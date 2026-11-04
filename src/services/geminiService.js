import { MAX_HISTORY_MESSAGES } from '../config/limits';
import { trimHistory } from '../utils/trimHistory';

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

// O servidor responde erros como JSON { error: 'codigo' }.
function readErrorCode(text) {
  try {
    return JSON.parse(text)?.error;
  } catch {
    return undefined;
  }
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
    const kind = readErrorCode(detail) === 'not_configured' ? 'config' : kindForStatus(response.status);
    throw new GeminiError(kind, { status: response.status, detail });
  }
  throw new GeminiError('unknown', { detail: `Falha após ${retries} tentativas.` });
}

const TRUNCATED_NOTE = '\n\n[A resposta foi cortada por ser muito longa. Peça para continuar.]';

function extractResponseText(result) {
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    return result.candidates[0].finishReason === 'MAX_TOKENS' ? `${text}${TRUNCATED_NOTE}` : text;
  }

  const blockReason = result?.promptFeedback?.blockReason;
  const finishReason = result?.candidates?.[0]?.finishReason;
  if (blockReason || ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'RECITATION'].includes(finishReason)) {
    throw new GeminiError('blocked', { detail: blockReason ?? finishReason });
  }
  throw new GeminiError('empty', { detail: JSON.stringify(result)?.slice(0, 500) });
}

const GEMINI_ENDPOINT = '/api/gemini';

// Só o necessário vai ao servidor: papéis e textos (campos da tela como isMeta ficam de fora).
const toWireHistory = (history) =>
  trimHistory(history, MAX_HISTORY_MESSAGES).history.map(({ role, text }) => ({ role, text }));

function postToServer(payload, signal) {
  return fetchWithRetry(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * Envia o histórico da conversa ao servidor, que aplica a persona do caso
 * simulado, e retorna a fala do aconselhando.
 */
export async function sendChatTurn({ history, caseId, signal }) {
  const result = await postToServer({ mode: 'chat', caseId, history: toWireHistory(history) }, signal);
  return extractResponseText(result);
}

/**
 * Pede ao servidor os recursos de apoio ao conselheiro (sugestão de perguntas,
 * versículos) sem afetar o histórico principal do chat.
 */
export async function requestHelperAnalysis({ helper, history, signal }) {
  const result = await postToServer({ mode: 'helper', helper, history: toWireHistory(history) }, signal);
  return extractResponseText(result);
}
