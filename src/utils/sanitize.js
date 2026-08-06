const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

/**
 * Escapa o texto (evitando XSS via conteúdo gerado pelo modelo) e converte
 * quebras de linha em <br /> para exibição segura com dangerouslySetInnerHTML.
 */
export function formatMessageHtml(text) {
  return escapeHtml(text).replace(/\n/g, '<br />');
}
