# Estado do projeto

## Decisions

- A sincronização da foto será feita por Anexo do Sistema → evento Java →
  `AD_PCFIITE.IMAGEM`.
- O evento não deve bloquear a PCFI por indisponibilidade momentânea do arquivo.
- O HTML5 usará `CRUDServiceProvider.saveRecord` para reacionar o evento de
  `AnexoSistema`, sem criar um SP customizado.
- O campo neutro utilizado para reacionar o evento será `DESCRICAO`, preservando
  o valor `Foto PCFI`.
- A Apuração de Faturas seguirá uma migração incremental: gadget HTML5 para
  consulta e nova fachada transacional da Facilita para mutações, sem build ou
  deploy do checkout legado `facilitatelecoment`.
- Diferença visual em relação à tela legada é aceitável; o critério é paridade
  funcional, autorização, consistência e rastreabilidade. A decisão está em
  `.specs/features/facilita-apuracao-faturas/adr/ADR-001-fachada-transacional-dashboard.md`.
- A validação da Apuração de Faturas será manual no Sankhya Om. O contrato da
  fachada precisa ser capturado e aprovado antes de habilitar operações de
  escrita.

## Handoff

Dashboard `facilita/apuracao-faturas` — migração da Apuração de Faturas para gadget HTML5.
Fase atual: T17 parcial; adaptadores de T11–T14 implementados; pacote ZIP recriado.
Próximo passo: capturar/aprovar requests, respostas e permissões no Om do cliente e
publicar a fachada `facilitatelecom@ApuracaoDashboardSP` (T18). Sem esse pacote,
T21/UAT transacional permanece bloqueado.
Arquivos alterados: `.specs/features/facilita-apuracao-faturas/`, `facilita/apuracao-faturas/`.
Alterações não relacionadas em `intercompany/` foram preservadas.
