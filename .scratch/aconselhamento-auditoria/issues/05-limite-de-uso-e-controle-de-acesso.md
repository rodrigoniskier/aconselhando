# 05: Limite de uso e controle de acesso

**What to build:** O servidor intermediário recusa abusos: cada dispositivo (ou cada IP) tem uma cota diária e por minuto, com teto de gastos global. Quando o limite é atingido, o usuário vê um aviso amigável dizendo quando poderá tentar de novo. Decisão pendente do dono: login completo fica fora deste ticket, a menos que seja decidido o contrário.

**Blocked by:** 04 (Esconder a chave do Gemini atrás de um servidor intermediário)

**Status:** ready-for-agent

- [ ] Requisições acima da cota recebem recusa clara no servidor
- [ ] O app mostra mensagem amigável quando a cota acaba
- [ ] Existe teto global de uso configurável
- [ ] Testes cobrem o limite dentro e fora da cota
