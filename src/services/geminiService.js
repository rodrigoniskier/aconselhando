import { GEMINI_API_URL } from '../config/gemini';

/** Erro com mensagem já adequada para mostrar ao usuário. */
export class GeminiError extends Error {
  constructor(userMessage, { status, retryable = false } = {}) {
    super(userMessage);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable = retryable;
  }
}

function userMessageFor(status) {
  if (status === 429) {
    return 'Muitas pessoas estão usando o aconselhamento agora ou o limite de uso foi atingido. Aguarde alguns instantes e tente novamente.';
  }
  if (status === 503 || status === 504 || status === 502) {
    return 'O serviço de IA está sobrecarregado no momento. Tente novamente em alguns segundos.';
  }
  if (status === 413) return 'A conversa ficou longa demais. Inicie um novo caso para continuar.';
  return 'Não foi possível obter a resposta agora. Verifique sua conexão e tente novamente.';
}

const MAX_CLIENT_WAIT_MS = 10_000;

function serverRetryAfterMs(response) {
  const header = Number(response?.headers?.get('Retry-After'));
  return Number.isFinite(header) && header > 0 ? header * 1000 : 0;
}

function retryDelayMs(response, attempt, baseDelay) {
  // Só o backoff calculado localmente tem teto; o Retry-After do servidor é respeitado.
  const backoff = Math.min(baseDelay * 2 ** attempt, 8000);
  // Jitter evita que vários usuários repitam a chamada no mesmo instante.
  const jittered = backoff / 2 + Math.random() * (backoff / 2);
  return Math.max(serverRetryAfterMs(response), jittered);
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

// O proxy (api/gemini.js) já faz retry e fallback entre modelos; aqui só
// tentamos de novo falhas transitórias, poucas vezes e com espera crescente.
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  let lastStatus;
  for (let i = 0; i < retries; i++) {
    let response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      // Nunca engolir um abort: quem cancelou a requisição precisa saber.
      if (error.name === 'AbortError') throw error;
      if (i === retries - 1) throw new GeminiError(userMessageFor(), { retryable: true });
      await wait(retryDelayMs(null, i, delay), options?.signal);
      continue;
    }

    if (response.ok) return response.json();

    lastStatus = response.status;
    const transient = [429, 502, 503, 504].includes(response.status);
    if (!transient || i === retries - 1) {
      throw new GeminiError(userMessageFor(response.status), {
        status: response.status,
        retryable: transient,
      });
    }
    const delayMs = retryDelayMs(response, i, delay);
    // Espera longa demais para uma conversa: informa o usuário em vez de insistir.
    if (delayMs > MAX_CLIENT_WAIT_MS) {
      throw new GeminiError(userMessageFor(response.status), { status: response.status, retryable: true });
    }
    await wait(delayMs, options?.signal);
  }
  throw new GeminiError(userMessageFor(lastStatus), { status: lastStatus, retryable: true });
}

function extractResponseText(result) {
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta da API inválida ou vazia.');
  return text;
}

/**
 * Envia o histórico completo da conversa para o Gemini, com a persona do
 * caso simulado como instrução de sistema, e retorna a fala do aconselhando.
 */
export async function sendChatTurn({ history, systemPrompt, signal }) {
  const payload = {
    contents: history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    })),
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  const result = await fetchWithRetry(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  return extractResponseText(result);
}

/**
 * Chama a API para os recursos de apoio ao conselheiro (sugestão de
 * perguntas, versículos, avaliação) sem afetar o histórico principal do chat.
 */
export async function requestHelperAnalysis({ systemPrompt, history, signal }) {
  const historyText = history
    .map((msg) => `${msg.role === 'user' ? 'Conselheiro' : 'Aconselhando'}: ${msg.text}`)
    .join('\n');

  const fullUserPrompt = `
    Aqui está o histórico da conversa para sua análise:
    ---
    ${historyText}
    ---
    Fim do histórico. Por favor, forneça sua assistência com base nisso.
  `;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: fullUserPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  };

  const result = await fetchWithRetry(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  return extractResponseText(result);
}
