# Memory — Diagnóstico Devolução Intercompany

Registro de decisões da spec e da implementação (addon GET Intercompany + dashboard HTML5). Atualizar quando mudar regra de negócio ou contrato do gadget.

## Contexto

- **Problema:** produtos nas filiais devolvedoras (empresas **2** e **7**) aparecem com estoque físico mas não entram (ou entram parcialmente) na carga da **devolução intercompany**.
- **Referência de verdade:** lógica do addon Java em `GET_intercompany` (`IntercompanyDevolucao`, vínculo com `GET_TGFITCNFENT`, `TGFITS`, parâmetros `TSIPAR`).
- **Entrega:** dashboard **somente leitura** para diagnóstico e drill-down — não executa devolução nem altera parâmetros.

## Decisões de produto / escopo

| Decisão | Detalhe |
|--------|---------|
| Empresas alvo | **2** e **7** como devolvedoras; gadget multilist com lista SQL restrita a essas empresas; default **2,7** se prompt vazio. |
| Fora de escopo | Gerar/aprovar devolução; editar `TSIPAR`; reconciliação contábil completa. |
| UX principal | Grid com **motivo** legível (`MOTIVO_COD` + `MOTIVO_TXT`); seleção de linha abre dois painéis (intercompany vs outras entradas). |
| Destaque visual | Linhas de nota intercompany com `SALDO_VINCULAVEL > 0` em verde (alinhado ao que o addon considera vinculável). |

## Parâmetros Sankhya (`TSIPAR` / addon)

| Chave | Uso no dashboard |
|-------|------------------|
| `CODMODNFENTFIL` | Modelo de NF **entrada filial** — TOP da compra intercompany elegível (`cab_mod_ent.CODTIPOPER = cab.CODTIPOPER`). |
| `CODMODNFDEVINTC` | Modelo de NF **devolução** — usado em `Get_Tem_Rastreamento_Itens` (mesmo contexto do addon). |
| `LOCAISVALEST` | Lista CSV de `CODLOCAL` para estoque físico e filtro de rastreio; se vazio, **default `10200`**. |

Assumimos que esses parâmetros valem para o cenário das empresas 2/7 (não há override por empresa no HTML5).

## Regras de estoque e vínculo (espelho do addon)

### Estoque físico (`estoque` CTE)

- Fonte: `TGFEST` nos locais de `LOCAISVALEST` (parse CSV).
- Filtro empresa: lista do prompt **`P_CODEMP`**.
- Agrupa por `CODEMP`, `TRUNC(CODPROD)`, `NVL(CONTROLE,' ')`.
- Exibe apenas linhas com `DISPONIVEL = ESTOQUE - RESERVADO > 0`.

### Exclusão por fornecedor

- Se existir `TGFPRO` com `CODPARCFORN` cujo parceiro tem `TGFPAR.CODEMPPREF = CODEMP` do estoque ? **`EXCL_FORN = S`** ? motivo **`EXCL_FORN`** (mesma ideia da carga da devolução).

### Rastreável (`rastreio`)

- Função `Get_Tem_Rastreamento_Itens` com TOP/dados do modelo de **devolução** (`CODMODNFDEVINTC`).
- **`RASTREAVEL = S`:** cap de vínculo usa `LEAST(saldo item NF, saldo TGFITS)` com regras de `TGFRASTEMP` (tipo rastreio, controle, local em `locais`).
- **`RASTREAVEL = N`:** cap usa `QTDNEG - QTDENTREGUE - QTDCONFERIDA` em itens de NF intercompany elegíveis.

### NF intercompany elegível (`cap_vinculo`)

- Compra `TIPMOV = 'C'`, `STATUSNOTA = 'L'`, empresa do item = empresa do estoque.
- Vínculo intercompany: presença em **`GET_TGFITCNFENT`** na mesma `NUNOTA`.
- TOP de entrada filial alinhada ao parâmetro `CODMODNFENTFIL`.
- Saldo item aberto: `QTDNEG - QTDENTREGUE - QTDCONFERIDA > 0`.

### Classificação `MOTIVO_COD` (ordem de precedência)

1. `EXCL_FORN` — fornecedor com `CODEMPPREF`.
2. `SEM_VINC_INTERCO` — `DISP_PP <= 0` e `DISPONIVEL > 0`.
3. `PARCIAL_VINC` — `0 < DISP_PP < DISPONIVEL`.
4. `ELEGIVEL` — `DISP_PP >= DISPONIVEL` e `DISPONIVEL > 0`.
5. `OUTRO` — demais casos.

Métricas: **`DISP_PP`** = saldo vinculável intercompany; **`DIF_SEM_VINCULO`** = `DISPONIVEL - DISP_PP`.

## Drill-down (queries 2 e 3)

| Painel | Critério |
|--------|----------|
| Notas intercompany | `GET_TGFITCNFENT` + mesma TOP entrada filial; saldo vinculável conforme rastreio (item vs `TGFITS`). |
| Outras entradas | Compras liberadas com saldo em item, **sem** vínculo intercompany (ou TOP diferente da entrada filial). |

Filtro opcional de produto aplica-se às três consultas.

## Decisões técnicas SQL (Oracle)

- **`TRUNC(CODPROD)`** em joins produto/estoque para evitar mismatch numérico.
- Alias reservado: não usar `mod` — usar **`cab_mod`** / **`cab_mod_ent`** (evita ORA-00928).
- Subconsultas correlacionadas pesadas com outer join: preferir **CTEs** (evita ORA-01799).
- Parâmetros de negócio (`NUNOTA` dos modelos, locais) vêm de CTE **`params`**, não hardcoded na UI.

## Decisões HTML5 / gadget

| Item | Decisão |
|------|---------|
| Pasta canônica | `C:\projetos\html5\intercompany\` (`intercompany_devolucao.jsp`, `dados.jsp`, `javascript/`, `css/`, `tdb_dashboard.xml`, `erro.jsp`). |
| Spec | `html5\.specs\features\intercompany-devolucao-diagnostico\spec.md`. |
| DataSource | `MGEDS` (padrão Sankhya Oracle do ambiente). |
| Gadget | `tdb_dashboard.xml` — **obrigatório** abrir pelo menu do gadget para rodar prompts. |
| Prompts | **`P_CODEMP`** — `multiList` SQL, obrigatório, empresas 2 e 7. **`P_CODPROD`** — inteiro, opcional. |
| Binding SQL | Usar substituição Sankhya **`${P_CODEMP}`** / **`${P_CODPROD}`** (não `:P_CODEMP` em `IN (...)` — bind nulo gerava erro “`: null`” no load). |
| Fallback sem prompt | Empresas **`2,7`**; produto vazio = sem filtro de produto. |
| Export | Excel via script do grid principal (convenção dos outros dashboards HTML5 do projeto). |

## Caso de referência (validação manual)

- **Produto 40018** (empresa 2): `DISPONIVEL` positivo, **`DISP_PP = 0`** — estoque físico em local configurado sem saldo `TGFITS` explicável pela cadeia intercompany (entradas com rastreio esgotado / outras origens). Dashboard deve mostrar **`SEM_VINC_INTERCO`** ou **`PARCIAL_VINC`**, não “elegível”.

## Pendências / não decidido implementar

- Terceiro quadrante **`TGFVAS`** (FIFO entrada/saída) — discutido, não entrou no MVP.
- Pasta duplicada `html5\sankhya\intercompany_devolucao\` — pode remover após confirmar deploy só em `intercompany/`.
- Corrigir encoding ISO/UTF-8 nos labels de `tdb_dashboard.xml` (mojibake em “devolução”, “código”).
- `metadata.xml` em `intercompany/` é mínimo; registro formal do gadget no ambiente segue processo Sankhya do cliente.

## Manutenção

- Qualquer mudança em `IntercompanyDevolucao` / queries de vínculo no addon **deve** ser refletida nas CTEs de `dados.jsp` e revisada neste `memory.md`.
- Novas empresas devolvedoras: alterar SQL do multilist no gadget **e** o fallback `'2,7'` se ainda fizer sentido como default.
