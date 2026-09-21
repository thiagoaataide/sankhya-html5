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
4. A migração seguirá etapas: leitura estável → contrato da fachada → fachada homologada → integração de ações → UAT e pacote.
5. Senhas não fazem parte do detalhe. CPF/CNPJ, login e e-mail aguardam matriz de exposição por perfil.

## Estado atual

- Consulta, filtros, seleção, detalhe não sensível, preferências de colunas e exportação já estão implementados no gadget.
- Detalhe de anexos, abertura de tarefa, edição, upload, confirmação e nova auditoria agora têm adaptadores no gadget; a execução real continua dependente da publicação da fachada e da homologação do contrato.
- A decisão completa está em [`ADR-001-fachada-transacional-dashboard.md`](adr/ADR-001-fachada-transacional-dashboard.md).
- O contrato inicial, com campos ainda pendentes de homologação, está em [`contracts.md`](contracts.md).

## Próximo passo ativo

**T17 — Consolidar o contrato da fachada transacional.** O contrato inicial e a evidência de dados já foram registrados; falta capturar/aprovar requests, respostas e permissões no Om do cliente antes de publicar o backend T18.

## Riscos a não esquecer

- A versão do Om e o artefato instalado podem não corresponder ao fonte de referência.
- Atualizações concorrentes e falhas parciais em anexos podem deixar a linha inconsistente se a fachada não for atômica.
- Consultas diretas no gadget devem continuar limitadas a colunas e filtros autorizados.
