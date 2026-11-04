import { describe, expect, it } from 'vitest';
import { trimHistory } from './trimHistory';

const makeHistory = (n) =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'model' : 'user', text: `m${i}` }));

describe('trimHistory', () => {
  it('não altera conversas dentro do limite', () => {
    const history = makeHistory(6);
    expect(trimHistory(history, 6)).toEqual({ history, trimmed: false });
  });

  it('mantém a primeira mensagem e as mais recentes quando passa do limite', () => {
    const result = trimHistory(makeHistory(10), 4);
    expect(result.trimmed).toBe(true);
    expect(result.history.map((m) => m.text)).toEqual(['m0', 'm7', 'm8', 'm9']);
  });

  it('nunca devolve mais mensagens que o limite', () => {
    expect(trimHistory(makeHistory(100), 40).history).toHaveLength(40);
  });

  it('não modifica a lista original', () => {
    const history = makeHistory(10);
    trimHistory(history, 4);
    expect(history).toHaveLength(10);
  });
});
