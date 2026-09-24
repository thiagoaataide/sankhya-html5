# T22 — UAT do Dashboard (somente leitura)

Gadget: `facilita/apuracao-faturas`  
Escopo: validar **consulta** (lista, filtros, detalhe, exportação) **sem** depender de mutação homologada na fachada.  
Referências: `.specs/features/facilita-apuracao-faturas/homologacao.md` (C01–C08), task **T22**.

## Progresso (atualize ao marcar)

| Bloco | Feito | Total | Situação |
| --- | ---: | ---: | --- |
| A | 7 | 7 | fechado |
| B | 7 | 8 | falta **B.8** (standby) |
| C | 28 | 28 | **fechado** 2026-09-24 |
| D | 7 | 7 | **fechado** 2026-09-24 |
| E | 4 | 4 | **fechado** 2026-09-24 |
| F | 3 | 3 | **fechado** 2026-09-24 |
| G | 3 | 3 | **fechado** 2026-09-24 (ver notas) |
| H | 0 | 4 | pendente |

## Como usar este arquivo

1. Publique o ZIP do gadget no Om de teste e use **Ctrl+F5** após cada publicação.
2. Marque **`[x]`** na coluna **✓** ao concluir o teste; use **`[ ]`** para pendente.
3. Ajuste **Status** / **Notas**; para falar com o agente, cite o **código** (ex.: `C1.2`, `D.5`).

**Status sugeridos:** `pendente` | `ok` | `falhou` | `n/a` | `standby` | `doc`

**Base de teste:** referência **01/10/2026**, **Possui anexo = Sim** (~503 linhas no lote atual), sidebar **Atualizar** após mudar parâmetro.

**Regras já acordadas**

- Contadores = **total filtrado** (todas as páginas); a grade mostra só a página atual.
- Chip **“Mês corrente”** é **indicativo**; o mês vem de **`P_REFERENCIA`** no servidor.
- **B.8** (NUNOTA) em **standby** até existir linha com nota na amostra.

---

## Índice de códigos

| ✓ | Código | Resumo |
| --- | --- | --- |
| [x] | [A.1](#a-parâmetros-do-gadget-servidor) | Mês de referência (`P_REFERENCIA`) |
| [x] | [A.2](#a-parâmetros-do-gadget-servidor) | Somente pendentes (`P_SOMENTE_PENDENTES`) |
| [x] | [A.3](#a-parâmetros-do-gadget-servidor) | Possui anexo (`P_POSSUI_ANEXO`) |
| [x] | [A.4](#a-parâmetros-do-gadget-servidor) | Combinação dos três parâmetros |
| [x] | [A.5](#a-parâmetros-do-gadget-servidor) | Atualizar (sidebar) mantém parâmetros |
| [x] | [A.6](#a-parâmetros-do-gadget-servidor) | Esconder ao atualizar (UX) |
| [x] | [A.7](#a-parâmetros-do-gadget-servidor) | Chip “Mês corrente” (documentação) |
| [x] | [B.1](#b-busca-visão-de-trabalho) | Busca por sequência |
| [x] | [B.2](#b-busca-visão-de-trabalho) | Busca por conta |
| [x] | [B.3](#b-busca-visão-de-trabalho) | Busca por contrato |
| [x] | [B.4](#b-busca-visão-de-trabalho) | Campo = todos os campos |
| [x] | [B.5](#b-busca-visão-de-trabalho) | Busca por vencimento (`DD/MM/AAAA`) |
| [x] | [B.6](#b-busca-visão-de-trabalho) | Busca por valor (formato da grade) |
| [x] | [B.7](#b-busca-visão-de-trabalho) | Limpar pesquisa |
| [ ] | [B.8](#b-busca-visão-de-trabalho) | Faturamento / NUNOTA (**standby**) |
| [x] | [C1.1](#c1--contadores-vs-filtro) | Contadores com pesquisa vazia |
| [x] | [C1.2](#c1--contadores-vs-filtro) | Contadores com busca restritiva |
| [x] | [C1.3](#c1--contadores-vs-filtro) | Contadores na página 2+ |
| [x] | [C1.4](#c1--contadores-vs-filtro) | Busca sem resultado |
| [x] | [C1.5](#c1--contadores-vs-filtro) | Limpar busca restaura contadores |
| [x] | [C2.1](#c2--paginação) | 15 linhas e texto de página |
| [x] | [C2.2](#c2--paginação) | Anterior / Próxima |
| [x] | [C2.3](#c2--paginação) | Registros por página 25/50/100 |
| [x] | [C2.4](#c2--paginação) | Paginação com zero linhas |
| [x] | [C3.1](#c3--ordenação) | Campo = Todos → ordem por contrato |
| [x] | [C3.2](#c3--ordenação) | Ordenar por vencimento (2 cliques) |
| [x] | [C3.3](#c3--ordenação) | Ordenar por valor (numérico) |
| [x] | [C3.4](#c3--ordenação) | Ordenar por sequência |
| [x] | [C3.5](#c3--ordenação) | Ordenar com filtro ativo |
| [x] | [C3.6](#c3--ordenação) | Trocar “Campo” reseta ordenação manual |
| [x] | [C4.1](#c4--colunas-picker) | Ocultar / mostrar Anexo |
| [x] | [C4.2](#c4--colunas-picker) | Ocultar Valor e Estado |
| [x] | [C4.3](#c4--colunas-picker) | Impedir ocultar todas as colunas |
| [x] | [C4.4](#c4--colunas-picker) | F5 persiste colunas (opcional) |
| [x] | [C5.1](#c5--seleção-e-painel-lateral) | Clique seleciona e abre painel à direita |
| [x] | [C5.2](#c5--seleção-e-painel-lateral) | Trocar linha atualiza painel |
| [x] | [C5.3](#c5--seleção-e-painel-lateral) | Enter / Espaço na linha |
| [x] | [C5.4](#c5--seleção-e-painel-lateral) | Filtro remove linha selecionada |
| [x] | [C5.5](#c5--seleção-e-painel-lateral) | Selecionar → limpar pesquisa |
| [x] | [C6.1](#c6--vazio-status-atualizar) | Badges e contador Pendentes |
| [x] | [C6.2](#c6--vazio-status-atualizar) | Coluna Anexo vs filtro servidor |
| [x] | [C6.3](#c6--vazio-status-atualizar) | Grade vazia e placeholder do painel |
| [x] | [C6.4](#c6--vazio-status-atualizar) | Atualizar zera busca local |
| [x] | [C7.1](#c7--regressão-rápida-opcional) | Regressão busca vencimento |
| [x] | [D.1](#d-detalhe-somente-leitura) | Campos do painel = whitelist |
| [x] | [D.2](#d-detalhe-somente-leitura) | Valores batem com a linha da grade |
| [x] | [D.3](#d-detalhe-somente-leitura) | Sem dados sensíveis no detalhe |
| [x] | [D.4](#d-detalhe-somente-leitura) | Seleção rápida — última linha vence |
| [x] | [D.5](#d-detalhe-somente-leitura) | `NUAPURACAO` inválido / sem registro |
| [x] | [D.6](#d-detalhe-somente-leitura) | Estado “Carregando” / erro legível |
| [x] | [D.7](#d-detalhe-somente-leitura) | Formato de datas e moeda no painel |
| [x] | [E.1](#e-exportação-csv) | CSV só linhas filtradas |
| [x] | [E.2](#e-exportação-csv) | CSV só colunas visíveis |
| [x] | [E.3](#e-exportação-csv) | Acentuação no Excel (BOM UTF-8) |
| [x] | [E.4](#e-exportação-csv) | Estado e Anexo formatados no CSV |
| [x] | [F.1](#f-perfis-e-acesso) | Usuário autorizado — lista e detalhe |
| [x] | [F.2](#f-perfis-e-acesso) | Usuário sem acesso (se houver) |
| [x] | [F.3](#f-perfis-e-acesso) | Erro sem stack trace na UI |
| [x] | [G.1](#g-falhas-de-leitura) | Falha na lista — sem dados “fantasma” |
| [x] | [G.2](#g-falhas-de-leitura) | Falha no detalhe — mensagem FA-D* |
| [x] | [G.3](#g-falhas-de-leitura) | Lista vazia no servidor desde o início |
| [ ] | [H.1](#h-anexo-e-workflow-smoke-leitura) | Botão Ver anexo (com anexo) |
| [ ] | [H.2](#h-anexo-e-workflow-smoke-leitura) | Ver anexo desabilitado sem anexo |
| [ ] | [H.3](#h-anexo-e-workflow-smoke-leitura) | Abrir tarefa com workflow |
| [ ] | [H.4](#h-anexo-e-workflow-smoke-leitura) | Abrir tarefa sem processo |
| [ ] | [Z.1](#z-fora-do-escopo-t22-registrar-só-se-testar) | Salvar / Confirmar / Upload (T18+) |

---

## A. Parâmetros do gadget (servidor)

Homologação: **C01**, **C02**. **Bloco fechado** em 2026-09-24.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | A.1 | Abrir com outro **Mês de referência** | Lista e coluna Referência mudam | ok | |
| [x] | A.2 | **Somente pendentes = Sim** | Só não confirmadas; contador **Pendentes** coerente | ok | Ex.: 1 linha `180297844` com combo pendentes+anexo |
| [x] | A.3 | **Possui anexo = Sim** | Só com anexo em `TSIANX`; coluna **Sim** | ok | ~474 confirmadas no lote 10/2026 |
| [x] | A.4 | Combinar mês + pendentes + anexo | Interseção correta (0 linhas = dados, não bug) | ok | Outros meses sem pendente = esperado |
| [x] | A.5 | **Atualizar** na sidebar | Recarrega com **mesmos** parâmetros | ok | Header **Atualizar** = mesmo efeito |
| [x] | A.6 | **Esconder ao atualizar** | Comportamento aceitável | ok | |
| [x] | A.7 | Clicar chip **Mês corrente** | **Não** altera filtro; só `P_REFERENCIA` | doc | Ressalva UX — não é botão |

---

## B. Busca (visão de trabalho)

Filtro **local** sobre linhas já carregadas. Homologação: **C03**.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | B.1 | Campo **Sequência** + número existente | Reduz a grade; contadores atualizam | ok | |
| [x] | B.2 | Campo **Conta** | Idem | ok | |
| [x] | B.3 | Campo **Contrato** (ex. **262**) | Poucas linhas (ex. **3**); contadores = filtrado | ok | |
| [x] | B.4 | **Todos os campos** + termo da linha | Encontra em colunas visíveis | ok | |
| [x] | B.5 | **Vencimento** `DD/MM/AAAA` (como na grade) | Encontra a linha | ok | Ex.: `30/09/2026` → `189295861` |
| [x] | B.6 | **Valor** como na grade (ex. `12,40`) | Encontra | ok | |
| [x] | B.7 | Limpar caixa de pesquisa | Volta ao total do lote atual | ok | |
| [ ] | B.8 | Campo **Faturamento** / NUNOTA | Encontra quando houver `NUNOTA` | standby | Sem massa estável no ambiente |

---

## C. Lista, contadores, paginação, colunas, seleção

### C1 — Contadores vs filtro

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C1.1 | Pesquisa vazia | **Registros** = total; **Com anexo** / **Pendentes** coerentes | ok | Evidência 2026-09-24: **503** / **1** / **503** |
| [x] | C1.2 | Busca restritiva (ex. contrato **262**) | Contadores = **3**, não 15 | ok | Validado junto com **B.3** |
| [x] | C1.3 | Ir para **página 2+** com muitas linhas | Contadores **inalterados** (503) | ok | Ex.: página **4 de 34** (46–60 de 503) |
| [x] | C1.4 | Texto inexistente | **Registros = 0**; mensagem de vazio | ok | “Nenhum resultado…” / contadores **0** (mesmo print C1.1 vazio) |
| [x] | C1.5 | Limpar pesquisa | Contadores voltam ao total inicial | ok | |

### C2 — Paginação

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C2.1 | Página 1, padrão 15 | Até 15 linhas; `Página 1 de N (1–15 de total)` | ok | Ex.: 1 de 34 com 503 |
| [x] | C2.2 | **Próxima** / **Anterior** | Navega; Anterior inativo na 1ª | ok | Navegação até página 4 validada |
| [x] | C2.3 | **Registros por página** 25, 50, 100 | Grade e indicador atualizam | ok | **25/página**: `Página 1 de 21 (1–25 de 503)` |
| [x] | C2.4 | Filtro com 0 linhas | Paginação vazia; sem erro JS | ok | **“Nenhum registro”**; aceite UX confirmado |

### C3 — Ordenação

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C3.1 | **Campo = Todos** (sem sort no cabeçalho) | Contrato em ordem **numérica** crescente | ok | Ex.: 1, 1, 4, 6, 7, 18… (seta ↑ em Contrato) |
| [x] | C3.2 | Cabeçalho **Vencimento** (2×) | Ordem coerente e inverte | ok | |
| [x] | C3.3 | Cabeçalho **Valor** | Ordem numérica crescente/decrescente | ok | Ex.: 0,00 → 28,56 (↑); 74.285,54 → 3.124,43 (↓) |
| [x] | C3.4 | Cabeçalho **Sequência** | Ordem por `NUAPURACAO` | ok | |
| [x] | C3.5 | Com busca ativa, ordenar | Ordena só o filtrado; contador mantém **n** | ok | |
| [x] | C3.6 | Trocar **Campo** (ex. Conta) | Sort manual do cabeçalho reseta | ok | |

### C4 — Colunas (picker)

Chave: `facilita-apuracao-faturas:columns:v1`. Homologação: **C06**.

**C4.4 — o que testar (persistência após recarregar)**

1. Em **Colunas**, desmarque uma ou duas colunas (ex.: **Anexo** e **Estado**) e confirme que sumiram da grade.
2. Recarregue a página: **F5**, botão **Atualizar** do cabeçalho, ou **Atualizar** na sidebar do gadget.
3. Anote o que aconteceu:
   - **Persistiu:** as mesmas colunas continuam ocultas → preferência salva no navegador (`localStorage`).
   - **Voltou ao padrão:** todas as colunas aparecem de novo → também aceitável; marque **doc** no checklist.
4. Não precisa comparar com o legado; só registrar o comportamento para homologação.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C4.1 | Desmarcar / remarcar **Anexo** | Coluna some e volta | ok | Evidência 2026-09-24: menu Colunas; grade sem ANEXO |
| [x] | C4.2 | Desmarcar **Valor** e **Estado** | Só essas somem | ok | |
| [x] | C4.3 | Tentar desmarcar **todas** | Mantém ao menos uma coluna | ok | |
| [x] | C4.4 | F5 com coluna oculta | Persiste ou padrão — **documentar** | doc | Preferência em `localStorage` (`columns:v1`); persiste após recarregar |

### C5 — Seleção e painel lateral

Homologação: **C04** (parcial).

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C5.1 | Clicar uma linha | Destaque; meta selecionada; painel **à direita** | ok | Layout full-width validado |
| [x] | C5.2 | Clicar outra linha | Highlight e painel atualizam | ok | |
| [x] | C5.3 | **Enter** / **Espaço** com foco na linha | Igual ao clique | ok | |
| [x] | C5.4 | Filtrar até a linha selecionada sumir | Seleção limpa; sem fantasma | ok | |
| [x] | C5.5 | Selecionar → limpar pesquisa | Seleção coerente | ok | |

### C6 — Vazio, status, Atualizar

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C6.1 | Estados **Confirmada** / **Pendente** | Badge legível; **Pendentes** correto | ok | Ex.: **503** registros, **1** pendente, badges Confirmada |
| [x] | C6.2 | Coluna **Anexo** | **Sim** com filtro possui anexo | ok | Via **A.3** |
| [x] | C6.3 | Busca sem match | Placeholder; sem detalhe antigo | ok | Mesmo cenário **C1.4** |
| [x] | C6.4 | **Atualizar** com busca local ativa | Recarrega; busca zera — documentar | doc | Comportamento esperado: reload limpa filtro local |

### C7 — Regressão rápida (opcional)

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | C7.1 | Busca **B.5** após testar **C** | Vencimento ainda funciona | ok | **B.5** já validado; sem regressão observada |

**Bloco C — FECHADO** em 2026-09-24 (Thiago). Itens **doc**: **C4.4** (persistência colunas), **C6.4** (reload zera busca local).

---

## D. Detalhe (somente leitura)

Homologação: **C04**, **C05**.

**D.4 — clique rápido em duas linhas**  
1. Com a lista carregada, clique na **linha A** (painel abre A).  
2. Logo em seguida clique na **linha B**.  
3. **OK se:** destaque e painel mostram só **B** (nunca ficam dados de A “atrasados”).

**D.5 — detalhe inválido (opcional)**  
1. Com uma linha selecionada, abra em nova aba (só para teste):  
   `…/detalhe_payload.jsp?nuapuracao=999999999` ou `nuapuracao=abc`.  
2. **OK se:** não aparece ficha com dados de outra apuração; container vazio ou mensagem segura no gadget ao pedir chave inexistente.

**D.6 — erro ao carregar detalhe**  
1. Selecione uma linha normal (detalhe OK).  
2. Simule falha: **DevTools → Network → Offline** (ou bloqueie só o request do `detalhe_payload.jsp`) e clique **outra** linha.  
3. **OK se:** texto tipo “Não foi possível carregar o detalhe”, badge **Indisponível**, código **FA-D…**; painel **não** continua mostrando o detalhe anterior como se fosse o atual.

**D.7 — formato (já validado)**  
Conferir no painel: datas **DD/MM/AAAA**, valores **1.234,56**, Sim/Não nos flags. Você já marcou ok com **D.2**.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | D.1 | Abrir detalhe de linha conhecida | Campos da whitelist em `detalhe_payload.jsp` | ok | Smoke visual no painel lateral |
| [x] | D.2 | Comparar com a grade | Mesmo `NUAPURACAO`, conta, valores | ok | Ex.: `189297954`, `189299640` |
| [x] | D.3 | Revisar painel | **Sem** senha, CPF/CNPJ, credencial | ok | Revisão visual 2026-09-24 |
| [x] | D.4 | Clicar linhas em sequência rápida | Painel = última sequência clicada | ok | 189298371 → 189301260 → **189299654**; 3× `detalhe_payload` 200 |
| [x] | D.5 | `nuapuracao` inexistente (`999999999`) | Sem dados de apuração | ok | Página em branco; URL base `.../173_20260924104513//detalhe_payload.jsp` |
| [x] | D.6 | Rede **Offline** + outra linha | **FA-D***; **Indisponível**; `detalhe_payload` falha | ok | Ex.: **FA-D1790261021439**; seleção **189295273** |
| [x] | D.7 | Datas e valores | `DD/MM/AAAA` e moeda BR | ok | |

---

## E. Exportação CSV

Homologação: **C07**.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | E.1 | **Exportar CSV** (lote atual) | Conjunto filtrado na tela | ok | **503** linhas + cabeçalho; `apuracao-faturas.csv` |
| [x] | E.2 | Colunas no arquivo | Alinhado às colunas visíveis na exportação | ok | 8 colunas; export com grade padrão (todas visíveis) |
| [x] | E.3 | Abrir no Excel | Acentos; separador `;` | ok | Cabeçalho **Sequência**; células entre aspas |
| [x] | E.4 | Estado / Anexo | **Confirmada**; **Sim** | ok | Valores formatados (não `S`/`N` cru) |

---

## F. Perfis e acesso

**Legado vs. novo (referência):** abrir a **tela/gadget** depende do **cadastro Sankhya** (perfil, solução, nível do dashboard) — não há no `Apuracao.js` um “se não pode ver, esconde menu”. Dentro da tela, o legado só checa permissão **explícita** em código para **solicitar nova auditoria** (`BH_NOVAAUDIT = S` no usuário, em `ApuracaoModel.confirmarApuracao` quando a linha já está confirmada). **Confirmar** apuração pendente, listar, anexo e workflow **não** usam outro flag de usuário no Kotlin legado (só regras de negócio). O dataset legado **omite** campos sensíveis (`LOGIN`, `SENHA`, `CPF`…) via `sk-field pattern` no HTML — não é perfil, é projeção. O dash novo (T22) usa JSP + sessão; mutações futuras passarão por `AuthorizationPort` no add-on.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | F.1 | Usuário padrão com acesso | Lista e detalhe carregam | ok | Sessão atual no Om teste |
| [x] | F.2 | Usuário **sem** acesso ao gadget/tela | Bloqueio pelo **Om** (perfil/nível), como no legado | n/a | Sem usuário de teste; aceite: quem não tem tela não abre o dash |
| [x] | F.3 | Erro visível na UI (ex. **D.6**) | Mensagem + **FA-D…**; sem stack Java | ok | Evidência offline + detalhe |

---

## G. Falhas de leitura

Fechamento pragmático com evidências **A–E** + **D.6** (não simulamos SQL quebrado na lista).

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [x] | G.1 | Erro na lista (`dados.jsp`) | Sem grade “fantasma” em uso normal | doc | **E**: 503 linhas = lista coerente; **falha de carga da lista não simulada** |
| [x] | G.2 | Erro no detalhe | **FA-D***; não mistura apurações | ok | **D.6** (offline) |
| [x] | G.3 | Servidor retorna 0 linhas | Contadores **0**; sem erro JS | ok | **A.4** / **C1.4**; mensagens de vazio |

---

## H. Anexo e workflow (smoke leitura)

Homologação: **C08**. Pode depender de **T23** + fachada.

| ✓ | Código | Passo | Esperado | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [ ] | H.1 | **Ver anexo** com anexo | Visualizador ou erro claro | pendente | |
| [ ] | H.2 | Sem anexo | Botão desabilitado | pendente | |
| [ ] | H.3 | **Abrir tarefa** com workflow | App ou mensagem clara | pendente | |
| [ ] | H.4 | Sem workflow | Botão desabilitado | pendente | |

---

## Z. Fora do escopo T22 (registrar só se testar)

| ✓ | Código | Passo | Esperado em T22 | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| [ ] | Z.1 | Salvar / Confirmar / Upload | Fail-closed; não é aceite T22 | pendente | |

---

## Fechamento T22 (dashboard)

- [x] Blocos **A** e **B** (exceto **B.8** standby) aceitos ou documentados  
- [x] Bloco **C** fechado  
- [x] Bloco **D** fechado  
- [x] Bloco **E** fechado  
- [x] **F** executado ou marcado `n/a` com justificativa  
- [x] **G** fechado (G.1 **doc** — sem simulação de erro em `dados.jsp`)  
- [ ] **H** executado ou decisão **T23** registrada  
- [ ] Evidências sem dados pessoais em `.specs/.../homologacao.md` ou `memory.md`

**Última atualização:** 2026-09-24 — **Bloco G fechado** (G.2 D.6; G.3 C1.4; G.1 doc + E).
