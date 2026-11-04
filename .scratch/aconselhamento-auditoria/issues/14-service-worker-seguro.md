# 14: Service Worker seguro

**What to build:** O Service Worker deixa de guardar respostas da API de IA e passa a devolver uma resposta de contingência quando algo não está em cache, em vez de quebrar.

**Blocked by:** 04 (Esconder a chave do Gemini atrás de um servidor intermediário)

**Status:** ready-for-agent

- [ ] Chamadas à API de IA nunca entram no cache
- [ ] Quando a rede e o cache falham, o usuário vê uma página/resposta de contingência
- [ ] Testes ou verificação manual documentada em modo offline
