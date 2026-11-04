# 07: Controlar o tamanho da conversa

**What to build:** Conversas longas não crescem sem limite: o histórico enviado é limitado de forma inteligente (mantendo o início e as falas mais recentes), e respostas longas como a avaliação final não são cortadas no meio.

**Blocked by:** 01 (Rede de segurança de testes), 04 (Esconder a chave do Gemini atrás de um servidor intermediário)

**Status:** ready-for-agent

- [ ] Existe um limite configurável de histórico enviado
- [ ] A avaliação final não é truncada em sessões longas
- [ ] O usuário é avisado quando partes antigas deixam de ser consideradas
- [ ] Testes cobrem o corte do histórico
