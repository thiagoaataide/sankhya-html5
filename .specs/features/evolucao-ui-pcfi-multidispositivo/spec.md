# Evolução da interface PCFI para uso multiplataforma

**Status**: Draft

## Problem Statement

A interface do PCFI já separa o fluxo em pedidos, PCFIs e conferência, mas a
navegação depende de duplo clique, os formulários dinâmicos concentram muitos
campos e a experiência ainda não está suficientemente adaptada a smartphones,
tablets e PCs. A validação visual e funcional também precisa comunicar erros,
estados e etapas com mais clareza.

Esta feature reorganiza a experiência do front-end sem alterar as regras de
negócio, as consultas SQL ou as integrações de persistência do Sankhya.

## Goals

- [ ] Permitir que o fluxo principal seja executado em smartphone, tablet e PC
      sem perda de ações ou campos essenciais.
- [ ] Tornar a navegação da lista e dos formulários explícita e operável por
      teclado e toque.
- [ ] Estruturar a conferência em grupos compreensíveis, com divulgação
      progressiva para lotes, patrimônios e observações.
- [ ] Exibir validações e estados de carregamento, erro e sucesso de forma
      próxima ao contexto da ação.
- [ ] Manter o comportamento atual de autorização, salvamento, câmera e
      anexos.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alterar consultas de `link/dados.jsp` | A feature é de experiência do front-end. |
| Alterar tabelas, campos ou regras de negócio | Não faz parte da reorganização visual. |
| Criar um novo framework ou build do projeto | O dashboard continuará usando JSP, CSS e JavaScript puro. |
| Remover filtros ou elementos nativos do Sankhya | Qualquer remoção exige decisão específica do usuário. |
| Alterar o fluxo Java de anexos e sincronização de imagens | O fluxo atual é uma decisão ativa do projeto. |
| Criar uma aplicação mobile separada | A mesma interface responsiva atenderá os três contextos. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Abordagem técnica | Refatoração incremental do JSP, CSS e JavaScript existentes | Reduz risco para o runtime do Sankhya e preserva integrações | No — proposta para aprovação |
| Breakpoints | Mobile até 600px, tablet de 601px a 1024px, desktop acima de 1024px | Cobre retrato e paisagem sem depender de um único tamanho | No — proposta para aprovação |
| Lista em smartphone | Manter tabela semântica com rolagem horizontal controlada e ação explícita | Evita perder colunas de operação e reduz mudança no modelo de dados | No — proposta para aprovação |
| Formulário em smartphone | Uma coluna; seções opcionais expansíveis | Evita campos comprimidos e reduz rolagem desnecessária | No — proposta para aprovação |
| Testes | Validação manual no runtime Sankhya, com `node --check` para JavaScript | O repositório não possui suíte ou manifesto de testes automatizados | No — proposta para aprovação |
| Estado não salvo | Solicitar confirmação antes de abandonar uma conferência alterada | Evita perda acidental de dados digitados | No — proposta para aprovação |

**Open questions:** não há bloqueios para o desenho inicial. As decisões acima
ficam registradas como defaults e devem ser confirmadas antes da execução.

## User Stories

### P1: Navegar pelos pedidos sem gestos ocultos ⭐ MVP

**User Story**: Como um usuário operacional, quero abrir um pedido por uma ação
visível e acessível para iniciar a conferência sem depender de duplo clique.

**Why P1**: O duplo clique é pouco descobrível, difícil no toque e não atende
adequadamente ao teclado.

**Acceptance Criteria**:

1. WHEN a lista de pedidos é renderizada THEN cada pedido SHALL oferecer uma
   ação explícita para abrir a conferência.
2. WHEN o usuário usa teclado ou toque THEN a ação SHALL funcionar sem depender
   de `dblclick` na linha.
3. WHEN a busca não retorna resultados THEN o sistema SHALL informar que não há
   correspondências e oferecer uma forma clara de limpar a busca.
4. WHEN fornecedor ou centro de resultado tiver texto longo THEN a interface
   SHALL preservar o conteúdo completo por tooltip, detalhe ou expansão sem
   deslocar a ação principal.

**Independent Test**: Abrir um pedido usando mouse, toque e teclado; filtrar
por um termo inexistente; limpar o filtro e retornar à lista.

### P1: Preencher uma conferência em formulário estruturado ⭐ MVP

**User Story**: Como um conferente, quero encontrar os campos agrupados por
finalidade para preencher quantidade, qualidade, lotes e patrimônios com menos
erros.

**Why P1**: A conferência é o fluxo operacional central do PCFI.

**Acceptance Criteria**:

1. WHEN a conferência é aberta THEN o sistema SHALL apresentar uma hierarquia
   clara entre identificação, quantidade, qualidade, anexos e observações.
2. WHEN a etapa não exigir lotes ou patrimônios THEN essas áreas SHALL
   permanecer recolhidas ou ausentes.
3. WHEN a etapa exigir qualidade THEN os campos de embalagem, divergência,
   item impróprio, matéria-prima e patrimônio SHALL aparecer em agrupamentos
   identificáveis.
4. WHEN uma PCFI existente for reaberta THEN os valores salvos de selects,
   checkboxes, quantidades e observações SHALL aparecer refletidos nos controles.
5. WHEN um campo obrigatório estiver inválido THEN o sistema SHALL indicar o
   campo e a correção necessária sem depender apenas de uma mensagem global.

**Independent Test**: Abrir uma PCFI nova e uma existente, preencher uma
conferência com lote e outra com patrimônio, e verificar os estados exibidos.

### P1: Usar a conferência nos três contextos de tela ⭐ MVP

**User Story**: Como um usuário que trabalha em campo ou no escritório, quero
usar o mesmo fluxo em smartphone, tablet e PC sem perder legibilidade ou ações.

**Why P1**: O PCFI será usado em dispositivos com dimensões e formas de entrada
diferentes.

**Acceptance Criteria**:

1. WHEN a tela tiver aproximadamente 360px de largura THEN os formulários SHALL
   usar uma coluna, manter os campos legíveis e não criar rolagem horizontal no
   formulário.
2. WHEN a tela tiver aproximadamente 768px de largura THEN os grupos SHALL
   reorganizar seus campos sem sobreposição e os botões SHALL permanecer
   alcançáveis por toque.
3. WHEN a tela tiver aproximadamente 1440px de largura THEN a lista SHALL
   aproveitar o espaço disponível sem esticar campos de forma desproporcional.
4. WHEN a tabela exceder a largura do dispositivo THEN a interface SHALL
   preservar a ação principal e indicar de forma compreensível a rolagem ou o
   conteúdo adicional.

**Independent Test**: Executar o fluxo em 360x800, 768x1024 e 1440x900 usando
orientação retrato e paisagem quando disponível.

### P2: Receber feedback acessível e consistente

**User Story**: Como um usuário, quero saber o estado da operação e corrigir
erros sem perder o ponto em que estava no fluxo.

**Why P2**: Feedback inadequado aumenta retrabalho e risco de salvamento
incorreto.

**Acceptance Criteria**:

1. WHEN uma operação assíncrona iniciar THEN o sistema SHALL comunicar o estado
   de carregamento sem bloquear a compreensão do contexto.
2. WHEN ocorrer erro de validação THEN o sistema SHALL levar o foco ao primeiro
   campo inválido e preservar os demais valores digitados.
3. WHEN um modal abrir THEN o sistema SHALL controlar foco, permitir fechamento
   seguro e devolver o foco ao controle que o acionou.
4. WHEN o usuário tentar abandonar uma conferência alterada THEN o sistema SHALL
   pedir confirmação antes de descartar os dados em memória.

**Independent Test**: Provocar erro de validação, abrir e fechar cada modal,
negar a permissão da câmera e tentar sair com alterações não salvas.

### P2: Aplicar uma direção visual operacional e coerente

**User Story**: Como um usuário operacional, quero identificar rapidamente etapa,
status, prioridade e próxima ação sem excesso de elementos decorativos.

**Why P2**: A interface deve ser memorável e clara, sem competir com a tarefa
de conferência.

**Acceptance Criteria**:

1. WHEN qualquer etapa estiver ativa THEN a interface SHALL indicar a posição
   no fluxo `Pedidos → PCFIs → Conferência`.
2. WHEN um status for apresentado THEN o sistema SHALL combinar texto com cor ou
   outro indicador visual, sem depender somente de cor.
3. WHEN a interface for exibida em qualquer breakpoint THEN títulos, campos e
   ações SHALL manter uma hierarquia visual consistente.

**Independent Test**: Comparar as três telas do fluxo nos três breakpoints e
identificar etapa, status e próxima ação sem consultar o código.

## Edge Cases

- WHEN não houver pedidos THEN o sistema SHALL exibir um estado vazio útil e
  distinto de uma busca sem correspondência.
- WHEN houver muitos itens, lotes ou patrimônios THEN o formulário SHALL manter
  os controles utilizáveis sem sobreposição ou perda de foco.
- WHEN o fornecedor, centro de resultado ou produto tiver texto muito longo THEN
  o conteúdo SHALL quebrar, truncar com acesso ao valor completo ou expandir de
  forma controlada.
- WHEN a câmera não estiver disponível ou a permissão for negada THEN o sistema
  SHALL informar a causa e permitir continuar sem capturar foto quando a regra
  de negócio permitir.
- WHEN o salvamento falhar parcialmente ou retornar erro THEN o sistema SHALL
  preservar a edição em memória e informar o próximo passo.
- WHEN o usuário alternar entre orientação retrato e paisagem THEN nenhum campo
  essencial SHALL ficar inacessível.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PCFI-UI-01 | P1: Navegar pelos pedidos | Phase 1 / T2 | Implemented |
| PCFI-UI-02 | P1: Navegar pelos pedidos | Phase 1 / T2 | Implemented |
| PCFI-UI-03 | P1: Navegar pelos pedidos | Phase 1 / T2 | Implemented |
| PCFI-UI-04 | P1: Navegar pelos pedidos | Phase 1 / T2 | Implemented |
| PCFI-UI-05 | P1: Preencher conferência | Phase 1 / T1 + Phase 2 / T4 | Implemented |
| PCFI-UI-06 | P1: Preencher conferência | Phase 2 / T4 | Implemented |
| PCFI-UI-07 | P1: Preencher conferência | Phase 2 / T3 | Implemented |
| PCFI-UI-08 | P1: Usar nos três contextos | Phase 1 / T1 + Phase 2 / T3/T5 | Implemented |
| PCFI-UI-09 | P1: Usar nos três contextos | Phase 3 / T7 | Implemented |
| PCFI-UI-10 | P1: Usar nos três contextos | Phase 3 / T7 | Implemented |
| PCFI-UI-11 | P2: Feedback acessível | Phase 3 / T7 | Implemented |
| PCFI-UI-12 | P2: Feedback acessível | Phase 2 / T5 | Implemented |
| PCFI-UI-13 | P2: Feedback acessível | Phase 1 / T1 + Phase 4 / T8 | Implemented |
| PCFI-UI-14 | P2: Feedback acessível | Phase 2 / T5 | Implemented |
| PCFI-UI-15 | P2: Direção visual | Phase 1 / T1 + Phase 3 / T6/T9 | Implemented |
| PCFI-UI-16 | P2: Direção visual | Phase 3 / T6/T9 | Implemented |

**Coverage**: 16 total, 16 mapped to tasks, 0 unmapped.

## Success Criteria

- [ ] O fluxo principal pode ser concluído manualmente em 360x800, 768x1024 e
      1440x900.
- [ ] Nenhuma ação essencial depende de duplo clique ou hover.
- [ ] Os campos obrigatórios e erros são identificáveis no próprio formulário.
- [ ] A revisão final de `web-design-guidelines` não deixa achados de alta
      prioridade sem justificativa.
- [ ] `node --check .\\link\\javascript\\script.js` passa após as alterações.
- [ ] As integrações de salvamento, câmera, autorização e anexo continuam
      funcionando no runtime Sankhya.
