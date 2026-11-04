# 08: Mensagens de erro compreensíveis

**What to build:** Erros técnicos (código HTTP, texto bruto do servidor) deixam de aparecer na tela. O usuário vê mensagens claras por tipo de problema (sem internet, limite de uso, indisponibilidade) e um botão 'tentar de novo'.

**Blocked by:** 01 (Rede de segurança de testes)

**Status:** done

- [x] Nenhum detalhe técnico bruto é exibido ao usuário
- [x] Há mensagens distintas para pelo menos: sem conexão, limite de uso, serviço indisponível, erro desconhecido
- [x] Botão 'tentar de novo' reenvia a última mensagem
- [x] Detalhes técnicos continuam disponíveis no console para depuração
- [x] Testes cobrem o mapeamento de erros
