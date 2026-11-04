import { describe, expect, it } from 'vitest';
import { buildPersonaPrompt } from './prompts';
import { COUNSELING_CASES } from '../data/counselingCases';

describe('buildPersonaPrompt', () => {
  it('mantém a persona do caso', () => {
    const prompt = buildPersonaPrompt('Assuma a persona de Carlos.');
    expect(prompt).toContain('Assuma a persona de Carlos.');
  });

  it('manda a IA sair do personagem diante de risco real e indicar ajuda', () => {
    const prompt = buildPersonaPrompt('Persona qualquer');
    expect(prompt).toMatch(/sair do personagem/i);
    expect(prompt).toMatch(/autolesão|suicíd/i);
    expect(prompt).toContain('188');
  });

  it('proíbe a persona de dar instruções de autolesão', () => {
    expect(buildPersonaPrompt('x')).toMatch(/nunca (forneça|dê|descreva)[^.]*(método|instruç)/i);
  });

  it('vale para todos os casos cadastrados', () => {
    for (const item of COUNSELING_CASES) {
      expect(buildPersonaPrompt(item.systemPrompt)).toContain(item.systemPrompt.trim());
    }
  });
});
