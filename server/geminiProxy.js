// Servidor intermediário do Gemini: guarda a chave, monta as instruções de IA e
// só aceita pedidos de formatos conhecidos (assim não vira uma "IA grátis" aberta).
// Não depende de plataforma: api/gemini.js (Vercel) e o servidor de desenvolvimento
// chamam handleGeminiRequest().
import { COUNSELING_CASES } from '../src/data/counselingCases.js';
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS } from '../src/config/limits.js';
import { HELPER_PROMPTS, buildHelperUserPrompt, buildPersonaPrompt } from '../src/config/prompts.js';

const DEFAULT_MODEL = 'gemini-3.6-flash';
const DEFAULT_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const ROLES = new Set(['user', 'model']);

const reply = (status, body, headers = {}) => ({ status, body, headers });
const badRequest = (message) => reply(400, { error: 'bad_request', message });

function validate(body) {
  if (!body || typeof body !== 'object') return { error: 'Corpo do pedido ausente.' };
  const { mode, caseId, helper, history } = body;

  if (mode !== 'chat' && mode !== 'helper') return { error: 'Modo desconhecido.' };
  if (!Array.isArray(history) || history.length === 0) return { error: 'Histórico inválido.' };
  if (history.length > MAX_HISTORY_MESSAGES) return { error: 'Histórico longo demais.' };
  for (const msg of history) {
    if (!msg || !ROLES.has(msg.role) || typeof msg.text !== 'string' || !msg.text.trim()) {
      return { error: 'Mensagem inválida no histórico.' };
    }
    if (msg.text.length > MAX_MESSAGE_CHARS) return { error: 'Mensagem longa demais.' };
  }

  if (mode === 'chat') {
    const found = COUNSELING_CASES.find((item) => item.id === caseId);
    if (!found) return { error: 'Caso desconhecido.' };
    return { value: { mode, history, selectedCase: found } };
  }

  if (!Object.hasOwn(HELPER_PROMPTS, helper)) return { error: 'Ajudante desconhecido.' };
  return { value: { mode, history, helper } };
}

function buildPayload({ mode, history, selectedCase, helper }) {
  if (mode === 'chat') {
    return {
      contents: history.map((msg) => ({ role: msg.role, parts: [{ text: msg.text }] })),
      systemInstruction: { parts: [{ text: buildPersonaPrompt(selectedCase.systemPrompt) }] },
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096 },
    };
  }
  return {
    contents: [{ role: 'user', parts: [{ text: buildHelperUserPrompt(history) }] }],
    systemInstruction: { parts: [{ text: HELPER_PROMPTS[helper] }] },
    generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
  };
}

/**
 * Processa um pedido do app. Independente de plataforma: recebe dados simples e
 * devolve { status, body, headers }.
 */
export async function handleGeminiRequest({ method, body, env, fetchImpl = fetch }) {
  if (method !== 'POST') return reply(405, { error: 'method_not_allowed' }, { Allow: 'POST' });

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return reply(500, { error: 'not_configured' });

  const parsed = validate(body);
  if (parsed.error) return badRequest(parsed.error);

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const base = env.GEMINI_API_BASE || DEFAULT_API_BASE;

  let upstream;
  try {
    upstream = await fetchImpl(`${base}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(buildPayload(parsed.value)),
    });
  } catch (error) {
    console.error('Falha de rede ao chamar o Gemini:', error.message);
    return reply(503, { error: 'upstream', message: 'Serviço de IA inacessível.' });
  }

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    console.error(`Gemini respondeu ${upstream.status}:`, detail);
    return reply(upstream.status, { error: 'upstream', detail });
  }

  return reply(200, await upstream.json());
}
