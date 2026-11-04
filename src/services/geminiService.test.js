import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestHelperAnalysis, sendChatTurn } from './geminiService';

const okResponse = (text) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

const errorResponse = (status, body = 'erro') => ({
  ok: false,
  status,
  text: async () => body,
});

const abortError = () => Object.assign(new Error('cancelado'), { name: 'AbortError' });
const emptyResponse = { ok: true, status: 200, json: async () => ({ candidates: [] }) };

const history = [
  { role: 'user', text: 'Olá' },
  { role: 'model', text: 'Oi, tudo bem?' },
];

let fetchMock;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Roda a promise junto com o avanço dos timers de espera entre tentativas.
const runWithTimers = async (promise) => {
  const outcome = promise.then(
    (value) => ({ value }),
    (error) => ({ error }),
  );
  await vi.runAllTimersAsync();
  return outcome;
};

describe('sendChatTurn', () => {
  it('devolve o texto da resposta e envia a persona e o histórico', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('Estou cansado.'));

    const { value } = await runWithTimers(
      sendChatTurn({ history, systemPrompt: 'Você é Carlos' }),
    );

    expect(value).toBe('Estou cansado.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.systemInstruction.parts[0].text).toBe('Você é Carlos');
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: 'Olá' }] },
      { role: 'model', parts: [{ text: 'Oi, tudo bem?' }] },
    ]);
  });

  it('falha quando a resposta vem vazia', async () => {
    fetchMock.mockResolvedValue(emptyResponse);

    const { error } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(error.kind).toBe('empty');
    expect(error.message).toMatch(/não retornou/i);
  });

  it('tenta de novo depois de erro 429 e usa a resposta seguinte', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse('Agora foi.'));

    const { value } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(value).toBe('Agora foi.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('desiste do 429 na última tentativa e mostra o status', async () => {
    fetchMock.mockResolvedValue(errorResponse(429, 'cota'));

    const { error } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(error.kind).toBe('rate_limit');
    expect(error.status).toBe(429);
  });

  it.each([400, 401, 403, 404, 500])('não repete o erro permanente %i', async (status) => {
    fetchMock.mockResolvedValue(errorResponse(status, 'quebrou'));

    const { error } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error.status).toBe(status);
    expect(error.detail).toMatch(/quebrou/);
    // O usuário nunca vê código HTTP nem o texto bruto do servidor.
    expect(error.message).not.toMatch(/quebrou|HTTP|\d{3}/);
  });

  it('repete o erro passageiro 503 e usa a resposta seguinte', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(okResponse('Voltou.'));

    const { value } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(value).toBe('Voltou.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('repassa o sinal de cancelamento ao fetch', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('ok'));
    const controller = new AbortController();

    await runWithTimers(sendChatTurn({ history, systemPrompt: 'x', signal: controller.signal }));

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('recupera de falha de rede na primeira tentativa', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse('De volta.'));

    const { value } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(value).toBe('De volta.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('propaga o cancelamento sem tentar de novo', async () => {
    fetchMock.mockRejectedValue(abortError());

    const { error } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));

    expect(error.name).toBe('AbortError');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('classificação de erros para o usuário', () => {
  const failWith = async (response) => {
    fetchMock.mockResolvedValue(response);
    const { error } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));
    return error;
  };

  it('503 persistente vira indisponibilidade', async () => {
    const error = await failWith(errorResponse(503));
    expect(error.kind).toBe('unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('falha de rede persistente vira erro de conexão', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { error } = await runWithTimers(sendChatTurn({ history, systemPrompt: 'x' }));
    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/conex/i);
  });

  it.each([401, 403])('%i vira problema de configuração', async (status) => {
    const error = await failWith(errorResponse(status));
    expect(error.kind).toBe('config');
  });

  it('cada tipo tem uma mensagem diferente em português', async () => {
    const messages = new Set();
    for (const response of [errorResponse(429), errorResponse(503), errorResponse(401), errorResponse(500)]) {
      fetchMock.mockReset();
      messages.add((await failWith(response)).message);
    }
    expect(messages.size).toBe(4);
  });

  it('pedido bloqueado por segurança vira kind blocked, com explicação', async () => {
    const error = await failWith({
      ok: true,
      status: 200,
      json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }),
    });
    expect(error.kind).toBe('blocked');
    expect(error.message).toMatch(/reformul/i);
  });

  it('resposta cortada por filtro de segurança sem texto vira blocked', async () => {
    const error = await failWith({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ finishReason: 'SAFETY' }] }),
    });
    expect(error.kind).toBe('blocked');
  });

  it('bloqueado e vazio têm mensagens distintas', async () => {
    const blocked = await failWith({
      ok: true, status: 200, json: async () => ({ promptFeedback: { blockReason: 'OTHER' } }),
    });
    fetchMock.mockReset();
    const empty = await failWith(emptyResponse);
    expect(blocked.message).not.toBe(empty.message);
  });
});

describe('requestHelperAnalysis', () => {
  it('manda o histórico como transcrição com os papéis em português', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('1. Pergunta?'));

    const { value } = await runWithTimers(
      requestHelperAnalysis({ systemPrompt: 'Supervisor', history }),
    );

    expect(value).toBe('1. Pergunta?');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const sent = body.contents[0].parts[0].text;
    expect(sent).toContain('Conselheiro: Olá');
    expect(sent).toContain('Aconselhando: Oi, tudo bem?');
    expect(body.systemInstruction.parts[0].text).toBe('Supervisor');
    expect(body.contents).toHaveLength(1);
  });

  it('propaga o cancelamento', async () => {
    fetchMock.mockRejectedValue(abortError());

    const { error } = await runWithTimers(requestHelperAnalysis({ systemPrompt: 'x', history }));

    expect(error.name).toBe('AbortError');
  });
});
