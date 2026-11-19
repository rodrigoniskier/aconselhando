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
echo "VITE_GEMINI_API_KEY=sua-chave" > .env.local   # não versione este arquivo
npm run dev
```

## Segurança e privacidade

- As conversas simuladas são enviadas à Gemini API para gerar as respostas. Não digite dados reais de
  pessoas.
- A chave é lida de `VITE_GEMINI_API_KEY`. Variáveis `VITE_` ficam visíveis no código entregue ao
  navegador, portanto, em uma publicação aberta, use uma chave restrita por domínio e por cota, ou
  coloque um backend como intermediário. Nunca versione chaves.

## Limitações

- Os casos são simulações e não substituem supervisão de um conselheiro experiente.
- Sem testes automatizados.
