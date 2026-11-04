# Tickets: auditoria de engenharia do Aconselhando

Origem: auditoria de engenharia de software. Ordem de dependência (bloqueadores primeiro).

- 01 Rede de segurança de testes — bloqueado por: ninguém
- 02 Separar os textos de IA da tela de chat — bloqueado por: 01
- 03 Corrigir erros de português nos textos e casos — bloqueado por: 02
- 04 Esconder a chave do Gemini atrás de um servidor intermediário — bloqueado por: 01
- 05 Limite de uso e controle de acesso — bloqueado por: 04
- 06 Nome do modelo configurável, com plano B — bloqueado por: 04
- 07 Controlar o tamanho da conversa — bloqueado por: 01, 04
- 08 Mensagens de erro compreensíveis — bloqueado por: 01
- 09 Tratar resposta bloqueada ou vazia pela IA — bloqueado por: 08
- 10 Confirmar antes de encerrar e permitir copiar a conversa — bloqueado por: 01
- 11 Recarregar a página não perde onde o usuário está — bloqueado por: 01
- 12 Avisos de segurança e conteúdo sensível — bloqueado por: 02
- 13 Acessibilidade e layout no celular — bloqueado por: 01
- 14 Service Worker seguro — bloqueado por: 04
- 15 Offline de verdade e versão de cache automática — bloqueado por: 14
- 16 Atualizar sem perder a conversa — bloqueado por: 14
- 17 Atualizar dependências vulneráveis — bloqueado por: ninguém
- 18 Documentação e verificação automática (CI) — bloqueado por: 01
- 19 Política de privacidade — bloqueado por: 04
- 20 Versão única e padrão de commits — bloqueado por: ninguém

- 21 Não repetir erros permanentes da IA — bloqueado por: 01

Pode começar já: 01, 17, 20
