---
description: Criar dashboard HTML5 para o ERP Sankhya
---

# Skill: Sankhya Dashboard HTML5

Esta skill cria dashboards HTML5 completos e funcionais para integração com o ERP Sankhya.

---

## 📋 Pré-requisitos

Antes de iniciar, confirme com o usuário:

1. **Nome do dashboard** (será usado para criar a pasta e arquivos)
2. **Consulta SQL** ou se o usuário já possui o arquivo `dados.jsp` pronto
3. **Tipo de visualização** (tabela, cards, gráficos, etc.)
4. **Perguntar obrigatoriamente:**
   - [ ] Deseja remover o **botão de configuração de gráfico** do Sankhya?
   - [ ] Deseja remover a **barra de filtros nativa (VCompactBar)** do Sankhya?

---

## 📁 Estrutura de Arquivos

Criar a seguinte estrutura dentro de `c:\Users\ferna\OneDrive - Get! Grupo\Área de Trabalho\Html5\Link\`:

```
[NomeDashboard]/
├── [NomeDashboard].jsp      # Página principal
├── dados.jsp                 # Consultas SQL
├── css/
│   └── style.css            # Estilos do dashboard
├── javascript/
│   └── script.js            # Lógica JavaScript
└── Logo_Get.png             # Logo (copiar de outro dashboard)
```

---

## 📝 Templates dos Arquivos

### 1. Arquivo Principal: `[NomeDashboard].jsp`

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>[TÍTULO DO DASHBOARD]</title>
    <link rel="stylesheet" href="${BASE_FOLDER}/css/style.css">
    <snk:load />
</head>
<snk:load>
    <jsp:include page="dados.jsp" />
    <!-- Biblioteca para exportação Excel (opcional) -->
    <script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js"></script>
    <script src="${BASE_FOLDER}/javascript/script.js"></script>
</snk:load>

<body>
    <main class="dashboard">
        <header class="dashboard__header">
            <div class="dashboard__header-content">
                <div class="powered-by">
                    <span class="powered-by-text">powered by</span>
                    <img src="${BASE_FOLDER}/Logo_Get.png" alt="Get Consulting" class="powered-by-logo">
                </div>
                <div class="dashboard__header-text">
                    <h1>[TÍTULO DO DASHBOARD]</h1>
                    <p class="dashboard__subtitle">[DESCRIÇÃO DO DASHBOARD]</p>
                </div>
            </div>
        </header>

        <section class="dashboard__content">
            <!-- Empty State -->
            <div id="empty-state" class="empty-state" hidden>
                <span class="empty-state__icon">!</span>
                <p>Nenhum dado encontrado para os filtros selecionados.</p>
            </div>

            <!-- Tabela Principal -->
            <div class="table-card">
                <div class="table-card__header">
                    <div class="table-card__title">
                        <h2>[TÍTULO DA SEÇÃO]</h2>
                        <p class="table-card__subtitle">[SUBTÍTULO]</p>
                    </div>
                    <div class="table-card__meta">
                        <button type="button" id="export-excel" class="pill-button pill-button--accent">Exportar Excel</button>
                    </div>
                </div>
                <div class="table-card__body">
                    <table id="main-table">
                        <thead></thead>
                        <tbody></tbody>
                        <tfoot></tfoot>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <!-- Container de Dados (hidden) -->
    <div id="data-container" style="display:none;">
        <c:if test="${not empty mainDatasetApp.rows}">
            <c:forEach items="${mainDatasetApp.rows}" var="row" varStatus="status">
                <span class="data-row"
                      data-index="${status.index}"
                      data-campo1="<c:out value='${row.CAMPO1}'/>"
                      data-campo2="<c:out value='${row.CAMPO2}'/>"
                      data-valor="<c:out value='${row.VALOR}'/>">
                </span>
            </c:forEach>
        </c:if>
    </div>

    <!-- Modal de Loading (opcional) -->
    <div id="loading-overlay" class="loading-overlay" hidden>
        <div class="loading-card" role="status" aria-live="polite">
            <span class="loading-spinner" aria-hidden="true"></span>
            <p class="loading-text" id="loading-text">Processando...</p>
        </div>
    </div>

    <!-- Modal de Erro (opcional) -->
    <div id="error-modal" class="modal modal--error" hidden aria-hidden="true">
        <div class="modal__backdrop" data-modal-close></div>
        <div class="modal__card" role="alertdialog" aria-modal="true">
            <div class="modal__icon" aria-hidden="true">!</div>
            <div class="modal__content">
                <h2 class="modal__title">Atenção</h2>
                <p id="error-modal-desc" class="modal__text"></p>
            </div>
            <div class="modal__actions">
                <button type="button" class="btn btn--primary" data-modal-close>Entendi</button>
            </div>
        </div>
    </div>
</body>

</html>
```

---

### 2. Arquivo de Dados: `dados.jsp`

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>

<snk:query var="mainDataset" dataSource="MGEDS">
    -- [INSERIR CONSULTA SQL AQUI]
    -- Parâmetros disponíveis:
    -- :PERIODO.INI e :PERIODO.FIN (datas)
    -- :CONTA (lista de códigos de conta)
    -- :CODTIPOPER, :CODNAT, :CODPARC (filtros opcionais)
    -- ${CODUSU_LOG} (código do usuário logado)
    
    SELECT
        CAMPO1,
        CAMPO2,
        VALOR
    FROM TABELA
    WHERE CONDICOES
    AND (CAMPO = :PARAMETRO OR :PARAMETRO IS NULL)
</snk:query>

<!-- Armazenar dataset em escopo de aplicação -->
<c:set scope="application" var="mainDatasetApp" value="${mainDataset}" />
```

---

### 3. JavaScript Base: `javascript/script.js`

```javascript
/**
 * Classe JX - API de integração com Sankhya
 * Fornece métodos para consultas, salvamento e navegação
 */
class JX {
    static async post(e, t, { headers: n } = { headers: {} }) {
        let o = "", a = !0;
        n && (a = (o = n["Content-Type"] ? String(n["Content-Type"]) : o).length < 1 || o.includes("json"), n["Content-Type"] && delete n["Content-Type"], n["Content-Type"] = a ? "application/json" : o);
        try {
            const o = await window.fetch.bind(window)(e, { headers: n, method: "POST", redirect: "follow", body: a ? JSON.stringify(t) : t });
            return a ? o.json() : o.text()
        } catch (e) { console.error(e) }
    }

    static async get(e, { headers: t } = { headers: {} }) {
        let n = "", o = !0;
        t && (o = (n = t["Content-Type"] ? String(t["Content-Type"]) : n).length < 1 || n.includes("json"), t["Content-Type"] && delete t["Content-Type"], t["Content-Type"] = o ? "application/json" : n);
        try {
            const n = await window.fetch.bind(window)(e, { headers: t, method: "GET", redirect: "follow", mode: "no-cors" });
            return o ? n.json() : n.text()
        } catch (e) { console.error(e) }
    }

    static async consultar(sql) {
        const url = `${window.location.origin}/mge/service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json`;
        let body = { serviceName: "DbExplorerSP.executeQuery", requestBody: { sql: sql } };
        const response = await JX.post(url, body);
        return JX._parseQueryResponse(response);
    }

    static _parseQueryResponse(response) {
        let result = [];
        let data = typeof response === "string" ? JSON.parse(response) : response;
        data = data.data ? data.data.responseBody : (data.responseBody || data);
        const fields = data.fieldsMetadata || [];
        const rows = data.rows || [];
        rows.forEach(row => {
            let obj = {};
            fields.forEach((field, index) => obj[field.name] = row[index]);
            result.push(obj);
        });
        return result;
    }

    static salvar(campos, entidade, pk) {
        const url = `${window.location.origin}/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=json`;
        const body = {
            serviceName: "CRUDServiceProvider.saveRecord",
            requestBody: {
                dataSet: {
                    rootEntity: entidade,
                    includePresentationFields: "N",
                    dataRow: {
                        localFields: Object.keys(campos).reduce((acc, key) => ({
                            ...acc,
                            [key.toUpperCase()]: { $: String(campos[key]) }
                        }), {})
                    },
                    entity: {
                        fieldset: { list: Object.keys(campos).map(k => k.toUpperCase()).join(",") }
                    }
                }
            }
        };
        if (pk) {
            body.requestBody.dataSet.dataRow.key = Object.keys(pk).reduce((acc, key) => ({
                ...acc,
                [key.toUpperCase()]: { $: String(pk[key]) }
            }), {});
        }
        return JX.post(url, body);
    }

    static abrirPagina({ resourceID, chavesPrimarias }) {
        const appFn = (typeof window.openApp === 'function'
            ? window.openApp
            : (window.parent && typeof window.parent.openApp === 'function' ? window.parent.openApp : null));
        
        if (appFn && chavesPrimarias) {
            try {
                appFn(resourceID, chavesPrimarias);
                return;
            } catch (error) {
                console.error("Erro ao chamar openApp:", error);
            }
        }
        console.warn("Função openApp não disponível");
    }

    static getUrl(path) {
        return `${window.location.origin}${path ? "/" + path.replace(/^[\/]+/, "") : ""}`;
    }
}

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================
(function () {
    "use strict";

    // Formatadores
    const currencyFormatter = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2
    });
    const dateFormatter = new Intl.DateTimeFormat("pt-BR");

    // Estado
    let entries = [];
    let entriesAll = [];

    // Elementos DOM
    let tableBody;

    // ========================================================================
    // INICIALIZAÇÃO
    // ========================================================================
    document.addEventListener("DOMContentLoaded", init);

    function init() {
        // [REMOVER_ELEMENTOS_SANKHYA] - Será substituído conforme escolha do usuário
        scheduleCleaning();

        // Ler dados do container
        const datasetContainer = document.getElementById("data-container");
        tableBody = document.querySelector("#main-table tbody");

        if (!datasetContainer || !tableBody) {
            console.error("Container de dados ou tabela não encontrado");
            return;
        }

        // Carregar dados
        entriesAll = readDataset(datasetContainer);
        entries = entriesAll.slice();

        // Renderizar
        renderTable();
        toggleEmptyState(entries.length === 0);

        // Bind eventos
        bindActionButtons();
    }

    // ========================================================================
    // LIMPEZA DE ELEMENTOS SANKHYA (GERADO CONFORME ESCOLHA)
    // ========================================================================
    // [CÓDIGO_LIMPEZA_SANKHYA]

    // ========================================================================
    // LEITURA DE DADOS
    // ========================================================================
    function readDataset(container) {
        const rows = Array.from(container.querySelectorAll(".data-row"));
        return rows.map((row, index) => ({
            id: `row-${index}`,
            campo1: row.dataset.campo1 || "",
            campo2: row.dataset.campo2 || "",
            valor: parseFloat(row.dataset.valor) || 0
            // Adicionar mais campos conforme necessário
        }));
    }

    // ========================================================================
    // RENDERIZAÇÃO
    // ========================================================================
    function renderTable() {
        if (!tableBody) return;

        const fragment = document.createDocumentFragment();

        entries.forEach((row) => {
            const tr = document.createElement("tr");
            tr.dataset.rowId = row.id;

            // Criar células conforme colunas
            tr.appendChild(createCell(row.campo1));
            tr.appendChild(createCell(row.campo2));
            tr.appendChild(createCurrencyCell(row.valor));

            fragment.appendChild(tr);
        });

        tableBody.innerHTML = "";
        tableBody.appendChild(fragment);
    }

    function createCell(value) {
        const td = document.createElement("td");
        td.textContent = value || "-";
        return td;
    }

    function createCurrencyCell(value) {
        const td = document.createElement("td");
        td.className = "currency-cell";
        td.textContent = formatCurrency(value);
        return td;
    }

    // ========================================================================
    // UTILIDADES
    // ========================================================================
    function formatCurrency(value) {
        return Number.isFinite(value) ? currencyFormatter.format(value) : "-";
    }

    function formatDate(value) {
        if (!value) return "-";
        try {
            const date = new Date(value);
            return dateFormatter.format(date);
        } catch {
            return value;
        }
    }

    function parseNumber(value) {
        if (value === null || value === undefined || value === "") return 0;
        const num = parseFloat(String(value).replace(",", "."));
        return isNaN(num) ? 0 : num;
    }

    function toggleEmptyState(show) {
        const emptyState = document.getElementById("empty-state");
        const tableCard = document.querySelector(".table-card");
        if (emptyState) emptyState.hidden = !show;
        if (tableCard) tableCard.style.display = show ? "none" : "";
    }

    // ========================================================================
    // EVENTOS
    // ========================================================================
    function bindActionButtons() {
        const exportBtn = document.getElementById("export-excel");
        if (exportBtn) {
            exportBtn.addEventListener("click", exportToExcel);
        }
    }

    // ========================================================================
    // EXPORTAÇÃO EXCEL
    // ========================================================================
    function exportToExcel() {
        if (!entries.length) {
            alert("Não há dados para exportar.");
            return;
        }

        const data = entries.map(row => ({
            "Campo 1": row.campo1,
            "Campo 2": row.campo2,
            "Valor": row.valor
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dados");
        XLSX.writeFile(wb, "exportacao.xlsx");
    }

})();
```

---

### 4. CSS Base: `css/style.css`

```css
/* ============================================================================
   SANKHYA DASHBOARD - CSS BASE
   ============================================================================ */

/* ============================================================================
   VARIÁVEIS CSS
   ============================================================================ */
:root {
    /* Cores principais */
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-secondary: #64748b;
    --color-accent: #10b981;
    
    /* Cores de fundo */
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --bg-hover: #f1f5f9;
    
    /* Cores de texto */
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
    
    /* Cores de borda */
    --border-color: #e2e8f0;
    --border-radius: 8px;
    
    /* Cores de status */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-info: #3b82f6;
    
    /* Sombras */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    
    /* Espaçamento */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* Tipografia */
    --font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
}

/* ============================================================================
   RESET E BASE
   ============================================================================ */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: 1.5;
    color: var(--text-primary);
    background-color: var(--bg-main);
    min-height: 100vh;
}

/* ============================================================================
   ESCONDER ELEMENTOS NATIVOS SANKHYA
   ============================================================================ */
/* [CSS_LIMPEZA_SANKHYA] */

/* ============================================================================
   LAYOUT PRINCIPAL
   ============================================================================ */
.dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    max-width: 1600px;
    margin: 0 auto;
}

/* ============================================================================
   HEADER
   ============================================================================ */
.dashboard__header {
    background: var(--bg-card);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
}

.dashboard__header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
}

.dashboard__header-text h1 {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
}

.dashboard__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: var(--spacing-xs);
}

/* Powered By */
.powered-by {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.powered-by-text {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.powered-by-logo {
    height: 24px;
    width: auto;
}

/* ============================================================================
   CARDS
   ============================================================================ */
.table-card {
    background: var(--bg-card);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.table-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
    gap: var(--spacing-md);
}

.table-card__title h2 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
}

.table-card__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: var(--spacing-xs);
}

.table-card__body {
    overflow-x: auto;
}

/* ============================================================================
   TABELAS
   ============================================================================ */
table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
}

thead {
    background: var(--bg-hover);
    position: sticky;
    top: 0;
    z-index: 10;
}

th {
    padding: var(--spacing-md);
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
}

td {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
}

tbody tr:hover {
    background-color: var(--bg-hover);
}

/* Células especiais */
.currency-cell {
    text-align: right;
    font-family: "Roboto Mono", monospace;
    font-variant-numeric: tabular-nums;
}

/* ============================================================================
   BOTÕES
   ============================================================================ */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    border-radius: var(--border-radius);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
}

.btn--primary {
    background: var(--color-primary);
    color: white;
}

.btn--primary:hover {
    background: var(--color-primary-hover);
}

.btn--secondary {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-color);
}

.btn--secondary:hover {
    background: var(--border-color);
}

.btn--ghost {
    background: transparent;
    color: var(--text-secondary);
}

.btn--ghost:hover {
    background: var(--bg-hover);
}

/* Pill Buttons */
.pill-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-sm);
    font-weight: 500;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
}

.pill-button--primary {
    background: var(--color-primary);
    color: white;
}

.pill-button--primary:hover {
    background: var(--color-primary-hover);
}

.pill-button--accent {
    background: var(--color-accent);
    color: white;
}

.pill-button--accent:hover {
    background: #059669;
}

.pill-button--ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}

.pill-button--ghost:hover {
    background: var(--bg-hover);
}

/* ============================================================================
   EMPTY STATE
   ============================================================================ */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    text-align: center;
    color: var(--text-secondary);
    background: var(--bg-card);
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
}

.empty-state__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--bg-hover);
    color: var(--text-muted);
    font-size: var(--font-size-xl);
    font-weight: bold;
    margin-bottom: var(--spacing-md);
}

/* ============================================================================
   LOADING
   ============================================================================ */
.loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-card {
    background: var(--bg-card);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    box-shadow: var(--shadow-lg);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ============================================================================
   MODAL
   ============================================================================ */
.modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
}

.modal__card {
    position: relative;
    background: var(--bg-card);
    border-radius: var(--border-radius);
    padding: var(--spacing-xl);
    max-width: 400px;
    width: 90%;
    box-shadow: var(--shadow-lg);
    text-align: center;
}

.modal__icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #fef2f2;
    color: var(--color-danger);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-md);
    font-size: var(--font-size-xl);
    font-weight: bold;
}

.modal__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
}

.modal__text {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
}

.modal__actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
}

/* ============================================================================
   RESPONSIVO
   ============================================================================ */
@media (max-width: 768px) {
    .dashboard {
        padding: var(--spacing-md);
    }
    
    .dashboard__header-content {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .table-card__header {
        flex-direction: column;
        align-items: flex-start;
    }
}
```

---

## 🔧 Código para Remoção de Elementos Sankhya

### Opção 1: Remover APENAS o Botão de Gráfico

**CSS (`style.css`):**
```css
/* Hide ERP auto-generated config button */
.gwt-Button.chartConfigButton {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}
```

**JavaScript (`script.js`):**
```javascript
function scheduleCleaning() {
    removeConfigButton();
    [500, 2000, 5000].forEach(t => setTimeout(removeConfigButton, t));
}

function removeConfigButton() {
    try {
        [window.parent, window.parent && window.parent.parent]
            .filter(Boolean)
            .forEach((frame) => {
                const doc = frame.document;
                if (!doc) return;
                doc.querySelectorAll("button.gwt-Button.chartConfigButton")
                   .forEach(btn => btn.remove());
            });
    } catch (error) {
        console.error("[cfgBtn] Error removing config button:", error);
    }
}
```

---

### Opção 2: Remover Botão de Gráfico E Barra de Filtros

**CSS (`style.css`):**
```css
/* Hide ERP auto-generated elements */
.gwt-Button.chartConfigButton,
.VCompactBar,
.VCompactBar-opened,
.VCompactBar-closed {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
}
```

**JavaScript (`script.js`):**
```javascript
function scheduleCleaning() {
    cleanSankhyaUI();
    [500, 2000, 5000, 10000].forEach(t => setTimeout(cleanSankhyaUI, t));
}

function cleanSankhyaUI() {
    try {
        [window.parent, window.parent && window.parent.parent]
            .filter(Boolean)
            .forEach((frame) => {
                const doc = frame.document;
                if (!doc) return;

                const selectors = [
                    "button.chartConfigButton",
                    ".VCompactBar",
                    ".VCompactBar-opened",
                    ".VCompactBar-closed"
                ];

                selectors.forEach(s => {
                    doc.querySelectorAll(s).forEach(el => el.remove());
                });
            });
    } catch (e) {
        console.error("[cleanUI] Erro ao limpar interface nativa:", e);
    }
}
```

---

### Opção 3: Não Remover Nenhum Elemento

Não incluir nenhum código de remoção. Remover a chamada `scheduleCleaning()` do `init()`.

---

## 📋 Checklist de Criação

1. [ ] Criar pasta do dashboard
2. [ ] Criar `dados.jsp` com a consulta SQL
3. [ ] Criar arquivo principal `.jsp`
4. [ ] Criar `css/style.css`
5. [ ] Criar `javascript/script.js`
6. [ ] Copiar `Logo_Get.png` de outro dashboard
7. [ ] Aplicar código de remoção de elementos (conforme escolha)
8. [ ] Mapear campos do dataset para data-attributes
9. [ ] Ajustar colunas da tabela conforme campos
10. [ ] Testar no ambiente Sankhya

---

## 🔗 Resource IDs Comuns (para abrir telas)

```javascript
// Movimentação Financeira
'br.com.sankhya.fin.cad.movimentacaoFinanceira'

// Central de Notas
'br.com.sankhya.com.mov.CentralNotas'

// Parceiros
'br.com.sankhya.core.cad.parceiro'

// Produtos
'br.com.sankhya.core.cad.produto'
```

---

## 📌 Tabelas Sankhya Mais Comuns

| Tabela | Descrição |
|--------|-----------|
| `TGFFIN` | Movimentação Financeira |
| `TGFPAR` | Parceiros |
| `TGFTOP` | Tipos de Operação |
| `TGFNAT` | Naturezas |
| `TGFTIT` | Tipos de Título |
| `TSICTA` | Contas Bancárias |
| `TGFMBC` | Movimentação Bancária |
| `TSIEMP` | Empresas |
| `TSIUSU` | Usuários |
| `TGFCAB` | Cabeçalho de Notas |
| `TGFITE` | Itens de Notas |
| `TGFPRO` | Produtos |

---

## Assistente de IA no Dashboard

Use este padrao quando o usuario pedir um assistente de IA dentro de um dashboard Sankhya. A premissa correta e: a IA interpreta a pergunta e redige a resposta, mas o dashboard monta o contexto e executa a analise sobre os dados ja carregados pelo JSP/SQL. Por padrao, o assistente deve ser completo e aberto para todos os campos e datasets expostos pelo dashboard. Restricoes de escopo devem ser implementadas somente no dashboard que exigir isso.

### Objetivo

Criar um assistente capaz de responder perguntas abertas sobre qualquer campo disponivel no dashboard, desde que esse campo esteja exposto em containers hidden e normalizado pelo JavaScript. O assistente tambem pode aplicar filtros visuais, limpar filtros especificos, alterar periodos comparados, destacar registros ou abrir detalhes quando o dashboard tiver esses controles.

### Estrutura recomendada

Adicionar no JSP principal:

```html
<button type="button" id="ai-chat-toggle" class="ai-chat-toggle" aria-controls="ai-chat-panel" aria-expanded="false">
    Perguntar a IA
</button>

<section id="ai-chat-panel" class="ai-chat-panel" role="dialog" aria-modal="false" aria-labelledby="ai-chat-title" hidden>
    <header class="ai-chat-header">
        <div>
            <span>Assistente gerencial</span>
            <h2 id="ai-chat-title">Perguntar a IA</h2>
        </div>
        <button type="button" id="ai-chat-close" class="ai-chat-close" aria-label="Fechar painel de IA">Fechar</button>
    </header>
    <div class="ai-chat-body">
        <label class="ai-chat-field" for="ai-question">
            <span>Pergunta</span>
            <textarea id="ai-question" rows="4" maxlength="1000"></textarea>
        </label>
        <div class="ai-chat-actions">
            <button type="button" id="ai-send" class="ai-send">Enviar</button>
            <span id="ai-chat-status" class="ai-chat-status" aria-live="polite"></span>
        </div>
        <div id="ai-chat-answer" class="ai-chat-answer">
            Faca uma pergunta sobre os dados carregados no dashboard.
        </div>
    </div>
</section>
```

Adicionar CSS proprio para `.ai-chat-toggle`, `.ai-chat-panel`, `.ai-chat-header`, `.ai-chat-body`, `.ai-chat-field`, `.ai-chat-actions`, `.ai-send`, `.ai-chat-status` e `.ai-chat-answer`. Manter o painel fixo, acima do dashboard, sem esconder a UI nativa do Sankhya alem do que o usuario autorizou.

### Contrato dos dados

O `dados.jsp` deve trazer a base necessaria para analise. O JSP principal deve expor cada dataset em containers hidden com `data-*`, e o JS deve normalizar tudo em uma estrutura como `state.aiSources`.

Cada fonte de dados deve declarar:

- `source`: nome estavel da base, como `principal`, `analitico`, `itens`, `movimentos`, `metas` ou outro nome do proprio dashboard
- `label`: nome legivel para resposta e status
- `rows`: linhas normalizadas lidas do DOM
- `fields`: campos disponiveis com tipo (`dimension`, `metric`, `date`, `period`, `id`, `text`)
- `defaultMetric`: metrica numerica principal, quando existir
- `defaultGroupBy`: dimensao principal, quando existir
- `allowedActions`: actions visuais que esse dashboard realmente sabe aplicar

Cada linha lida pelo JS deve ter dimensoes, metricas numericas e campos temporais normalizados quando existirem.

Nao use a IA para consultar o banco diretamente. A IA deve operar sobre catalogos, amostras, contexto da pergunta e resultados agregados calculados pelo dashboard.

### Estrategia de contexto aberta

Montar o contexto em camadas:

1. `catalog`: lista todas as fontes (`source`), campos, tipos, metricas, periodos disponiveis, filtros atuais, contagens e amostras/top valores por dimensao.
2. `questionContext`: interpreta a pergunta localmente e identifica periodos, anos, termos de busca, campo provavel, fonte provavel e filtros semanticos.
3. `analysisPlan`: plano JSON retornado pela IA ou criado por fallback local.
4. `analysisResult`: resultado compacto calculado localmente, com cobertura, filtros aplicados, totais, rankings, series ou comparativos.

Nao limitar o assistente a uma fonte especifica no prompt ou no schema. Se o dashboard tiver varias bases, permitir que o plano escolha `source`. Para fechar o escopo em um dashboard especifico, sanitizar `source` e campos nesse dashboard, sem alterar esta regra geral.

### Fluxo correto da IA

Implementar o fluxo em tres etapas:

1. Planejamento: enviar ao modelo apenas `catalog`, `questionContext` e filtros atuais. Pedir que ele retorne um plano JSON, sem resposta textual.
2. Execucao local: o JavaScript executa o plano sobre a fonte selecionada. Aplicar filtros, recortes de periodo, agrupamentos, metricas, ordenacao, limites e calculos de variacao localmente. Gerar um `analysisResult` compacto.
3. Resposta: enviar ao modelo a pergunta original, o plano, o `analysisResult` e um `dashboardContext` compacto. Pedir resposta gerencial em portugues e actions opcionais para atualizar a tela.

Esse fluxo evita limite de contexto e permite perguntas abertas sobre os dados carregados. Sempre manter fallback local: se o modelo falhar, o dashboard ainda deve responder com base no `analysisResult` ou aplicar actions locais quando possivel.

### Chamada direta OpenAI para teste controlado

Quando o usuario pedir teste sem backend, deixar uma configuracao explicita no topo do `script.js`, sem gravar chave real em versao final:

```javascript
const AI_OPENAI_API_KEY = ""; // teste controlado: preencher localmente e remover antes de publicar
const AI_OPENAI_MODEL = "gpt-5.5";
const AI_OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
```

Usar `gpt-5.5` como padrao de teste direto neste workspace. Nao usar `gpt-5` como default para o assistente, pois isso ja causou falha de modelo/configuracao em dashboard real.

Na chamada direta para `/v1/responses`:

- enviar `Authorization: Bearer ${AI_OPENAI_API_KEY}`
- usar `text.format.type = "json_schema"`
- incluir `strict: false` dentro de `text.format`
- incluir `max_output_tokens` em cada chamada (`1000` para planejamento e `1800` para resposta sao bons valores iniciais)
- extrair JSON por `output_text` e, como fallback, concatenar `output[].content[].text`
- se `JSON.parse` falhar, tentar recortar do primeiro `{` ao ultimo `}` antes de desistir
- traduzir erros HTTP para mensagens uteis: `401` chave invalida, `404` modelo nao encontrado, `429` limite/uso, `>=500` indisponibilidade temporaria
- se a chamada direta falhar, usar fallback local ou backend, mas exibir o motivo especifico no status para facilitar o teste

Nao enviar a base inteira para a OpenAI. A primeira chamada envia catalogo, filtros atuais, periodos disponiveis e amostras; a segunda envia apenas pergunta, plano e `analysisResult` agregado.

### Schema do plano analitico

Use um plano generico como este:

```json
{
  "source": "principal",
  "calculation": "ranking | total | growth | comparison | timeseries | detail | distribution",
  "filters": [
    {
      "field": "campo",
      "operator": "equals | contains | not_contains | in | not_in | between | gte | lte",
      "value": "texto ou valor",
      "values": []
    }
  ],
  "period": {
    "periods": ["2025-04", "2026-04"],
    "lastNYears": 3,
    "years": [2024, 2025, 2026],
    "startPeriod": "2024-01",
    "endPeriod": "2026-12"
  },
  "groupBy": ["dimensao", "ano"],
  "metric": "valor",
  "sort": { "by": "valor | growthAbs | growthPct | label", "direction": "desc" },
  "limit": 20,
  "includeSeries": true,
  "actions": []
}
```

Campos permitidos devem ser derivados do dataset real. Para cada dashboard, montar `catalog` automaticamente a partir de `state.aiSources` e do mapeamento de campos. Nunca manter listas fixas de campos de um dashboard anterior como regra global.

### Motor generico de analise

O JavaScript deve ter funcoes genericas para:

- normalizar o plano retornado pela IA
- escolher a fonte por `plan.source` com fallback local baseado na pergunta
- complementar o plano por heuristicas locais quando o modelo vier incompleto
- resolver periodo: anos explicitos, intervalo `YYYY-MM`, ultimos N anos, periodo atual e periodos comparados da tela
- fazer periodos citados na pergunta prevalecerem sobre filtros visuais atuais. Exemplo: se a tela esta em `2026`, mas a pergunta diz `abril de 2025 para abril de 2026`, executar sobre `period.periods = ["2025-04", "2026-04"]`, nao sobre o ano visual selecionado.
- aplicar filtros por campo e operador
- agrupar por uma ou mais dimensoes
- somar metricas numericas
- contar linhas ou valores distintos quando fizer sentido
- calcular ranking, total, serie temporal, comparativo, crescimento absoluto e crescimento percentual
- ordenar e limitar o resultado
- montar `analysisResult` com cobertura: fonte usada, linhas originais, linhas consideradas, total considerado, anos e periodos usados

O motor deve suportar perguntas abertas sem criar uma funcao especifica por frase, desde que os campos existam no catalogo.

### Heuristicas locais obrigatorias

Mesmo com o plano da IA, adicionar heuristicas no JS para comandos comuns:

- reconhecer `ultimos N anos`
- reconhecer anos explicitos como `2026, 2025 e 2024`
- reconhecer meses com ano, como `abril de 2025`, `04/2025` e `2025-04`, e preencher `period.periods`
- reconhecer `periodo 1`, `periodo 2`, `periodos`, `P1`, `P2`
- interpretar `sem considerar`, `excluindo`, `ignorar`, `desconsiderar` como filtro de exclusao
- reconhecer `crescimento`, `aumento`, `variacao`, `queda`, `reducao` como calculo de variacao
- reconhecer `faca filtro`, `filtre`, `aplique`, `mostre`, `somente`, `apenas` como intencao de filtro visual
- identificar o alvo do filtro antes de montar o payload: ano/periodo vai para controles temporais, cada campo estruturado vai para seu controle proprio quando existir, e texto livre vai para busca somente quando a pergunta citar busca ou algum campo textual existente.
- reconhecer `tire`, `remova`, `limpe`, `apague` como limpeza especifica do campo citado, nao como reset total
- gerar actions locais a partir da pergunta para comandos de tela. Exemplo: `filtre o ano de 2025` deve gerar `APPLY_FILTER` com `{ "year": "2025" }` mesmo que a OpenAI retorne `actions: []`.
- em dashboards com filtro de ano simples, `filtre o ano de 2025` nao pode preencher campo de busca textual com `o ano de 2025`; a busca textual so deve mudar quando o usuario citar busca ou algum campo textual existente.
- mesclar actions da OpenAI, do plano e das heuristicas locais; uma lista vazia da OpenAI nunca deve apagar a action local. Usar deduplicacao por `type + payload`.

Essas heuristicas nao substituem a IA; elas estabilizam interpretacao de periodo, filtros e actions visuais.

### Sanitizacao por dashboard

Antes de executar o plano da IA, sanitizar `source`, `filters`, `groupBy`, `metric` e `actions` contra o catalogo real:

- aceitar apenas fontes declaradas em `state.aiSources`
- aceitar apenas campos existentes na fonte escolhida
- traduzir aliases locais para campos reais quando houver mapeamento explicito
- descartar filtros, agrupamentos e actions incompativeis em vez de deixar a analise zerar
- quando a pergunta citar uma fonte ou campo indisponivel, explicar a limitacao com base no que foi carregado
- quando houver dois ou mais periodos, calcular comparacao pelo primeiro e pelo ultimo periodo da lista
- explicar na resposta a fonte usada, periodos considerados, valor base, valor final, variacao absoluta e variacao percentual quando esses dados existirem

Qualquer fechamento de escopo deve ficar nesta camada do dashboard especifico. A regra geral da skill continua aberta.

### Actions para atualizar a tela

Retornar actions no formato:

```json
{
  "answer": "texto para o usuario",
  "actions": [
    {
      "type": "APPLY_FILTER",
      "payload": {}
    }
  ]
}
```

Actions recomendadas, quando o dashboard suportar:

- `APPLY_FILTER`: aplicar filtros visuais
- `CLEAR_FILTERS`: limpar todos os filtros somente quando o usuario pedir reset geral
- `HIGHLIGHT_ROW`: destacar linha ou registro
- `HIGHLIGHT_FIELD_VALUE`: destacar um valor de campo
- `OPEN_DETAIL`: abrir detalhe, modal ou drill-down
- `SET_PERIODS`: alterar periodos visuais quando houver controles de periodo

Payloads devem usar nomes dos controles reais do dashboard. Nao inventar action visual que nao tenha implementacao local.

Payload recomendado para periodos:

```json
{
  "periodos": [
    { "indice": 1, "periodoInicial": "2026-01", "periodoFinal": "2026-12" },
    { "indice": 2, "periodoInicial": "2025-01", "periodoFinal": "2025-12" },
    { "indice": 3, "periodoInicial": "2024-01", "periodoFinal": "2024-12" }
  ],
  "clearBusca": true
}
```

Regras importantes:

- `indice: 1` altera o primeiro periodo visual.
- `indice: 2` altera o segundo periodo visual.
- Se o indice ainda nao existir, criar o periodo visual dinamicamente.
- `clearBusca: true` limpa apenas o campo de busca textual configurado no dashboard.
- `clearYear: true` ou `limparAno: true` limpa apenas o filtro visual de ano.
- `clearCompany: true` ou `limparEmpresa: true` limpa apenas o filtro visual de empresa.
- `year`/`ano` atualiza apenas o select de ano; nao deve alimentar busca de linha.
- Nao deixar `CLEAR_FILTERS` apagar periodos quando o usuario pediu somente limpar um campo especifico.
- Aplicar actions locais depois das actions do modelo, para corrigir payload incompleto da IA.
- Para dashboards com `select` de ano simples, aceitar payloads `year`, `ano`, `periodoInicial`, `periodoFinal`, `periodos` ou `periods`, extrair o ano e atualizar o controle visual correspondente.
- Quando uma action for aplicada e a resposta textual vier vazia, responder com texto simples como `Filtro aplicado para o ano de 2025.` em vez de mostrar erro generico.

### Backend e seguranca

Para teste controlado, a chamada direta para a OpenAI pode acelerar a validacao. Para uso real, preferir backend intermediario:

- para teste direto no navegador, permitir chave local temporaria em `AI_OPENAI_API_KEY`, modelo `gpt-5.5` e endpoint `/v1/responses`
- guardar `OPENAI_API_KEY` apenas no servidor
- expor endpoint como `POST /api/dashboard-ai/ask`
- aplicar CORS restrito
- limitar tamanho do JSON
- no backend, repetir o mesmo fluxo: planejar, executar analise local ou receber `analysisResult`, e responder

Nunca deixar chave real da OpenAI fixa no `script.js` em versao distribuida.

### Validacao

Depois de implementar:

- rodar `node --check .\javascript\script.js`
- se houver backend, rodar `node --check .\backend\server.js`
- testar perguntas de ranking, total, crescimento, comparacao, exclusao e limpeza de filtros
- testar aplicacao visual de 1, 2 e 3 periodos
- testar limpeza especifica de busca/natureza sem resetar os demais filtros
