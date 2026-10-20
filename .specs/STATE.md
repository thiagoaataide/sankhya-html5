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
- Apuração de Faturas (A9, 2026-10-19): o gadget deve permitir gravar **valor
  0,00** no botão 77. Zero não é “campo vazio”; confirmação (79) aceita
  `VALOR = 0` no banco. Detalhes em `memory.md` § editar valor e vencimento.

## Handoff

Dashboard `facilita/apuracao-faturas` com rotinas em GET_FACILITA.
Botões 77, 78 e 79 ligados. Painel lateral reordenado em 2026-10-01.
Fonte vigente: `.specs/features/facilita-apuracao-faturas/memory.md`.
Ajustes A1–A6: UAT validado no Om (2026-10-19). **A9–A13** implementados (UAT
pendente, incl. modal **Dados anexo** / `anexos_payload.jsp`). **A7** iframe
pendente.
