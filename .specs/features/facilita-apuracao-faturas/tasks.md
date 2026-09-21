# Dashboard de Apuração de Faturas — Tarefas

**Design:** `design.md`  
**Status:** em execução — T4 concluída.

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
Fase 0: T1 → T2 → T3
Fase 1: T4 → T5 → T8 → T15
         T1 + T4 → T7 ─┘
         T4 → T6
         T5 → T9
Fase 2: T2 + T3 + T7 → T10; T8 + T10 → T11
Fase 3: T2 + T11 → (T12, T13, T14)
Fase 4: T9 + T12 + T13 + T14 + T15 → T16
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

### Fase 3 — Operações e exportação

### T12: Integrar edição de valor e vencimento

**What:** Implementar o adaptador de edição com o contrato homologado e recarga da linha após resposta.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T2, T11  
**Requirement:** APU-04, APU-05, APU-06

**Done when:**

- [ ] Somente valor e vencimento são editáveis.
- [ ] Recusa de validação preserva o valor exibido vindo do servidor.
- [ ] Sucesso recarrega a linha e informa o usuário.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

### T13: Integrar anexo e visualização

**What:** Implementar seleção de um arquivo, tipo obrigatório e abertura do visualizador conforme o contrato homologado.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T2, T11  
**Requirement:** APU-07, APU-08, APU-09

**Done when:**

- [ ] Impede mais de um arquivo e a ausência de tipo antes de enviar.
- [ ] Erro de envio não atualiza visualmente a apuração como anexada.
- [ ] Visualização respeita a autorização registrada no contrato.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

### T14: Integrar confirmação e nova auditoria

**What:** Implementar comandos de confirmação e solicitação de nova auditoria com o contrato homologado.  
**Where:** `facilita/apuracao-faturas/javascript/script.js`  
**Depends on:** T2, T11  
**Requirement:** APU-10, APU-11, APU-12

**Done when:**

- [ ] Não confirma apuração sem valor.
- [ ] Nova auditoria é oferecida somente no estado aplicável e informa falta de permissão.
- [ ] Toda resposta atualiza a linha a partir da fonte do servidor.

**Tests:** manual — UAT do solicitante  
**Gate:** UAT transacional

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

### Fase 4 — Empacotamento e aceite

### T16: Preparar pacote e roteiro de UAT

**What:** Criar ZIP publicável e consolidar roteiro de aceite por requisito.  
**Where:** `facilita/apuracao-faturas/` e `.specs/features/facilita-apuracao-faturas/homologacao.md`  
**Depends on:** T9, T12, T13, T14, T15  
**Requirement:** APU-01 a APU-16

**Done when:**

- [ ] ZIP contém os arquivos do gadget na raiz, sem diretório intermediário.
- [ ] O entry point coincide com `tdb_partida.jsp`.
- [ ] O roteiro registra o resultado manual de todos os requisitos aplicáveis.
- [ ] O solicitante decide o aceite ou os ajustes necessários.

**Tests:** manual — UAT do solicitante  
**Gate:** Pacote

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
| T12 | T2, T11 | T2 + T11 → T12 | OK |
| T13 | T2, T11 | T2 + T11 → T13 | OK |
| T14 | T2, T11 | T2 + T11 → T14 | OK |
| T15 | T8 | T8 → T15 | OK |
| T16 | T9, T12, T13, T14, T15 | Fase 4 consolida todas | OK |

## Validação da co-localização

| Tarefa | Camada | Matriz requer | Tarefa declara | Status |
| --- | --- | --- | --- | --- |
| T1-T3 | documentação de homologação | manual | manual | OK |
| T4-T7, T10 | XML/JSP | manual | manual | OK |
| T8-T9, T11-T15 | JavaScript/CSS | manual | manual | OK |
| T16 | pacote | manual | manual | OK |

## Execução

O plano possui cinco fases. Antes de executar, a orquestração deve oferecer o modelo de trabalho por fases; a validação continuará manual e conduzida pelo solicitante.
