import { useCallback, useEffect, useState } from 'react';
import { applyServiceWorkerUpdate, registerServiceWorker } from '../serviceWorkerRegistration';

/** Avisa quando há uma versão nova do app esperando e aplica quando o usuário aceita. */
export function useServiceWorkerUpdate() {
  const [registration, setRegistration] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    registerServiceWorker({ onUpdateReady: setRegistration });
  }, []);

  const applyUpdate = useCallback(() => {
    if (registration) applyServiceWorkerUpdate(registration);
  }, [registration]);

  return {
    updateAvailable: Boolean(registration) && !dismissed,
    applyUpdate,
    dismissUpdate: () => setDismissed(true),
  };
}
