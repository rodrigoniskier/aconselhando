const STORAGE_KEY = 'aconselhando_last_screen';

/**
 * Decide em qual tela o app abre. A conversa não é salva, então recarregar no
 * meio de um chat leva ao menu e avisa o usuário, em vez de cair na tela
 * inicial sem explicação.
 */
export function resolveInitialScreen(storedScreen) {
  if (storedScreen === 'menu') return { screen: 'menu', reloadedFromChat: false };
  if (storedScreen === 'chat') return { screen: 'menu', reloadedFromChat: true };
  return { screen: 'home', reloadedFromChat: false };
}

export function loadStoredScreen() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveScreen(screen) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, screen);
  } catch {
    // sessionStorage indisponível (ex: modo privado); o app segue funcionando.
  }
}
