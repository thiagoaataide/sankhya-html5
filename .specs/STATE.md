# Estado do projeto

## Decisions

- A sincronização da foto será feita por Anexo do Sistema → evento Java →
  `AD_PCFIITE.IMAGEM`.
- O evento não deve bloquear a PCFI por indisponibilidade momentânea do arquivo.
- O HTML5 usará `CRUDServiceProvider.saveRecord` para reacionar o evento de
  `AnexoSistema`, sem criar um SP customizado.
- O campo neutro utilizado para reacionar o evento será `DESCRICAO`, preservando
  o valor `Foto PCFI`.
- A Apuração de Faturas segue no gadget HTML5. Valor e vencimento gravam pelo
  botão de ação `77` (`ActionButtonsSP.executeJava` na instância `bhApuracao`),
  não pela fachada `ApuracaoDashboardSP`. O `save` JAPE dispara o
  `ApuracaoListener` do legado. Ver anexo abre
  `/facilitatelecom/visualizadorArquivos.facilita?nuApuracao=`, e o visualizador
  completa a sessão e a chave do arquivo. Comprovado em 2026-09-30. Confirmar,
  nova auditoria e o envio de anexo ainda não usam esse caminho.
- Diferença visual em relação à tela legada é aceitável; o critério é paridade
  funcional, autorização, consistência e rastreabilidade. A decisão está em
  `.specs/features/facilita-apuracao-faturas/adr/ADR-001-fachada-transacional-dashboard.md`.
- A validação da Apuração de Faturas será manual no Sankhya Om. O contrato da
  fachada precisa ser capturado e aprovado antes de habilitar operações de
  escrita.

## Handoff

Dashboard `facilita/apuracao-faturas` — migração da Apuração de Faturas para gadget HTML5.
Fase atual: T12 comprovada no Om pelo botão `77`. Ver anexo comprovado: abre
`/facilitatelecom/visualizadorArquivos.facilita?nuApuracao=` e o visualizador
completa `mgeSession` e `chaveArquivo`.
Próximo passo: confirmar e nova auditoria no mesmo padrão de botão de ação.
T18 (fachada do add-on) deixa de ser o caminho de escrita do gadget.
Arquivos alterados: `.specs/features/facilita-apuracao-faturas/`, `facilita/apuracao-faturas/`.
Alterações não relacionadas em `intercompany/` foram preservadas.
