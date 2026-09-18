# Feature: Diagnóstico Devolução Intercompany (HTML5)

## Objetivo

Dashboard Sankhya HTML5 para explicar por que produtos nas empresas devolvedoras (2 e 7) não entram ou entram parcialmente na devolução intercompany, com drill-down em notas intercompany e demais entradas.

## User Stories

### P1 — Grid principal com motivos
- **US-01**: WHEN o usuário abre o dashboard com empresas 2/7 THEN o sistema SHALL listar produtos com estoque, reservado e disponível nos locais configurados.
- **US-02**: WHEN um produto tem saldo físico mas saldo vinculável intercompany zero THEN o sistema SHALL exibir motivo classificado (ex.: sem vínculo, exclusivo fornecedor, parcial).

### P1 — Drill-down por produto
- **US-03**: WHEN o usuário seleciona um produto THEN o sistema SHALL mostrar notas de compra intercompany com saldo vinculável (TGFITS se rastreável; item se não).
- **US-04**: WHEN o usuário seleciona um produto THEN o sistema SHALL mostrar entradas não intercompany com saldo explicável.

### P2 — Filtros
- **US-05**: WHEN o usuário informa código de produto no prompt THEN o sistema SHALL restringir todas as consultas a esse produto.

## Acceptance Criteria

- WHEN `CODEMP` ? {2, 7} AND há estoque nos locais `LOCAISVALEST` THEN grid SHALL exibir `ESTOQUE`, `RESERVADO`, `DISPONIVEL`, `DISP_PP`, `DIF_SEM_VINCULO`, `RASTREAVEL`, `MOTIVO_COD`, `MOTIVO_TXT`.
- WHEN produto `RASTREAVEL = S` THEN `DISP_PP` SHALL usar regra do addon (menor entre saldo item intercompany e TGFITS na empresa/local).
- WHEN produto `RASTREAVEL = N` THEN `DISP_PP` SHALL usar `QTDNEG - QTDENTREGUE - QTDCONFERIDA` em NFs intercompany elegíveis.
- WHEN linha intercompany tem `SALDO_VINCULAVEL > 0` THEN UI SHALL destacar visualmente a linha.

## Assumptions

- Parâmetros globais `TSIPAR` (CODMODNFENTFIL, CODMODNFDEVINTC, LOCAISVALEST) aplicam-se às empresas 2 e 7.
- Empresas devolvedoras fixas no gadget: multilist com default 2 e 7.
- Local de rastreio padrão 10200 quando `LOCAISVALEST` vazio.

## Out of Scope

- Execução da devolução intercompany pelo dashboard.
- Alteração de parâmetros TSIPAR.
