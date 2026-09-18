# Estado do projeto

## Decisions

- A sincronização da foto será feita por Anexo do Sistema → evento Java →
  `AD_PCFIITE.IMAGEM`.
- O evento não deve bloquear a PCFI por indisponibilidade momentânea do arquivo.
- O HTML5 usará `CRUDServiceProvider.saveRecord` para reacionar o evento de
  `AnexoSistema`, sem criar um SP customizado.
- O campo neutro utilizado para reacionar o evento será `DESCRICAO`, preservando
  o valor `Foto PCFI`.

## Handoff

Dashboard `intercompany/` — diagnóstico devolução intercompany (empresas 2 e 7).
Spec: `.specs/features/intercompany-devolucao-diagnostico/spec.md`
Próximo passo: publicar gadget no Sankhya e validar SQL em produção (volume de notas).
