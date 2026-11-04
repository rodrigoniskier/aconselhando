# Como contribuir

## Antes de enviar uma mudança

```bash
npm run lint
npm test
npm run build
```

Os três precisam passar (o CI roda os mesmos comandos).

## Mensagens de commit

Escreva em português, no imperativo, dizendo **o que mudou e por quê**. Evite mensagens genéricas como "Update App.jsx".

Formato: `tipo: resumo curto (até ~70 caracteres)`, seguido, se preciso, de uma linha em branco e de um parágrafo explicando o motivo.

Tipos usados: `feat` (funcionalidade nova), `fix` (correção), `test`, `docs`, `refactor`, `chore` (manutenção/dependências).

Exemplos:

- `fix: para de repetir erros permanentes da IA`
- `feat: botão para copiar a conversa`
- `chore: atualiza dependências com vulnerabilidades`

## Versão do aplicativo

A versão vem **somente** do `package.json`. Para lançar: atualize `WHATS_NEW` em `src/config/appVersion.js` e rode `npm version patch` (ou `minor`/`major`).
