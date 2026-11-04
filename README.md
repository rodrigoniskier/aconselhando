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
cp .env.example .env.local   # preencha VITE_GEMINI_API_KEY
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

## Segurança da chave da API

Atenção: enquanto a chamada ao Gemini sair direto do navegador, a chave fica visível no código distribuído (ticket 04 da auditoria resolve isso com um servidor intermediário). Restrinja a chave no painel do Google e não a compartilhe.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). A auditoria de engenharia e os tickets estão em `.scratch/aconselhamento-auditoria/`.
