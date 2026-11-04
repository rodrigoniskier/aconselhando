import { describe, expect, it } from 'vitest';
import { formatTranscript } from './transcript';

describe('formatTranscript', () => {
  it('rotula as falas como Conselheiro e Aconselhando, separadas por linha em branco', () => {
    const text = formatTranscript([
      { role: 'model', text: 'Oi, estou cansado.' },
      { role: 'user', text: 'Conte mais.' },
    ]);
    expect(text).toBe('Aconselhando: Oi, estou cansado.\n\nConselheiro: Conte mais.');
  });

  it('não inclui mensagens de erro da tela', () => {
    const text = formatTranscript([
      { role: 'model', text: 'Falou.' },
      { role: 'model', text: 'Ocorreu um erro', isError: true },
    ]);
    expect(text).toBe('Aconselhando: Falou.');
  });

  it('troca o pedido interno de avaliação por uma marcação curta', () => {
    const text = formatTranscript([
      { role: 'user', text: 'PROMPT GIGANTE INTERNO', isMeta: true },
      { role: 'model', text: 'AVALIAÇÃO DA SESSÃO' },
    ]);
    expect(text).toBe('[Solicitação de avaliação]\n\nAconselhando: AVALIAÇÃO DA SESSÃO');
  });

  it('devolve texto vazio quando não há conversa', () => {
    expect(formatTranscript([])).toBe('');
  });
});
