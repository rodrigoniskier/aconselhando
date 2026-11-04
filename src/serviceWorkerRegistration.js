let updateRequested = false;

/**
 * Registra o Service Worker (só na versão publicada). Quando existe uma versão nova
 * esperando, chama onUpdateReady(registration) em vez de recarregar a página sozinho.
 */
export function registerServiceWorker({ onUpdateReady }) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  // O hook pode rodar depois do evento `load`; nesse caso registra na hora.
  const onReady = (callback) =>
    document.readyState === 'complete' ? callback() : window.addEventListener('load', callback);

  onReady(async () => {
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.warn('Falha ao registrar o Service Worker:', error);
      return;
    }

    // Só é "atualização" se já havia uma versão controlando a página.
    const isUpdate = () => Boolean(navigator.serviceWorker.controller);

    if (registration.waiting && isUpdate()) onUpdateReady(registration);

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && isUpdate()) onUpdateReady(registration);
      });
    });

    // Procura versões novas de hora em hora.
    setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

    // Recarrega apenas depois que o usuário aceitou a atualização.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updateRequested) window.location.reload();
    });
  });
}

export function applyServiceWorkerUpdate(registration) {
  updateRequested = true;
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}
