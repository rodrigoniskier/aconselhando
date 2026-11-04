# 01: Rede de segurança de testes

**What to build:** O projeto passa a ter testes automáticos rodando com um comando. Os primeiros testes cobrem o sanitizador de texto da IA e o serviço que fala com o Gemini (sucesso, limite de uso, erro, cancelamento).

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Existe um comando de teste documentado que roda no terminal
- [x] Testes do sanitizador cobrem os caracteres perigosos e as quebras de linha
- [x] Testes do serviço de IA cobrem resposta válida, resposta vazia, erro 429 com nova tentativa, outros erros e cancelamento
- [x] Lint e build continuam passando
