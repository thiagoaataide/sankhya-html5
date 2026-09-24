# Memória — Apuração de Faturas

## Contexto permanente

- A tela legada apresenta `GridConfig.getSelectedColumns is not a function` no fim do carregamento da grade.
- O checkout `C:\projetos\facilitatelecoment` é referência de comportamento, não fonte publicável. Não fazer build, cópia ou deploy dele.
- O artefato novo vive em `facilita/apuracao-faturas/` neste projeto HTML5.
- Layout diferente é aceito; o requisito é paridade funcional e respeito à autorização.
- A validação do solicitante é manual no Sankhya Om. Não criar gates automatizados ou assumir que o HTML5 será submetido ao build do legado.

## Decisões registradas

1. A consulta permanece no gadget HTML5 e não usa Angular, `sk-datagrid` ou `GridConfig`.
2. Operações de escrita serão expostas por uma nova fachada transacional (`ApuracaoDashboardSP`, nome lógico), em pacote de backend separado do legado.
3. O gadget não chama diretamente `ApuracaoSP`, `AnexoSistemaSP` ou `BHAnexoServiceSP` para mutações.
4. A entrega seguirá fatias verticais: leitura segura e estável primeiro; depois comandos de escrita pelo Provider; anexos e workflow ficam em fase separada, salvo se o aceite os tornar pré-requisitos.
5. Senhas não fazem parte do detalhe. CPF/CNPJ, login e e-mail aguardam matriz de exposição por perfil.
6. A consulta temporária em JSP é somente leitura e só pode ser usada após comprovar parâmetros vinculados ou validados, projeção allowlisted e autorização do usuário. JavaScript não grava diretamente em `BH_FACAPU`.

## Estado atual

- Consulta, filtros, seleção, detalhe não sensível, preferências de colunas e exportação já estão implementados no gadget.
- Detalhe de anexos, abertura de tarefa, edição, upload, confirmação e nova auditoria agora têm adaptadores no gadget; a execução real continua dependente da publicação da fachada e da homologação do contrato.
- A decisão completa está em [`ADR-001-fachada-transacional-dashboard.md`](adr/ADR-001-fachada-transacional-dashboard.md).
- O contrato inicial, com campos ainda pendentes de homologação, está em [`contracts.md`](contracts.md).

## Próximo passo ativo

**T22 — Homologar o caminho de consulta independente da fachada.** Validar
lista, filtros e detalhe no Om, incluindo parâmetros e autorização. Se a JSP
não comprovar esses controles, mover a leitura para uma consulta autorizada no
Provider. Em seguida, recortar T17 para edição, confirmação e nova auditoria;
não esperar anexos/workflow para recuperar a tela. Executar T23 antes do pacote
para registrar se esses recursos são requisito do aceite.

## Riscos a não esquecer

- A versão do Om e o artefato instalado podem não corresponder ao fonte de referência.
- Atualizações concorrentes e falhas parciais em anexos podem deixar a linha inconsistente se a fachada não for atômica.
- Consultas diretas no gadget devem continuar limitadas a colunas e filtros autorizados.
