# Sincronização agendada da imagem PCFI

## Objetivo

Processar de forma assíncrona os anexos de fotos dos itens PCFI, sem depender do
momento em que o evento de `TSIANX` é disparado e sem bloquear o salvamento da
PCFI.

## Decisões

- O HTML5 somente cria o Anexo do Sistema.
- A cópia para `AD_PCFIITE.IMAGEM` será feita por uma ação agendada Java.
- A ação usará `org.cuckoo.core.ScheduledAction` e `JapeWrapper`.
- O processamento será em lote, idempotente e tolerante a arquivo ainda ausente.
- A frequência será configurada no Sankhya; cinco segundos é o limite inicial
  desejado, sujeito à capacidade do ambiente.

## Acceptance Criteria

- **SCH-IMG-01:** quando houver anexo PCFI com arquivo disponível e o BLOB do
  item estiver nulo, a ação deve copiar os bytes para `AD_PCFIITE.IMAGEM`.
- **SCH-IMG-02:** quando o arquivo ainda não existir, a ação deve ignorar o
  registro sem lançar exceção e permitir nova tentativa futura.
- **SCH-IMG-03:** quando o BLOB já estiver preenchido, a ação não deve
  reprocessar o item.
- **SCH-IMG-04:** uma falha em um registro não deve interromper o lote dos
  demais registros.
- **SCH-IMG-05:** o HTML5 deve concluir o upload sem chamada adicional para
  reacionar o evento de `TSIANX`.

## Escopo fora da feature

- Não criar novo Service Provider.
- Não alterar o conteúdo nem o vínculo do Anexo do Sistema.
- Não remover automaticamente anexos antigos.
