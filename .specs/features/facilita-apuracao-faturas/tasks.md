# Dashboard de Apuração de Faturas — Tarefas

**Design:** `design.md`  
**Status:** em execução — T1 tem evidência preparada; T2/T3 estão parciais;
T4–T10 e T15 estão concluídas; T22 é o próximo gate de leitura. T17 foi
recortada para comandos MVP; T18 aguarda adapters/publicação do Add-on; T21
valida leitura e comandos principais. T23 decide se anexos/workflow entram no
aceite; T11/T13 ficam complementares até essa decisão.

## Protocolo de validação

O solicitante conduzirá o UAT manual no Sankhya Om. Não há runner, testes automatizados ou comandos de gate neste projeto. Cada tarefa que altera comportamento será validada pelo cenário manual indicado antes da próxima tarefa dependente.

## Test Coverage Matrix

> Diretriz confirmada pelo solicitante: validação manual no Sankhya Om; sem testes automatizados.

| Camada | Tipo de teste | Expectativa de cobertura | Local | Comando |
| --- | --- | --- | --- | --- |
| JSP / `snk:query` | manual | Cenários aplicáveis APU-01 a APU-16 | UAT do solicitante | N/A |
| JavaScript / CSS | manual | Carregamento, vazio, erro, seleção, teclado e responsividade | UAT do solicitante | N/A |
| Integrações de escrita | manual | Sucesso, recusa e falha parcial por operação | Homologação do cliente | N/A |

## Parallelism Assessment

| Tipo | Paralelo? | Motivo |
| --- | --- | --- |
| UAT no Sankhya | Não | Compartilha sessão, dados e ambiente de homologação. |
| Arquivos estáticos independentes | Sim, após a estrutura | JSP, CSS e JS distintos podem evoluir em paralelo, mas a validação manual é sequencial. |

## Gate Check Commands

| Nível | Quando usar | Comando |
| --- | --- | --- |
| UAT de consulta | Após filtros, lista, detalhe ou exportação | N/A — solicitante valida no Sankhya Om. |
| UAT transacional | Após edição, anexo, confirmação, reauditoria ou workflow | N/A — solicitante valida no Sankhya Om. |
| Pacote | Antes do upload | N/A — solicitante confere ZIP com arquivos na raiz. |

## Execution Plan

```text
Fase 0 — referência e exposição de dados: T1 → T2 → T3
Fase 1 — leitura independente: T4 → T5/T6/T7/T8/T9/T10 → T22
Fase 2 — comandos essenciais: T17 → Add-on T15 → T18 → T12/T14 → T21
Fase 3 — anexos e workflow: T23 decide o gate; se necessário, T11/T13 → UAT complementar
Fase 4 — pacote: T16 após o aceite das fases aplicáveis
```

## Task Breakdown

### Fase 0 — Referência de homologação

### T1: Criar roteiro de comparação comportamental

**What:** Documentar os cenários e a amostra de pelo menos 20 apurações para comparar legado e dashboard.  
**Where:** `.specs/features/facilita-apuracao-faturas/homologacao.md`  
**Depends on:** None  
**Requirement:** APU-01, APU-02, APU-04 a APU-16

**Done when:**

- [ ] Inclui pendente, confirmada, com anexo, sem valor e com tarefa pendente.
- [ ] Registra resultado esperado por cenário, sem dados sensíveis.
- [ ] O solicitante confirma que a amostra está disponível em homologação.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ⚠️ Evidência preparada com consulta somente leitura no ambiente Facilita Telecom/teste; falta a confirmação manual da amostra pelo solicitante.

### T2: Registrar contratos observados das ações legadas

**What:** Capturar request, resposta, erros e permissões de salvar, anexar, confirmar, solicitar nova auditoria e abrir tarefa.  
**Where:** `.specs/features/facilita-apuracao-faturas/homologacao.md`  
**Depends on:** T1  
**Requirement:** APU-05 a APU-14

**Done when:**

- [ ] Cada ação contém entrada mínima, resposta de sucesso e resposta de recusa.
- [ ] O contrato de anexos registra associação, tipo e comportamento em falha.
- [ ] A permissão `BH_NOVAAUDIT` é observada com usuário permitido e não permitido.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

**Status:** ⚠️ Parcial — contratos e regras conhecidos do fonte foram registrados, mas request/response reais dos serviços ainda precisam ser capturados no Om do cliente.

### T3: Definir exposição de dados por perfil

**What:** Registrar quais campos de detalhe podem ser exibidos, mascarados ou excluídos.  
**Where:** `.specs/features/facilita-apuracao-faturas/dados-sensiveis.md`  
**Depends on:** T2  
**Requirement:** APU-03, APU-09

**Done when:**

- [ ] Senha é excluída por padrão.
- [ ] CPF/CNPJ, e-mail e login têm regra explícita por perfil.
- [ ] A decisão é aprovada pelo responsável do cliente.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ⚠️ Parcial — matriz conservadora criada em `dados-sensiveis.md`; aguarda aprovação do responsável do cliente.

### Fase 1 — Consulta e experiência base

### T4: Criar configuração do gadget

**What:** Criar a estrutura de nível e os parâmetros iniciais do dashboard.  
**Where:** `facilita/apuracao-faturas/tdb_dashboard.xml`  
**Depends on:** None  
**Requirement:** APU-01, APU-02

**Done when:**

- [ ] Define um nível principal e `tdb_partida.jsp` como entry point.
- [ ] Define mês de referência e filtros suportados sem usar `GridConfig`.
- [ ] Usa tipos de parâmetro compatíveis com a skill HTML5.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — XML criado em `facilita/apuracao-faturas/tdb_dashboard.xml`.

### T5: Criar casca semântica do dashboard

**What:** Criar o JSP principal com cabeçalho Sankhya, áreas de filtro, lista, detalhe e mensagens de estado.  
**Where:** `facilita/apuracao-faturas/tdb_partida.jsp`  
**Depends on:** T4  
**Requirement:** APU-01, APU-03, APU-04

**Done when:**

- [ ] Inclui `snk:load`, idioma, título e referências locais a CSS/JS.
- [ ] Expõe regiões acessíveis para carregando, vazio, erro, sucesso e sem permissão.
- [ ] Não referencia Angular, `sk-datagrid` ou `GridConfig`.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — JSP principal criado em `facilita/apuracao-faturas/tdb_partida.jsp`.

### T6: Criar página de erro do gadget

**What:** Criar página JSP de erro com mensagem compreensível e retorno seguro ao dashboard.  
**Where:** `facilita/apuracao-faturas/erro.jsp`  
**Depends on:** T4  
**Requirement:** APU-03

**Done when:**

- [ ] Não expõe SQL, stack trace, sessão ou dados sensíveis.
- [ ] Indica que o usuário pode registrar o horário e a ação que falhou.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — página segura criada em `facilita/apuracao-faturas/erro.jsp`.

### T7: Criar consulta inicial de apurações

**What:** Implementar `snk:query` da lista usando mês, pendência, anexo e colunas permitidas.  
**Where:** `facilita/apuracao-faturas/dados.jsp`  
**Depends on:** T1, T4  
**Requirement:** APU-01, APU-02, APU-03

**Done when:**

- [ ] Datas usam o padrão EL + `TO_DATE/SUBSTR` da skill.
- [ ] Parâmetros de lista usam binding e os filtros opcionais retornam resultado coerente.
- [ ] O resultado é serializado de forma segura para o JavaScript.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — consulta somente leitura criada em `facilita/apuracao-faturas/dados.jsp`; execução SQL pendente de UAT do solicitante.

### T8: Implementar lista, filtros locais e seleção

**What:** Renderizar a tabela própria, aplicar busca, selecionar uma apuração e atualizar estados visuais.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T5, T7  
**Requirement:** APU-01, APU-02, APU-03, APU-04

**Done when:**

- [ ] A seleção é feita por teclado e mouse.
- [ ] Lista vazia, carregamento e falha não deixam dados anteriores parecendo atuais.
- [ ] A tabela não usa a configuração de grade legada.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — listagem, filtros, contadores e seleção implementados em `facilita/apuracao-faturas/javascript/script.js`.

### T9: Implementar apresentação operacional responsiva

**What:** Estilizar filtros, tabela, painel de detalhe, estados e foco visível conforme a direção visual aprovada.  
**Where:** `facilita/apuracao-faturas/css/style.css`  
**Depends on:** T5  
**Requirement:** APU-01 a APU-04

**Done when:**

- [ ] A tabela é a área dominante e os estados usam texto e cor acessível.
- [ ] Em largura reduzida, filtros recolhem e colunas-chave continuam acessíveis por rolagem.
- [ ] Foco de teclado e contraste permitem operação sem mouse.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — estilos responsivos, estados visuais, tabela, filtros e foco acessível implementados em `facilita/apuracao-faturas/css/style.css`.

### Fase 2 — Detalhe e navegação

### T10: Criar payload de detalhe não sensível

**What:** Criar JSP que retorna dados da apuração selecionada, incluindo somente campos aprovados em T3.  
**Where:** `facilita/apuracao-faturas/detalhe_payload.jsp`  
**Depends on:** T2, T3, T7  
**Requirement:** APU-04, APU-09

**Done when:**

- [ ] Consulta recebe somente a chave da apuração e valida ausência de resultado.
- [ ] Não inclui senha ou campo não aprovado em T3.
- [ ] Falhas retornam estado tratável pela interface.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — payload somente leitura criado em `facilita/apuracao-faturas/detalhe_payload.jsp`, com chave numérica validada e whitelist de campos não sensíveis; execução SQL pendente de UAT.

### T11: Exibir detalhe e abrir tarefa nativa

**What:** Buscar detalhe sob demanda, exibir campos autorizados e abrir a tarefa pendente pela API nativa quando disponível.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T8, T10  
**Requirement:** APU-13, APU-14

**Done when:**

- [ ] A seleção cancela ou ignora respostas obsoletas de requisições anteriores.
- [ ] Ausência de tarefa mostra mensagem de negócio, não erro técnico.
- [ ] A tarefa abre com o identificador validado em T2.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ⚠️ Parcial — detalhe assíncrono, visualização via fachada e abertura por `openApp` implementados; UAT permanece pendente até homologar o retorno de `getTarefa`/`IDINSTTAR`.

### Fase 3 — Desenho e fachada transacional

### T17: Consolidar contrato da fachada transacional

**What:** Fechar primeiro o contrato mínimo de edição, confirmação e nova auditoria. Lista/detalhe só entram na fachada se T22 reprovar a consulta JSP; anexos e workflow ficam fora deste contrato MVP.
**Where:** `.specs/features/facilita-apuracao-faturas/contracts.md`, `.specs/features/facilita-apuracao-faturas/adr/ADR-001-fachada-transacional-dashboard.md`
**Depends on:** T2, T3, T7, T8, T10, T22
**Requirement:** APU-04 a APU-06, APU-10 a APU-12, APU-17, APU-18

**Done when:**

- [ ] Atualização, confirmação e nova auditoria têm entrada mínima, envelope
  de sucesso/erro e regra de releitura definidos.
- [ ] Autorização pelo usuário corrente, estado, concorrência/idempotência e
  correlação estão explícitos; campos/semânticas não comprovados seguem PENDENTE.
- [ ] Anexos e workflow não são pré-requisitos do contrato MVP, salvo decisão
  registrada do responsável pelo aceite.
- [ ] O responsável do cliente aprova o contrato mínimo antes da integração.

**Tests:** manual — revisão do contrato e captura no Sankhya Om
**Gate:** UAT transacional

**Status:** 🔄 Em execução — contrato inicial criado em `contracts.md`; falta captura/aprovação dos comandos MVP no ambiente do cliente.

### T18: Integrar os comandos MVP com o Add-on Provider

**What:** Integrar o gadget com o Add-on existente para edição, confirmação e nova auditoria. A implementação Java pertence ao repositório do Add-on, não ao projeto HTML5.
**Where:** gadget em `facilita/apuracao-faturas/`; backend em `C:/projetos/facilita-apuracao-fatura-addon`
**Depends on:** T17, Add-on T15 e T16
**Requirement:** APU-05, APU-06, APU-10 a APU-12, APU-17

**Done when:**

- [ ] O gadget chama somente operações publicadas e homologadas no Add-on;
  não depende do checkout `facilitatelecoment`.
- [ ] Cada comando valida usuário, estado e precondições no backend, grava em
  transação e devolve a linha reconsultada.
- [ ] Erros de regra, conflito e autorização retornam envelope seguro com
  `code`, `message` e `correlationId`.
- [ ] Há evidência manual de sucesso e recusa para cada comando MVP no Om.

**Tests:** manual — UAT transacional do pacote novo
**Gate:** UAT transacional

**Status:** ⛔ Bloqueada — o Add-on está em repositório separado. A integração aguarda contrato T17 aprovado, adapters T15/T16 homologados e publicação do Provider em ambiente de teste; esta task não autoriza implementar Java no HTML5 nem buildar o legado.

### Fase 4 — Operações e exportação

### T12: Integrar edição de valor e vencimento

**What:** Implementar o adaptador de edição com o contrato homologado e recarga da linha após resposta.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T17, T18
**Requirement:** APU-04, APU-05, APU-06

**Done when:**

- [ ] Somente valor e vencimento são editáveis.
- [ ] Recusa de validação preserva o valor exibido vindo do servidor.
- [ ] Sucesso recarrega a linha e informa o usuário.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

**Status:** ⚠️ Adaptador implementado — a chamada usa `ApuracaoDashboardSP.atualizar`; execução real aguarda T17/T18 e publicação da fachada.

### T13: Integrar anexo e visualização

**What:** Implementar seleção de um arquivo, tipo obrigatório e abertura do visualizador conforme o contrato homologado.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T23, Add-on T10
**Requirement:** APU-07, APU-08, APU-09

**Done when:**

- [ ] Impede mais de um arquivo e a ausência de tipo antes de enviar.
- [ ] Erro de envio não atualiza visualmente a apuração como anexada.
- [ ] Visualização respeita a autorização registrada no contrato.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

**Status:** ⚠️ Adaptador implementado — upload para sessão e associação usam `ApuracaoDashboardSP.anexar`/`listarAnexos`; execução fica na fase complementar e depende de T23 e Add-on T10.

### T14: Integrar confirmação e nova auditoria

**What:** Implementar comandos de confirmação e solicitação de nova auditoria com o contrato homologado.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T17, T18
**Requirement:** APU-10, APU-11, APU-12

**Done when:**

- [ ] Não confirma apuração sem valor.
- [ ] Nova auditoria é oferecida somente no estado aplicável e informa falta de permissão.
- [ ] Toda resposta atualiza a linha a partir da fonte do servidor.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

**Status:** ⚠️ Adaptador implementado — confirmação e nova auditoria usam operações distintas da fachada; execução real aguarda T17/T18 e validação de `BH_NOVAAUDIT`.

### T15: Implementar colunas locais e exportação

**What:** Implementar escolha de colunas, ordenação e exportação da lista filtrada sem `GridConfig`.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T8  
**Requirement:** APU-15, APU-16

**Done when:**

- [ ] Preferências usam chave nova e isolada por usuário.
- [ ] Exportação contém somente linhas filtradas e colunas visíveis.
- [ ] Arquivo exportado preserva acentos em Excel.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT de consulta

**Status:** ✅ Concluída — preferências locais com chave própria, ordenação, escolha de colunas e CSV UTF-8 com BOM implementados em `facilita/apuracao-faturas/javascript/script.js`.

### Fase 5 — Empacotamento e aceite

### T21: Executar UAT transacional integrado

**What:** Validar no Sankhya Om as operações integradas do gadget contra a fachada, incluindo sucesso, recusa, conflito e falha parcial.
**Where:** `.specs/features/facilita-apuracao-faturas/homologacao.md`
**Depends on:** T12, T14, T22
**Requirement:** APU-04 a APU-06, APU-10 a APU-12, APU-17, APU-18

**Done when:**

- [ ] Edição, confirmação e nova auditoria são testadas com usuário permitido
  e negado; anexos/workflow não fazem parte desta fatia.
- [ ] Recusa por permissão, valor ausente, conflito e falha não deixam estado
  parcial na UI; após sucesso, a linha é reconsultada.
- [ ] A amostra e o correlation ID dos cenários ficam registrados sem dados
  sensíveis.
- [ ] O solicitante aceita explicitamente a consulta e os comandos do MVP ou
  devolve os bloqueios para correção.

**Tests:** manual — UAT do solicitante
**Gate:** UAT transacional

**Status:** ⛔ Bloqueada — depende da consulta aprovada em T22 e da publicação/homologação dos comandos principais via T18, T12 e T14.

### T16: Preparar pacote e roteiro de UAT

**What:** Criar ZIP publicável e consolidar roteiro de aceite por requisito.  
**Where:** `facilita/apuracao-faturas/` e `.specs/features/facilita-apuracao-faturas/homologacao.md`  
**Depends on:** T21, T22, T23
**Requirement:** APU-01 a APU-18

**Done when:**

- [ ] ZIP contém os arquivos do gadget na raiz, sem diretório intermediário.
- [ ] O entry point coincide com `tdb_partida.jsp`.
- [ ] O roteiro registra o resultado manual de todos os requisitos aplicáveis.
- [ ] O solicitante decide o aceite ou os ajustes necessários.

**Tests:** manual — UAT do solicitante  
**Gate:** Pacote

**Status:** ⚠️ Parcial — roteiro criado em `.specs/features/facilita-apuracao-faturas/homologacao.md`; ZIP final aguarda T21/T22/T23 e o aceite das fases aplicáveis.

### T22: Homologar a consulta read-first sem depender da fachada

**What:** Validar lista, filtros e detalhe atuais em modo somente leitura.
Comprovar parâmetros, projeção e autorização; se JSP não passar no gate, mover
a consulta para uma operação autorizada do Provider antes de liberar o gadget.
**Where:** `facilita/apuracao-faturas/dados.jsp`,
`detalhe_payload.jsp` e `homologacao.md`
**Depends on:** T3, T7, T8, T10
**Requirement:** APU-01, APU-02, APU-03, APU-09, APU-18

**Done when:**

- [ ] Filtros de mês, pendência, anexo e busca combinam-se conforme a amostra
  funcional aprovada e não usam `GridConfig`.
- [ ] Entradas são vinculadas ou validadas no servidor; a projeção usa apenas
  campos permitidos e os perfis autorizados/negados são testados.
- [ ] Uma consulta JSP que não comprove esses controles não libera o gadget;
  a leitura é movida para o Provider e volta ao UAT.
- [ ] Falha de leitura não exibe resultado antigo como atual nem dados parciais.
- [ ] Evidência manual registra filtros, perfis e resultado sem dados sensíveis.

**Tests:** manual — UAT de consulta
**Gate:** UAT de consulta

**Status:** ⏳ Nova — aguarda validação da consulta e dos parâmetros no Om.

### T23: Confirmar se anexos e workflow são gate do MVP

**What:** Obter a decisão explícita do responsável funcional sobre concluir a
aprovação sem anexar/visualizar arquivos ou abrir a tarefa nativa.
**Where:** `homologacao.md`, `tasks.md` e `memory.md`
**Depends on:** T2, T3
**Requirement:** APU-07 a APU-09, APU-13, APU-14

**Done when:**

- [ ] A decisão identifica se anexos e workflow são indispensáveis para
  concluir uma aprovação no MVP.
- [ ] Se forem indispensáveis, T11/T13 e Add-on T10/T11 são promovidas para o
  gate de integração/UAT; se não forem, ficam registradas como fase posterior.
- [ ] A decisão é refletida no roteiro de homologação e não é inferida do
  fonte legado.

**Tests:** manual — aceite do responsável funcional
**Gate:** decisão de escopo

**Status:** ⏳ Nova — decisão de aceite funcional pendente.

## Cross-check de dependências

| Tarefa | Dependências declaradas | Diagrama | Status |
| --- | --- | --- | --- |
| T1 | nenhuma | Fase 0 inicia em T1 | OK |
| T2 | T1 | T1 → T2 | OK |
| T3 | T2 | T2 → T3 | OK |
| T4 | nenhuma | Fase 1 inicia em T4 | OK |
| T5 | T4 | T4 → T5 | OK |
| T6 | T4 | T4 → T6 | OK |
| T7 | T1, T4 | T1 + T4 → T7 | OK |
| T8 | T5, T7 | T5 + T7 → T8 | OK |
| T9 | T5 | T5 → T9 | OK |
| T10 | T2, T3, T7 | T2 + T3 + T7 → T10 | OK |
| T11 | T8, T10 | T8 + T10 → T11 | OK |
| T12 | T17, T18 | T17 + T18 → T12 | OK |
| T13 | T23, Add-on T10 | T23 + Add-on T10 → T13 | fase complementar |
| T14 | T17, T18 | T17 + T18 → T14 | OK |
| T15 | T8 | T8 → T15 | OK |
| T17 | T2, T3, T7, T8, T10, T22 | T22 + evidências → T17 | em execução |
| T18 | T17, Add-on T15/T16 | contrato + adapters → T18 | bloqueada até Om |
| T21 | T12, T14, T22 | leitura + comandos → T21 | UAT do MVP |
| T16 | T21, T22, T23 | aceite das fases aplicáveis → T16 | aguarda UAT |
| T22 | T3, T7, T8, T10 | consultas → T22 | nova — UAT de leitura |
| T23 | T2, T3 | decisão funcional → T23 | nova — escopo anexo/workflow |

## Validação da co-localização

| Tarefa | Camada | Matriz requer | Tarefa declara | Status |
| --- | --- | --- | --- | --- |
| T1-T3 | documentação de homologação | manual | manual | OK |
| T4-T7, T10 | XML/JSP | manual | manual | OK |
| T8-T9, T11-T15 | JavaScript/CSS | manual | manual | OK |
| T17 | contrato/ADR | manual | manual | OK |
| T18 | integração com backend | manual | manual | OK |
| T21 | integração | manual | manual | OK |
| T22-T23 | consulta e decisão funcional | manual | manual | pendente |
| T16 | pacote | manual | manual | OK |

## Execução

O plano possui cinco fases. Antes de executar, a orquestração deve oferecer o modelo de trabalho por fases; a validação continuará manual e conduzida pelo solicitante.
