# A16 — Preferências do usuário (`AD_APURACAOCONF` + cache local)

**Objetivo:** Mesma configuração da Apuração de Faturas em **qualquer navegador/PC** para o mesmo `CODUSU`, mantendo resposta rápida com `localStorage` como cache.

**Escopo:** gadget `facilita/apuracao-faturas` + instância **`AD_APURACAOCONF`** + **`CRUDServiceProvider.saveRecord`** (sem Java customizado no add-on).  
**Fora do escopo:** preferências de outros gadgets; tela de cadastro manual (só uso via dashboard).

---

## 1. Modelo cadastrado no Om (2026-10-19)

| Metadado | Valor |
|----------|--------|
| **Nome da tabela** | `AD_APURACAOCONF` |
| **Nome da instância** | `AD_APURACAOCONF` |
| **Descrição da instância** | Preferências Apuração HTML5 |
| **`rootEntity` (CRUD)** | `AD_APURACAOCONF` |

### Campos da instância

| Campo | Descrição | Tipo (dicionário) | Pesquisa | Grid pesquisa | Papel |
|-------|-----------|-------------------|----------|---------------|--------|
| `CODUSU` | Usuário | Número inteiro | S | S | **PK** — expressão usuário logado; na **update** só na `key` do `saveRecord` |
| `DHALTER` | Dh. Alteração | Data e Hora | N | N | **Expressão** data/hora atual; gadget **não envia** |
| `CONF` | Configuração | Texto longo (CLOB) | N | S | Conteúdo = **documento JSON** (UTF-8); único campo em `localFields` no save |

### Dicionário — regras no gadget

| Campo | No `saveRecord` |
|-------|------------------|
| `CODUSU` | Expressão no insert; no update: `key: { CODUSU: <CODUSU_LOG> }` — **não** em `localFields` |
| `CONF` | `localFields: { CONF: "<json string>" }` |
| `DHALTER` | Nunca no payload JS |

### Sugestões adicionais

1. **PK só `CODUSU`** — uma linha por usuário para este dashboard.
2. **FK opcional** `CODUSU → TSIUSU`.
3. **Validação de tamanho do JSON** no JS antes do `saveRecord` (ex. 128 KB); o CLOB aceita mais, mas evita abuso.
4. **`version` dentro do JSON** — sem coluna `VERSAO` na tabela no MVP.

---

## 2. Contrato do documento em `CONF` (CLOB)

Um único documento por usuário. Alinhado ao `buildUserPreferencesSnapshot()` atual:

```json
{
  "version": 1,
  "savedAt": "2026-10-19T13:45:00.000Z",
  "server": {
    "P_REFERENCIA": "2026-11-01",
    "P_SOMENTE_PENDENTES": "S",
    "P_POSSUI_ANEXO": "N"
  },
  "client": {
    "search": "",
    "field": "T",
    "page": 1,
    "columnFilters": { "numcontrato": "262" }
  },
  "grid": {
    "pageSize": 25,
    "columns": { "nuapuracao": true, "valor": true },
    "pinned": ["nuapuracao"],
    "order": ["nuapuracao", "numcontrato"],
    "sortKey": "numcontrato",
    "sortDirection": 1,
    "manualColumnSort": false
  }
}
```

| Campo | Regra |
|-------|--------|
| `version` | Inteiro; incrementar só se o formato mudar (migração no JS ao ler). |
| `savedAt` | ISO-8601 UTC; preenchido no **cliente** ao montar o snapshot; útil para cache e debug. |
| `server` | Últimos `P_*` **efetivos** (toolbar + sessão). Gravados quando o usuário **Aplica** ou quando a UI diverge do JSON ao sincronizar com o servidor. |
| `client` | Filtros locais da grade (não alteram SQL do `dados.jsp`). |
| `grid` | Colunas, ordem, pin, paginação, ordenação. |

**Validação no gadget (antes do save):** JSON parseável; `version === 1`; tamanho máximo acordado; não confiar em validação só no cliente para segurança entre usuários — o CRUD com `CODUSU` em expressão + `key` do usuário logado impede gravar linha de outro.

---

## 3. Estratégia localStorage + tabela

### Princípio

- **Fonte da verdade entre dispositivos:** `AD_APURACAOCONF`.
- **Cache no navegador:** mesma chave já usada hoje: `facilita-apuracao-faturas:user-prefs:v1:{CODUSU}` (conteúdo idêntico ao CLOB).

### Fluxo ao abrir o gadget

```mermaid
sequenceDiagram
    participant U as Usuário
    participant G as Gadget JS
    participant L as localStorage
    participant Q as Leitura (snk:query ou executeQuery)
    participant C as CRUD saveRecord
    participant T as AD_APURACAOCONF

    U->>G: Abre dashboard
    G->>L: Lê cache (se houver)
    G->>Q: SELECT CONF, DHALTER WHERE CODUSU = logado
    Q->>T: consulta
    T-->>G: 0 ou 1 linha
    alt linha no banco
        G->>G: Aplica JSON do servidor
        G->>L: Atualiza cache
    else sem linha, cache local existe
        G->>C: saveRecord sem key (insert)
        C->>T: INSERT (CODUSU/DHALTER por expressão)
    else sem linha e sem cache
        G->>G: Padrão do gadget + defaults P_*
    end
    G->>G: Aplica grid/client do JSON; server só se sessão sem P_*
    G->>G: Se JSON.server ≠ toolbar, **toolbar prevalece** e JSON é regravado
```

### Precedência dos filtros servidor (`P_*`)

1. **Toolbar / controles na tela** (e `sessionStorage` da consulta na sessão atual) são a fonte da verdade **enquanto o gadget está aberto**.
2. O bloco `server` do JSON/`CONF` **não sobrescreve** checkboxes, mês ou anexo já exibidos na UI.
3. Ao carregar prefs do servidor (`applyRemotePreferencesFromServer`), aplicam-se **`grid`** e **`client`**; se `server` remoto ≠ valores lidos da toolbar (`readAuthoritativeServerFilters`), marca dirty e **`saveRecord`** com snapshot atualizado (UI → JSON).
4. JSON/`localStorage` com `server` só **semeia** a sessão quando **não** há `P_*` ativos (`seedServerFilterSessionFromPrefsIfEmpty`).
5. **Aplicar** grava `server` no snapshot, atualiza sessão/URL e recarrega a grade via `dados.jsp` (sem reload da moldura).

### Fluxo ao alterar / sair

| Evento | Ação |
|--------|------|
| Mudança coluna, ordenação, busca local, filtro de cabeçalho | `saveUserPreferences()` → **local imediato** + **debounce ~1,5 s** → `saveRecord` |
| **Aplicar** parâmetros servidor | snapshot com `server` da toolbar + `refreshGridFromServer` + debounce/flush `saveRecord` |
| `pagehide` / aba oculta | flush pendente (cancelar debounce e enviar) |
| Falha de rede no save | manter local; tentar de novo no próximo evento ou na próxima abertura |

### Conflito entre máquinas

**V1 — última escrita vence** (`DHALTER` no servidor). Não há merge por campo. Documentar para o usuário: duas sessões abertas ao mesmo tempo — a que salvar por último prevalece.

*(V2 opcional: comparar `savedAt` e pedir confirmação — não previsto no MVP.)*

---

## 4. Persistência — `CRUDServiceProvider.saveRecord`

Referência no repo: `link/javascript/script.js` (`apiSave` / `window.saveRecords`) e `SKILL.md` (método `JX.salvar`).

### 4.1 Leitura (existe linha?)

Uma das opções (escolher uma na implementação A19):

| Opção | Uso |
|-------|-----|
| **A** | `prefs_payload.jsp` + `snk:query`: `SELECT CONF, DHALTER FROM AD_APURACAOCONF WHERE CODUSU = …` (usuário logado) — embutido no `tdb_partida.jsp` |
| **B** | `executeQuery` / `DbExplorerSP` só leitura no `script.js` (mesmo filtro por usuário logado) |

Flag em memória: `prefsRowExists` (true se retornou 1 linha).

### 4.2 Gravação (upsert)

```text
se prefsRowExists === false:
  saveRecord(localFields: { CONF }, rootEntity: AD_APURACAOCONF, key: omitido)
  → INSERT; CODUSU e DHALTER pelas expressões do dicionário

se prefsRowExists === true:
  saveRecord(localFields: { CONF }, rootEntity: AD_APURACAOCONF, key: { CODUSU: <CODUSU_LOG> })
  → UPDATE; DHALTER pela expressão
```

Contrato HTTP (igual PCFI):

- URL: `/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=json`
- `status === "1"` = sucesso; após insert, marcar `prefsRowExists = true`.

**Não enviar** `DHALTER` nem `CODUSU` em `localFields` (exceto `CODUSU` na `key` do update).

### 4.3 Config no gadget

```javascript
window.FACILITA_APURACAO_PREFS = {
  rootEntity: "AD_APURACAOCONF",
  confField: "CONF",
  codusu: "<CODUSU_LOG>"
};
```

---

## 5. Onde cada peça vive

| Artefato | Repositório / pasta |
|----------|---------------------|
| Tabela + instância dicionário (`CODUSU`/`DHALTER` expressão) | Om / GET_FACILITA conforme vocês cadastram |
| Leitura inicial | `prefs_payload.jsp` (opcional) ou query no JS |
| `saveRecord` + sync + cache | `facilita/apuracao-faturas/javascript/script.js` |
| Documentação | `memory.md`, checklist UAT |

---

## 6. UAT (resumo)

1. Usuário A: mês 11/2026, pendentes, colunas custom → Aplicar → fechar tela.
2. Mesmo usuário, **outro navegador**: mesma config + reload `P_*`.
3. Usuário B: não vê JSON do A (outro `CODUSU`).
4. Servidor indisponível: abre com cache local; ao voltar rede, grava na tabela.
5. Primeira visita com cache local antigo e tabela vazia: bootstrap para o banco.

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Storage bloqueado no iframe | Servidor ainda restaura na abertura |
| JSON inválido no CLOB | `saveRecord` falha; manter cache local; log no console |
| Instância CRUD sem permissão para o usuário | Liberar instância no perfil ou regra de negócio |
| CLOB grande por colunas novas | `version` no JSON + limite no JS antes do save |

---

## 8. Relação com o que já está no ar

- Hoje: **somente** `localStorage` (A16 “cliente”, implementado no JS).
- Próximo passo: tasks **A17–A21** — tabela + dicionário + `saveRecord` no gadget (**sem** Java novo no add-on).
