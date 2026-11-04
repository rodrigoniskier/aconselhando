# 06: Nome do modelo configurável, com plano B

**What to build:** O modelo de IA deixa de estar fixo no código do app: passa a ser configuração do servidor intermediário, com um modelo reserva automático se o principal for aposentado ou falhar.

**Blocked by:** 04 (Esconder a chave do Gemini atrás de um servidor intermediário)

**Status:** done

- [x] Trocar o modelo não exige nova versão do app
- [x] Se o modelo principal responde que não existe mais, o reserva é usado e o evento fica registrado
- [x] Testes cobrem a troca para o modelo reserva
