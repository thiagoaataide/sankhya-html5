# Roteiro de homologação — Apuração de Faturas

Este roteiro valida o gadget e a futura fachada em um Om equivalente ao cliente. A execução é manual pelo solicitante; não há runner ou gate automatizado.

## Evidência inicial de dados

Consulta somente leitura executada em **Facilita Telecom / teste** em 2026-09-21:

- `BH_FACAPU` possui os campos esperados de identificação, valores, vencimento,
  confirmação, workflow, anexo e auditoria; a consulta de metadados retornou 30
  colunas.
- No mês corrente do ambiente de teste foram observados 10.914 registros: 10.208
  pendentes sem valor e 706 confirmados, dos quais 452 sem valor. A coluna
  `POSSUIANEXO` da tabela não foi usada como prova de anexo; a checagem deve ser a
  existência em `TSIANX`.
- A amostra histórica contém registros com anexo e workflow (`IDINSTPRN`), além
  de registros confirmados sem valor. Os identificadores foram usados apenas para
  validar o formato e não são reproduzidos neste documento.

Essa evidência confirma que a massa necessária para os cenários existe no ambiente
de teste, mas não substitui o aceite manual do solicitante no ambiente do cliente.

## Pré-condições

- Usuário autenticado com acesso à tabela `BH_FACAPU` e ao nível do gadget.
- Amostra com apuração pendente, confirmada, com anexo, sem anexo e sem valor.
- Mês de referência conhecido para comparação com a tela legada.

## Consulta e visão

| Cenário | Ação | Resultado esperado |
| --- | --- | --- |
| C01 | Abrir o gadget sem parâmetros | Lista inicia no primeiro dia do mês corrente; estados carregando/vazio/erro são compreensíveis. |
| C02 | Alterar `P_REFERENCIA`, pendência e anexo no contexto do dashboard | A consulta retorna somente as linhas compatíveis. |
| C03 | Pesquisar por sequência, conta, contrato, valor e vencimento | Filtros locais atualizam a tabela e os contadores sem chamar `GridConfig`. |
| C04 | Selecionar uma linha e selecionar outra rapidamente | Detalhe final corresponde à última seleção; resposta obsoleta não sobrescreve a seleção. |
| C05 | Abrir o detalhe de uma linha | Somente campos da whitelist são exibidos; não aparecem senha, CPF/CNPJ ou credencial. |
| C06 | Alternar colunas, ordenar e recarregar a página | Preferências usam a chave `facilita-apuracao-faturas:columns:v1` e não a configuração legada. |
| C07 | Exportar após filtrar e ocultar colunas | CSV contém somente as linhas/colunas visíveis e abre acentuado no Excel. |
| C08 | Selecionar uma apuração com anexo | O visualizador legado abre em nova aba; autorização deve ser conferida no ambiente. |

## Operações transacionais — fachada nova

| Cenário | Ação | Resultado esperado |
| --- | --- | --- |
| C09 | Alterar vencimento e valor válidos e salvar | A fachada confirma o commit, a linha é recarregada do servidor e o `correlationId` é exibido. |
| C10 | Informar valor vazio, negativo ou vencimento inválido | A operação é recusada sem alterar a linha exibida; a mensagem identifica a correção necessária. |
| C11 | Confirmar uma apuração com valor | O estado muda para confirmada somente após o commit; repetir a ação não duplica o efeito. |
| C12 | Confirmar uma apuração sem valor | A fachada retorna regra de negócio; nenhum campo é alterado. |
| C13 | Solicitar nova auditoria como usuário autorizado | A fachada limpa os campos do processo numa transação e a linha é recarregada. |
| C14 | Solicitar nova auditoria como usuário sem `BH_NOVAAUDIT` | Retorno `FORBIDDEN`; nenhum campo é alterado e a mensagem não expõe stack trace. |
| C15 | Enviar um único arquivo com tipo | O upload e a associação concluem; a linha passa a indicar anexo após a reconsulta. |
| C16 | Tentar dois arquivos, nenhum tipo ou falha na associação | O envio é bloqueado ou compensado; a linha não é marcada como anexada. |
| C17 | Abrir tarefa com `IDINSTPRN` e tarefa pendente | A fachada retorna `IDINSTTAR` e `openApp` abre `br.com.sankhya.workflow.listatarefa`. |
| C18 | Abrir tarefa sem tarefa pendente | A tela informa ausência de tarefa, sem erro técnico. |

Em C09–C18, registrar request/resposta da fachada, usuário/perfil, estado antes/depois
e `correlationId`, sempre removendo dados pessoais e segredos.

## Evidências a registrar

- Versão do Om e URL do ambiente de homologação.
- Quantidade de linhas comparadas com a tela legada e divergências por `NUAPURACAO`.
- Captura da resposta/erro do payload de detalhe, sem dados sensíveis.
- Arquivo CSV exportado e colunas selecionadas.
- Correlation ID exibido em qualquer estado de erro.

## Matriz de amostra sugerida

Selecionar ao menos 20 linhas, sem copiar dados pessoais para a documentação:

| Grupo | Quantidade mínima | Característica obrigatória |
| --- | ---: | --- |
| Pendente sem valor | 4 | `CONFIRMADO <> 'S'` e `VALOR` nulo ou zero |
| Pendente com valor | 4 | candidato à confirmação |
| Confirmada com valor | 4 | `CONFIRMADO = 'S'` |
| Confirmada sem valor | 2 | recusa de confirmação/regra de legado |
| Com anexo | 3 | existência em `TSIANX` para `bhApuracao` |
| Com workflow | 3 | `IDINSTPRN` preenchido e tarefa pendente |

Uma mesma linha pode atender a mais de um grupo. Registrar somente a chave interna,
estado e resultado do cenário; mascarar conta, cliente, e-mail e qualquer credencial.

## Bloqueios para paridade transacional

As tarefas abaixo permanecem deliberadamente sem chamadas de escrita até a captura e aprovação dos contratos no ambiente de homologação:

- `T11`: retorno da fachada `getTarefa` e identificador `IDINSTTAR`.
- `T12`: endpoint `atualizar`, validação e controle de concorrência.
- `T13`: upload de arquivo, tipo de anexo, compensação e visualização autorizada pela fachada.
- `T14`: operações `confirmar`/`solicitarNovaAuditoria`, permissão `BH_NOVAAUDIT` e transação atômica.
- `T16`: pacote final publicável depende do UAT C09–C18.

Até a fachada ser publicada e os contratos aprovados, as ações mostram o erro estruturado
da integração e nenhuma alteração de estado deve ser considerada concluída pelo gadget.
