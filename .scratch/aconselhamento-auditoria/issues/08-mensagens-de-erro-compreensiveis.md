# 08: Mensagens de erro compreensíveis

**What to build:** Erros técnicos (código HTTP, texto bruto do servidor) deixam de aparecer na tela. O usuário vê mensagens claras por tipo de problema (sem internet, limite de uso, indisponibilidade) e um botão 'tentar de novo'.

**Blocked by:** 01 (Rede de segurança de testes)

**Status:** ready-for-agent

- [ ] Nenhum detalhe técnico bruto é exibido ao usuário
- [ ] Há mensagens distintas para pelo menos: sem conexão, limite de uso, serviço indisponível, erro desconhecido
- [ ] Botão 'tentar de novo' reenvia a última mensagem
- [ ] Detalhes técnicos continuam disponíveis no console para depuração
- [ ] Testes cobrem o mapeamento de erros
