# Evolução da interface PCFI para uso multiplataforma — Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill. Execute uma task por
vez, valide o resultado e crie um commit atômico por task. A revisão final com
`web-design-guidelines` é obrigatória após a última alteração.

**Spec**: `.specs/features/evolucao-ui-pcfi-multidispositivo/spec.md`
**Design**: `.specs/features/evolucao-ui-pcfi-multidispositivo/design.md`
**Status**: Phase 1 in progress — T1 complete, T2 pending

## Test Coverage Matrix

> Gerada a partir de `AGENTS.md`, `spec.md` e inspeção do repositório. Não há
> suíte ou manifesto de testes automatizados; aplica-se validação manual forte
> para UI e `node --check` para sintaxe JavaScript.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| JSP/DOM structure | none | Todos os ACs de estrutura, semântica, labels, estados e modais verificados no runtime Sankhya | `link/pcfi.jsp` | Manual no runtime Sankhya |
| JavaScript UI behavior | none | Todos os ACs de navegação, renderização, validação, feedback e transições verificados nos fluxos feliz, vazio e erro | `link/javascript/script.js` | `node --check .\\link\\javascript\\script.js` + manual no runtime Sankhya |
| CSS responsive/visual | none | Todos os ACs em 360x800, 768x1024 e 1440x900, em retrato e paisagem quando disponível | `link/css/style.css` | Manual com emulação de viewport/dispositivo |
| Sankhya persistence/integration | none | Salvamento, autorização, câmera, anexo e retorno sem regressão | `link/javascript/script.js`, `link/dados.jsp` | Manual no runtime Sankhya |

## Parallelism Assessment

> A execução deve ser sequencial. As tasks compartilham DOM, estado global,
> `script.js` e `style.css`; não há isolamento de testes automatizados.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --- | --- | --- | --- |
| Manual UI | No | Um único dashboard e uma única sessão Sankhya | `link/pcfi.jsp`, `link/javascript/script.js` |
| JavaScript syntax | Yes, isoladamente | Processo local sem estado compartilhado | `node --check` |
| Sankhya integration | No | Dados e sessão do runtime Sankhya | `link/dados.jsp`, `link/javascript/script.js` |

## Gate Check Commands

> Não foram encontrados `package.json`, runner de testes, `pom.xml`, workflow
> de CI ou configuração de build neste repositório.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após tasks que alteram JavaScript | `node --check .\\link\\javascript\\script.js` |
| Full | Após cada fase e antes da entrega | Quick gate + validação manual no Sankhya em 360x800, 768x1024 e 1440x900 |
| Build | Após a feature completa | `node --check .\\link\\javascript\\script.js`; não há build automatizado |

---

## Execution Plan

### Phase 1: Estrutura e navegação (Sequential)

```text
T1 → T2
```

### Phase 2: Formulário e validação (Sequential)

```text
T2 → T3 → T4 → T5
```

### Phase 3: Responsividade e direção visual (Sequential)

```text
T5 → T6 → T7 → T9
```

### Phase 4: Feedback e fechamento (Sequential)

```text
T7 → T8 → T10
```

Como há mais de três fases, antes de executar a implementação o orquestrador
deve oferecer um worker por fase, conforme o protocolo do `tlc-spec-driven`.
Nenhum worker deve ser iniciado sem confirmação do usuário.

## Task Breakdown

### T1: Estruturar o shell semântico e as etapas do fluxo

**What**: Ajustar o markup principal para explicitar etapas, formulário,
labels, fieldsets, estados e contratos semânticos dos modais.
**Where**: `link/pcfi.jsp`
**Depends on**: None
**Reuses**: Views, IDs, classes, modais e datasets existentes.
**Requirement**: PCFI-UI-05, PCFI-UI-08, PCFI-UI-13, PCFI-UI-15
**Status**: Complete

**Tools**:

- MCP: NONE
- Skills: `sankhya-dashboard-html5`, `frontend-design`,
  `web-design-guidelines`

**Done when**:

- [x] O fluxo exibe `Pedidos → PCFIs → Conferência` sem duplicar títulos.
- [x] A busca possui label acessível, `name`, autocomplete apropriado e
      placeholder terminando em `…`.
- [x] A conferência possui `form`, `fieldset` e `legend` para os grupos
      principais.
- [x] Loading, toast e modais possuem semântica e descrições adequadas.
- [x] IDs usados pelo JavaScript permanecem compatíveis.
- [ ] Validação manual confirma que o JSP carrega no runtime Sankhya.

**Tests**: none — manual Sankhya
**Gate**: full
**Commit**: `feat(pcfi-ui): estruturar shell e etapas do fluxo` (pending hash)

### T2: Substituir a abertura por duplo clique por ações explícitas

**What**: Alterar a renderização da lista para oferecer ação acionável por
mouse, toque e teclado e melhorar busca e estado vazio.
**Where**: `link/javascript/script.js`
**Depends on**: T1
**Reuses**: `renderPedidos`, paginação, `esc`, `state.pedidosFiltrados` e
`abrirPedido`.
**Requirement**: PCFI-UI-01, PCFI-UI-02, PCFI-UI-03, PCFI-UI-04

**Tools**:

- MCP: NONE
- Skills: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] A coluna de conferência renderiza um botão ou link explícito para abrir o
      pedido.
- [ ] A abertura não depende de `ondblclick` ou de `cursor: pointer` na linha.
- [ ] A ação funciona com Tab, Enter, toque e mouse.
- [ ] Fornecedor e centro de resultado mantêm acesso ao texto completo.
- [ ] A busca sem resultados exibe estado específico e permite limpar o termo.
- [ ] `node --check .\\link\\javascript\\script.js` passa.

**Tests**: none — manual Sankhya + sintaxe JavaScript
**Gate**: quick + full
**Commit**: `feat(pcfi-ui): tornar abertura de pedidos explícita`

### T3: Evoluir a fábrica de campos e refletir valores salvos

**What**: Fazer a geração de campos dinâmicos produzir metadados acessíveis e
preservar os valores de controles ao reabrir uma PCFI.
**Where**: `link/javascript/script.js`
**Depends on**: T2
**Reuses**: `field`, `prepararItens`, `renderItens` e `renderSubs`.
**Requirement**: PCFI-UI-07, PCFI-UI-08

**Tools**:

- MCP: NONE
- Skills: `sankhya-dashboard-html5`, `web-design-guidelines`

**Done when**:

- [ ] Campos dinâmicos recebem IDs estáveis e labels associadas.
- [ ] Campos recebem `name`, `type`, `autocomplete`, `inputmode` e `required`
      conforme o caso.
- [ ] Selects de embalagem e divergência refletem `EMBALAGEM` e `DIVERGENCIA`
      salvos.
- [ ] Campos numéricos mantêm limites, step e unidade visíveis.
- [ ] Os bindings existentes continuam atualizando `state.itens`.
- [ ] `node --check .\\link\\javascript\\script.js` passa.

**Tests**: none — manual Sankhya + sintaxe JavaScript
**Gate**: quick + full
**Commit**: `feat(pcfi-ui): melhorar metadados dos campos dinâmicos`

### T4: Organizar os campos dos itens por seções progressivas

**What**: Reorganizar a renderização dos itens para separar quantidade, foto,
qualidade, lotes, patrimônios e observações, mantendo essenciais visíveis.
**Where**: `link/javascript/script.js`
**Depends on**: T3
**Reuses**: `renderItens`, `renderSubs`, `fotoMarkup`, classes existentes e
regras atuais de etapa.
**Requirement**: PCFI-UI-05, PCFI-UI-06

**Tools**:

- MCP: NONE
- Skills: `frontend-design`, `sankhya-dashboard-html5`

**Done when**:

- [ ] Cada item apresenta um resumo claro de produto, pedido e saldo pendente.
- [ ] Quantidade recebida permanece no primeiro nível da conferência.
- [ ] Lotes, patrimônios e observações ficam agrupados e podem ser expandidos
      quando não forem necessários.
- [ ] A etapa de quantidade não exibe controles exclusivos da qualidade.
- [ ] A etapa de qualidade exibe agrupamentos compreensíveis para cada decisão.
- [ ] Adicionar/remover sublinhas não perde valores já digitados.
- [ ] `node --check .\\link\\javascript\\script.js` passa.

**Tests**: none — manual Sankhya + sintaxe JavaScript
**Gate**: quick + full
**Commit**: `feat(pcfi-ui): organizar formulário por seções`

### T5: Adicionar validação contextual e proteção contra perda de edição

**What**: Apresentar erros junto aos campos, focar o primeiro erro e confirmar
saída quando houver dados alterados em memória.
**Where**: `link/javascript/script.js`
**Depends on**: T3, T4
**Reuses**: `validar`, `salvar`, `confirmar`, `voltar` e `toast`.
**Requirement**: PCFI-UI-08, PCFI-UI-12, PCFI-UI-14

**Tools**:

- MCP: NONE
- Skills: `sankhya-dashboard-html5`, `web-design-guidelines`

**Done when**:

- [ ] Cada erro aplicável identifica item, campo e correção necessária.
- [ ] Campos inválidos recebem `aria-invalid` e descrição associada.
- [ ] O primeiro campo inválido recebe foco.
- [ ] Os valores válidos permanecem preservados após erro.
- [ ] Cancelar ou voltar com alterações solicita confirmação.
- [ ] O toast continua disponível como resumo, sem substituir a indicação no
      campo.
- [ ] `node --check .\\link\\javascript\\script.js` passa.

**Tests**: none — manual Sankhya + sintaxe JavaScript
**Gate**: quick + full
**Commit**: `feat(pcfi-ui): contextualizar validações do formulário`

### T6: Consolidar tokens visuais, foco e movimento acessível

**What**: Organizar o CSS em blocos legíveis e estabelecer hierarquia visual,
foco visível, tipografia e redução de movimento.
**Where**: `link/css/style.css`
**Depends on**: T5
**Reuses**: Paleta PCFI, classes atuais, badges, painéis e cartões.
**Requirement**: PCFI-UI-15, PCFI-UI-16

**Tools**:

- MCP: NONE
- Skills: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] O CSS deixa de ficar concentrado em linhas minificadas difíceis de revisar.
- [ ] A UI possui escala tipográfica e espaçamento coerentes.
- [ ] Todos os controles têm estado `:focus-visible` perceptível.
- [ ] O spinner respeita `prefers-reduced-motion`.
- [ ] Status não depende apenas da cor e mantém contraste adequado.
- [ ] Não há `transition: all` ou remoção de outline sem substituição.

**Tests**: none — inspeção visual manual
**Gate**: full
**Commit**: `style(pcfi-ui): consolidar tokens e estados visuais`

### T7: Adaptar layout para smartphone, tablet e PC

**What**: Implementar os breakpoints e a adaptação de formulários, tabela,
ações e áreas de toque para os três contextos.
**Where**: `link/css/style.css`
**Depends on**: T6
**Reuses**: Media queries atuais, `table-wrap`, `form-grid`, `item-grid`,
`subrow` e `footer-actions`.
**Requirement**: PCFI-UI-09, PCFI-UI-10, PCFI-UI-11, PCFI-UI-12

**Tools**:

- MCP: NONE
- Skills: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] Em 360x800, o formulário usa uma coluna e não cria rolagem horizontal.
- [ ] Em 768x1024, os grupos e botões permanecem legíveis e alcançáveis.
- [ ] Em 1440x900, a tabela usa o espaço sem esticar conteúdo de forma
      desproporcional.
- [ ] A tabela mantém rolagem controlada quando necessário e preserva a ação
      principal.
- [ ] Subformulários de lote e patrimônio empilham seus campos em telas
      estreitas.
- [ ] Botões e controles têm área de toque mínima adequada.
- [ ] Ações inferiores não ficam cortadas em retrato ou paisagem.

**Tests**: none — inspeção visual manual nos três viewports
**Gate**: full
**Commit**: `style(pcfi-ui): adaptar layout aos dispositivos`

### T8: Uniformizar modais e feedback assíncrono

**What**: Implementar ciclo de foco, `Esc`, restauração de foco, bloqueio de
scroll e mensagens live para confirmação, qualidade, fiscal e câmera.
**Where**: `link/javascript/script.js`
**Depends on**: T7
**Reuses**: `confirmar`, `fecharCamera`, `abrirCameraItem`, `loading` e `toast`.
**Requirement**: PCFI-UI-13, PCFI-UI-14

**Tools**:

- MCP: NONE
- Skills: `web-design-guidelines`, `sankhya-dashboard-html5`

**Done when**:

- [ ] Todo modal define foco inicial previsível.
- [ ] O foco não escapa do modal durante a navegação por teclado.
- [ ] `Esc` e botões de cancelamento fecham com segurança.
- [ ] O foco retorna ao controle que abriu o modal.
- [ ] O conteúdo externo não rola enquanto o modal está aberto.
- [ ] Loading e erro são anunciados sem mensagens duplicadas ou ambíguas.
- [ ] A câmera é encerrada ao cancelar, fechar ou concluir a captura.
- [ ] `node --check .\\link\\javascript\\script.js` passa.

**Tests**: none — manual Sankhya + sintaxe JavaScript
**Gate**: quick + full
**Commit**: `feat(pcfi-ui): uniformizar modais e feedback`

### T9: Refinar hierarquia, indicadores e estados visuais

**What**: Aplicar a direção visual operacional refinada, reduzindo repetição e
destacando etapa, prioridade, status e próxima ação.
**Where**: `link/css/style.css`
**Depends on**: T7
**Reuses**: `summary-card`, `badge`, `context-card`, `pcfi-row` e tokens de T6.
**Requirement**: PCFI-UI-15, PCFI-UI-16

**Tools**:

- MCP: NONE
- Skills: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] A etapa ativa é mais evidente que elementos decorativos secundários.
- [ ] Os indicadores de resumo não formam uma grade visual repetitiva sem
      hierarquia.
- [ ] Estados de prioridade, qualidade, fiscal e negação têm texto e tratamento
      visual consistente.
- [ ] A próxima ação fica evidente em cada view.
- [ ] A direção visual funciona nos três breakpoints.

**Tests**: none — inspeção visual manual
**Gate**: full
**Commit**: `style(pcfi-ui): refinar hierarquia e estados`

### T10: Executar auditoria final multiplataforma

**What**: Revisar a feature completa, corrigir achados residuais e registrar o
resultado da auditoria final.
**Where**: `link/pcfi.jsp`, `link/css/style.css`, `link/javascript/script.js`
**Depends on**: T8, T9
**Reuses**: Spec, design, matriz de cobertura e `web-design-guidelines`.
**Requirement**: PCFI-UI-01 a PCFI-UI-16

**Tools**:

- MCP: NONE
- Skills: `web-design-guidelines`, `frontend-design`,
  `sankhya-dashboard-html5`

**Done when**:

- [ ] Cada requisito da spec possui evidência manual ou justificativa registrada.
- [ ] `web-design-guidelines` é aplicada aos três arquivos de UI.
- [ ] O fluxo é percorrido em smartphone, tablet e PC, incluindo orientação
      retrato e paisagem quando disponível.
- [ ] Busca, vazio, validação, câmera, modais, salvamento e retorno são
      verificados.
- [ ] `node --check .\\link\\javascript\\script.js` passa.
- [ ] O resultado é registrado em
      `.specs/features/evolucao-ui-pcfi-multidispositivo/validation.md` pelo
      verificador independente.

**Tests**: none — auditoria manual final
**Gate**: full + build
**Commit**: `test(pcfi-ui): validar experiência multiplataforma`

## Parallel Execution Map

```text
Phase 1: T1 ──→ T2
Phase 2: T2 ──→ T3 ──→ T4 ──→ T5
Phase 3: T5 ──→ T6 ──→ T7 ──→ T9
Phase 4: T7 ──→ T8 ──→ T10
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Estrutura semântica em um JSP | ✅ Granular |
| T2 | Navegação da lista em um arquivo JS | ✅ Granular |
| T3 | Fábrica e apresentação de campos em um arquivo JS | ✅ Granular |
| T4 | Renderização do formulário de itens em um arquivo JS | ✅ Granular |
| T5 | Validação e saída segura em um arquivo JS | ✅ Granular |
| T6 | Tokens e estados base em um arquivo CSS | ✅ Granular |
| T7 | Responsividade em um arquivo CSS | ✅ Granular |
| T8 | Modais e feedback em um arquivo JS | ✅ Granular |
| T9 | Hierarquia visual em um arquivo CSS | ✅ Granular |
| T10 | Auditoria final da feature | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends on (task body) | Diagram shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T3, T4 | T3 → T5 and T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T7 | T7 → T9 | ✅ Match |
| T10 | T8, T9 | T8 → T10 and T9 → T10 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | JSP/DOM | none + manual | none + manual | ✅ OK |
| T2 | JavaScript UI | none + manual + syntax | none + manual + syntax | ✅ OK |
| T3 | JavaScript UI | none + manual + syntax | none + manual + syntax | ✅ OK |
| T4 | JavaScript UI | none + manual + syntax | none + manual + syntax | ✅ OK |
| T5 | JavaScript UI | none + manual + syntax | none + manual + syntax | ✅ OK |
| T6 | CSS responsive/visual | none + manual | none + manual | ✅ OK |
| T7 | CSS responsive/visual | none + manual | none + manual | ✅ OK |
| T8 | JavaScript UI | none + manual + syntax | none + manual + syntax | ✅ OK |
| T9 | CSS responsive/visual | none + manual | none + manual | ✅ OK |
| T10 | Todos os layers | none + auditoria manual | none + auditoria manual | ✅ OK |
