import { describe, expect, it } from 'vitest';
import { renderServiceWorker } from './serviceWorkerBuild';

const template = `const CACHE_NAME = 'aconselhando-__BUILD_ID__';\nconst PRECACHE_URLS = __PRECACHE_URLS__;`;
const files = ['assets/index-abc.js', 'assets/index-abc.css'];

describe('renderServiceWorker', () => {
  it('lista no cache os arquivos gerados pelo build, com barra inicial, mais os fixos', () => {
    const { code } = renderServiceWorker(template, files);
    const urls = JSON.parse(code.match(/PRECACHE_URLS = (.*);/)[1]);
    expect(urls).toEqual(expect.arrayContaining(['/', '/index.html', '/manifest.json', '/assets/index-abc.js', '/assets/index-abc.css']));
  });

  it('gera a mesma versão para o mesmo conjunto de arquivos, em qualquer ordem', () => {
    const a = renderServiceWorker(template, files).buildId;
    const b = renderServiceWorker(template, [...files].reverse()).buildId;
    expect(a).toBe(b);
  });

  it('muda a versão quando algum arquivo do build muda', () => {
    const a = renderServiceWorker(template, files).buildId;
    const b = renderServiceWorker(template, ['assets/index-xyz.js', 'assets/index-abc.css']).buildId;
    expect(a).not.toBe(b);
  });

  it('coloca a versão no nome do cache e não deixa marcadores sem trocar', () => {
    const { code, buildId } = renderServiceWorker(template, files);
    expect(code).toContain(`aconselhando-${buildId}`);
    expect(code).not.toMatch(/__[A-Z_]+__/);
  });

  it('falha em vez de publicar um Service Worker sem os marcadores', () => {
    expect(() => renderServiceWorker('self.skipWaiting()', files)).toThrow(/marcador/i);
  });
});
