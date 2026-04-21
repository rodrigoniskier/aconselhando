/* Define a nova versão do cache */
const CACHE_NAME = 'aconselhando-v2';

/* Lista de arquivos essenciais */
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/* 1. Evento de Instalação: Salva arquivos e força ativação */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Novo cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // Força o Service Worker a se tornar o ativo imediatamente
  self.skipWaiting();
});

/* 2. Evento de Ativação: Limpa caches antigos e assume controle das abas */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Remove versões antigas de cache (ex: v1)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Faz o Service Worker assumir o controle das páginas abertas na hora
      self.clients.claim()
    ])
  );
});

/* 3. Evento de Fetch: Estratégia de Rede Primeiro (Network First) */
/* Isso garante que o usuário sempre baixe o App.jsx mais novo se houver internet */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a rede responder, atualizamos o cache e retornamos o arquivo novo
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se estiver sem internet, busca no cache
        return caches.match(event.request);
      })
  );
});
