# ADR-001 — Fachada transacional para a Apuração de Faturas

**Status:** Aceito  
**Data:** 2026-09-21  
**Escopo:** `facilita/apuracao-faturas`

## Contexto

A tela legada falha no navegador ao chamar `GridConfig.getSelectedColumns`, embora a chamada de carregamento da configuração da grade retorne HTTP 200. O fonte em `C:\projetos\facilitatelecoment` é uma referência funcional, mas não há evidência de que corresponda ao artefato instalado no cliente; portanto, ele não será buildado, copiado ou publicado.

O levantamento encontrou operações além da consulta: edição de `DTVENC` e `VALOR`, anexos, confirmação, nova auditoria e abertura de tarefa. No legado, essas operações dependem de `ApuracaoSP`, `AnexoSistemaSP` e `BHAnexoServiceSP` (`Apuracao.js:287-297`, `Apuracao.js:460-478`; `commons/service.js:190-205`). Os contratos e o comportamento exato dessas dependências não estão comprovados para a versão do cliente.

O solicitante confirmou que a nova tela pode ter layout diferente, desde que preserve as funcionalidades. A validação será manual no Sankhya Om, sem gates automatizados neste projeto.

## Decisão

Adotar uma migração incremental (Strangler Fig) com duas fronteiras:

1. O gadget HTML5 deste repositório permanece responsável pela consulta, filtros, lista, detalhe não sensível, preferências locais e exportação.
2. Um novo pacote de backend da Facilita, fora do checkout legado e a ser definido no T17, fornecerá a fachada transacional lógica `ApuracaoDashboardSP`. Essa fachada será a única fronteira para edição, confirmação, nova auditoria, anexos e workflow. Ela deve validar autorização, estado, concorrência, idempotência e retornar erros estruturados.

O gadget não chamará diretamente os serviços legados para gravar dados. Enquanto a fachada não estiver disponível, as ações transacionais permanecerão bloqueadas ou serão encaminhadas para uma tela nativa somente quando o contrato e o identificador tiverem sido homologados.

## Alternativas consideradas

| Alternativa | Motivo da decisão |
| --- | --- |
| Corrigir e republicar a tela Angular legada | Rejeitada: exigiria confiar num fonte não comprovado e manteria a dependência de `GridConfig`. |
| Gadget somente leitura | Aceita como etapa intermediária, mas não entrega a paridade funcional solicitada. |
| Gadget chamando diretamente `ApuracaoSP`/serviços de anexo | Rejeitada: contratos, versão, autorização e tratamento de falha não estão comprovados. |
| Tela HTML5 customizada completa | Mantida como plano B se o mecanismo de gadget não suportar alguma interação, mas aumenta o custo de UI. |

## Consequências

### Positivas

- Isola a recuperação da consulta da API de grade que falhou.
- Mantém regras de escrita fora do JSP/JavaScript e permite auditoria por operação.
- Permite liberar a leitura e homologar a fachada em etapas, sem deploy do legado.
- Torna explícitos os contratos que hoje são apenas inferidos do fonte.

### Negativas e compromissos

- Será necessário publicar o Add-on de backend em separado do pacote HTML5.
- T12/T14 dependem do contrato e da homologação dos comandos principais;
  anexos/workflow (T11/T13) têm dependência e gate próprios.
- Haverá uma janela em que o gadget oferece consulta, mas as ações de escrita ainda não estão habilitadas.
- A reversão inicial será retirar o gadget e reabrir a tela nativa; não haverá rollback por recompilação do legado.

## Critérios de revisão

Reavaliar esta decisão se a homologação provar que o gadget não consegue abrir anexos/tarefas com segurança ou se a versão do Om não permitir o endpoint da fachada. Nesse caso, migrar as interações inviáveis para a tela HTML5 customizada prevista como plano B.

## Adendo — recuperação read-first (2026-09-23)

O solicitante confirmou o faseamento para recuperar a tela sem deslocar regras
de negócio para o navegador:

1. O gadget substitui a experiência quebrada e mantém a apresentação, filtros
   e estado visual.
2. Lista e detalhe podem continuar temporariamente em JSP server-side, somente
   leitura, depois de comprovar parâmetros vinculados ou validados, projeção
   allowlisted e autorização sob a sessão do Om. Se qualquer controle não
   puder ser comprovado, a leitura passa para o Provider.
3. A interface pequena do `ApuracaoDashboardSP` é a seam de toda mutação. O
   backend concentra regras, autorização do usuário corrente, transação e
   releitura; o JavaScript não grava diretamente em `BH_FACAPU`.
4. Edição, confirmação e nova auditoria são habilitadas em fatias verticais.
   Anexos e workflow continuam no escopo funcional, mas só bloqueiam o MVP se
   o responsável pelo aceite confirmar que são indispensáveis para concluir
   uma aprovação.

Este adendo esclarece a sequência de entrega; não revoga a decisão original de
manter as mutações atrás da fachada transacional.
