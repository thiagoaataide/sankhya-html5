# Estado do projeto

## Decisions

- A sincronização da foto será feita por Anexo do Sistema → evento Java →
  `AD_PCFIITE.IMAGEM`.
- O evento não deve bloquear a PCFI por indisponibilidade momentânea do arquivo.
- O HTML5 usará `CRUDServiceProvider.saveRecord` para reacionar o evento de
  `AnexoSistema`, sem criar um SP customizado.
- O campo neutro utilizado para reacionar o evento será `DESCRICAO`, preservando
  o valor `Foto PCFI`.
- A Apuração de Faturas segue no gadget HTML5 mais rotinas Java em
  `C:\projetos\GET_FACILITA` (`Acoes.apuracao`), chamadas por
  `ActionButtonsSP.executeJava`. O add-on
  `facilita-apuracao-fatura-addon` e a fachada `ApuracaoDashboardSP` ficam
  descontinuados por ora. A memória vigente está em
  `.specs/features/facilita-apuracao-faturas/memory.md`.
- Botões: `77` valor e vencimento, `78` tarefa pendente, `79` confirmar ou
  solicitar nova auditoria. A gravação é JAPE em `bhApuracao`.
- A lateral do gadget não repete a grade. Ordem: ações, valor e vencimento,
  anexo, acesso à operadora. Erro de rotina abre aviso, sem o prefixo
  "Regra Personalizada".
- Diferença visual em relação à tela legada é aceitável. A validação é manual
  no Sankhya Om.

## Handoff

Dashboard `facilita/apuracao-faturas` com rotinas em GET_FACILITA.
Botões 77, 78 e 79 ligados. Painel lateral reordenado em 2026-10-01.
Fonte vigente: `.specs/features/facilita-apuracao-faturas/memory.md`.
Próximo passo: publicar o gadget e o jar e homologar confirmar, nova auditoria e abrir tarefa no Om.
