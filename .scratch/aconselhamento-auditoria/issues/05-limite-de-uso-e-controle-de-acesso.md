# 05: Limite de uso e controle de acesso

**What to build:** O servidor intermediário recusa abusos: cada dispositivo (ou cada IP) tem uma cota diária e por minuto, com teto de gastos global. Quando o limite é atingido, o usuário vê um aviso amigável dizendo quando poderá tentar de novo. Decisão pendente do dono: login completo fica fora deste ticket, a menos que seja decidido o contrário.

**Blocked by:** 04 (Esconder a chave do Gemini atrás de um servidor intermediário)

**Status:** done

- [x] Requisições acima da cota recebem recusa clara no servidor
- [x] O app mostra mensagem amigável quando a cota acaba
- [x] Existe teto global de uso configurável
- [x] Testes cobrem o limite dentro e fora da cota

**Nota da implementação:** a contagem de uso fica na memória de cada instância do servidor; para um teto rigoroso entre instâncias, trocar por um armazenamento compartilhado (ex.: Upstash/Vercel KV) mantendo a interface do limitador. Login completo não foi feito (decisão pendente do dono).
