# Facilita — Apuração de Faturas (ajustes) — Tasks

**Spec:** `spec.md`  
**Status:** A1–A6 concluídas (UAT validado no Om); A9–A10 e A11–A13 implementadas (UAT pendente); A14 parcial (doc); A15 implementada (UAT pendente); A16 desenho (prefs servidor); A7 pendente iframe  
**Última atualização:** 2026-10-19  
**Design A11:** [design-a11-dados-anexo.md](design-a11-dados-anexo.md)  
**Design A16:** [design-a16-preferencias-usuario.md](design-a16-preferencias-usuario.md)
**Memória operacional:** [memory.md](../facilita-apuracao-faturas/memory.md) (§ editar valor e vencimento / A9)

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
| Sintaxe JS | `node --check facilita/apuracao-faturas/javascript/script.js` e `sankhya-parameter-drawer-guard.js` |
| Comportamento | UAT manual no Om |

## Execution plan

```text
A1 → A2 → A3 → … (sequencial, conforme pedidos)
A11 → A12 → A13 → A14   (modal Dados anexo — ver design-a11-dados-anexo.md)
A15   (bloqueio hover barra de parâmetros Sankhya — guard no parent)
A17 → A18 → A19 → A20 → A21   (preferências AD_APURACAOCONF — ver design-a16-preferencias-usuario.md)
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
- [x] UAT no Om: combinar mês + pendentes + anexo + texto de pesquisa, confirmar linha e verificar que a visão permanece.

**Tests:** `node --check` + manual — UAT  
**Status:** ✅ Concluída (UAT validado no Om, 2026-10-19)

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
- [x] UAT no Om: reordenar, recarregar gadget e confirmar persistência.

**Tests:** `node --check` + manual — UAT  
**Status:** ✅ Concluída (UAT validado no Om, 2026-10-19)

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
- [x] UAT no Om: filtrar conta/contrato, confirmar operação e verificar persistência após refresh da grade.

**Tests:** `node --check` + manual — UAT  
**Status:** ✅ Concluída (UAT validado no Om, 2026-10-19)

### A4: Colunas Nome Cliente e Razão Cliente no grid

**What:** Expor `TGFPAR.NOMEPARC` e `TGFPAR.RAZAOSOCIAL` do parceiro `APU.CLIENTE` na lista, com rótulos **Nome Cliente** e **Razão Cliente** (visíveis por padrão).
**Where:** `dados.jsp`, `javascript/script.js`
**Depends on:** None
**Pedido em:** 2026-10-08

**Done when:**

- [x] SQL faz `LEFT JOIN TGFPAR CLI ON CLI.CODPARC = APU.CLIENTE`.
- [x] Colunas no grid, pesquisa global e filtros por coluna (A3).
- [x] UAT no Om: conferir nomes em apurações com `CLIENTE` preenchido.

**Tests:** manual — UAT  
**Status:** ✅ Concluída (UAT validado no Om, 2026-10-19)

### A5: Unificar resumo e filtros (menos scroll vertical)

**What:** Remover o bloco “Visão de trabalho”; colocar Pesquisar, Campo e chip de mês na mesma faixa dos contadores (Registros, Pendentes, Com anexo); eliminar texto duplicado de totais; compactar cabeçalho e ampliar área útil da grade.
**Where:** `tdb_partida.jsp`, `css/style.css`, `javascript/script.js`
**Depends on:** None
**Pedido em:** 2026-10-08

**Done when:**

- [x] Uma única faixa `work-toolbar` com métricas + filtros.
- [x] Contagem redundante removida (`filter-summary`, `state-message`).
- [x] `table-wrap` com mais altura visível (`calc(100vh - 210px)`).
- [x] UAT: operação sem scroll da página só para ver a grade (scroll vertical só dentro da tabela).

**Tests:** manual — UAT  
**Status:** ✅ Concluída (UAT validado no Om, 2026-10-19)

### A6: Parâmetros do gadget na toolbar (sem painel lateral)

**What:** Remover `prompt-parameters` do `tdb_dashboard.xml`; expor mês, somente pendentes e possui anexo antes do campo Pesquisar; botão Aplicar recarrega com query `P_*`.
**Where:** `tdb_dashboard.xml`, `tdb_partida.jsp`, `dados.jsp`, `javascript/script.js`, `css/style.css`
**Depends on:** A5
**Pedido em:** 2026-10-08

**Done when:**

- [x] Painel lateral de parâmetros do componente deixa de ser necessário após republicar o XML.
- [x] Controles alinhados à esquerda da pesquisa local; padrão mês corrente + pendentes Sim + anexo Não.
- [x] UAT: republicar gadget (XML + JSP), aplicar filtros e validar lista/contadores.

**Tests:** manual — UAT  
**Status:** ✅ Concluída (UAT validado no Om, 2026-10-19)

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

### A9: Permitir salvar valor 0,00 na edição

**What:** Aceitar valor zero ao salvar alterações de valor/vencimento; exibir `0` no campo quando a apuração já tem valor zero.
**Where:** `facilita/apuracao-faturas/javascript/script.js`
**Depends on:** None
**Pedido em:** 2026-10-19

**Done when:**

- [x] `0` / `0,00` passam na validação client-side e são enviados ao botão 77.
- [x] Campo Valor mostra zero quando `data-valor` é `0` ou `0,00` (sem tratar como vazio).
- [ ] UAT no Om: gravar `0,00` e conferir na grade e na confirmação.

**Tests:** `node --check` + manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A10: Coluna Nome da conta na operadora na grade

**What:** Expor na lista o campo legado `bhConta.ContatoLoginOperadora.LOGIN` (`BH_FACLGO.LOGIN`), com rótulo **Nome da conta na operadora**, pesquisa e filtro por coluna.
**Where:** `dados.jsp`, `javascript/script.js`, `tdb_partida.jsp`; memória em `memory.md`
**Depends on:** None
**Pedido em:** 2026-10-19

**Done when:**

- [x] SQL projeta `NOMECONTAOPERADORA` via join `BH_FACLGO` (relação gestor da conta).
- [x] Coluna visível no grid, export CSV, pesquisa (Campo) e ordenação local.
- [ ] UAT no Om: comparar valores com a grade legada de Apuração de Faturas.

**Tests:** `node --check` + manual — UAT  
**Status:** 🔄 Em execução (código pronto; falta UAT)

### A11: Payload JSP — metadados de anexo (`TSIANX`)

**What:** Criar `anexos_payload.jsp` com consulta allowlisted a `TSIANX` + `TSIUSU`, filtro `bhApuracao` / `PKREGISTRO`, saída HTML com `.anexo-row` e `data-*`.
**Where:** `facilita/apuracao-faturas/anexos_payload.jsp` (novo)
**Depends on:** None
**Pedido em:** 2026-10-19
**Design:** [design-a11-dados-anexo.md](design-a11-dados-anexo.md)

**Done when:**

- [x] Parâmetro `nuapuracao` validado (somente dígitos); inválido → container vazio + `data-valid-key="N"`.
- [x] SQL retorna colunas do design (tipo, descrição, arquivo, usuários, datas, visível/acesso).
- [x] `ORDER BY DHCAD DESC`; múltiplas linhas suportadas.
- [x] `errorPage="erro.jsp"` e encoding UTF-8 alinhados a `detalhe_payload.jsp`.

**Tests:** manual — abrir JSP no Om com `nuapuracao` conhecido  
**Status:** ✅ Concluída (código)

### A12: Botão e markup do modal

**What:** Incluir **Dados anexo** na faixa secundária (após Ver anexo) e estrutura do diálogo `#attachment-metadata-dialog` no `tdb_partida.jsp`.
**Where:** `facilita/apuracao-faturas/tdb_partida.jsp`
**Depends on:** None (pode paralelizar com A11)
**Pedido em:** 2026-10-19

**Done when:**

- [x] `#btn-attachment-metadata` com label acessível “Dados anexo”.
- [x] Modal com título, região de tabela (`#attachment-metadata-body`), botão Fechar.
- [x] `aria-*` e `hidden` inicial; não alterar altura fixa do aside.

**Tests:** inspeção visual / HTML  
**Status:** ✅ Concluída (código)

### A13: CSS + JavaScript do modal

**What:** Estilos do modal largo; fetch do payload; render da tabela; abrir/fechar (Fechar, Escape); habilitar botão com `possuiAnexo`; cancelar fetch ao trocar linha.
**Where:** `css/style.css`, `javascript/script.js`
**Depends on:** A11, A12
**Pedido em:** 2026-10-19

**Done when:**

- [x] Clique em **Dados anexo** carrega `anexos_payload.jsp` e preenche a tabela.
- [x] Estados carregando, vazio, erro e N linhas implementados.
- [x] `setActionBusy` inclui o novo botão; **Ver anexo** inalterado.
- [x] `node --check` no `script.js` sem erros.
- [x] Revisão `web-design-guidelines` aplicada (foco, teclado, tabela, caption).

**Tests:** `node --check` + manual — Om  
**Status:** ✅ Concluída (código; UAT pendente)

### A14: Memória, checklist UAT e republicação

**What:** Documentar mapeamento legado ↔ SQL em `memory.md`; itens H.5+ no `t22-uat-checklist.md`; nota de republicar gadget (JSP + JS + CSS).
**Where:** `.specs/features/facilita-apuracao-faturas/memory.md`, `facilita/apuracao-faturas/t22-uat-checklist.md`, `STATE.md` se necessário
**Depends on:** A13
**Pedido em:** 2026-10-19

**Done when:**

- [x] Memória § “Dados anexo (modal)” publicada.
- [x] Checklist UAT com comparação ao modal Anexos do legado (H.5, H.6).
- [ ] UAT no Om validado pelo solicitante.

**Tests:** manual — UAT  
**Status:** 🔄 Em execução (falta UAT)

### A15: Impedir abertura da barra de parâmetros do dashboard ao passar o mouse

**What:** O moldura HTML5 do Sankhya mantém `VCompactBar` (faixa ~15px à esquerda) que abre no `mouseover`, mesmo sem `prompt-parameters` no gadget. Injetar guard no documento pai do iframe: CSS (`pointer-events: none`, largura 0) + colapso pontual de `.VCompactBar-opened` (sem observer no `body` do ERP — travava o navegador).
**Where:** `javascript/sankhya-parameter-drawer-guard.js`, `tdb_partida.jsp` (script antes do `script.js`)
**Depends on:** A6 (parâmetros na toolbar; XML sem prompt lateral)
**Pedido em:** 2026-10-19

**Done when:**

- [x] Task registrada e guard carregado no gadget.
- [x] Hover na borda esquerda do dashboard não expande o painel de parâmetros (validar no Om).
- [x] `node --check` no `sankhya-parameter-drawer-guard.js` sem erros.
- [ ] UAT no Om validado pelo solicitante.

**Riscos:** depende de classes GWT (`VCompactBar`); upgrade do Sankhya pode exigir revisão. Falha silenciosa se `parent` for cross-origin.

**Tests:** `node --check` + manual — Om  
**Status:** ✅ Concluída (código; UAT pendente)

### A16: Preferências por usuário — desenho (localStorage + `AD_APURACAOCONF`)

**What:** Documentar modelo de dados, contrato JSON, sync cache/servidor e **`CRUDServiceProvider.saveRecord`** (sem SP Java). Hoje só `localStorage`; tabela **ainda não** é usada em código.
**Where:** [design-a16-preferencias-usuario.md](design-a16-preferencias-usuario.md)
**Depends on:** A6 (parâmetros `P_*` na toolbar)
**Pedido em:** 2026-10-19

**Done when:**

- [x] Desenho publicado (tabela, JSON, fluxos, API, UAT, riscos).
- [x] Tasks A17–A21 registradas para implementação.

**Status:** ✅ Concluída (desenho)

### A17: Tabela `AD_APURACAOCONF` + instância no dicionário

**What:** Cadastro no Om conforme desenho A16 §1: tabela/instância **`AD_APURACAOCONF`** (“Preferências Apuração HTML5”); campos `CODUSU` (inteiro, PK, expressão usuário logado), `DHALTER` (data/hora, expressão), `CONF` (CLOB, configuração JSON). Permissão de inclusão/alteração para perfis do dashboard.
**Where:** Dicionário de dados Om (Facilita)
**Depends on:** A16
**Pedido em:** 2026-10-19

**Done when:**

- [x] Tabela e instância `AD_APURACAOCONF` modeladas no dicionário (campos `CODUSU`, `DHALTER`, `CONF`).
- [x] Expressões de `CODUSU` e `DHALTER` validadas (insert/update de teste).
- [x] Tabela física publicada no banco de teste.
- [x] Permissões CRUD liberadas para usuários do dashboard.

**Tests:** `SELECT` + um `saveRecord` de teste  
**Status:** ✅ Concluída (Om)

### A18: Contrato `saveRecord` (documentado + smoke)

**What:** Validar no Om o upsert em **`AD_APURACAOCONF`**: insert sem `key` (só `CONF`); update com `key.CODUSU`; expressões preenchem `CODUSU`/`DHALTER`. `rootEntity`: `AD_APURACAOCONF`.
**Where:** Postman ou console no Om; nota em `design-a16-preferencias-usuario.md` §4
**Depends on:** A17
**Pedido em:** 2026-10-19

**Done when:**

- [x] Insert e update bem-sucedidos com `CRUDServiceProvider.saveRecord` (validado no Om).
- [ ] Usuário B não altera linha do usuário A (UAT).

**Tests:** manual — Om  
**Status:** ✅ Concluída (smoke; UAT isolamento pendente)

### A19: Gadget — leitura, `saveRecord`, cache local

**What:** Helper `saveRecords` (padrão PCFI); flag existe/não existe; debounce + `pagehide`; leitura via `prefs_payload.jsp` ou query; sync com `localStorage`.
**Where:** `facilita/apuracao-faturas/javascript/script.js`, opcional `prefs_payload.jsp`, `tdb_partida.jsp`
**Depends on:** A18
**Pedido em:** 2026-10-19

**Done when:**

- [x] Upsert via `saveRecord` integrado (`prefs_payload.jsp` + `script.js`).
- [x] Comportamento de reload `P_*` preservado.
- [x] Falha de rede não quebra a tela (fallback local + warn no console).
- [x] `node --check` no `script.js`.

**Tests:** `node --check` + manual cross-browser  
**Status:** ✅ Concluída (código; UAT A20 pendente)

### A20: UAT — preferências entre navegadores

**What:** Checklist: mesmo `CODUSU` em dois browsers; isolamento entre usuários; bootstrap cache→banco; offline parcial.
**Where:** `t22-uat-checklist.md`
**Depends on:** A19
**Pedido em:** 2026-10-19

**Done when:**

- [ ] Itens de checklist adicionados e validados no Om pelo solicitante.

**Status:** ⏳ Pendente

### A21: Memória e deploy coordenado

**What:** Atualizar `memory.md` (fonte da verdade = `AD_APURACAOCONF` + cache); deploy: republicar gadget + instância publicada no Om.
**Where:** `.specs/features/facilita-apuracao-faturas/memory.md`
**Depends on:** A19
**Pedido em:** 2026-10-19

**Done when:**

- [ ] Memória reflete arquitetura final; sem referência ambígua a “tabela futura”.

**Status:** ⏳ Pendente

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
| 2026-10-19 | UAT no Om validado para A1–A6 (solicitante). |
| 2026-10-19 | A9: permitir salvar e exibir valor 0,00 na edição (botão 77). |
| 2026-10-19 | A10: coluna Nome da conta na operadora (`BH_FACLGO.LOGIN`). |
| 2026-10-19 | A11–A14: desenho modal Dados anexo (`design-a11-dados-anexo.md`). |
| 2026-10-19 | A11–A13: implementado modal Dados anexo + `anexos_payload.jsp`. |
| 2026-10-19 | A15: `sankhya-parameter-drawer-guard.js` — desativa hover da `VCompactBar` no parent. |
| 2026-10-19 | A16: desenho preferências + tasks A17–A21. |
| 2026-10-19 | A17: dicionário `AD_APURACAOCONF` (CODUSU, DHALTER, CONF) modelado no Om. |
