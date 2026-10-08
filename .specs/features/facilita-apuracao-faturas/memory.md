# Memória — Apuração de Faturas (HTML5)

Vigente em 2026-10-01. Este arquivo concentra o estado, as decisões e o
contrato operacional do gadget. O add-on
`C:\projetos\facilita-apuracao-fatura-addon` fica descontinuado por ora.
As specs antigas desse repositório e o ADR da fachada
`ApuracaoDashboardSP` permanecem só como histórico.

## Onde vive cada coisa

| Peça | Onde |
|------|------|
| Gadget | `facilita/apuracao-faturas/` |
| Rotinas Java | `C:\projetos\GET_FACILITA`, pacote `Acoes.apuracao` |
| Regra de negócio | `C:\projetos\facilitatelecom_legado\facilitatelecoment` |
| Add-on Studio | Descontinuado por ora. Não é o caminho do gadget. |

O gadget chama `ActionButtonsSP.executeJava` pela função `acionarBotaoJava`.
Um parâmetro só vai pelo `ServiceProxy`. A gravação é JAPE na instância
`bhApuracao`, para o evento da entidade enxergar `CONFIRMADO`.

## Botões de ação

| ID | Nome | Classe | Parâmetro |
|----|------|--------|-----------|
| 77 | Alterar vencimento e valor | `Acoes.apuracao.AtualizarValorVencimento` | `NUAPURACAO`, `VALOR`, `DTVENC` |
| 78 | Obter tarefa | `Acoes.apuracao.ObterTarefaPendente` | `NUAPURACAO` |
| 79 | Confirmar / nova auditoria | `Acoes.apuracao.ConfirmarApuracao` | `NUAPURACAO` |

IDs no gadget: `tdb_partida.jsp`, objeto `FACILITA_APURACAO_FACADE`.

## Confirmar e nova auditoria

Um botão só. O texto muda com `CONFIRMADO`.

- Aberto e com valor: grava `CONFIRMADO = S`. Sem valor: "Para confirmar uma conta o campo valor deve ser preenchido."
- Confirmado e usuário com `TSIUSU.BH_NOVAAUDIT = S`: limpa `IDINSTPRN`, `CONFIRMADO`, `AUDITORIAFINALIZADA`, `EMAILENVIADO` e `FATURAMENTOLIBERADO`.
- Confirmado sem a flag: "Usuário não possui permissão para solicitar nova auditoria."

O `S` em `CONFIRMADO` dispara o fluxo no evento já existente da entidade.

## Abrir tarefa

Duplo clique na grade e o botão Abrir tarefa chamam o botão 78. A rotina devolve o `IDINSTTAR` pendente (`MIN` em `TWFITAR` com `DHCONCLUSAO` nulo). O gadget abre `br.com.sankhya.workflow.listatarefa` com o `IDINSTPRN` da linha. Sem tarefa, o aviso é "Nenhuma tarefa pendente para a apuração." O prefixo "Regra Personalizada" não aparece para o usuário.

## Painel lateral

Decisão de 2026-10-01. A grade já mostra conta, contrato, referência, valor, vencimento, estado e anexo. A lateral não repete isso.

Ordem: identidade e estado, ações (grudadas no topo), valor e vencimento, anexo, acesso à operadora.

## Visual

Paleta alinhada ao site da GET (`#0473e3`, fundo `#f3f6fa`, texto `#1c1c1c`).
O selo "Powered by" com `css/logo-get.png` fica fixo no canto inferior direito. A logo vai na pasta do CSS para entrar no pacote do gadget.

## Fora deste caminho

- Sem Service Provider novo no GET_FACILITA.
- Ver anexo continua em `/facilitatelecom/visualizadorArquivos.facilita?nuApuracao=`.
- Consulta da grade continua na JSP do gadget.
