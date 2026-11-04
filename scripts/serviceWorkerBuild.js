import { createHash } from 'node:crypto';

// Arquivos que sempre entram no cache, além dos gerados pelo build.
const STATIC_URLS = ['/', '/index.html', '/manifest.json', '/privacidade.html', '/icon-192.png', '/icon-512.png'];

/**
 * Preenche o modelo do Service Worker com a lista de arquivos a guardar em cache
 * e uma versão que muda sozinha sempre que o conteúdo do build muda (os nomes dos
 * arquivos gerados carregam o hash do conteúdo).
 */
export function renderServiceWorker(template, builtFiles) {
  if (!template.includes('__BUILD_ID__') || !template.includes('__PRECACHE_URLS__')) {
    throw new Error('Modelo do Service Worker sem os marcadores __BUILD_ID__ e __PRECACHE_URLS__.');
  }
  const sorted = [...builtFiles].sort();
  const buildId = createHash('sha256').update(sorted.join('\n')).digest('hex').slice(0, 10);
  const urls = [...new Set([...STATIC_URLS, ...sorted.map((file) => `/${file}`)])];

  const code = template.replaceAll('__BUILD_ID__', buildId).replaceAll('__PRECACHE_URLS__', JSON.stringify(urls));
  return { code, buildId };
}
