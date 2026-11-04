# 04: Esconder a chave do Gemini atrás de um servidor intermediário

**What to build:** O app deixa de carregar a chave do Gemini no código distribuído. As chamadas de conversa e de ajuda passam por um servidor intermediário que guarda a chave. Para o usuário, a conversa funciona como antes.

**Blocked by:** 01 (Rede de segurança de testes)

**Status:** ready-for-agent

- [ ] A chave não aparece no pacote gerado pelo build nem nas requisições feitas pelo navegador
- [ ] Conversa, sugerir pergunta, buscar versículos e avaliação funcionam via servidor
- [ ] A chave atual é considerada comprometida e substituída (passo manual do dono do projeto, documentado)
- [ ] Aviso de 'chave não configurada' adaptado ao novo modelo
- [ ] Testes do serviço atualizados
