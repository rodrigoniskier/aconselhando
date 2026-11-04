import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createNodeMiddleware } from './server/nodeAdapter.js'
import { renderServiceWorker } from './scripts/serviceWorkerBuild.js'

// Serve POST /api/gemini no `npm run dev` e no `npm run preview`, usando as
// variáveis do servidor (GEMINI_API_KEY etc., sem prefixo VITE_, nunca vão para o navegador).
function geminiApi(mode) {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const middleware = createNodeMiddleware(env)
  return {
    name: 'gemini-api',
    // Chaves sem `return`: o Vite trataria uma função retornada como hook pós-configuração.
    configureServer(server) {
      server.middlewares.use('/api/gemini', middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/gemini', middleware)
    },
  }
}

// No build, preenche public/sw.js (copiado para dist/) com a versão do cache e a
// lista de arquivos gerados, para o app abrir sem internet e o cache se renovar sozinho.
function serviceWorkerBuild() {
  let outDir
  let builtFiles = []
  return {
    name: 'service-worker-build',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    generateBundle(_options, bundle) {
      builtFiles = Object.keys(bundle).filter((name) => !name.endsWith('.map'))
    },
    closeBundle() {
      const file = join(outDir, 'sw.js')
      const { code } = renderServiceWorker(readFileSync(file, 'utf8'), builtFiles)
      writeFileSync(file, code)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), geminiApi(mode), serviceWorkerBuild()],
}))
