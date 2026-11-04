# 15: Offline de verdade e versão de cache automática

**What to build:** Os arquivos gerados pelo build (JS e CSS) passam a ser guardados em cache, de modo que o app abre sem internet. O nome/versão do cache muda sozinho a cada release, sem edição manual.

**Blocked by:** 14 (Service Worker seguro)

**Status:** ready-for-agent

- [ ] O app abre sem internet depois da primeira visita
- [ ] Cada release invalida o cache antigo automaticamente
- [ ] Documentação curta de como a versão é gerada
