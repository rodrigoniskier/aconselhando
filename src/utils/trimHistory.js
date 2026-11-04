/**
 * Limita o histórico enviado à IA: mantém a primeira mensagem (que dá o contexto
 * inicial do caso) e as mais recentes. Não modifica a lista original.
 */
export function trimHistory(history, maxMessages) {
  if (history.length <= maxMessages) return { history, trimmed: false };
  return {
    history: [history[0], ...history.slice(history.length - (maxMessages - 1))],
    trimmed: true,
  };
}
