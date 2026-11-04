# 21: Não repetir erros permanentes da IA

**What to build:** Hoje, quando o Gemini responde com erro permanente (ex.: 400, 401, 403, 404, 500), o app repete a chamada até 3 vezes com espera, atrasando o aviso ao usuário e gastando cota à toa. Só devem ser repetidos erros passageiros: limite de uso (429), indisponibilidade (503) e falha de rede.

**Blocked by:** 01 (Rede de segurança de testes)

**Status:** done

- [x] Erros 400, 401, 403, 404 e 500 falham na primeira tentativa, sem espera
- [x] 429, 503 e falhas de rede continuam sendo repetidos com espera crescente
- [x] Cancelamento continua sem repetição
- [x] Testes cobrem cada categoria e a contagem de chamadas
