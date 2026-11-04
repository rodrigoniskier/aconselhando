# Aconselhando

Aplicativo web (PWA, também empacotado como app Android) para **treinar aconselhamento bíblico** com simulações de IA. A pessoa escolhe um caso, conversa com um personagem fictício interpretado pelo Gemini e pode pedir sugestões de perguntas, versículos e uma avaliação final da sessão. Nada é salvo: a conversa existe só enquanto a tela está aberta.

## Como funciona

- **Tecnologias:** React 19, Vite, Tailwind CSS 4, Gemini API.
- **Telas:** início → menu de casos → chat.
- **Casos de treino:** `src/data/counselingCases.js`. Instruções enviadas à IA: `src/config/prompts.js`.
- **Chamadas à IA:** `src/services/geminiService.js`.
- **Modo offline:** `public/sw.js` (Service Worker).

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha GEMINI_API_KEY (fica só no servidor)
npm run dev
```

## Comandos

- `npm run dev`: servidor de desenvolvimento
- `npm test`: roda os testes automáticos uma vez (Vitest)
- `npm run test:watch`: testes em modo contínuo
- `npm run lint`: verifica o estilo do código
- `npm run build`: gera a versão de produção em `dist/`
- `npm run preview`: serve a versão de produção localmente

## Publicação

O app é publicado como site estático (Vercel). Antes de publicar, rode `npm run lint`, `npm test` e `npm run build`. Para lançar uma versão, veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Servidor intermediário e a chave da API

O navegador **nunca** fala direto com o Google. Ele chama `POST /api/gemini`, e o servidor (`server/geminiProxy.js`, publicado pela Vercel como `api/gemini.js`) guarda a chave, monta as instruções da IA e só aceita pedidos de formatos conhecidos (conversa de um caso cadastrado, ou um dos ajudantes). No `npm run dev` e `npm run preview` a mesma rota é servida localmente.

Na Vercel, cadastre `GEMINI_API_KEY` em *Project Settings > Environment Variables* (veja `.env.example`). Se a chave antiga já foi publicada em versões anteriores do app, **revogue-a** no painel do Google e crie outra.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). A auditoria de engenharia e os tickets estão em `.scratch/aconselhamento-auditoria/`.
