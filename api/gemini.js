// Função serverless (Vercel): mantém a chave do Gemini no servidor e dá
// resiliência a vários usuários simultâneos:
//   - ordem de modelos (GEMINI_MODELS) com fallback automático;
//   - retry com backoff exponencial e jitter em erros transitórios;
//   - "cooldown" de modelo com cota esgotada, compartilhado entre requisições
//     da mesma instância, para que os demais usuários não repitam a falha;
//   - limite por IP (melhor esforço; cada instância tem sua própria contagem).

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const MODELS = (process.env.GEMINI_MODELS || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const MODEL_ORDER = MODELS.length ? MODELS : DEFAULT_MODELS;

const MAX_BODY_BYTES = 64 * 1024;
const TOTAL_BUDGET_MS = 40_000; // abaixo de maxDuration (vercel.json)
const ATTEMPT_TIMEOUT_MS = 15_000;
const ATTEMPTS_PER_MODEL = 2;
const BASE_BACKOFF_MS = 500;
const COOLDOWN_MS = 60_000;
const RATE_LIMIT = { windowMs: 60_000, max: 20 };

const TRANSIENT = new Set([500, 502, 503, 504]);
const modelCooldownUntil = new Map(); // modelo -> timestamp
const hits = new Map(); // ip -> [timestamps]

function sendRaw(res, status, text) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).send(text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms) => ms / 2 + Math.random() * (ms / 2);

function rateLimited(ip, now) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(ip, recent);
    return Math.ceil((RATE_LIMIT.windowMs - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // evita crescimento sem limite
  return 0;
}

async function callModel(model, body, apiKey, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
      signal,
    },
  );
  return { status: res.status, text: await res.text() };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Serviço não configurado.' });

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Requisição grande demais.' });
  }

  const start = Date.now();
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  const wait = rateLimited(ip, start);
  if (wait) {
    res.setHeader('Retry-After', String(wait));
    return res.status(429).json({ error: 'Muitas requisições. Aguarde um instante.', retryAfter: wait });
  }

  // Modelos em cooldown vão para o fim da fila (ainda são tentados por último).
  const active = MODEL_ORDER.filter((m) => (modelCooldownUntil.get(m) || 0) <= start);
  const cooling = MODEL_ORDER.filter((m) => !active.includes(m));
  const queue = [...active, ...cooling];

  let last = { status: 502, text: JSON.stringify({ error: 'Falha ao contatar o serviço de IA.' }) };

  for (const model of queue) {
    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
      const remaining = TOTAL_BUDGET_MS - (Date.now() - start);
      if (remaining < 1500) break;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(ATTEMPT_TIMEOUT_MS, remaining));
      try {
        const result = await callModel(model, body, apiKey, controller.signal);
        clearTimeout(timer);

        if (result.status === 200) {
          res.setHeader('X-Gemini-Model', model);
          return sendRaw(res, 200, result.text);
        }
        last = result;

        if (result.status === 429) {
          // Cota deste modelo esgotada: pausa-o e passa ao próximo, sem repetir.
          modelCooldownUntil.set(model, Date.now() + COOLDOWN_MS);
          break;
        }
        if (result.status === 404 || result.status === 400) {
          // Modelo inexistente/indisponível ou requisição inválida: não adianta repetir.
          if (result.status === 404) break;
          return sendRaw(res, 400, result.text);
        }
        if (!TRANSIENT.has(result.status)) {
          return sendRaw(res, result.status, result.text);
        }
      } catch {
        clearTimeout(timer);
        last = { status: 504, text: JSON.stringify({ error: 'O serviço de IA demorou a responder.' }) };
        // Timeout: não repete o mesmo modelo lento; passa ao próximo.
        break;
      }

      if (attempt < ATTEMPTS_PER_MODEL - 1) {
        await sleep(jitter(BASE_BACKOFF_MS * 2 ** attempt));
      }
    }
  }

  // Todos os modelos falharam. Tempo sugerido para o cliente tentar de novo.
  const retryAfter = last.status === 429 ? 30 : 5;
  res.setHeader('Retry-After', String(retryAfter));
  return sendRaw(res, last.status === 429 ? 429 : 503, last.text);
}
