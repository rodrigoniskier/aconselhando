# 18: Documentação e verificação automática (CI)

**What to build:** O repositório ganha um README que explica o app, um arquivo de exemplo de configuração e uma verificação automática (lint, testes e build) a cada mudança enviada.

**Blocked by:** 01 (Rede de segurança de testes)

**Status:** done

- [x] README descreve o que é o app, como rodar, testar e publicar
- [x] Existe um exemplo de configuração sem segredos
- [x] Uma verificação automática roda lint, testes e build em cada mudança
- [x] A verificação falha de verdade quando algo quebra

**Nota da implementação:** a verificação do CI foi escrita mas só roda de fato no GitHub após o push; localmente lint, testes e build passam.
