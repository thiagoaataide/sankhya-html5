# Roteiro de homologação — Apuração de Faturas

Este roteiro valida o MVP de consulta do gadget em um Om equivalente ao cliente. A execução é manual pelo solicitante; não há runner ou gate automatizado.

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

## Evidências a registrar

- Versão do Om e URL do ambiente de homologação.
- Quantidade de linhas comparadas com a tela legada e divergências por `NUAPURACAO`.
- Captura da resposta/erro do payload de detalhe, sem dados sensíveis.
- Arquivo CSV exportado e colunas selecionadas.
- Correlation ID exibido em qualquer estado de erro.

## Bloqueios para paridade transacional

As tarefas abaixo permanecem deliberadamente sem chamadas de escrita até a captura e aprovação dos contratos no ambiente de homologação:

- `T11`: retorno de `ApuracaoSP.getTarefa` e identificador `IDINSTTAR`.
- `T12`: contrato de atualização de `VALOR`/`DTVENC`, validação e controle de concorrência.
- `T13`: upload de arquivo, tipo de anexo, compensação e visualização autorizada.
- `T14`: confirmação e nova auditoria, incluindo permissão `BH_NOVAAUDIT` e transação atômica.
- `T16`: pacote final publicável depende dos itens acima.

Até esses contratos serem aprovados, os botões de tarefa e confirmação permanecem desabilitados e informam o motivo; nenhuma alteração de estado é enviada pelo gadget.
