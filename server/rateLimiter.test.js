import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimiter';

const MINUTE = 60_000;
const DAY = 86_400_000;

function setup(limits, start = 1_000_000 * MINUTE) {
  const clock = { now: start };
  const limiter = createRateLimiter({ limits, now: () => clock.now });
  return { limiter, clock };
}

describe('createRateLimiter', () => {
  it('permite até o máximo e bloqueia a partir daí, dizendo quando tentar de novo', async () => {
    const { limiter, clock } = setup([{ name: 'minuto', scope: 'client', windowMs: MINUTE, max: 3 }]);
    for (let i = 0; i < 3; i++) expect((await limiter.check('a')).allowed).toBe(true);

    clock.now += 20_000;
    const blocked = await limiter.check('a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.name).toBe('minuto');
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('libera de novo quando a janela termina', async () => {
    const { limiter, clock } = setup([{ name: 'minuto', scope: 'client', windowMs: MINUTE, max: 1 }]);
    await limiter.check('a');
    expect((await limiter.check('a')).allowed).toBe(false);
    clock.now += MINUTE;
    expect((await limiter.check('a')).allowed).toBe(true);
  });

  it('conta cada cliente separadamente', async () => {
    const { limiter } = setup([{ name: 'minuto', scope: 'client', windowMs: MINUTE, max: 1 }]);
    expect((await limiter.check('a')).allowed).toBe(true);
    expect((await limiter.check('b')).allowed).toBe(true);
    expect((await limiter.check('a')).allowed).toBe(false);
  });

  it('o teto global vale para todos os clientes juntos', async () => {
    const { limiter } = setup([{ name: 'global', scope: 'global', windowMs: DAY, max: 2 }]);
    expect((await limiter.check('a')).allowed).toBe(true);
    expect((await limiter.check('b')).allowed).toBe(true);
    const blocked = await limiter.check('c');
    expect(blocked.allowed).toBe(false);
    expect(blocked.name).toBe('global');
  });

  it('um pedido recusado não consome a cota dos outros limites', async () => {
    const { limiter: l2, clock } = setup([
      { name: 'minuto', scope: 'client', windowMs: MINUTE, max: 1 },
      { name: 'dia', scope: 'client', windowMs: DAY, max: 2 },
    ]);
    await l2.check('a');
    for (let i = 0; i < 10; i++) await l2.check('a');
    clock.now += MINUTE;
    expect((await l2.check('a')).allowed).toBe(true); // 2º do dia ainda disponível
    clock.now += MINUTE;
    expect((await l2.check('a')).name).toBe('dia');
  });

  it('descarta contadores antigos para não crescer sem limite', async () => {
    const { limiter, clock } = setup([{ name: 'minuto', scope: 'client', windowMs: MINUTE, max: 5 }]);
    for (let i = 0; i < 50; i++) {
      await limiter.check(`cliente-${i}`);
    }
    clock.now += 10 * MINUTE;
    await limiter.check('novo');
    expect(limiter.size()).toBeLessThanOrEqual(2);
  });
});
