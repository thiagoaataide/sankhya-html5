# Plano de implementação — PCFI

Implementação concluída em 29 de julho de 2026. O documento permanece como
registro das tarefas e critérios de homologação.

## Decisões confirmadas

- A imagem será capturada somente na etapa de conferência de quantidade.
- Cada item de `AD_PCFIITE` terá uma única imagem no campo `IMAGEM`, já criado
  como **Conteúdo Binário** com apresentação **Imagem**.
- O HTML5 enviará a foto como Anexo do Sistema vinculado a `AD_PCFIITE`.
- O evento Sankhya será disparado a partir de `AnexoSistema` (`TSIANX`) e
  copiará os bytes para `AD_PCFIITE.IMAGEM`.
- Na qualidade, as decisões serão **Aprovado**, **Aprovado com Ressalva** e
  **Negado**.
- Aprovado e Aprovado com Ressalva seguem para Fiscal com status fiscal
  pendente.
- Negado encerra a PCFI sem Fiscal: status de processo `N` e status fiscal
  `C`.
- Uma PCFI negada continua abatendo a quantidade do pedido de compra.

## Pontos que precisam ser confirmados antes do código

- A qualidade já possui `STATUSQUAL` com os valores `P`, `E`, `A`, `R` e `N`.
  Não será criado um campo adicional de resultado.
- O evento recuperará o arquivo pelo diretório configurado no parâmetro
  `FREPBASEFOLDER`, usando o caminho
  `Sistema/Anexos/AD_PCFIITE/<CHAVEARQUIVO>`. A tabela `TSIANX` guarda o
  vínculo e os metadados do anexo, não o conteúdo binário.
- Definir um marcador para as fotos de PCFI no Anexo do Sistema, como uma
  descrição ou nome de arquivo padronizado. O evento não deve copiar qualquer
  anexo eventualmente incluído no item.
- Definir se o usuário poderá substituir a foto antes da confirmação. O plano
  considera uma única foto final por item.

## Tarefas atômicas

As tarefas 1 a 11 foram implementadas no componente e na classe Java. A tarefa
12 deve ser executada no ambiente de homologação do Sankhya.

### 1. Validar opções de status no dicionário

- Criar a opção `N - Negado` no campo de status do processo da PCFI.
- Conferir que o status fiscal aceita `C - Cancelado`.
- Confirmar `STATUSQUAL` com as opções `A - Aprovado`, `R - Aprovado com
  ressalva` e `N - Negado`.

**Aceite:** os valores podem ser gravados e aparecem corretamente no Construtor
de Telas.

### 2. Mapear o resultado da qualidade para os status da PCFI

- Registrar a matriz de persistência abaixo no código antes de alterar o modal.

| Decisão da qualidade | Processo | Fiscal | `STATUSQUAL` |
| --- | --- | --- | --- |
| Aprovado | `F` | `P` | `A` |
| Aprovado com Ressalva | `F` | `P` | `R` |
| Negado | `N` | `C` | `N` |

**Aceite:** a matriz usa somente campos e opções existentes no dicionário.

### 3. Substituir o modal atual de finalização da qualidade

- Criar um modal próprio da etapa de Qualidade, mantendo o padrão visual e o
  comportamento responsivo do modal já existente.
- Exibir três ações: **Aprovado**, **Aprovado com Ressalva** e **Negado**.
- Exibir a ação de cancelar, toque fora e `Esc` sem persistir alterações.

**Aceite:** o modal não usa `window.confirm()` e funciona por toque em tablet e
smartphone.

### 4. Persistir a decisão de qualidade

- Alterar somente o caminho de salvamento da etapa `QUAL`.
- Gravar os status definidos na tarefa 2.
- Impedir a abertura da etapa Fiscal quando o processo estiver em `N`.
- Atualizar textos, badges e linhas da lista para mostrar **Negada** em vez de
**Concluída**.

**Aceite:** Aprovado e Ressalva ficam disponíveis ao Fiscal; Negado não oferece
nova etapa e mostra o status correto.

### 5. Preservar a regra de saldo para PCFI negada

- Revisar as consultas de `dados.jsp` que calculam `QTD_PCFI` e pendências.
- Manter `STATUSPCFI = 'N'` no cálculo da quantidade já recebida.
- Ajustar somente filtros de prioridade e apresentação que não devem tratar uma
PCFI negada como ativa.

**Aceite:** após negar a qualidade, a OC não recupera a quantidade da PCFI e a
PCFI não pode receber prioridade nem avançar de etapa.

### 6. Criar a interface de captura por item na Quantidade

- Exibir o componente somente quando `state.etapa === 'QTDE'`.
- Adicionar seletor de arquivo com `accept="image/*"` e solicitação de câmera
traseira em dispositivos compatíveis.
- Mostrar prévia, nome do arquivo e ação para remover ou substituir a foto.
- Não exibir esse componente nas etapas de Qualidade e Fiscal.

**Aceite:** em tablet e smartphone a câmera pode ser usada; em desktop o
seletor de arquivos continua disponível.

### 7. Validar e preparar a imagem no cliente

- Aceitar apenas tipos de imagem permitidos.
- Definir tamanho máximo e, se necessário, reduzir a imagem antes do upload.
- Guardar a foto temporariamente no estado do item até o item PCFI existir.
- Exigir a foto apenas se a regra de negócio futura determinar obrigatoriedade.

**Aceite:** arquivos inválidos não seguem para upload e cada item mantém sua
própria foto temporária.

### 8. Vincular a foto como Anexo do Sistema

- Após salvar `AD_PCFI` e cada `AD_PCFIITE`, usar a chave do item (`NUPCFI` e
  `SEQUENCIA`) para realizar o upload e o vínculo do Anexo do Sistema.
- Enviar o marcador definido nos pontos pendentes para identificar a foto PCFI.
- Tratar falha de upload sem repetir a criação de cabeçalho e itens.

**Aceite:** o Anexo aparece na entidade `AD_PCFIITE` do item correspondente e
possui o marcador da foto PCFI.

### 9. Mapear tecnicamente o AnexoSistema em `TSIANX`

- Usar `NOMEINSTANCIA = 'AD_PCFIITE'` e `PKREGISTRO` para identificar o item
alvo do anexo.
- Usar a convenção confirmada
  `PKREGISTRO = NUPCFI + '_' + SEQUENCIA + '_AD_PCFIITE'` no HTML5 e no
  evento. Exemplo: o item `NUPCFI = 3` e `SEQUENCIA = 1` usa
  `3_1_AD_PCFIITE`.
- Obter `FREPBASEFOLDER` pela entidade `ParametroSistema` e ler o arquivo no
  caminho `Sistema/Anexos/AD_PCFIITE/<CHAVEARQUIVO>`.
- Registrar qual evento de persistência ocorre somente depois de o AnexoSistema
ser vinculado a `AD_PCFIITE`.
- Definir a regra de substituição da imagem: usar o último anexo marcado como
foto PCFI.

**Aceite:** existe uma consulta de homologação que localiza o anexo e o item
alvo sem ambiguidades.

### 10. Implementar e cadastrar o evento Java

- Criar uma classe que implemente
  `br.com.sankhya.extensions.eventoprogramavel.EventoProgramavelJava`.
- Registrar o evento na entidade `AnexoSistema` (`TSIANX`).
- No evento posterior ao vínculo, validar entidade `AD_PCFIITE`, marcador e
tipo de arquivo antes de processar.
- Ler o binário do Anexo e atualizar `AD_PCFIITE.IMAGEM` via JAPE pela chave
composta `NUPCFI` e `SEQUENCIA`.
- Não abrir nem confirmar uma transação manualmente dentro do evento.

**Aceite:** anexar ou substituir uma foto PCFI atualiza somente a imagem do item
correto, sem afetar anexos de outras entidades.

### 11. Exibir a imagem no grid de itens

- Validar que o campo `IMAGEM`, com apresentação **Imagem**, é renderizado no
grid do Construtor de Telas de `AD_PCFIITE`.
- Ajustar tamanho, miniatura e permissões de visualização na tela, se
necessário.

**Aceite:** a foto gravada pelo evento aparece no grid do item e é a mesma foto
vinculada ao Anexo do Sistema.

### 12. Homologar o fluxo completo

- Testar Quantidade com e sem foto.
- Testar foto em dois itens diferentes na mesma PCFI.
- Testar substituição da foto de um item.
- Testar Qualidade Aprovado, Ressalva e Negado.
- Testar Fiscal pendente após Aprovado e Ressalva.
- Testar que Negado mantém o saldo abatido e não libera Fiscal.
- Testar permissões de câmera, upload e visualização de imagem.

**Aceite:** todos os cenários passam em navegador desktop, tablet e smartphone.

## Feature registrada — sincronização assíncrona da imagem

O evento não bloqueia a persistência quando o arquivo ainda não foi materializado
no repositório. Após o retorno de `AnexoSistemaSP.salvar`, o HTML5 atualiza a
descrição do próprio `AnexoSistema` via `CRUDServiceProvider.saveRecord` para
disparar novamente o evento `Após Alterar` e preencher `AD_PCFIITE.IMAGEM`.

### Arquitetura vigente

O HTML5 apenas envia o anexo; `AcoesAgendadas.PCFI.SincronizaImagemPcfiAgendada`
procura anexos PCFI pendentes em lotes e preenche o BLOB quando o arquivo estiver
disponível. A ação substitui a dependência do evento de `TSIANX`.
