# Memória — Apuração de Faturas (HTML5)

Vigente em 2026-10-19. Este arquivo concentra o estado, as decisões e o
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

- Aberto e com valor preenchido no banco (`VALOR` não nulo): grava `CONFIRMADO = S`.
  **Valor zero (0,00) conta como preenchido** — distinto de `VALOR` nulo.
  Sem valor (nulo): "Para confirmar uma conta o campo valor deve ser preenchido."
- Confirmado e usuário com `TSIUSU.BH_NOVAAUDIT = S`: limpa `IDINSTPRN`, `CONFIRMADO`, `AUDITORIAFINALIZADA`, `EMAILENVIADO` e `FATURAMENTOLIBERADO`.
- Confirmado sem a flag: "Usuário não possui permissão para solicitar nova auditoria."

O `S` em `CONFIRMADO` dispara o fluxo no evento já existente da entidade.

## Abrir tarefa

Duplo clique na grade e o botão Abrir tarefa chamam o botão 78. A rotina devolve o `IDINSTTAR` pendente (`MIN` em `TWFITAR` com `DHCONCLUSAO` nulo). O gadget abre `br.com.sankhya.workflow.listatarefa` com o `IDINSTPRN` da linha. Sem tarefa, o aviso é "Nenhuma tarefa pendente para a apuração." O prefixo "Regra Personalizada" não aparece para o usuário.

## Faixa de detalhe (layout v3, 2026-10-19)

Decisão de 2026-10-01 mantida: a grade já mostra conta, contrato, referência, valor, vencimento, estado e anexo; o detalhe não repete isso.

**Layout:** `.workbench__top` = `work-toolbar` + `.workbench-detail` (faixa horizontal com zonas: identidade/ações · editável · anexo · operadora). Grade `.workbench__list` em largura total abaixo. Hero fora do workbench.

## Editar valor e vencimento (botão 77)

Formulário **Dados editáveis** na faixa de detalhe → **Salvar alterações** chama
`AtualizarValorVencimento` com `NUAPURACAO`, `VALOR` e/ou `DTVENC`.

| Regra | Onde |
| --- | --- |
| Valor permitido ≥ 0, **incluindo 0,00** | Java (`signum() < 0` só barra negativo); gadget desde A9 (2026-10-19) |
| Informar ao menos valor ou vencimento | Java e `updateSelectedApuracao` em `script.js` |
| Exibir zero no campo | `valorRaw` em `readDetail` + `formatValorForInput`; não usar truthiness em `0` |
| Payload | `VALOR` enviado só se o campo mudou; vazio explícito (`""`) grava **nulo** no banco (botão 77 atualizado) |
| Valor nulo | Permitido ao limpar o campo e salvar; distinto de `0,00` |

**Histórico do bug (A9):** o HTML5 tratava `0` como vazio (`detail.valor ? …`,
`setInputValue` com `value \|\| ""`) e a validação client-side impedia salvar
quando o campo parecia vazio mesmo com intenção de gravar zero. Correção só no
`javascript/script.js`; o jar do GET_FACILITA não mudou para este pedido.

Rastreio: task **A9** em
`.specs/features/facilita-apuracao-faturas-ajustes/tasks.md`.

## Coluna “Nome da conta na operadora” (grade)

No legado (`Apuracao.html`), o dado vem de
`bhConta.ContatoLoginOperadora.LOGIN` — tabela `BH_FACLGO`, campo `LOGIN`
(dicionário: *Login* em `ContatoLoginOperadora.xml`). No grid Sankhya o rótulo
costuma aparecer como **Nome da conta na operadora**; não é `IDENTIFICADOR`
(`BH_FACCON`) nem `NOMEPARC` da operadora.

Join na consulta do gadget (igual à relação em `Conta.xml` →
`ContatoLoginOperadora`):

```sql
LEFT JOIN BH_FACLGO LGO
  ON LGO.CODPARC = CTA.CODPARCGESTOR
 AND LGO.CODCONTATO = CTA.CODCONTATOGESTOR
 AND LGO.CODOPERADORA = CTA.OPERADORA
```

Projeção na lista: `LGO.LOGIN AS NOMECONTAOPERADORA` em `dados.jsp`; coluna
`nomeContaOperadora` em `script.js` (visível por padrão). O mesmo `LOGIN`
alimenta o painel “Login” no detalhe (`ACESSO_LOGIN` / `data-acesso-login`).

Rastreio: task **A10** em
`.specs/features/facilita-apuracao-faturas-ajustes/tasks.md`.

## Dados anexo (modal)

Botão **Dados anexo** na faixa secundária do painel (ao lado de **Ver anexo**).
Abre modal somente leitura; não altera altura do aside.

| Item | Valor |
| --- | --- |
| Leitura | `anexos_payload.jsp` (`snk:query`) |
| Tabela | `TSIANX` (`AnexoSistema`) |
| Filtro | `NOMEINSTANCIA = 'bhApuracao'`, `PKREGISTRO = '{NUAPURACAO}_bhApuracao'` |
| Ordem | `DHCAD DESC` |
| Usuários | `TSIUSU` em `CODUSU` e `CODUSUALT` |
| Abrir arquivo | **Ver anexo** → `visualizadorArquivos.facilita` (inalterado) |

Colunas no modal: tipo (`BH_TIPO`), descrição, arquivo, inclusão/alteração
(código + nome), datas, **Visível** e **Acesso** via `TDDOPC.OPCAO` (join por
`TDDCAM.NOMETAB = 'TSIANX'` e `NOMECAMPO` `TIPOAPRES` / `TIPOACESSO`; fallback
para o código `VALOR` se não houver opção).

Rastreio: tasks **A11–A14** e
`facilita-apuracao-faturas-ajustes/design-a11-dados-anexo.md`.

## Visual

Paleta alinhada ao site da GET (`#0473e3`, fundo `#f3f6fa`, texto `#1c1c1c`).
O selo "Powered by" com `css/logo-get.png` fica fixo no canto inferior direito. A logo vai na pasta do CSS para entrar no pacote do gadget.

## Fora deste caminho

- Sem Service Provider novo no GET_FACILITA.
- Ver anexo continua em `/facilitatelecom/visualizadorArquivos.facilita?nuApuracao=`.
- Consulta da grade continua na JSP do gadget.

## Preferências por usuário

Documento JSON (`version`, `savedAt`, `server`, `client`, `grid`) gravado em:

| Camada | Onde |
| --- | --- |
| Servidor | `AD_APURACAOCONF.CONF` (CLOB), PK `CODUSU` — `CRUDServiceProvider.saveRecord` |
| Cache | `localStorage` — `facilita-apuracao-faturas:user-prefs:v1:{CODUSU}` |

Leitura na abertura: `prefs_payload.jsp` (`snk:query` por `CODUSU` logado).
Upsert: insert sem `key` (só `CONF`); update com `key.CODUSU`. `DHALTER`/`CODUSU`
por expressão no dicionário.

**Precedência:** filtros `P_*` na toolbar (e `sessionStorage` da sessão) **sempre
prevalecem** sobre o bloco `server` do JSON/`CONF`. O remoto restaura sobretudo
`grid` e `client`; se o JSON tiver `server` diferente da tela, o gadget **grava**
o JSON atualizado. **Aplicar** recarrega a grade via `dados.jsp` (sem reload da
moldura). Debounce ~1,5 s + flush ao sair. Ver `design-a16-preferencias-usuario.md`.

## Parâmetros da consulta (servidor)

`P_REFERENCIA`, `P_SOMENTE_PENDENTES` e `P_POSSUI_ANEXO` ficam na faixa
`work-toolbar` do gadget (não no painel lateral do componente). O
`tdb_dashboard.xml` não declara mais `prompt-parameters` (republicar para sumir
o painel lateral). A moldura GWT ainda renderiza `VCompactBar` (hover abre faixa
de parâmetros); task **A15** carrega `sankhya-parameter-drawer-guard.js`, que
injeta CSS no `parent` e colapsa `.VCompactBar` (experimental; ver tasks A15).
**Aplicar** atualiza só `P_*` na URL atual do componente,
preservando os demais parâmetros do `html5component`; **Atualizar** mantém a
consulta vigente.

## Ajustes pós-entrega

Correções e refinamentos incrementais após a apresentação ficam na feature
`.specs/features/facilita-apuracao-faturas-ajustes/` (`spec.md`, `tasks.md`).
Cada pedido do solicitante entra como task **A*n*** nesse `tasks.md`.
