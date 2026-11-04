import { useCallback, useEffect, useState } from 'react';
import { loadStoredScreen, resolveInitialScreen, saveScreen } from '../utils/screenRestore';

/**
 * Gerencia a navegação entre telas usando o histórico real do navegador,
 * para que o botão físico de "voltar" do Android navegue entre as telas do
 * app (chat -> menu -> home) em vez de fechar o app na primeira tentativa.
 */
export function useScreenHistory(initialScreen) {
  const [initial] = useState(() => resolveInitialScreen(loadStoredScreen()));
  const [screen, setScreen] = useState(initial.screen);
  const [reloadNotice, setReloadNotice] = useState(initial.reloadedFromChat);

  useEffect(() => {
    saveScreen(screen);
  }, [screen]);

  useEffect(() => {
    window.history.replaceState({ screen: initial.screen }, '');

    function handlePopState(event) {
      setScreen(event.state?.screen ?? initialScreen);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateTo = useCallback((nextScreen) => {
    window.history.pushState({ screen: nextScreen }, '');
    setScreen(nextScreen);
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const dismissReloadNotice = useCallback(() => setReloadNotice(false), []);

  return { screen, navigateTo, goBack, reloadNotice, dismissReloadNotice };
}
