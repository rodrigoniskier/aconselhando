import { describe, expect, it } from 'vitest';
import { resolveInitialScreen } from './screenRestore';

describe('resolveInitialScreen', () => {
  it('abre a tela inicial na primeira visita', () => {
    expect(resolveInitialScreen(null)).toEqual({ screen: 'home', reloadedFromChat: false });
  });

  it('mantém o menu ao recarregar no menu', () => {
    expect(resolveInitialScreen('menu')).toEqual({ screen: 'menu', reloadedFromChat: false });
  });

  it('leva ao menu, avisando, ao recarregar no meio de um chat', () => {
    expect(resolveInitialScreen('chat')).toEqual({ screen: 'menu', reloadedFromChat: true });
  });

  it('ignora valores desconhecidos', () => {
    expect(resolveInitialScreen('lixo')).toEqual({ screen: 'home', reloadedFromChat: false });
  });
});
