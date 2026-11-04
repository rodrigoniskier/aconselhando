import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createNodeMiddleware } from './server/nodeAdapter.js'

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

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), geminiApi(mode)],
}))
