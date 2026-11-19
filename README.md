# Aconselhando

Plataforma de treinamento para aconselhamento bíblico com simulações de IA.

## Problema, público e resultado

**Problema.** Praticar aconselhamento exige situações realistas, e treinar com pessoas reais em sofrimento envolve riscos que a simulação evita.

**Para quem.** Estudantes e líderes em formação em aconselhamento bíblico.

**O que entrega.** Casos de aconselhamento simulados em que a IA assume a persona do aconselhando e conversa com o treinando, mais um assistente que sugere perguntas e referências durante a conversa. É instalável como PWA e mostra aviso quando está offline.

**Tecnologias.** React 19, Vite, JavaScript, Gemini API, PWA (manifest e Service Worker), ESLint.

**Qualidade e evidências.** Sanitização do conteúdo exibido e histórico de telas. Este repositório não tem testes automatizados.

## Executar localmente

Requer Node.js.

```bash
npm install
echo "GEMINI_API_KEY=sua-chave" > .env.local   # não versione este arquivo
npx vercel dev   # serve o app e a função api/gemini.js localmente
```

## Segurança e privacidade

- As conversas simuladas são enviadas à Gemini API para gerar as respostas. Não digite dados reais de
  pessoas.
- A chave do Gemini fica no servidor: o navegador chama `/api/gemini` (função serverless em
  `api/gemini.js`), que lê `GEMINI_API_KEY` das variáveis de ambiente da Vercel. A chave não entra no
  código entregue ao cliente. Nunca versione chaves.
- O proxy limita o tamanho da requisição, mas ainda não tem limite de uso por visitante; defina uma
  cota no Google AI Studio.

## Limitações

- Os casos são simulações e não substituem supervisão de um conselheiro experiente.
- Sem testes automatizados.
