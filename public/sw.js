/* Service Worker do Aconselhando.
 * Os marcadores de build abaixo (versão e lista de arquivos) são preenchidos no build
 * por scripts/serviceWorkerBuild.js: o cache muda de nome sozinho a cada versão e já
 * guarda todos os arquivos do app. */
const CACHE_NAME = 'aconselhando-__BUILD_ID__';
const PRECACHE_URLS = __PRECACHE_URLS__;

/* Instalação: guarda os arquivos do app. A nova versão fica ESPERANDO até o usuário
 * aceitar a atualização (mensagem SKIP_WAITING), para não recarregar no meio de uma sessão. */
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* Ativação: apaga caches de versões antigas e assume as abas abertas. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

/* Busca: rede primeiro; sem rede, usa o cache. Só trata arquivos do próprio app (GET).
 * Chamadas à IA (/api/) e qualquer outra coisa passam direto, sem cache. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isAppFile = request.method === 'GET' && url.origin === self.location.origin && !url.pathname.startsWith('/api/');
  if (!isAppFile) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await caches.match('/index.html');
          if (shell) return shell;
        }
        return new Response('Sem conexão com a internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }),
  );
});
