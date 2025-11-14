/* Define um nome para o cache */
const CACHE_NAME = 'aconselhando-v1';

/* Lista de arquivos que devem ser cacheados na instalação */
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
  // Adicione aqui os principais arquivos JS e CSS se souber os nomes
  // Mas para um app React (Vite/CRA), isso é mais complexo.
  // Vamos manter simples por agora.
];

/* 1. Evento de Instalação: Salva os arquivos no cache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

/* 2. Evento de Fetch: Responde com arquivos do cache ou da rede */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o arquivo existir no cache, retorna ele
        if (response) {
          return response;
        }
        
        // Se não, busca na rede, salva no cache e retorna
        return fetch(event.request).then(
          (networkResponse) => {
            // Verifica se a resposta é válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta para salvar no cache
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

/* 3. Evento de Ativação: Limpa caches antigos (se houver) */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
