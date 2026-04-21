import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado com sucesso:', registration);

        // Verifica se há atualizações no servidor a cada 1 hora
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);

        // Escuta por novos Service Workers (novas versões do código)
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Se já houver um controle ativo, significa que isto é uma atualização
                console.log('Nova versão detectada e instalada. Recarregando...');
                // Opcional: alert("O aplicativo foi atualizado para a versão mais recente.");
                window.location.reload();
              }
            }
          };
        };
      })
      .catch((error) => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
  });
}
