const ROLE_LABEL = { user: 'Conselheiro', model: 'Aconselhando' };

/**
 * Transforma a conversa em texto legível para copiar. Ignora mensagens de erro
 * da tela e troca o pedido interno de avaliação por uma marcação curta.
 */
export function formatTranscript(history) {
  return history
    .filter((msg) => !msg.isError)
    .map((msg) => (msg.isMeta ? '[Solicitação de avaliação]' : `${ROLE_LABEL[msg.role]}: ${msg.text}`))
    .join('\n\n');
}
