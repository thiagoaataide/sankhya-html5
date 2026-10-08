(function () {
    "use strict";

    var rows = [];
    var filteredRows = [];
    var selectedRow = null;
    var selectedDetail = null;
    var detailRequestSequence = 0;
    var actionRequestSequence = 0;
    var sortState = { key: "numcontrato", direction: 1 };
    var pageState = { page: 1, pageSize: 15 };
    var manualColumnSort = false;
    var gridRefreshSequence = 0;
    var CLIENT_FILTER_KEY = "facilita-apuracao-faturas:client-filters:v1";
    var SERVER_QUERY_KEY = "facilita-apuracao-faturas:server-query:v1";
    var GRID_COLUMNS = [
        { id: "nuapuracao", label: "Sequência", kind: "text", visible: true },
        { id: "codconta", label: "Conta", kind: "text", visible: true },
        { id: "numcontrato", label: "Contrato", kind: "text", visible: true },
        { id: "nomeCliente", label: "Nome Cliente", kind: "text", visible: true },
        { id: "razaoCliente", label: "Razão Cliente", kind: "text", visible: true },
        { id: "referencia", label: "Referência", kind: "date", visible: true },
        { id: "dtvenc", label: "Vencimento", kind: "date", visible: true },
        { id: "valor", label: "Valor", kind: "money", visible: true },
        { id: "confirmado", label: "Estado", kind: "estado", visible: true },
        { id: "possuiAnexo", label: "Anexo", kind: "flag", visible: true },
        { id: "identificador", label: "Identificador", kind: "text", visible: false },
        { id: "nomeOperadora", label: "Operadora", kind: "text", visible: false },
        { id: "nomeTitular", label: "Titular", kind: "text", visible: false },
        { id: "cgcTitular", label: "CNPJ titular", kind: "text", visible: false },
        { id: "apelidoVend", label: "Consultor", kind: "text", visible: false },
        { id: "nunota", label: "Faturamento", kind: "text", visible: false },
        { id: "sequenciacon", label: "Sequência contratual", kind: "text", visible: false },
        { id: "referenciaadiada", label: "Referência adiada", kind: "date", visible: false },
        { id: "valorref", label: "Valor de referência", kind: "money", visible: false },
        { id: "vlrest", label: "Valor estimado", kind: "money", visible: false },
        { id: "auditoriafinalizada", label: "Auditoria finalizada", kind: "flag", visible: false },
        { id: "emailenviado", label: "E-mail enviado", kind: "flag", visible: false },
        { id: "faturamentoliberado", label: "Faturamento liberado", kind: "flag", visible: false },
        { id: "operadora", label: "Cód. operadora", kind: "text", visible: false },
        { id: "cliente", label: "Cód. cliente", kind: "text", visible: false },
        { id: "codvend", label: "Cód. consultor", kind: "text", visible: false },
        { id: "idinstprn", label: "Fluxo", kind: "text", visible: false },
        { id: "nufila", label: "Fila de e-mail", kind: "text", visible: false },
        { id: "plano", label: "Plano", kind: "text", visible: false },
        { id: "tamanhoAnexo", label: "Tamanho do anexo", kind: "money", visible: false },
        { id: "sequenciaFaturamento", label: "Sequência faturamento", kind: "text", visible: false },
        { id: "cfgDataini", label: "Início da configuração", kind: "date", visible: false },
        { id: "cfgDatafin", label: "Fim da configuração", kind: "date", visible: false },
        { id: "cfgVlrref", label: "Valor ref. configuração", kind: "money", visible: false },
        { id: "cfgVlrfixo", label: "Valor fixo", kind: "money", visible: false },
        { id: "acessoLogin", label: "Login", kind: "text", visible: false },
        { id: "acessoCpf", label: "CPF acesso", kind: "text", visible: false },
        { id: "acessoEmail", label: "E-mail acesso", kind: "text", visible: false },
        { id: "acessoCnpj", label: "CNPJ acesso", kind: "text", visible: false },
        { id: "acessoLinha", label: "Linha gestora", kind: "text", visible: false }
    ];
    var visibleColumns = {};
    GRID_COLUMNS.forEach(function (column) {
        visibleColumns[column.id] = column.visible;
    });
    var pinnedColumns = [];
    var columnOrder = GRID_COLUMNS.map(function (column) {
        return column.id;
    });
    var columnDragState = { columnId: "" };
    var columnFilters = {};
    var facadeConfig = window.FACILITA_APURACAO_FACADE || {};
    var facadeModuleName = facadeConfig.moduleName || "0bace5b4-6687-4507-9093-a80a82a03bcb";
    var facadeServiceName = facadeConfig.serviceName || "ApuracaoDashboardSP";
    var facadeServicePath = facadeConfig.servicePath || "/mge/service.sbr";
    var numberFormat = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        try {
            captureServerFilterQuery();
            syncServerFilterControlsFromQuery(getServerFilterQuery());
            rows = readRows();
            filteredRows = rows.slice();
            buildGridChrome();
            loadColumnPreferences();
            loadPagePreferences();
            bindEvents();
            restoreClientFilterState();
            syncSortWithSearchField();
            applySorting();
            applyFilters(true);
            setLoading(false);
        } catch (error) {
            showError("A consulta não pôde ser preparada.");
            console.error("[facilita-apuracao] inicialização", error);
        }
    }

    function readRows() {
        var container = document.getElementById("data-container");
        if (!container) {
            throw new Error("data-container ausente");
        }

        return Array.prototype.slice.call(container.querySelectorAll(".data-row")).map(function (element) {
            var data = element.dataset;
            return {
                nuapuracao: data.nuapuracao || "",
                codconta: data.codconta || "",
                numcontrato: data.numcontrato || "",
                nunota: data.nunota || "",
                sequenciacon: data.sequenciacon || "",
                referencia: data.referencia || "",
                referenciaadiada: data.referenciaadiada || "",
                dtvenc: data.dtvenc || "",
                valor: parseNumber(data.valor),
                valorref: parseNumber(data.valorref),
                confirmado: flag(data.confirmado),
                auditoriafinalizada: flag(data.auditoriafinalizada),
                emailenviado: flag(data.emailenviado),
                faturamentoliberado: flag(data.faturamentoliberado),
                operadora: data.operadora || "",
                cliente: data.cliente || "",
                titularidade: data.titularidade || "",
                codvend: data.codvend || "",
                codvendRel: data.codvendRel || "",
                idinstprn: data.idinstprn || "",
                nufila: data.nufila || "",
                plano: data.plano || "",
                tamanhoAnexo: parseNumber(data.tamanhoAnexo),
                sequenciaFaturamento: data.sequenciaFaturamento || "",
                identificador: data.identificador || "",
                nomeOperadora: data.nomeOperadora || "",
                nomeTitular: data.nomeTitular || "",
                nomeCliente: data.nomeCliente || "",
                razaoCliente: data.razaoCliente || "",
                cgcTitular: data.cgcTitular || "",
                apelidoVend: data.apelidoVend || "",
                vlrest: parseNumber(data.vlrest),
                cfgDataini: data.cfgDataini || "",
                cfgDatafin: data.cfgDatafin || "",
                cfgVlrref: parseNumber(data.cfgVlrref),
                cfgVlrfixo: parseNumber(data.cfgVlrfixo),
                acessoLogin: data.acessoLogin || "",
                acessoCpf: data.acessoCpf || "",
                acessoEmail: data.acessoEmail || "",
                acessoCnpj: data.acessoCnpj || "",
                acessoLinha: data.acessoLinha || "",
                adDhalter: data.adDhalter || "",
                possuiAnexo: flag(data.possuiAnexo)
            };
        });
    }

    function bindEvents() {
        var search = document.getElementById("filter-text");
        var field = document.getElementById("filter-field");
        var refresh = document.getElementById("btn-refresh");
        var exportButton = document.getElementById("btn-export");
        var editForm = document.getElementById("detail-edit");
        var uploadButton = document.getElementById("btn-upload-attachment");

        if (search) {
            search.addEventListener("input", function () {
                saveClientFilterState();
                applyFilters();
            });
        }
        if (field) {
            field.addEventListener("change", function () {
                manualColumnSort = false;
                saveClientFilterState();
                applyFilters();
            });
        }
        var pageSize = document.getElementById("page-size");
        var pagePrev = document.getElementById("page-prev");
        var pageNext = document.getElementById("page-next");
        if (pageSize) {
            pageSize.addEventListener("change", function () {
                pageState.pageSize = parsePageSize(pageSize.value);
                pageState.page = 1;
                savePagePreferences();
                render();
            });
        }
        if (pagePrev) {
            pagePrev.addEventListener("click", function () {
                if (pageState.page > 1) {
                    pageState.page -= 1;
                    render();
                }
            });
        }
        if (pageNext) {
            pageNext.addEventListener("click", function () {
                if (pageState.page < getTotalPages()) {
                    pageState.page += 1;
                    render();
                }
            });
        }
        if (refresh) {
            refresh.addEventListener("click", function () {
                refreshGridFromServer(selectedRow ? selectedRow.nuapuracao : "");
            });
        }
        var applyServerFilters = document.getElementById("btn-apply-server-filters");
        if (applyServerFilters) {
            applyServerFilters.addEventListener("click", function () {
                reloadWithServerFilters(readServerFilterControls());
            });
        }
        var serverReference = document.getElementById("server-filter-reference");
        if (serverReference) {
            serverReference.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    reloadWithServerFilters(readServerFilterControls());
                }
            });
        }
        if (exportButton) {
            exportButton.addEventListener("click", exportCsv);
        }
        if (editForm) {
            editForm.addEventListener("submit", function (event) {
                event.preventDefault();
                updateSelectedApuracao();
            });
        }
        if (uploadButton) {
            uploadButton.addEventListener("click", uploadSelectedAttachment);
        }
        document.addEventListener("facilita-apuracao:selected", function (event) {
            loadDetail(event.detail);
        });
        document.addEventListener("facilita-apuracao:cleared", clearDetailSelection);
        document.addEventListener("click", closeColumnMenus);
    }

    function closeColumnMenus() {
        Array.prototype.forEach.call(document.querySelectorAll(".col-menu"), function (menu) {
            menu.hidden = true;
        });
    }

    function buildGridChrome() {
        var head = document.getElementById("grid-apuracoes-head");
        var menu = document.getElementById("column-picker-menu");
        if (!head || !menu) {
            return;
        }
        head.textContent = "";
        menu.textContent = "";
        menu.appendChild(buildSelectAllLabel());
        orderedColumns().forEach(function (column) {
            var th = document.createElement("th");
            var dragHandle = document.createElement("button");
            var sortButton = document.createElement("button");
            var marker = document.createElement("span");
            var pinButton = document.createElement("button");
            var label = document.createElement("label");
            var checkbox = document.createElement("input");
            th.scope = "col";
            th.setAttribute("data-column", column.id);
            if (column.kind === "money") {
                th.className = "num";
            }
            dragHandle.type = "button";
            dragHandle.className = "col-drag-handle";
            dragHandle.draggable = true;
            dragHandle.setAttribute("aria-label", "Reordenar coluna " + column.label);
            dragHandle.title = "Arraste para reordenar";
            dragHandle.textContent = "\u2261";
            dragHandle.addEventListener("dragstart", function (event) {
                columnDragState.columnId = column.id;
                event.dataTransfer.setData("text/plain", column.id);
                event.dataTransfer.effectAllowed = "move";
                th.classList.add("is-column-dragging");
            });
            dragHandle.addEventListener("dragend", function () {
                columnDragState.columnId = "";
                th.classList.remove("is-column-dragging");
                clearColumnDropTargets();
            });
            th.addEventListener("dragover", function (event) {
                if (!columnDragState.columnId || columnDragState.columnId === column.id) {
                    return;
                }
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                th.classList.add("is-column-drop-target");
            });
            th.addEventListener("dragleave", function (event) {
                if (event.currentTarget.contains(event.relatedTarget)) {
                    return;
                }
                th.classList.remove("is-column-drop-target");
            });
            th.addEventListener("drop", function (event) {
                event.preventDefault();
                th.classList.remove("is-column-drop-target");
                var dragId = event.dataTransfer.getData("text/plain") || columnDragState.columnId;
                if (!dragId || dragId === column.id) {
                    return;
                }
                moveColumnInOrder(dragId, column.id);
            });
            sortButton.type = "button";
            sortButton.className = "sort-trigger";
            sortButton.setAttribute("data-sort", column.id);
            sortButton.appendChild(document.createTextNode(column.label + " "));
            marker.setAttribute("aria-hidden", "true");
            sortButton.appendChild(marker);
            sortButton.addEventListener("click", function () {
                sortBy(column.id);
            });
            pinButton.type = "button";
            pinButton.className = "col-menu-trigger";
            pinButton.setAttribute("data-pin", column.id);
            pinButton.setAttribute("aria-haspopup", "menu");
            pinButton.setAttribute("aria-label", "Opções de " + column.label);
            pinButton.textContent = "\u22EE";
            var columnMenu = document.createElement("div");
            var pinItem = document.createElement("button");
            columnMenu.className = "col-menu";
            columnMenu.hidden = true;
            columnMenu.setAttribute("role", "menu");
            pinItem.type = "button";
            pinItem.className = "col-menu__item";
            pinItem.setAttribute("role", "menuitem");
            pinItem.textContent = "Fixar coluna";
            pinButton.addEventListener("click", function (event) {
                event.stopPropagation();
                var willOpen = columnMenu.hidden;
                closeColumnMenus();
                if (!willOpen) {
                    return;
                }
                var box = pinButton.getBoundingClientRect();
                columnMenu.hidden = false;
                columnMenu.style.position = "fixed";
                columnMenu.style.top = (box.bottom + 4) + "px";
                columnMenu.style.left = Math.max(8, box.right - 168) + "px";
            });
            pinItem.addEventListener("click", function (event) {
                event.stopPropagation();
                var index = pinnedColumns.indexOf(column.id);
                if (index >= 0) {
                    pinnedColumns.splice(index, 1);
                } else {
                    pinnedColumns.push(column.id);
                }
                columnMenu.hidden = true;
                saveColumnPreferences();
                placePinnedColumn();
                render();
            });
            columnMenu.appendChild(pinItem);
            th.appendChild(dragHandle);
            th.appendChild(sortButton);
            th.appendChild(pinButton);
            th.appendChild(columnMenu);
            head.appendChild(th);

            checkbox.type = "checkbox";
            checkbox.setAttribute("data-column", column.id);
            checkbox.checked = visibleColumns[column.id];
            checkbox.addEventListener("change", function () {
                var checkedColumns = document.querySelectorAll(".column-picker input[data-column]:checked");
                if (!checkbox.checked && checkedColumns.length === 0) {
                    checkbox.checked = true;
                    return;
                }
                visibleColumns[column.id] = checkbox.checked;
                if (!checkbox.checked) {
                    var pinnedIndex = pinnedColumns.indexOf(column.id);
                    if (pinnedIndex >= 0) {
                        pinnedColumns.splice(pinnedIndex, 1);
                    }
                }
                syncSelectAll();
                saveColumnPreferences();
                placePinnedColumn();
                render();
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + column.label));
            menu.appendChild(label);
        });
        buildColumnFilterRow();
        syncSelectAll();
    }

    function buildColumnFilterRow() {
        var filterHead = document.getElementById("grid-apuracoes-filter-head");
        if (!filterHead) {
            return;
        }
        filterHead.textContent = "";
        orderedColumns().forEach(function (column) {
            var th = document.createElement("th");
            var input = document.createElement("input");
            th.scope = "col";
            th.className = "col-filter-cell" + (column.kind === "money" ? " num" : "");
            th.setAttribute("data-column", column.id);
            input.type = "search";
            input.className = "col-filter-input";
            input.setAttribute("data-column-filter", column.id);
            input.setAttribute("aria-label", "Filtrar coluna " + column.label);
            input.placeholder = "Filtrar";
            input.autocomplete = "off";
            input.spellcheck = false;
            input.value = columnFilters[column.id] || "";
            input.addEventListener("input", function () {
                syncColumnFiltersFromDom();
                saveClientFilterState();
                applyFilters();
            });
            input.addEventListener("mousedown", function (event) {
                event.stopPropagation();
            });
            th.appendChild(input);
            filterHead.appendChild(th);
        });
        applyColumnVisibility();
        applyPinnedColumn();
    }

    function syncColumnFiltersFromDom() {
        columnFilters = {};
        Array.prototype.forEach.call(
            document.querySelectorAll("#grid-apuracoes-filter-head input[data-column-filter]"),
            function (input) {
                var id = input.getAttribute("data-column-filter");
                var value = String(input.value || "").trim();
                if (value) {
                    columnFilters[id] = value;
                }
            }
        );
    }

    function restoreColumnFilterInputs() {
        Array.prototype.forEach.call(
            document.querySelectorAll("#grid-apuracoes-filter-head input[data-column-filter]"),
            function (input) {
                var id = input.getAttribute("data-column-filter");
                input.value = columnFilters[id] || "";
            }
        );
    }

    function normalizeColumnOrder(order) {
        var seen = {};
        var normalized = [];
        (order || []).forEach(function (id) {
            if (!columnById(id) || seen[id]) {
                return;
            }
            seen[id] = true;
            normalized.push(id);
        });
        GRID_COLUMNS.forEach(function (column) {
            if (!seen[column.id]) {
                normalized.push(column.id);
            }
        });
        return normalized;
    }

    function orderedColumns() {
        var order = normalizeColumnOrder(columnOrder);
        var pinned = [];
        var rest = [];
        order.forEach(function (id) {
            var column = columnById(id);
            if (!column) {
                return;
            }
            if (pinnedColumns.indexOf(id) >= 0) {
                pinned.push(column);
            } else {
                rest.push(column);
            }
        });
        return pinned.concat(rest);
    }

    function moveColumnInOrder(dragId, targetId) {
        columnOrder = normalizeColumnOrder(columnOrder);
        var fromIndex = columnOrder.indexOf(dragId);
        var targetIndex = columnOrder.indexOf(targetId);
        if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
            return;
        }
        columnOrder.splice(fromIndex, 1);
        if (fromIndex < targetIndex) {
            targetIndex -= 1;
        }
        columnOrder.splice(targetIndex, 0, dragId);
        manualColumnSort = true;
        saveColumnPreferences();
        placePinnedColumn();
        render();
    }

    function clearColumnDropTargets() {
        Array.prototype.forEach.call(document.querySelectorAll("#grid-apuracoes-head th.is-column-drop-target"), function (cell) {
            cell.classList.remove("is-column-drop-target");
        });
    }

    function placePinnedColumn() {
        var head = document.getElementById("grid-apuracoes-head");
        var filterHead = document.getElementById("grid-apuracoes-filter-head");
        orderedColumns().forEach(function (column) {
            [head, filterHead].forEach(function (row) {
                if (!row) {
                    return;
                }
                var cell = row.querySelector('[data-column="' + column.id + '"]');
                if (cell) {
                    row.appendChild(cell);
                }
            });
        });
    }

    function buildSelectAllLabel() {
        var label = document.createElement("label");
        var checkbox = document.createElement("input");
        label.className = "column-picker__all";
        checkbox.type = "checkbox";
        checkbox.id = "column-select-all";
        checkbox.addEventListener("change", function () {
            GRID_COLUMNS.forEach(function (column) {
                visibleColumns[column.id] = checkbox.checked || column.id === "nuapuracao";
            });
            pinnedColumns = pinnedColumns.filter(function (id) {
                return visibleColumns[id];
            });
            Array.prototype.forEach.call(document.querySelectorAll(".column-picker input[data-column]"), function (item) {
                item.checked = visibleColumns[item.getAttribute("data-column")];
            });
            syncSelectAll();
            saveColumnPreferences();
            placePinnedColumn();
            render();
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" Selecionar todos"));
        return label;
    }

    function syncSelectAll() {
        var checkbox = document.getElementById("column-select-all");
        if (!checkbox) {
            return;
        }
        var total = GRID_COLUMNS.length;
        var marked = GRID_COLUMNS.filter(function (column) {
            return visibleColumns[column.id];
        }).length;
        checkbox.checked = marked === total;
        checkbox.indeterminate = marked > 0 && marked < total;
    }

    function applyFilters(preservePage) {
        var search = document.getElementById("filter-text");
        var field = document.getElementById("filter-field");
        var query = search ? search.value.trim().toLowerCase() : "";
        var selectedField = field ? field.value : "T";
        var previousPage = pageState.page;

        filteredRows = rows.filter(function (row) {
            if (query && !searchableValues(row, selectedField).some(function (value) {
                return matchesSearchToken(value, query);
            })) {
                return false;
            }
            return rowMatchesColumnFilters(row);
        });
        if (preservePage) {
            pageState.page = previousPage;
            clampPage();
        } else {
            pageState.page = 1;
        }
        syncSortWithSearchField();
        applySorting();

        if (selectedRow && !filteredRows.some(function (row) {
            return row.nuapuracao === selectedRow.nuapuracao;
        })) {
            selectedRow = null;
            document.dispatchEvent(new CustomEvent("facilita-apuracao:cleared"));
        }
        render();
    }

    function captureServerFilterQuery() {
        var search = window.location.search;
        if (search && search.length > 1) {
            try {
                window.sessionStorage.setItem(SERVER_QUERY_KEY, search);
            } catch (error) {
                console.warn("[facilita-apuracao] não foi possível guardar parâmetros do gadget", error);
            }
        }
    }

    function getServerFilterQuery() {
        if (window.location.search && window.location.search.length > 1) {
            captureServerFilterQuery();
            return window.location.search;
        }
        captureServerFilterQuery();
        try {
            var stored = window.sessionStorage.getItem(SERVER_QUERY_KEY);
            if (stored) {
                return stored;
            }
        } catch (error) {
            console.warn("[facilita-apuracao] parâmetros do gadget indisponíveis", error);
        }
        return "";
    }

    function parseServerFilterParams(search) {
        var params = {};
        var raw = String(search || "").replace(/^\?/, "");
        if (!raw) {
            return params;
        }
        raw.split("&").forEach(function (pair) {
            if (!pair) {
                return;
            }
            var parts = pair.split("=");
            var key = decodeURIComponent(parts[0] || "");
            var value = decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
            if (key) {
                params[key] = value;
            }
        });
        return params;
    }

    function currentMonthReferenceIso() {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        return year + "-" + (month < 10 ? "0" : "") + month + "-01";
    }

    function monthInputFromReference(value) {
        if (!value) {
            return currentMonthReferenceIso().slice(0, 7);
        }
        var iso = String(value).trim();
        if (/^\d{4}-\d{2}/.test(iso)) {
            return iso.slice(0, 7);
        }
        var br = iso.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (br) {
            return br[3] + "-" + br[2];
        }
        return currentMonthReferenceIso().slice(0, 7);
    }

    function referenceFromMonthInput(monthValue) {
        if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) {
            return currentMonthReferenceIso();
        }
        return monthValue + "-01";
    }

    function defaultServerFilterValues() {
        return {
            P_REFERENCIA: currentMonthReferenceIso(),
            P_SOMENTE_PENDENTES: "S",
            P_POSSUI_ANEXO: "N"
        };
    }

    function resolveServerFilterValues(params) {
        var defaults = defaultServerFilterValues();
        var resolved = {
            P_REFERENCIA: params.P_REFERENCIA || defaults.P_REFERENCIA,
            P_SOMENTE_PENDENTES: params.P_SOMENTE_PENDENTES || defaults.P_SOMENTE_PENDENTES,
            P_POSSUI_ANEXO: params.P_POSSUI_ANEXO || defaults.P_POSSUI_ANEXO
        };
        if (resolved.P_SOMENTE_PENDENTES !== "S") {
            resolved.P_SOMENTE_PENDENTES = "N";
        }
        if (resolved.P_POSSUI_ANEXO !== "S") {
            resolved.P_POSSUI_ANEXO = "N";
        }
        return resolved;
    }

    function mergeServerFilterParams(search, values) {
        var merged = parseServerFilterParams(search);
        var resolved = resolveServerFilterValues(values || {});
        merged.P_REFERENCIA = resolved.P_REFERENCIA;
        merged.P_SOMENTE_PENDENTES = resolved.P_SOMENTE_PENDENTES;
        merged.P_POSSUI_ANEXO = resolved.P_POSSUI_ANEXO;
        return merged;
    }

    function syncServerFilterControlsFromQuery(search) {
        var resolved = resolveServerFilterValues(parseServerFilterParams(search));
        var monthInput = document.getElementById("server-filter-reference");
        var pendingInput = document.getElementById("server-filter-pending");
        var attachmentInput = document.getElementById("server-filter-attachment");
        if (monthInput) {
            monthInput.value = monthInputFromReference(resolved.P_REFERENCIA);
        }
        if (pendingInput) {
            pendingInput.checked = resolved.P_SOMENTE_PENDENTES === "S";
        }
        if (attachmentInput) {
            attachmentInput.checked = resolved.P_POSSUI_ANEXO === "S";
        }
    }

    function readServerFilterControls() {
        var monthInput = document.getElementById("server-filter-reference");
        var pendingInput = document.getElementById("server-filter-pending");
        var attachmentInput = document.getElementById("server-filter-attachment");
        return {
            P_REFERENCIA: referenceFromMonthInput(monthInput ? monthInput.value : ""),
            P_SOMENTE_PENDENTES: pendingInput && pendingInput.checked ? "S" : "N",
            P_POSSUI_ANEXO: attachmentInput && attachmentInput.checked ? "S" : "N"
        };
    }

    function reloadWithServerFilters(values) {
        saveClientFilterState();
        var targetUrl;
        try {
            targetUrl = new URL(window.location.href);
        } catch (error) {
            targetUrl = null;
        }
        if (targetUrl) {
            var merged = mergeServerFilterParams(targetUrl.search, values);
            targetUrl.searchParams.set("P_REFERENCIA", merged.P_REFERENCIA);
            targetUrl.searchParams.set("P_SOMENTE_PENDENTES", merged.P_SOMENTE_PENDENTES);
            targetUrl.searchParams.set("P_POSSUI_ANEXO", merged.P_POSSUI_ANEXO);
            try {
                window.sessionStorage.setItem(SERVER_QUERY_KEY, targetUrl.search);
            } catch (storageError) {
                console.warn("[facilita-apuracao] não foi possível guardar parâmetros do gadget", storageError);
            }
            window.location.assign(targetUrl.toString());
            return;
        }
        var fallback = mergeServerFilterParams(window.location.search, values);
        var query = "?"
            + "P_REFERENCIA=" + encodeURIComponent(fallback.P_REFERENCIA)
            + "&P_SOMENTE_PENDENTES=" + encodeURIComponent(fallback.P_SOMENTE_PENDENTES)
            + "&P_POSSUI_ANEXO=" + encodeURIComponent(fallback.P_POSSUI_ANEXO);
        window.location.assign(window.location.pathname + query + (window.location.hash || ""));
    }

    function saveClientFilterState() {
        var search = document.getElementById("filter-text");
        var field = document.getElementById("filter-field");
        syncColumnFiltersFromDom();
        try {
            window.sessionStorage.setItem(CLIENT_FILTER_KEY, JSON.stringify({
                search: search ? search.value : "",
                field: field ? field.value : "T",
                page: pageState.page,
                pageSize: pageState.pageSize,
                columnFilters: columnFilters
            }));
        } catch (error) {
            console.warn("[facilita-apuracao] não foi possível guardar filtros locais", error);
        }
    }

    function restoreClientFilterState() {
        try {
            var raw = window.sessionStorage.getItem(CLIENT_FILTER_KEY);
            if (!raw) {
                return;
            }
            var state = JSON.parse(raw);
            var search = document.getElementById("filter-text");
            var field = document.getElementById("filter-field");
            var pageSize = document.getElementById("page-size");
            if (search && state.search != null) {
                search.value = state.search;
            }
            if (field && state.field) {
                field.value = state.field;
            }
            if (state.pageSize) {
                pageState.pageSize = parsePageSize(String(state.pageSize));
                if (pageSize) {
                    pageSize.value = String(pageState.pageSize);
                }
            }
            if (state.page) {
                pageState.page = Math.max(1, parseInt(state.page, 10) || 1);
            }
            if (state.columnFilters && typeof state.columnFilters === "object") {
                columnFilters = state.columnFilters;
                restoreColumnFilterInputs();
            }
        } catch (error) {
            console.warn("[facilita-apuracao] filtros locais inválidos", error);
        }
    }

    function refreshGridFromServer(selectedNuapuracao) {
        var requestId = ++gridRefreshSequence;
        saveClientFilterState();
        setLoading(true);
        var base = window.FACILITA_APURACAO_BASE || "";
        var url = base + "/dados.jsp" + getServerFilterQuery();
        fetch(url, { credentials: "same-origin", headers: { Accept: "text/html" } })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                if (requestId !== gridRefreshSequence) {
                    return;
                }
                var documentResponse = new DOMParser().parseFromString(html, "text/html");
                var newContainer = documentResponse.getElementById("data-container");
                var currentContainer = document.getElementById("data-container");
                if (!newContainer || !currentContainer) {
                    throw new Error("data-container ausente na resposta");
                }
                currentContainer.innerHTML = newContainer.innerHTML;
                rows = readRows();
                restoreClientFilterState();
                applyFilters(true);
                var targetId = selectedNuapuracao || (selectedRow && selectedRow.nuapuracao) || "";
                if (targetId) {
                    var match = filteredRows.find(function (row) {
                        return row.nuapuracao === targetId;
                    });
                    if (match) {
                        selectRow(match);
                    } else {
                        selectedRow = null;
                        clearDetailSelection();
                        document.dispatchEvent(new CustomEvent("facilita-apuracao:cleared"));
                    }
                }
            })
            .catch(function (error) {
                if (requestId !== gridRefreshSequence) {
                    return;
                }
                showError("Não foi possível atualizar a lista.");
                console.error("[facilita-apuracao] atualização da grade", error);
            })
            .finally(function () {
                if (requestId === gridRefreshSequence) {
                    setLoading(false);
                }
            });
    }

    function matchesSearchToken(value, query) {
        return String(value).toLowerCase().indexOf(query) !== -1;
    }

    function dateSearchVariants(isoValue) {
        if (!isoValue) {
            return [];
        }
        var iso = String(isoValue).trim();
        var variants = [iso];
        var br = formatDate(iso);
        if (br !== "—") {
            variants.push(br);
        }
        return variants;
    }

    function columnFilterSearchValues(row, column) {
        var values = [];
        if (column.kind === "estado") {
            values.push(row.confirmado === "S" ? "Confirmada" : "Pendente");
            values.push(row.confirmado === "S" ? "confirmada" : "pendente");
            return values;
        }
        if (column.kind === "flag") {
            values.push(row[column.id] === "S" ? "Sim" : "Não");
            values.push(row[column.id] === "S" ? "sim" : "nao");
            values.push(row[column.id] || "");
            return values;
        }
        var formatted = formatColumnValue(column, row);
        if (formatted && formatted !== "—") {
            values.push(formatted);
        }
        var raw = row[column.id];
        if (raw != null && raw !== "") {
            values.push(String(raw));
        }
        if (column.kind === "date") {
            values = values.concat(dateSearchVariants(row[column.id]));
        }
        if (column.kind === "money") {
            values.push(numberFormat.format(row[column.id] || 0));
        }
        return values;
    }

    function rowMatchesColumnFilters(row) {
        var keys = Object.keys(columnFilters);
        if (!keys.length) {
            return true;
        }
        for (var i = 0; i < keys.length; i++) {
            var columnId = keys[i];
            var query = String(columnFilters[columnId] || "").trim().toLowerCase();
            if (!query) {
                continue;
            }
            var column = columnById(columnId);
            if (!column || !visibleColumns[columnId]) {
                continue;
            }
            var matches = columnFilterSearchValues(row, column).some(function (value) {
                return matchesSearchToken(value, query);
            });
            if (!matches) {
                return false;
            }
        }
        return true;
    }

    function searchableValues(row, selectedField) {
        var fields = {
            NUAPURACAO: [row.nuapuracao],
            CODCONTA: [row.codconta],
            NUMCONTRATO: [row.numcontrato],
            NOMECLIENTE: [row.nomeCliente],
            RAZAOCLIENTE: [row.razaoCliente],
            NOMETITULAR: [row.nomeTitular],
            NOMEOPERADORA: [row.nomeOperadora],
            APELIDOVEND: [row.apelidoVend],
            CLIENTE: [row.cliente],
            OPERADORA: [row.operadora],
            TITULARIDADE: [row.titularidade],
            NUNOTA: [row.nunota],
            VALOR: [numberFormat.format(row.valor)],
            DTVENC: dateSearchVariants(row.dtvenc),
            REFERENCIA: dateSearchVariants(row.referencia)
        };

        if (selectedField !== "T" && fields[selectedField]) {
            return fields[selectedField];
        }
        return [
            row.nuapuracao,
            row.codconta,
            row.numcontrato,
            row.nomeCliente,
            row.razaoCliente,
            row.nunota,
            numberFormat.format(row.valor)
        ].concat(dateSearchVariants(row.dtvenc)).concat(dateSearchVariants(row.referencia));
    }

    function render() {
        renderGrid();
        renderCounters();
        updateSummary();
        updateSortIndicators();
    }

    function renderGrid() {
        var body = document.getElementById("grid-apuracoes-body");
        var empty = document.getElementById("grid-empty");
        if (!body) {
            return;
        }

        body.textContent = "";
        clampPage();
        getPageRows().forEach(function (row) {
            var tr = document.createElement("tr");
            tr.tabIndex = 0;
            tr.setAttribute("role", "button");
            tr.setAttribute("aria-label", "Selecionar apuração " + row.nuapuracao);
            tr.setAttribute("aria-selected", String(isSelected(row)));
            tr.className = isSelected(row) ? "is-selected" : "";
            tr.addEventListener("click", function () {
                selectRow(row);
            });
            tr.addEventListener("dblclick", function () {
                selectRow(row);
                openTask(row);
            });
            tr.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectRow(row);
                }
            });

            orderedColumns().forEach(function (column) {
                var cell = column.kind === "estado" ? statusCell(row) : textCell(formatColumnValue(column, row));
                if (column.kind === "money") {
                    cell.className = "num";
                }
                cell.setAttribute("data-column", column.id);
                tr.appendChild(cell);
            });
            body.appendChild(tr);
        });
        applyColumnVisibility();
        applyPinnedColumn();

        if (empty) {
            empty.hidden = filteredRows.length !== 0;
        }
        updatePaginationControls();
    }

    function renderCounters() {
        setText("row-count", String(filteredRows.length));
        setText("pending-count", String(filteredRows.filter(function (row) {
            return row.confirmado !== "S";
        }).length));
        setText("attachment-count", String(filteredRows.filter(function (row) {
            return row.possuiAnexo === "S";
        }).length));
    }

    function updateSummary() {
        var gridMeta = document.getElementById("grid-meta");
        if (selectedRow) {
            setText("grid-meta", "Apuração " + selectedRow.nuapuracao + " selecionada.");
        } else if (filteredRows.length === 0) {
            setText("grid-meta", "Nenhum resultado para os filtros atuais.");
        } else {
            setText("grid-meta", "Uma linha por apuração");
        }
    }

    function selectRow(row) {
        selectedRow = row;
        renderGrid();
        updateSummary();
        document.dispatchEvent(new CustomEvent("facilita-apuracao:selected", {
            detail: row
        }));
    }

    function loadDetail(row) {
        var sequence = ++detailRequestSequence;
        var panel = document.getElementById("detail-panel");
        var empty = document.getElementById("detail-empty");
        if (!panel || !empty) {
            return;
        }
        selectedDetail = null;
        empty.hidden = true;
        panel.hidden = false;
        setText("detail-title", "Apuração " + row.nuapuracao);
        setText("detail-state", "Carregando");
        clearAccess();
        setDetailActions(null);
        clearDetailMessage();

        var base = window.FACILITA_APURACAO_BASE || "";
        var url = base + "/detalhe_payload.jsp?nuapuracao=" + encodeURIComponent(row.nuapuracao);
        fetch(url, { credentials: "same-origin", headers: { Accept: "text/html" } })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                if (sequence !== detailRequestSequence) {
                    return;
                }
                var documentResponse = new DOMParser().parseFromString(html, "text/html");
                var detailElement = documentResponse.querySelector(".detail-row");
                if (!detailElement) {
                    throw new Error("Apuração não encontrada");
                }
                selectedDetail = readDetail(detailElement);
                renderDetail(selectedDetail);
            })
            .catch(function (error) {
                if (sequence !== detailRequestSequence) {
                    return;
                }
                setText("detail-state", "Indisponível");
                setDetailMessage("A consulta do detalhe falhou. Código: FA-D" + Date.now());
                console.error("[facilita-apuracao] detalhe", error);
            });
    }

    function clearDetailSelection() {
        detailRequestSequence += 1;
        selectedDetail = null;
        var panel = document.getElementById("detail-panel");
        var empty = document.getElementById("detail-empty");
        if (panel) {
            panel.hidden = true;
        }
        if (empty) {
            empty.hidden = false;
        }
        clearAccess();
    }

    function clearAccess() {
        var access = document.getElementById("access-body");
        if (access) {
            access.textContent = "";
        }
    }

    function readDetail(element) {
        var data = element.dataset;
        return {
            nuapuracao: data.nuapuracao || "",
            codconta: data.codconta || "",
            numcontrato: data.numcontrato || "",
            nunota: data.nunota || "",
            sequenciacon: data.sequenciacon || "",
            referencia: data.referencia || "",
            referenciaadiada: data.referenciaadiada || "",
            dtvenc: data.dtvenc || "",
            valor: parseNumber(data.valor),
            valorref: parseNumber(data.valorref),
            confirmado: flag(data.confirmado),
            auditoriafinalizada: flag(data.auditoriafinalizada),
            emailenviado: flag(data.emailenviado),
            faturamentoliberado: flag(data.faturamentoliberado),
            idinstprn: data.idinstprn || "",
            nufila: data.nufila || "",
            plano: data.plano || "",
            adDhalter: data.adDhalter || "",
            possuiAnexo: flag(data.possuiAnexo),
            acessoLogin: data.acessoLogin || "",
            acessoSenha: data.acessoSenha || "",
            acessoCpf: data.acessoCpf || "",
            acessoCnpj: data.acessoCnpj || "",
            acessoEmail: data.acessoEmail || "",
            acessoLinha: data.acessoLinha || ""
        };
    }

    function renderDetail(detail) {
        renderAccess(detail);
        setInputValue("edit-dtvenc", detail.dtvenc);
        setInputValue("edit-valor", detail.valor ? String(detail.valor) : "");
        setText("detail-state", detail.confirmado === "S" ? "Confirmada" : "Pendente");
        setDetailActions(detail);
    }

    function renderAccess(detail) {
        var body = document.getElementById("access-body");
        if (!body) {
            return;
        }
        body.textContent = "";
        [
            ["Login", detail.acessoLogin],
            ["CPF", detail.acessoCpf],
            ["E-mail", detail.acessoEmail],
            ["CNPJ", detail.acessoCnpj],
            ["Linha gestora", detail.acessoLinha]
        ].forEach(function (entry) {
            appendDetailItem(body, entry[0], entry[1] || "não definido");
        });
        appendSecretItem(body, detail.acessoSenha || "");
    }

    function appendDetailItem(body, labelText, valueText) {
        var item = document.createElement("div");
        var label = document.createElement("span");
        var value = document.createElement("strong");
        item.className = "detail-grid__item";
        label.className = "detail-grid__label";
        value.className = "detail-grid__value";
        label.textContent = labelText;
        value.textContent = valueText || "—";
        item.appendChild(label);
        item.appendChild(value);
        body.appendChild(item);
    }

    function appendSecretItem(body, senha) {
        var item = document.createElement("div");
        var label = document.createElement("span");
        var row = document.createElement("div");
        var value = document.createElement("strong");
        var button = document.createElement("button");
        var visivel = false;
        item.className = "detail-grid__item";
        label.className = "detail-grid__label";
        row.className = "access-secret";
        value.className = "detail-grid__value";
        label.textContent = "Senha";
        value.textContent = senha ? "••••••••" : "não definido";
        button.type = "button";
        button.className = "btn btn--quiet";
        button.textContent = "Mostrar";
        button.hidden = !senha;
        button.onclick = function () {
            visivel = !visivel;
            value.textContent = visivel ? senha : "••••••••";
            button.textContent = visivel ? "Ocultar" : "Mostrar";
        };
        row.appendChild(value);
        row.appendChild(button);
        item.appendChild(label);
        item.appendChild(row);
        body.appendChild(item);
    }

    function setDetailActions(detail) {
        var task = document.getElementById("btn-open-task");
        var attachment = document.getElementById("btn-view-attachment");
        var confirm = document.getElementById("btn-confirm");
        var save = document.getElementById("btn-save-edit");
        var upload = document.getElementById("btn-upload-attachment");
        if (task) {
            task.disabled = !detail || !detail.idinstprn;
            task.title = detail && detail.idinstprn ? "Consultar tarefa pendente" : "Sem processo de workflow";
            task.onclick = function () {
                openTask(detail);
            };
        }
        if (attachment) {
            attachment.disabled = !detail || detail.possuiAnexo !== "S";
            attachment.onclick = function () {
                viewSelectedAttachments();
            };
        }
        if (confirm) {
            confirm.disabled = !detail;
            confirm.textContent = detail && detail.confirmado === "S" ? "Solicitar nova auditoria" : "Confirmar";
            confirm.title = detail && detail.confirmado === "S" ? "Solicitar nova auditoria" : "Confirmar apuração";
            confirm.onclick = function () {
                confirmSelectedApuracao();
            };
        }
        if (save) {
            save.disabled = !detail;
        }
        if (upload) {
            upload.disabled = !detail;
        }
    }

    function resolveFacadeServiceName(operation) {
        if (facadeConfig.servicePrefix) {
            return facadeConfig.servicePrefix + "." + operation;
        }
        return facadeModuleName + "@" + facadeServiceName + "." + operation;
    }

    function resolveFacadeServiceUrl(serviceName) {
        if (facadeConfig.servicePrefix) {
            return window.location.origin + "/mge/service.sbr?serviceName="
                + encodeURIComponent(serviceName) + "&outputType=json";
        }
        return window.location.origin + facadeServicePath + "?serviceName="
            + encodeURIComponent(serviceName) + "&outputType=json";
    }

    function chamarServicoMge(serviceName, requestBody) {
        return fetch(window.location.origin + "/mge/service.sbr?serviceName=" + serviceName + "&outputType=json", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json;charset=UTF-8", Accept: "application/json" },
            body: JSON.stringify({ serviceName: serviceName, requestBody: requestBody })
        }).then(function (response) {
            return response.text().then(function (text) {
                if (text && /^\s*</.test(text)) {
                    throw createFacadeError(
                        "Resposta não é JSON (sessão expirada ou serviço indisponível).",
                        "INTEGRATION"
                    );
                }
                var data;
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (error) {
                    throw createFacadeError("O serviço retornou uma resposta inválida.", "INTEGRATION");
                }
                var status = String(data.status);
                if (status !== "1" && status !== "2") {
                    throw createFacadeError(
                        data.statusMessage || "Não foi possível associar o anexo.",
                        "INTEGRATION"
                    );
                }
                return data;
            });
        });
    }

    function acionarBotaoJava(dados, idBotao, linha) {
        var parametros = Object.keys(dados).map(function (chave) {
            return {
                type: "S",
                paramName: chave,
                $: dados[chave] == null ? "" : String(dados[chave])
            };
        });
        var campos = [];
        if (linha) {
            Object.keys(linha).forEach(function (chave) {
                if (linha[chave] != null && linha[chave] !== "") {
                    campos.push({ fieldName: chave, $: String(linha[chave]) });
                }
            });
        }
        var javaCall = {
            actionID: idBotao,
            params: { param: parametros }
        };
        if (campos.length) {
            javaCall.rows = { row: { field: campos } };
        }
        var serviceName = "ActionButtonsSP.executeJava";
        var requestBody = { javaCall: javaCall };
        if (window.ServiceProxy && typeof window.ServiceProxy.callService === "function") {
            return new Promise(function (resolve, reject) {
                window.ServiceProxy.callService(serviceName, requestBody).then(function (response) {
                    try {
                        var data = response && response.responseBody ? response : { status: "1", statusMessage: response };
                        var status = String(data.status == null ? "1" : data.status);
                        var mensagem = data.statusMessage || (response && response.statusMessage) || "";
                        if (!mensagem && response && response.responseBody) {
                            mensagem = response.responseBody.statusMessage || response.responseBody.$ || "";
                        }
                        if (status !== "1" && status !== "2") {
                            throw createFacadeError(
                                data.statusMessage || "Não foi possível executar o botão de ação.",
                                "INTEGRATION"
                            );
                        }
                        resolve(mensagem || "Valor e vencimento atualizados.");
                    } catch (error) {
                        reject(error);
                    }
                }, function (error) {
                    var mensagem = error && (error.statusMessage || error.message) || "Não foi possível executar o botão de ação.";
                    reject(createFacadeError(mensagem, "INTEGRATION"));
                });
            });
        }
        return fetch(window.location.origin + "/mge/service.sbr?serviceName=" + serviceName + "&outputType=json", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json;charset=UTF-8", Accept: "application/json" },
            body: JSON.stringify({
                serviceName: serviceName,
                requestBody: requestBody
            })
        }).then(function (response) {
            return response.text().then(function (text) {
                if (text && /^\s*</.test(text)) {
                    throw createFacadeError(
                        "Resposta não é JSON (sessão expirada ou serviço indisponível).",
                        "INTEGRATION"
                    );
                }
                var data;
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (error) {
                    throw createFacadeError("O botão de ação retornou uma resposta inválida.", "INTEGRATION");
                }
                var status = String(data.status);
                var mensagem = data.statusMessage || "Valor e vencimento atualizados.";
                if (status !== "1" && status !== "2") {
                    throw createFacadeError(
                        data.statusMessage || "Não foi possível salvar as alterações.",
                        "INTEGRATION"
                    );
                }
                return mensagem;
            });
        });
    }

    function callFacade(operation, payload) {
        var serviceName = resolveFacadeServiceName(operation);
        var requestBody = { request: payload || {} };
        if (window.ServiceProxy && typeof window.ServiceProxy.callService === "function") {
            return new Promise(function (resolve, reject) {
                window.ServiceProxy.callService(serviceName, requestBody).then(function (response) {
                    try {
                        resolve(readFacadeResponse(response));
                    } catch (error) {
                        reject(error);
                    }
                }, reject);
            });
        }

        var url = resolveFacadeServiceUrl(serviceName);
        return fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json;charset=UTF-8", Accept: "application/json" },
            body: JSON.stringify({ serviceName: serviceName, requestBody: requestBody })
        }).then(function (response) {
            return response.text().then(function (text) {
                if (text && /^\s*</.test(text)) {
                    throw createFacadeError(
                        "Resposta não é JSON (sessão expirada ou serviço indisponível).",
                        "INTEGRATION"
                    );
                }
                var data;
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (error) {
                    throw createFacadeError("A fachada retornou uma resposta inválida.", "INTEGRATION");
                }
                if (!response.ok) {
                    throw createFacadeError("Não foi possível concluir a operação.", "INTEGRATION", data.correlationId);
                }
                return readFacadeResponse(data);
            });
        });
    }

    function readFacadeResponse(response) {
        var data = response || {};
        if (data.status !== undefined && String(data.status) !== "1") {
            throw createFacadeError(data.statusMessage || "A fachada recusou a operação.", "INTEGRATION", data.correlationId);
        }
        var body = data.responseBody !== undefined ? data.responseBody : data;
        if (body && body.ok === false) {
            throw createFacadeError(body.error && body.error.message || "A operação foi recusada.", body.error && body.error.code, body.correlationId);
        }
        if (body && body.ok === true) {
            return body.data;
        }
        if (body && body.data !== undefined && body.error === null) {
            return body.data;
        }
        return body && body.response !== undefined ? body.response : body;
    }

    function observedEditionVersion(detail) {
        if (!detail) {
            return null;
        }
        if (detail.adDhalter) {
            return detail.adDhalter;
        }
        var valueToken = detail.valor == null || !isFinite(detail.valor) ? "" : String(detail.valor);
        var dueToken = detail.dtvenc || "";
        return valueToken + "|" + dueToken;
    }

    function createFacadeError(message, code, correlationId) {
        var error = new Error(message || "Falha na fachada transacional.");
        error.code = code || "INTERNAL";
        error.correlationId = correlationId || "FA-" + Date.now();
        return error;
    }

    function updateSelectedApuracao() {
        if (!selectedDetail) {
            return;
        }
        var date = getInputValue("edit-dtvenc");
        var valueText = getInputValue("edit-valor").replace(",", ".");
        var value = Number(valueText);
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setDetailMessage("Informe um vencimento válido.");
            return;
        }
        if (!valueText || !isFinite(value) || value < 0) {
            setDetailMessage("Informe um valor maior ou igual a zero.");
            return;
        }
        var idBotao = Number(facadeConfig.atualizarBotaoId);
        if (!idBotao) {
            setDetailMessage("O botão de ação de valor e vencimento ainda não está configurado.");
            return;
        }
        var requestId = ++actionRequestSequence;
        setActionBusy(true, "Salvando alterações…");
        acionarBotaoJava({
            NUAPURACAO: String(selectedDetail.nuapuracao),
            VALOR: valueText,
            DTVENC: date
        }, idBotao).then(function (mensagem) {
            if (requestId !== actionRequestSequence) {
                return;
            }
            clearDetailMessage();
            showSuccessDialog(mensagem);
        }).catch(function (error) {
            if (requestId === actionRequestSequence) {
                showActionError(error, "Não foi possível salvar as alterações.");
            }
        }).finally(function () {
            setActionBusy(false);
        });
    }

    function confirmSelectedApuracao() {
        if (!selectedDetail) {
            return;
        }
        var operation = selectedDetail.confirmado === "S" ? "solicitarNovaAuditoria" : "confirmar";
        var message = selectedDetail.confirmado === "S"
            ? "Solicitar nova auditoria para esta apuração?"
            : "Confirmar esta apuração?";
        if (!window.confirm(message)) {
            return;
        }
        var idBotao = Number(facadeConfig.confirmarBotaoId);
        if (!idBotao) {
            setDetailMessage("O botão de confirmar ainda não está configurado.");
            return;
        }
        var requestId = ++actionRequestSequence;
        setActionBusy(true, "Processando operação…");
        acionarBotaoJava({
            NUAPURACAO: String(selectedDetail.nuapuracao)
        }, idBotao, {
            NUAPURACAO: String(selectedDetail.nuapuracao)
        }).then(function (mensagem) {
            if (requestId !== actionRequestSequence) {
                return;
            }
            clearDetailMessage();
            showSuccessDialog(mensagem, selectedDetail.confirmado === "S"
                ? "Nova auditoria solicitada"
                : "Apuração confirmada");
        }).catch(function (error) {
            if (requestId === actionRequestSequence) {
                showActionError(error, "Não foi possível concluir a operação.");
            }
        }).finally(function () {
            setActionBusy(false);
        });
    }

    function uploadSelectedAttachment() {
        if (!selectedDetail) {
            return;
        }
        var fileInput = document.getElementById("attachment-file");
        var typeInput = document.getElementById("attachment-type");
        var file = fileInput && fileInput.files ? fileInput.files[0] : null;
        var type = typeInput ? typeInput.value : "";
        if (!file) {
            setDetailMessage("Selecione um arquivo antes de enviar.");
            return;
        }
        if (!type) {
            setDetailMessage("Selecione o tipo do anexo antes de enviar.");
            return;
        }
        var sessionKey = "ANEXO_SISTEMA_bhApuracao_" + selectedDetail.nuapuracao;
        var formData = new FormData();
        formData.append("arquivo", file, file.name || "anexo");
        setActionBusy(true, "Enviando anexo…");
        fetch(window.location.origin + "/mge/sessionUpload.mge?sessionkey=" + encodeURIComponent(sessionKey) + "&fitem=S&salvar=S&useCache=N", {
            method: "POST",
            credentials: "same-origin",
            body: formData
        }).then(function (response) {
            if (!response.ok) {
                throw createFacadeError("O upload do arquivo foi recusado.", "INTEGRATION");
            }
            return chamarServicoMge("AnexoSistemaSP.salvar", {
                params: {
                    pkEntity: String(selectedDetail.nuapuracao),
                    keySession: sessionKey,
                    nameEntity: "bhApuracao",
                    description: type,
                    keyAttach: "",
                    typeAcess: "ALL",
                    typeApres: "GLO",
                    nuAttach: "",
                    nameAttach: file.name || "anexo",
                    fileSelect: 1,
                    oldFile: file.name || "anexo"
                }
            });
        }).then(function () {
            if (fileInput) {
                fileInput.value = "";
            }
            clearDetailMessage();
            showSuccessDialog("Arquivo associado à apuração.", "Anexo enviado");
        }).catch(function (error) {
            showActionError(error, "Não foi possível associar o anexo.");
        }).finally(function () {
            setActionBusy(false);
        });
    }

    function viewSelectedAttachments() {
        if (!selectedDetail || selectedDetail.possuiAnexo !== "S" || !selectedDetail.nuapuracao) {
            return;
        }
        var url = "/facilitatelecom/visualizadorArquivos.facilita?nuApuracao="
            + encodeURIComponent(selectedDetail.nuapuracao);
        window.open(url, "_blank");
    }

    function openTask(row) {
        var alvo = row || selectedDetail;
        if (!alvo || !alvo.idinstprn) {
            setDetailMessage("Não há processo de workflow para esta apuração.");
            return;
        }
        var idBotao = Number(facadeConfig.tarefaBotaoId);
        if (!idBotao) {
            setDetailMessage("O botão de ação da tarefa ainda não está configurado.");
            return;
        }
        setActionBusy(true, "Consultando tarefa…");
        acionarBotaoJava({
            NUAPURACAO: String(alvo.nuapuracao)
        }, idBotao, {
            NUAPURACAO: String(alvo.nuapuracao)
        }).then(function (mensagem) {
            var taskId = String(mensagem || "").trim();
            if (!/^\d+$/.test(taskId) || taskId === "0") {
                throw createFacadeError("Não há tarefa pendente para esta apuração.", "BUSINESS_RULE");
            }
            var openApp = typeof window.openApp === "function"
                ? window.openApp
                : window.parent && typeof window.parent.openApp === "function" ? window.parent.openApp.bind(window.parent) : null;
            if (!openApp) {
                throw createFacadeError("A abertura de tarefas não está disponível neste contexto.", "INTEGRATION");
            }
            openApp("br.com.sankhya.workflow.listatarefa", {
                IDINSTPRN: alvo.idinstprn,
                IDINSTTAR: taskId
            });
        }).catch(function (error) {
            showActionError(error, "Não foi possível abrir a tarefa.");
        }).finally(function () {
            setActionBusy(false);
        });
    }

    function setActionBusy(busy, message) {
        ["btn-open-task", "btn-view-attachment", "btn-confirm", "btn-save-edit", "btn-upload-attachment"].forEach(function (id) {
            var button = document.getElementById(id);
            if (button) {
                button.dataset.actionDisabled = busy ? "S" : "N";
                if (busy) {
                    button.disabled = true;
                }
            }
        });
        if (!busy) {
            setDetailActions(selectedDetail);
        }
        if (message) {
            setDetailMessage(message);
        }
    }

    function showActionError(error, fallback) {
        var message = error && error.message ? error.message : fallback;
        clearDetailMessage();
        showErrorDialog(message);
        console.error("[facilita-apuracao] operação transacional", error);
    }

    function mensagemVisivel(texto) {
        var limpo = String(texto || "").replace(/<[^>]+>/g, " ");
        limpo = limpo.replace(/Regra Personalizada:\s*/gi, "");
        limpo = limpo.replace(/\s+/g, " ").trim();
        if (/nenhuma tarefa pendente para a apura/i.test(limpo)) {
            return "Nenhuma tarefa pendente para a apuração.";
        }
        return limpo;
    }

    function showErrorDialog(message) {
        var dialog = document.getElementById("error-dialog");
        var text = document.getElementById("error-dialog-message");
        var close = document.getElementById("error-dialog-close");
        if (!dialog || !text || !close) {
            window.alert(message || "Não foi possível concluir a operação.");
            return;
        }
        text.textContent = mensagemVisivel(message) || "Não foi possível concluir a operação.";
        dialog.hidden = false;
        close.onclick = function () {
            dialog.hidden = true;
        };
        close.focus();
    }

    function showSuccessDialog(message, title) {
        var dialog = document.getElementById("success-dialog");
        var text = document.getElementById("success-dialog-message");
        var heading = document.getElementById("success-dialog-title");
        var close = document.getElementById("success-dialog-close");
        if (!dialog || !text || !close) {
            window.alert(message || "Valor e vencimento atualizados.");
            reloadAfterAction();
            return;
        }
        var selectedNuapuracao = selectedDetail ? selectedDetail.nuapuracao : "";
        if (heading) {
            heading.textContent = title || "Alterações salvas";
        }
        text.textContent = message || "Valor e vencimento atualizados.";
        dialog.hidden = false;
        close.onclick = function () {
            dialog.hidden = true;
            reloadAfterAction(selectedNuapuracao);
        };
        close.focus();
    }

    function reloadAfterAction(selectedNuapuracao) {
        window.setTimeout(function () {
            refreshGridFromServer(selectedNuapuracao || "");
        }, 200);
    }

    function getInputValue(id) {
        var input = document.getElementById(id);
        return input ? String(input.value || "").trim() : "";
    }

    function setInputValue(id, value) {
        var input = document.getElementById(id);
        if (input) {
            input.value = value || "";
        }
    }

    function setDetailMessage(message) {
        var element = document.getElementById("detail-message");
        if (element) {
            element.hidden = false;
            element.textContent = message;
        }
    }

    function clearDetailMessage() {
        var element = document.getElementById("detail-message");
        if (element) {
            element.hidden = true;
            element.textContent = "";
        }
    }

    function statusCell(row) {
        var cell = document.createElement("td");
        var badge = document.createElement("span");
        badge.className = "badge " + (row.confirmado === "S" ? "badge--ok" : "badge--pending");
        badge.textContent = row.confirmado === "S" ? "Confirmada" : "Pendente";
        cell.appendChild(badge);
        return cell;
    }

    function textCell(value) {
        var cell = document.createElement("td");
        cell.textContent = value || "—";
        return cell;
    }

    function numberCell(value) {
        var cell = textCell(numberFormat.format(value || 0));
        cell.className = "num";
        return cell;
    }

    function sortKeyForSearchField(fieldValue) {
        var map = {
            T: "numcontrato",
            NUAPURACAO: "nuapuracao",
            CODCONTA: "codconta",
            NUMCONTRATO: "numcontrato",
            NOMECLIENTE: "nomeCliente",
            RAZAOCLIENTE: "razaoCliente",
            NOMETITULAR: "nomeTitular",
            NOMEOPERADORA: "nomeOperadora",
            APELIDOVEND: "apelidoVend",
            CLIENTE: "cliente",
            OPERADORA: "operadora",
            TITULARIDADE: "titularidade",
            NUNOTA: "nunota",
            VALOR: "valor",
            DTVENC: "dtvenc"
        };
        return map[fieldValue] || "numcontrato";
    }

    function syncSortWithSearchField() {
        if (manualColumnSort) {
            return;
        }
        var field = document.getElementById("filter-field");
        sortState.key = sortKeyForSearchField(field ? field.value : "T");
        sortState.direction = 1;
    }

    function parsePageSize(value) {
        var parsed = parseInt(String(value || "15"), 10);
        if (!isFinite(parsed) || parsed <= 0) {
            return 15;
        }
        return parsed;
    }

    function getTotalPages() {
        if (filteredRows.length === 0) {
            return 1;
        }
        return Math.ceil(filteredRows.length / pageState.pageSize);
    }

    function clampPage() {
        var totalPages = getTotalPages();
        if (pageState.page > totalPages) {
            pageState.page = totalPages;
        }
        if (pageState.page < 1) {
            pageState.page = 1;
        }
    }

    function getPageRows() {
        clampPage();
        var start = (pageState.page - 1) * pageState.pageSize;
        return filteredRows.slice(start, start + pageState.pageSize);
    }

    function updatePaginationControls() {
        var totalPages = getTotalPages();
        var totalRows = filteredRows.length;
        var start = totalRows === 0 ? 0 : (pageState.page - 1) * pageState.pageSize + 1;
        var end = totalRows === 0 ? 0 : Math.min(pageState.page * pageState.pageSize, totalRows);
        setText("page-status", totalRows === 0
            ? "Nenhum registro"
            : "Página " + pageState.page + " de " + totalPages + " (" + start + "–" + end + " de " + totalRows + ")");
        var prev = document.getElementById("page-prev");
        var next = document.getElementById("page-next");
        if (prev) {
            prev.disabled = pageState.page <= 1 || totalRows === 0;
        }
        if (next) {
            next.disabled = pageState.page >= totalPages || totalRows === 0;
        }
    }

    function loadPagePreferences() {
        try {
            var stored = window.localStorage.getItem("facilita-apuracao-faturas:page-size:v1");
            if (!stored) {
                return;
            }
            pageState.pageSize = parsePageSize(stored);
            var pageSize = document.getElementById("page-size");
            if (pageSize) {
                pageSize.value = String(pageState.pageSize);
            }
        } catch (error) {
            console.warn("[facilita-apuracao] preferências de paginação indisponíveis");
        }
    }

    function savePagePreferences() {
        try {
            window.localStorage.setItem("facilita-apuracao-faturas:page-size:v1", String(pageState.pageSize));
        } catch (error) {
            console.warn("[facilita-apuracao] preferências de paginação não persistidas");
        }
    }

    function sortBy(key) {
        manualColumnSort = true;
        if (sortState.key === key) {
            sortState.direction *= -1;
        } else {
            sortState.key = key;
            sortState.direction = 1;
        }
        applySorting();
        renderGrid();
        updateSortIndicators();
    }

    function applySorting() {
        if (!sortState.key) {
            sortState.key = "numcontrato";
        }
        filteredRows.sort(function (left, right) {
            var a = sortableValue(left, sortState.key);
            var b = sortableValue(right, sortState.key);
            if (a < b) {
                return -1 * sortState.direction;
            }
            if (a > b) {
                return 1 * sortState.direction;
            }
            return 0;
        });
    }

    function columnById(id) {
        for (var i = 0; i < GRID_COLUMNS.length; i++) {
            if (GRID_COLUMNS[i].id === id) {
                return GRID_COLUMNS[i];
            }
        }
        return null;
    }

    function formatColumnValue(column, row) {
        var value = row[column.id];
        if (column.kind === "date") {
            return formatDate(value);
        }
        if (column.kind === "money") {
            return numberFormat.format(value || 0);
        }
        if (column.kind === "flag") {
            return value === "S" ? "Sim" : "Não";
        }
        if (column.kind === "estado") {
            return value === "S" ? "Confirmada" : "Pendente";
        }
        return value || "—";
    }

    function sortableValue(row, key) {
        var column = columnById(key);
        if (column && column.kind === "money") {
            return row[key] || 0;
        }
        if (column && column.kind === "date") {
            return String(row[key] || "");
        }
        if (key === "nuapuracao" || key === "codconta" || key === "numcontrato" || key === "nunota") {
            var numeric = parseInt(String(row[key] || "0"), 10);
            return isFinite(numeric) ? numeric : 0;
        }
        return String(row[key] || "").toLowerCase();
    }

    function updateSortIndicators() {
        Array.prototype.forEach.call(document.querySelectorAll(".sort-trigger"), function (trigger) {
            var marker = trigger.querySelector("span");
            if (!marker) {
                return;
            }
            if (trigger.getAttribute("data-sort") !== sortState.key) {
                marker.textContent = "";
                trigger.removeAttribute("aria-label");
                return;
            }
            var directionLabel = sortState.direction === 1 ? "crescente" : "decrescente";
            marker.textContent = sortState.direction === 1 ? "↑" : "↓";
            trigger.setAttribute("aria-label", "Ordenar " + directionLabel);
        });
    }

    function applyColumnVisibility() {
        var cells = document.querySelectorAll("#grid-apuracoes [data-column]");
        Array.prototype.forEach.call(cells, function (cell) {
            cell.hidden = !visibleColumns[cell.getAttribute("data-column")];
        });
    }

    function loadColumnPreferences() {
        try {
            var stored = window.localStorage.getItem("facilita-apuracao-faturas:columns:v2");
            var preferences = stored ? JSON.parse(stored) : null;
            if (!preferences || typeof preferences.columns !== "object") {
                return;
            }
            Object.keys(visibleColumns).forEach(function (id) {
                if (typeof preferences.columns[id] === "boolean") {
                    visibleColumns[id] = preferences.columns[id];
                }
            });
            if (!Object.keys(visibleColumns).some(function (id) { return visibleColumns[id]; })) {
                visibleColumns.nuapuracao = true;
            }
            var storedPins = preferences.pinned;
            if (typeof storedPins === "string") {
                storedPins = storedPins ? [storedPins] : [];
            }
            if (storedPins && storedPins.length) {
                pinnedColumns = storedPins.filter(function (id) {
                    return visibleColumns[id] && columnById(id);
                });
            }
            if (preferences.order && preferences.order.length) {
                columnOrder = normalizeColumnOrder(preferences.order);
            }
            Array.prototype.forEach.call(document.querySelectorAll(".column-picker input[data-column]"), function (checkbox) {
                checkbox.checked = visibleColumns[checkbox.getAttribute("data-column")];
            });
            syncSelectAll();
            placePinnedColumn();
        } catch (error) {
            console.warn("[facilita-apuracao] preferências de colunas indisponíveis");
        }
    }

    function saveColumnPreferences() {
        try {
            window.localStorage.setItem("facilita-apuracao-faturas:columns:v2", JSON.stringify({
                columns: visibleColumns,
                pinned: pinnedColumns,
                order: normalizeColumnOrder(columnOrder)
            }));
        } catch (error) {
            console.warn("[facilita-apuracao] preferências de colunas não persistidas");
        }
    }

    function applyPinnedColumn() {
        var head = document.getElementById("grid-apuracoes-head");
        var offsets = {};
        var left = 0;
        var lastId = "";
        pinnedColumns.forEach(function (id) {
            if (!head || !visibleColumns[id]) {
                return;
            }
            var headerCell = head.querySelector('[data-column="' + id + '"]');
            if (!headerCell || headerCell.hidden) {
                return;
            }
            offsets[id] = left;
            left += headerCell.offsetWidth;
            lastId = id;
        });
        var cells = document.querySelectorAll("#grid-apuracoes [data-column]");
        Array.prototype.forEach.call(cells, function (cell) {
            var id = cell.getAttribute("data-column");
            var pinned = Object.prototype.hasOwnProperty.call(offsets, id) && !cell.hidden;
            cell.classList.toggle("is-pinned", pinned);
            cell.classList.toggle("is-pinned-last", pinned && id === lastId);
            cell.style.left = pinned ? offsets[id] + "px" : "";
        });
        Array.prototype.forEach.call(document.querySelectorAll(".col-menu-trigger"), function (button) {
            var active = pinnedColumns.indexOf(button.getAttribute("data-pin")) >= 0;
            var item = button.parentNode.querySelector(".col-menu__item");
            button.setAttribute("aria-pressed", String(active));
            if (item) {
                item.textContent = active ? "Desafixar coluna" : "Fixar coluna";
            }
        });
    }

    function exportCsv() {
        var columns = orderedColumns().filter(function (column) {
            return visibleColumns[column.id];
        });
        var lines = [columns.map(function (column) { return csvCell(column.label); }).join(";")];
        filteredRows.forEach(function (row) {
            lines.push(columns.map(function (column) {
                var value = column.kind === "estado" ? (row.confirmado === "S" ? "Confirmada" : "Pendente") : formatColumnValue(column, row);
                return csvCell(value === "—" ? "" : value);
            }).join(";"));
        });
        var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "apuracao-faturas.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function csvCell(value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
    }

    function setLoading(isLoading) {
        var loading = document.getElementById("grid-loading");
        if (loading) {
            loading.hidden = !isLoading;
        }
    }

    function showError(message) {
        setLoading(false);
        var error = document.getElementById("grid-error");
        if (error) {
            error.hidden = false;
        }
        setText("grid-error-detail", message + " Código: FA-" + Date.now());
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }
        var parts = value.split("-");
        return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : value;
    }

    function parseNumber(value) {
        var parsed = parseFloat(String(value || "").replace(",", "."));
        return isFinite(parsed) ? parsed : 0;
    }

    function flag(value) {
        return String(value || "N").trim().toUpperCase() === "S" ? "S" : "N";
    }

    function isSelected(row) {
        return selectedRow && selectedRow.nuapuracao === row.nuapuracao;
    }

    function setText(id, value) {
        var element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    window.FacilitaApuracao = {
        getRows: function () { return rows.slice(); },
        getFilteredRows: function () { return filteredRows.slice(); },
        getSelectedRow: function () { return selectedRow; }
    };
}());
