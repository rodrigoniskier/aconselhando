import { useState } from 'react';
import { APP_VERSION } from '../config/appVersion';

const STORAGE_KEY = 'aconselhando_whatsnew_seen_version';

function hasUnseenUpdate() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== APP_VERSION;
  } catch {
    // localStorage indisponível (ex: modo privado); não bloqueia o uso do app.
    return false;
  }
}

/**
 * Mostra o pop-up de novidades uma vez por versão instalada, usando
 * localStorage para lembrar a última versão que o usuário já viu.
 */
export function useWhatsNew() {
  const [visible, setVisible] = useState(hasUnseenUpdate);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      // ignora falha de storage
    }
    setVisible(false);
  };

  return { visible, dismiss };
}
