# Aconselhando

Plataforma de treinamento para aconselhamento bíblico com simulações de IA.

## Problema, público e resultado

**Problema.** Praticar aconselhamento exige situações realistas, e treinar com pessoas reais em sofrimento envolve riscos que a simulação evita.

**Para quem.** Estudantes e líderes em formação em aconselhamento bíblico.

**O que entrega.** Casos de aconselhamento simulados em que a IA assume a persona do aconselhando e conversa com o treinando, mais um assistente que sugere perguntas e referências durante a conversa. É instalável como PWA e mostra aviso quando está offline.

**Tecnologias.** React 19, Vite, JavaScript, Gemini API, PWA (manifest e Service Worker), ESLint.

**Qualidade e evidências.** Sanitização do conteúdo exibido e histórico de telas. Não há testes automatizados; o CI roda lint e build a cada push e pull request. Licença MIT.

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
- O proxy limita o tamanho de cada requisição e o número de requisições por IP (20 por minuto, contagem
  por instância serverless, portanto é um limite de melhor esforço). Defina também uma cota e um
  alerta de gasto no Google AI Studio.

## Uso simultâneo e resiliência

Para vários usuários ao mesmo tempo, `api/gemini.js` tenta os modelos em ordem (padrão:
`gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`; configurável pela variável
`GEMINI_MODELS`, separada por vírgulas). Em erro transitório (500/502/503/504) repete com espera
exponencial e jitter; quando a cota de um modelo se esgota (429), pausa esse modelo por 60 s e usa o
próximo; modelo inexistente (404) é ignorado. No navegador, `geminiService.js` repete falhas
transitórias respeitando `Retry-After` e mostra mensagens em português. Esses comportamentos foram
verificados com testes manuais contra um `fetch` simulado; o repositório ainda não tem testes
automatizados.

## Limitações

- Os casos são simulações e não substituem supervisão de um conselheiro experiente.
- Sem testes automatizados.
