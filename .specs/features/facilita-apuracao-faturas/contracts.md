# Contrato inicial — Fachada de Apuração de Faturas

**Estado:** desenho iniciado pelo T17; nenhum endpoint de escrita está homologado.  
**Regra:** itens marcados como `PENDENTE` não podem ser inventados a partir do fonte legado; devem ser capturados no Sankhya Om de homologação.

**OpenAPI publicado:** `facilita/apuracao-faturas/api/openapi.yaml` expõe somente a consulta validada (gadget + `detalhe_payload.jsp`).
**Postman:** `facilita/apuracao-faturas/api/postman/` — pasta *Consulta validada* alinhada ao OpenAPI; pasta *Fachada* com exemplos do `script.js` até concluir T21.

## Fronteira

O gadget HTML5 chama uma fachada de backend do novo pacote da Facilita. A fachada executa sob a sessão do usuário Sankhya, aplica autorização e retorna um envelope estável para a UI. O nome lógico proposto é `ApuracaoDashboardSP`; o pacote Java e o mecanismo de registro ainda precisam ser definidos.

O adaptador já implementado no gadget usa o prefixo `facilitatelecom@ApuracaoDashboardSP`, envia `{ request: payload }` pelo serviço `mge/service.sbr` (ou `ServiceProxy.callService` quando disponível) e utiliza `sessionUpload.mge` apenas para armazenar temporariamente o arquivo antes de chamar `anexar`. Isso é um contrato de integração do cliente; não comprova que o serviço exista até o T18 ser publicado.

## Faseamento da leitura e escrita

- `dados.jsp` e `detalhe_payload.jsp` podem atender temporariamente a lista e
  o detalhe em modo somente leitura. Antes de liberar o gadget, T22 comprova
  parâmetros vinculados ou validados, projeção allowlisted e autorização do
  usuário no Om.
- Se a consulta JSP não passar qualquer um desses controles, lista/detalhe
  devem ser movidos para uma operação de leitura autorizada do Provider. O
  JavaScript pode cuidar de estado visual e filtros sobre linhas autorizadas;
  não decide o escopo de acesso aos dados.
- `atualizar`, `confirmar` e `solicitarNovaAuditoria` são comandos do
  Provider, habilitados individualmente após homologação. Nenhum código do
  gadget grava diretamente em `BH_FACAPU`.
- Anexos e workflow ficam fora da primeira fatia. T23 registra se são
  indispensáveis para o aceite; se forem, T11/T13 e as integrações de Add-on
  correspondentes voltam ao gate do MVP.

## Envelope de resposta

```json
{
  "ok": true,
  "correlationId": "string",
  "data": {},
  "error": null
}
```

Em falha:

```json
{
  "ok": false,
  "correlationId": "string",
  "data": null,
  "error": {
    "code": "BUSINESS_RULE|FORBIDDEN|CONFLICT|VALIDATION|INTEGRATION|INTERNAL",
    "message": "mensagem segura para o usuário",
    "field": "opcional"
  }
}
```

O backend não deve retornar SQL, stack trace, sessão, senha ou segredo no envelope.

## Operações

| Operação lógica | Entrada mínima | Sucesso esperado | Publicado no OpenAPI | Pendente de homologação |
| --- | --- | --- | --- | --- |
| `listar` (gadget / `dados.jsp`) | `P_REFERENCIA`, `P_SOMENTE_PENDENTES`, `P_POSSUI_ANEXO` | linhas no HTML `data-row` | Sim (`carregarGadgetLista`) | paginação máxima, campos, ordenação e contrato de autorização |
| `listarDetalhe` (`detalhe_payload.jsp`) | `nuapuracao` | detalhe não sensível da linha | Sim (`obterDetalheApuracao`) | campos por perfil e versão de leitura |
| `atualizar` | `NUAPURACAO`, `DTVENC` e/ou `VALOR`, versão/estado observado | linha atualizada após commit | Não (Postman rascunho) | endpoint/registro, regras de valor, formato de data e versão |
| `confirmar` | `NUAPURACAO`, versão/estado observado | estado confirmado e linha reconsultável | Não | regra exata de valor, idempotência e permissão |
| `solicitarNovaAuditoria` | `NUAPURACAO`, motivo opcional, versão | campos do processo reiniciados em uma transação | Não | permissão `BH_NOVAAUDIT`, motivo obrigatório e campos exatos |
| `anexar` | `NUAPURACAO`, arquivo único, tipo | anexo associado e metadados retornados | Não | limite, MIME, antivírus, tipo e compensação |
| `listarAnexos` | `NUAPURACAO` | somente anexos autorizados | Não | visualizador, paginação e URL/identificador |
| `getTarefa` | `NUAPURACAO` ou `IDINSTPRN` | identificador da tarefa pendente | Não | campo definitivo e API de abertura |

## Regras transversais

- Toda mutação valida autorização e reconsulta o estado antes de gravar.
- A versão/estado observado deve impedir sobrescrever alteração concorrente; conflito retorna `CONFLICT`.
- Confirmação, nova auditoria e associação do anexo só respondem sucesso depois do commit ou de uma compensação comprovada.
- Repetição com a mesma chave de idempotência não pode duplicar confirmação ou anexo.
- Toda operação registra usuário, `NUAPURACAO`, operação, resultado e `correlationId`.
- A UI recarrega a linha a partir do servidor após sucesso; nunca infere o estado final.

## Evidências a capturar no T2

1. Request/response real de cada operação no Om do cliente.
2. Código de permissão e mensagens de recusa com usuário permitido e não permitido.
3. Identificador de versão/concorrência disponível na tabela ou no serviço.
4. Contrato de upload, associação, tipo de anexo e visualização.
5. Identificador correto para abrir a tarefa (`IDINSTPRN`, `IDINSTTAR` ou outro).
