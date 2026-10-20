# A11 — Modal “Dados anexo” (metadados TSIANX)

**Feature:** [facilita-apuracao-faturas-ajustes](spec.md)  
**Pedido em:** 2026-10-19  
**Tasks:** A11 → A12 → A13 → A14 em [tasks.md](tasks.md)

## Objetivo

Oferecer no painel lateral, ao lado de **Ver anexo**, o botão **Dados anexo**, que abre um **modal** somente leitura com os metadados dos registros em `TSIANX` (`AnexoSistema`) da apuração selecionada — paridade com a grade do modal **Anexos** na tela legada, **sem** aumentar altura do aside nem duplicar upload/download.

**Ver anexo** permanece: nova aba em `/facilitatelecom/visualizadorArquivos.facilita?nuApuracao={NUAPURACAO}`.

## Fonte de dados

| Item | Valor |
| --- | --- |
| Entidade | `AnexoSistema` |
| Tabela | `TSIANX` |
| Instância | `bhApuracao` → `NOMEINSTANCIA = 'bhApuracao'` |
| Chave do registro | `PKREGISTRO = TO_CHAR(NUAPURACAO) \|\| '_bhApuracao'` |
| Ordenação | `DHCAD DESC` (mais recente primeiro; alinhado ao legado e ao visualizador) |
| Usuários | `TSIUSU` em `CODUSU` (inclusão) e `CODUSUALT` (alteração) |

### Colunas projetadas (modal)

| Coluna no modal | Origem SQL | Notas |
| --- | --- | --- |
| Tipo | `BH_TIPO` | Código FO, 2V, FA, … |
| Descrição | `DESCRICAO` | |
| Arquivo | `NOMEARQUIVO` | Texto longo; truncar visual com `title` completo |
| Usuário inclusão | `CODUSU` + `UINC.NOMEUSU` | Ex.: `91 — MARIANE FILGUEIRAS` |
| Criado em | `DHCAD` | `TO_CHAR(..., 'DD/MM/YYYY HH24:MI')` |
| Modificado em | `DHALTER` | Idem |
| Usuário alteração | `CODUSUALT` + `UALT.NOMEUSU` | |
| Visível | `TIPOAPRES` | Na UAT, comparar rótulo legado (“Qualquer tela”); exibir código se não houver mapa |
| Acesso | `TIPOACESSO` | Idem |

**Fora do escopo:** `CHAVEARQUIVO`, conteúdo binário, senhas, CRUD de anexo, exclusão, download pelo modal.

## Arquitetura

```text
[btn-dados-anexo]  →  fetch(anexos_payload.jsp?nuapuracao=N)
                           ↓
                      snk:query TSIANX + TSIUSU
                           ↓
                      HTML: #anexos-container .anexo-row[data-*]
                           ↓
                      script.js: parse DOM → render <table> no modal
```

- Leitura **só via JSP** (`snk:query`), mesma sessão/cookie do gadget — sem `service.sbr` no fluxo principal.
- Parâmetro `nuapuracao`: validar `^[0-9]+$` no JSP (padrão `detalhe_payload.jsp`); chave inválida → container vazio + `data-valid-key="N"`.

## Artefatos

| Artefato | Ação |
| --- | --- |
| `facilita/apuracao-faturas/anexos_payload.jsp` | **Novo** — consulta + linhas `.anexo-row` |
| `facilita/apuracao-faturas/tdb_partida.jsp` | Botão `#btn-attachment-metadata`; markup `#attachment-metadata-dialog` |
| `facilita/apuracao-faturas/css/style.css` | Variante `.notice-dialog--wide`, área `.attachment-metadata__table-wrap` com scroll interno |
| `facilita/apuracao-faturas/javascript/script.js` | `openAttachmentMetadataDialog`, fetch, render, fechar (Escape + backdrop opcional) |
| `memory.md` | Seção “Dados anexo (modal)” |
| `t22-uat-checklist.md` | Itens H.5+ (smoke metadados) |

## UI — painel lateral

```text
detail-actions
  [ Confirmar / Solicitar nova auditoria ]  (full width)
  detail-actions__secondary (flex, gap 6px, 3 botões flex:1)
    [ Abrir tarefa ] [ Ver anexo ] [ Dados anexo ]
```

- **Dados anexo** habilitado quando `detail.possuiAnexo === 'S'` (mesma regra que Ver anexo).
- Texto do botão: “Dados anexo” (curto para caber na linha de três).

## UI — modal

- Classe base: reutilizar `.notice-dialog` / `.notice-dialog__panel`.
- Modificador: `.notice-dialog--wide` (`width: min(960px, 100%)`).
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="attachment-metadata-title"`.
- Cabeçalho: título “Dados do anexo” + subtítulo opcional “Apuração {NUAPURACAO}”.
- Corpo: `<table>` semântico (`<thead>` + `<tbody>`) ou `<div role="table">` se preferir consistência com grade — preferir `<table>` para leitura densa.
- Estados:
  - **Carregando:** texto “Carregando…” no corpo.
  - **Vazio:** “Nenhum anexo encontrado para esta apuração.” (flag `POSSUIANEXO=S` inconsistente).
  - **Erro:** mensagem + código `FA-ANX` no rodapé (padrão detalhe).
- Rodapé: botão **Fechar** (foco inicial ao abrir após render).
- **Escape** fecha; clique no backdrop fecha (igual expectativa de modal).
- Não incluir senha nem link de download na tabela.

## JavaScript (contrato)

```javascript
// URL
var base = window.FACILITA_APURACAO_BASE || "";
var url = base + "/anexos_payload.jsp?nuapuracao=" + encodeURIComponent(nuapuracao);

// Parser: querySelectorAll(".anexo-row") → array de objetos
// Campos data-* espelham colunas SQL (kebab-case no DOM)

// Integração setActionBusy: incluir btn-attachment-metadata na lista de botões desabilitados durante ações
```

Sequência de request: incrementar contador (padrão `detailRequestSequence`) para cancelar render se o usuário trocar de linha durante o fetch.

## SQL de referência (Oracle)

```sql
SELECT TO_CHAR(ANX.NUATTACH) AS NUATTACH,
       ANX.BH_TIPO,
       ANX.DESCRICAO,
       ANX.NOMEARQUIVO,
       TO_CHAR(ANX.CODUSU) AS CODUSU,
       UINC.NOMEUSU AS NOMEUSUINC,
       TO_CHAR(ANX.DHCAD, 'DD/MM/YYYY HH24:MI') AS DHCAD,
       TO_CHAR(ANX.DHALTER, 'DD/MM/YYYY HH24:MI') AS DHALTER,
       TO_CHAR(ANX.CODUSUALT) AS CODUSUALT,
       UALT.NOMEUSU AS NOMEUSUALT,
       ANX.TIPOAPRES,
       ANX.TIPOACESSO
  FROM TSIANX ANX
  LEFT JOIN TSIUSU UINC ON UINC.CODUSU = ANX.CODUSU
  LEFT JOIN TSIUSU UALT ON UALT.CODUSU = ANX.CODUSUALT
 WHERE ANX.NOMEINSTANCIA = 'bhApuracao'
   AND ANX.PKREGISTRO = TO_CHAR(:nuapuracao) || '_bhApuracao'
 ORDER BY ANX.DHCAD DESC
```

`:nuapuracao` substituído no JSP após validação (não concatenar input cru sem whitelist numérica).

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| `TIPOAPRES` / `TIPOACESSO` só com código | UAT com legado; mapa opcional em JS se padrão for estável |
| Múltiplos anexos | Tabela com N linhas; scroll só no corpo do modal |
| Sessão expirada | HTML de login na resposta → mensagem de integração |
| LGPD / perfil | Metadados já visíveis no legado; não expor `CHAVEARQUIVO` |

## Critério de aceite (UAT)

1. Apuração com anexo: **Dados anexo** habilitado; modal lista pelo menos tipo, descrição, arquivo, usuário/datas alinhados ao legado.
2. Apuração sem anexo: botão desabilitado.
3. Apuração com 2+ anexos na mesma PK: todas as linhas aparecem, ordem por data de criação decrescente.
4. Aside não ganha bloco fixo novo; scroll vertical do painel inalterado em relação ao baseline A7.

## Gates

- `node --check facilita/apuracao-faturas/javascript/script.js`
- Revisão `web-design-guidelines` em JSP/CSS/JS ao fechar A13/A14
