// Limitador de uso por janelas fixas, em memória. Cada instância do servidor
// tem a sua contagem: na Vercel isso já barra abusos comuns, mas a contagem não
// é compartilhada entre instâncias. Para um teto rigoroso, troque o armazenamento
// por um serviço compartilhado (ex.: Upstash Redis / Vercel KV) mantendo esta interface.

const PRUNE_EVERY_MS = 60_000;
const MAX_COUNTERS = 100_000; // proteção contra crescimento ilimitado de memória

export function createRateLimiter({ limits, now = Date.now }) {
  const counters = new Map(); // chave -> { count, resetAt }
  let lastPrune = now();

  function prune(t) {
    if (t - lastPrune < PRUNE_EVERY_MS && counters.size < MAX_COUNTERS) return;
    lastPrune = t;
    for (const [key, counter] of counters) if (counter.resetAt <= t) counters.delete(key);
    if (counters.size >= MAX_COUNTERS) counters.clear();
  }

  return {
    /** Registra um uso. Se algum limite estourou, não consome nenhum e diz quando tentar de novo. */
    async check(clientId) {
      const t = now();
      prune(t);

      const entries = limits.map((limit) => {
        const windowStart = Math.floor(t / limit.windowMs) * limit.windowMs;
        const key = `${limit.name}|${limit.scope === 'global' ? '*' : clientId}|${windowStart}`;
        const current = counters.get(key) ?? { count: 0, resetAt: windowStart + limit.windowMs };
        return { limit, key, current };
      });

      const blocked = entries.find(({ limit, current }) => current.count >= limit.max);
      if (blocked) {
        return {
          allowed: false,
          name: blocked.limit.name,
          scope: blocked.limit.scope,
          retryAfterSeconds: Math.max(1, Math.ceil((blocked.current.resetAt - t) / 1000)),
        };
      }

      for (const { key, current } of entries) {
        counters.set(key, { count: current.count + 1, resetAt: current.resetAt });
      }
      return { allowed: true };
    },
    size: () => counters.size,
  };
}

const positiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Limitador padrão do app. Ajustável por variáveis de ambiente. */
export function createDefaultRateLimiter(env) {
  return createRateLimiter({
    limits: [
      { name: 'minuto', scope: 'client', windowMs: 60_000, max: positiveInt(env.RATE_LIMIT_PER_MINUTE, 12) },
      { name: 'dia', scope: 'client', windowMs: 86_400_000, max: positiveInt(env.RATE_LIMIT_PER_DAY, 200) },
      { name: 'global', scope: 'global', windowMs: 86_400_000, max: positiveInt(env.GLOBAL_DAILY_LIMIT, 5000) },
    ],
  });
}

/** Identifica o cliente pelo IP informado pela hospedagem (Vercel) ou pela conexão. */
export function getClientId(headers = {}, socketAddress) {
  const forwarded = headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || headers['x-real-ip'] || socketAddress || 'desconhecido';
}
