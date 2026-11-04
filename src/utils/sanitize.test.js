import { describe, expect, it } from 'vitest';
import { escapeHtml, formatMessageHtml } from './sanitize';

describe('formatMessageHtml', () => {
  it('neutraliza tags HTML vindas da IA', () => {
    expect(formatMessageHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('neutraliza aspas e e-comercial para não escapar de atributos', () => {
    expect(formatMessageHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });

  it('converte quebras de linha em <br />', () => {
    expect(formatMessageHtml('linha 1\nlinha 2')).toBe('linha 1<br />linha 2');
  });

  it('não gera tags a partir de texto que já parece HTML com quebra de linha', () => {
    expect(formatMessageHtml('<b>oi</b>\nok')).toBe('&lt;b&gt;oi&lt;/b&gt;<br />ok');
  });

  it('mantém texto comum e acentuação intactos', () => {
    expect(formatMessageHtml('Olá, não sei o que fazer.')).toBe('Olá, não sei o que fazer.');
  });
});

describe('escapeHtml', () => {
  it('aceita valores que não são texto', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
  });
});
