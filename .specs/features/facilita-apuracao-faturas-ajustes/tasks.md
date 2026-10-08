# Facilita — Apuração de Faturas (ajustes) — Tasks

**Spec:** `spec.md`  
**Status:** em execução (A1 implementada; UAT pendente)  
**Última atualização:** 2026-10-08

## Como usar este arquivo

1. Cada pedido do solicitante vira uma task **A*n*** (A1, A2, …).
2. Descrever **What**, **Where**, critérios **Done when** e **Status**.
3. Implementar na ordem enviada, salvo dependência explícita entre tasks.
4. Após alterar `javascript/script.js`, rodar `node --check facilita/apuracao-faturas/javascript/script.js`.
5. Se tocar JSP/CSS/JS de UI, aplicar revisão `web-design-guidelines` ao fechar o lote ou a task.

## Protocolo de validação

Validação manual no Sankhya Om pelo solicitante, salvo quando a task for só
documentação ou spec.

## Gate

| Nível | Comando |
| --- | --- |
| Sintaxe JS | `node --check facilita/apuracao-faturas/javascript/script.js` |
| Comportamento | UAT manual no Om |

## Execution plan

```text
A1 → A2 → A3 → … (sequencial, conforme pedidos)
```

## Task breakdown

<!-- Novas tasks entram abaixo, em ordem. Template:

### A1: Título curto

**What:** …
**Where:** `facilita/apuracao-faturas/…`
**Depends on:** None | A*n*
**Pedido em:** 2026-10-08

**Done when:**

- [ ] …

**Tests:** manual — UAT | `node --check`
**Status:** ⏳ Pendente | 🔄 Em execução | ✅ Concluída | ❌ Cancelada

-->

### A1: Manter filtros após confirmar ou solicitar nova auditoria

**What:** Deixar de recarregar a página inteira após sucesso transacional; atualizar só a grade via `dados.jsp`, preservando parâmetros do gadget (`P_REFERENCIA`, `P_SOMENTE_PENDENTES`, `P_POSSUI_ANEXO`) e filtros locais (pesquisa, campo, página).
**Where:** `facilita/apuracao-faturas/javascript/script.js`
**Depends on:** None
**Pedido em:** 2026-10-08

**Done when:**

- [x] Fechar o diálogo de sucesso após confirmar/nova auditoria não chama `location.reload`.
- [x] A lista é reconsultada com os mesmos parâmetros do gadget guardados em `sessionStorage`.
- [x] Pesquisa, campo de filtro e paginação são restaurados após a atualização.
- [ ] UAT no Om: combinar mês + pendentes + anexo + texto de pesquisa, confirmar linha e verificar que a visão permanece.

**Tests:** `node --check` + manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A2: Reordenar colunas da grade por arrastar e soltar

**What:** Permitir mover colunas no cabeçalho da tabela (drag and drop), persistir a ordem com as demais preferências de colunas e refletir na exportação CSV.
**Where:** `facilita/apuracao-faturas/javascript/script.js`, `facilita/apuracao-faturas/css/style.css`
**Depends on:** None
**Pedido em:** 2026-10-08

**Done when:**

- [x] Cada coluna visível no cabeçalho tem alça de arraste com label acessível.
- [x] Soltar sobre outra coluna reordena lista e corpo da grade.
- [x] Ordem salva em `localStorage` (`columns:v2.order`).
- [x] CSV exporta colunas na ordem exibida.
- [ ] UAT no Om: reordenar, recarregar gadget e confirmar persistência.

**Tests:** `node --check` + manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A3: Filtro por coluna no cabeçalho da grade

**What:** Segunda linha no `thead` com campo de pesquisa abaixo de cada coluna visível; o texto filtra somente os dados da coluna correspondente (combinável com a pesquisa global do topo).
**Where:** `tdb_partida.jsp`, `javascript/script.js`, `css/style.css`
**Depends on:** A2 (ordem das colunas no cabeçalho)
**Pedido em:** 2026-10-08

**Done when:**

- [x] Cada coluna visível exibe input “Filtrar” com `aria-label` por coluna.
- [x] Filtros de colunas se combinam entre si e com a pesquisa global.
- [x] Valores persistem em `sessionStorage` com os demais filtros client-side (A1).
- [x] Reordenação/fixação de colunas mantém alinhamento da linha de filtros.
- [ ] UAT no Om: filtrar conta/contrato, confirmar operação e verificar persistência após refresh da grade.

**Tests:** `node --check` + manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A4: Colunas Nome Cliente e Razão Cliente no grid

**What:** Expor `TGFPAR.NOMEPARC` e `TGFPAR.RAZAOSOCIAL` do parceiro `APU.CLIENTE` na lista, com rótulos **Nome Cliente** e **Razão Cliente** (visíveis por padrão).
**Where:** `dados.jsp`, `javascript/script.js`
**Depends on:** None
**Pedido em:** 2026-10-08

**Done when:**

- [x] SQL faz `LEFT JOIN TGFPAR CLI ON CLI.CODPARC = APU.CLIENTE`.
- [x] Colunas no grid, pesquisa global e filtros por coluna (A3).
- [ ] UAT no Om: conferir nomes em apurações com `CLIENTE` preenchido.

**Tests:** manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A5: Unificar resumo e filtros (menos scroll vertical)

**What:** Remover o bloco “Visão de trabalho”; colocar Pesquisar, Campo e chip de mês na mesma faixa dos contadores (Registros, Pendentes, Com anexo); eliminar texto duplicado de totais; compactar cabeçalho e ampliar área útil da grade.
**Where:** `tdb_partida.jsp`, `css/style.css`, `javascript/script.js`
**Depends on:** None
**Pedido em:** 2026-10-08

**Done when:**

- [x] Uma única faixa `work-toolbar` com métricas + filtros.
- [x] Contagem redundante removida (`filter-summary`, `state-message`).
- [x] `table-wrap` com mais altura visível (`calc(100vh - 210px)`).
- [ ] UAT: operação sem scroll da página só para ver a grade (scroll vertical só dentro da tabela).

**Tests:** manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A6: Parâmetros do gadget na toolbar (sem painel lateral)

**What:** Remover `prompt-parameters` do `tdb_dashboard.xml`; expor mês, somente pendentes e possui anexo antes do campo Pesquisar; botão Aplicar recarrega com query `P_*`.
**Where:** `tdb_dashboard.xml`, `tdb_partida.jsp`, `dados.jsp`, `javascript/script.js`, `css/style.css`
**Depends on:** A5
**Pedido em:** 2026-10-08

**Done when:**

- [x] Painel lateral de parâmetros do componente deixa de ser necessário após republicar o XML.
- [x] Controles alinhados à esquerda da pesquisa local; padrão mês corrente + pendentes Sim + anexo Não.
- [ ] UAT: republicar gadget (XML + JSP), aplicar filtros e validar lista/contadores.

**Tests:** manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A7: Painel de detalhe sem scroll interno

**What:** Remover `overflow` do aside; layout denso (ações, edição 2 colunas, anexo compacto, acesso à operadora com células menores).
**Where:** `css/style.css`
**Pedido em:** 2026-10-08

**Status:** ✅ Implementado (validar no Om em altura típica do iframe)

### A8: Ampliar Pesquisar / Campo (relatório legado)

**What:** Incluir no filtro local (Pesquisar + combo Campo) titular, operadora, consultor e códigos — sem painel extra de filtros no servidor.
**Where:** `tdb_partida.jsp`, `javascript/script.js`, `dados.jsp` (dados para busca local)
**Depends on:** A6
**Pedido em:** 2026-10-08

**Done when:**

- [x] Opções extras no combo **Campo** e mapeamento em `matchesSearch`.
- [x] Dados de titular/operadora/consultor disponíveis nas linhas (`data-*`).
- [x] Painel “Filtros específicos” removido (escopo reduzido pelo solicitante).

**Tests:** `node --check` + manual — UAT  
**Status:** ✅ Concluída (validação local pelo solicitante)

## Registro de sessão

| Data | Nota |
| --- | --- |
| 2026-10-08 | Feature de ajustes criada; retomada do fluxo pós-commit `0ef48f5`. |
| 2026-10-08 | A1: refresh parcial da grade; botão Atualizar alinhado ao mesmo fluxo. |
| 2026-10-08 | A2: drag and drop de colunas no cabeçalho + persistência de ordem. |
| 2026-10-08 | A3: filtros por coluna na segunda linha do cabeçalho. |
| 2026-10-08 | A4: colunas Nome Cliente e Razão Cliente (`TGFPAR` via `APU.CLIENTE`). |
| 2026-10-08 | A5: toolbar única (métricas + pesquisa); menos altura fixa acima do grid. |
| 2026-10-08 | A6: parâmetros P_* na toolbar; `tdb_dashboard.xml` sem prompt lateral. |
| 2026-10-08 | A8: pesquisa local ampliada (Campo); painel filtros específicos descartado. |
