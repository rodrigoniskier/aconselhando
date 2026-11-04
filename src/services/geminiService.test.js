import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestHelperAnalysis, sendChatTurn } from './geminiService';
import { MAX_HISTORY_MESSAGES } from '../config/limits';

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
  it('devolve o texto da resposta e envia só o caso e o histórico ao servidor', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('Estou cansado.'));

    const { value } = await runWithTimers(
      sendChatTurn({ history: [...history, { role: 'user', text: 'x', isMeta: true, extra: 1 }], caseId: 'case_01' }),
    );

    expect(value).toBe('Estou cansado.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/gemini');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      mode: 'chat',
      caseId: 'case_01',
      history: [
        { role: 'user', text: 'Olá' },
        { role: 'model', text: 'Oi, tudo bem?' },
        { role: 'user', text: 'x' },
      ],
    });
  });

  it('servidor sem chave configurada vira problema de configuração', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => '{"error":"not_configured"}' });
    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    expect(error.kind).toBe('config');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falha quando a resposta vem vazia', async () => {
    fetchMock.mockResolvedValue(emptyResponse);

    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

    expect(error.kind).toBe('empty');
    expect(error.message).toMatch(/não retornou/i);
  });

  it('tenta de novo depois de erro 429 e usa a resposta seguinte', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse('Agora foi.'));

    const { value } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

    expect(value).toBe('Agora foi.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('desiste do 429 na última tentativa e mostra o status', async () => {
    fetchMock.mockResolvedValue(errorResponse(429, 'cota'));

    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(error.kind).toBe('rate_limit');
    expect(error.status).toBe(429);
  });

  it.each([400, 401, 403, 404, 500])('não repete o erro permanente %i', async (status) => {
    fetchMock.mockResolvedValue(errorResponse(status, 'quebrou'));

    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

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

    const { value } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

    expect(value).toBe('Voltou.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('repassa o sinal de cancelamento ao fetch', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('ok'));
    const controller = new AbortController();

    await runWithTimers(sendChatTurn({ history, caseId: 'case_01', signal: controller.signal }));

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('recupera de falha de rede na primeira tentativa', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse('De volta.'));

    const { value } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

    expect(value).toBe('De volta.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('propaga o cancelamento sem tentar de novo', async () => {
    fetchMock.mockRejectedValue(abortError());

    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));

    expect(error.name).toBe('AbortError');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('limite de uso do servidor', () => {
  const quotaResponse = (retryAfterSeconds) => ({
    ok: false,
    status: 429,
    text: async () => JSON.stringify({ error: 'rate_limit', retryAfterSeconds }),
  });

  it('não repete quando a espera é longa e diz quando tentar de novo', async () => {
    fetchMock.mockResolvedValue(quotaResponse(45));
    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error.kind).toBe('rate_limit');
    expect(error.retryAfterSeconds).toBe(45);
    expect(error.message).toMatch(/45 segundos/);
  });

  it.each([
    [1, /1 segundo/],
    [90, /2 minutos/],
    [3 * 3600, /3 horas/],
  ])('descreve a espera de %i segundos em linguagem simples', async (seconds, pattern) => {
    fetchMock.mockResolvedValue(quotaResponse(seconds));
    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    expect(error.message).toMatch(pattern);
  });

  it('ainda repete quando a espera é curtíssima', async () => {
    fetchMock.mockResolvedValueOnce(quotaResponse(1)).mockResolvedValueOnce(okResponse('Passou.'));
    const { value } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    expect(value).toBe('Passou.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('tamanho da conversa', () => {
  const longHistory = Array.from({ length: MAX_HISTORY_MESSAGES + 15 }, (_, i) => ({
    role: i % 2 === 0 ? 'model' : 'user',
    text: `m${i}`,
  }));

  it('envia no máximo o limite de mensagens, mantendo a primeira e as mais recentes', async () => {
    fetchMock.mockResolvedValue(okResponse('ok'));
    await runWithTimers(sendChatTurn({ history: longHistory, caseId: 'case_01' }));
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body).history;
    expect(sent).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(sent[0].text).toBe('m0');
    expect(sent.at(-1).text).toBe(longHistory.at(-1).text);
  });

  it('o ajudante também respeita o limite', async () => {
    fetchMock.mockResolvedValue(okResponse('ok'));
    await runWithTimers(requestHelperAnalysis({ helper: 'find_verses', history: longHistory }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).history).toHaveLength(MAX_HISTORY_MESSAGES);
  });

  it('avisa quando a resposta foi cortada por ser longa demais', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Texto até aqui' }] } }],
      }),
    });
    const { value } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    expect(value).toContain('Texto até aqui');
    expect(value).toMatch(/cortada/i);
  });

  it('não acrescenta aviso quando a resposta termina normalmente', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Completo.' }] } }],
      }),
    });
    const { value } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    expect(value).toBe('Completo.');
  });
});

describe('classificação de erros para o usuário', () => {
  const failWith = async (response) => {
    fetchMock.mockResolvedValue(response);
    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
    return error;
  };

  it('503 persistente vira indisponibilidade', async () => {
    const error = await failWith(errorResponse(503));
    expect(error.kind).toBe('unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('falha de rede persistente vira erro de conexão', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { error } = await runWithTimers(sendChatTurn({ history, caseId: 'case_01' }));
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
  it('envia o identificador do ajudante e o histórico ao servidor', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('1. Pergunta?'));

    const { value } = await runWithTimers(requestHelperAnalysis({ helper: 'suggest_question', history }));

    expect(value).toBe('1. Pergunta?');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/gemini');
    expect(JSON.parse(options.body)).toEqual({ mode: 'helper', helper: 'suggest_question', history });
  });

  it('propaga o cancelamento', async () => {
    fetchMock.mockRejectedValue(abortError());

    const { error } = await runWithTimers(requestHelperAnalysis({ helper: 'find_verses', history }));

    expect(error.name).toBe('AbortError');
  });
});
