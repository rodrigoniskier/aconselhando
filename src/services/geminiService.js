import { GEMINI_API_URL } from '../config/gemini';

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  let lastResponse;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      if (response.ok) {
        return await response.json();
      }

      // Backoff apenas para rate limit, com retentativas restantes.
      if (response.status === 429 && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
        continue;
      }

      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    } catch (error) {
      // Nunca engolir um abort: quem cancelou a requisição precisa saber.
      if (error.name === 'AbortError') throw error;
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
    }
  }
  throw new Error(`Falha após ${retries} tentativas. Status: ${lastResponse?.status}`);
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
