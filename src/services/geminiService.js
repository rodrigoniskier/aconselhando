import { GEMINI_API_URL } from '../config/gemini';

// Mensagens mostradas ao usuário, por tipo de problema. Detalhes técnicos ficam
// em `detail` e no console, nunca na tela.
const USER_MESSAGES = {
  network: 'Não foi possível conectar. Verifique sua conexão com a internet e tente de novo.',
  rate_limit: 'Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente de novo.',
  unavailable: 'O serviço de IA está indisponível no momento. Tente de novo em alguns minutos.',
  config: 'O aplicativo não conseguiu acessar o serviço de IA. Avise o responsável pelo aplicativo.',
  blocked: 'A IA não pôde responder a este pedido. Tente reformular sua mensagem e envie de novo.',
  empty: 'A IA não retornou nenhuma resposta desta vez. Tente enviar de novo.',
  unknown: 'Ocorreu um erro inesperado ao falar com a IA. Tente de novo.',
};

export class GeminiError extends Error {
  constructor(kind, { status, detail } = {}) {
    super(USER_MESSAGES[kind] ?? USER_MESSAGES.unknown);
    this.name = 'GeminiError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

function kindForStatus(status) {
  if (status === 429) return 'rate_limit';
  if (status === 503) return 'unavailable';
  if (status === 401 || status === 403) return 'config';
  return 'unknown';
}

// Só erros passageiros valem uma nova tentativa: limite de uso e indisponibilidade.
const RETRYABLE_STATUS = new Set([429, 503]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const isLastAttempt = i === retries - 1;
    let response;

    try {
      response = await fetch(url, options);
    } catch (error) {
      // Nunca engolir um abort: quem cancelou a requisição precisa saber.
      if (error.name === 'AbortError') throw error;
      if (isLastAttempt) throw new GeminiError('network', { detail: error.message });
      await sleep(delay * 2 ** i);
      continue;
    }

    if (response.ok) return response.json();

    if (RETRYABLE_STATUS.has(response.status) && !isLastAttempt) {
      await sleep(delay * 2 ** i);
      continue;
    }

    const detail = await response.text();
    throw new GeminiError(kindForStatus(response.status), { status: response.status, detail });
  }
  throw new GeminiError('unknown', { detail: `Falha após ${retries} tentativas.` });
}

function extractResponseText(result) {
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) return text;

  const blockReason = result?.promptFeedback?.blockReason;
  const finishReason = result?.candidates?.[0]?.finishReason;
  if (blockReason || ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'RECITATION'].includes(finishReason)) {
    throw new GeminiError('blocked', { detail: blockReason ?? finishReason });
  }
  throw new GeminiError('empty', { detail: JSON.stringify(result)?.slice(0, 500) });
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
