(function () {
    "use strict";

    var rows = [];
    var filteredRows = [];
    var selectedRow = null;
    var selectedDetail = null;
    var detailRequestSequence = 0;
    var attachmentMetadataSequence = 0;
    var attachmentMetadataLastFocus = null;
    var actionRequestSequence = 0;
    var sortState = { key: "numcontrato", direction: 1 };
    var pageState = { page: 1, pageSize: 15 };
    var manualColumnSort = false;
    var gridRefreshSequence = 0;
    var CLIENT_FILTER_KEY = "facilita-apuracao-faturas:client-filters:v1";
    var SERVER_QUERY_KEY = "facilita-apuracao-faturas:server-query:v1";
    var USER_PREFS_VERSION = 1;
    var USER_PREFS_KEY_PREFIX = "facilita-apuracao-faturas:user-prefs:v1:";
    var LEGACY_COLUMNS_KEY = "facilita-apuracao-faturas:columns:v2";
    var LEGACY_PAGE_SIZE_KEY = "facilita-apuracao-faturas:page-size:v1";
    var pendingClientPreferences = null;
    var prefsRowExists = false;
    var prefsSaveTimer = null;
    var prefsServerSyncEnabled = false;
    var prefsDirtyForServer = false;
    var USER_PREFS_MAX_BYTES = 131072;
    var PREFS_SAVE_DEBOUNCE_MS = 1500;
    var GRID_COLUMNS = [
        { id: "nuapuracao", label: "Sequência", kind: "text", visible: true },
        { id: "codconta", label: "Conta", kind: "text", visible: true },
        { id: "numcontrato", label: "Contrato", kind: "text", visible: true },
        { id: "nomeCliente", label: "Nome Cliente", kind: "text", visible: true },
        { id: "razaoCliente", label: "Razão Cliente", kind: "text", visible: true },
        { id: "nomeContaOperadora", label: "Nome da conta na operadora", kind: "text", visible: true },
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
            migrateLegacyUserPreferences();
            seedServerFilterSessionFromPrefsIfEmpty();
            loadUserPreferences();
            syncServerFilterControlsFromQuery(getServerFilterQuery());
            rows = readRows();
            filteredRows = rows.slice();
            buildGridChrome();
            applyColumnPreferencesToDom();
            bindEvents();
            restoreClientFilterState();
            syncSortWithSearchField();
            applySorting();
            applyFilters(true);
            writeUserPreferencesToLocalStorage(buildUserPreferencesSnapshot());
            setLoading(false);
            if (hasActiveServerFilterSession() || hasPersistedServerFilterPrefs()) {
                refreshGridFromServer();
            }
            loadServerPreferencesAsync();
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
                nomeContaOperadora: data.nomeContaOperadora || "",
                cgcTitular: data.cgcTitular || "",
                apelidoVend: data.apelidoVend || "",
                vlrest: parseNumber(data.vlrest),
                cfgDataini: data.cfgDataini || "",
                cfgDatafin: data.cfgDatafin || "",
                cfgVlrref: parseNumber(data.cfgVlrref),
                cfgVlrfixo: parseNumber(data.cfgVlrfixo),
                acessoLogin: data.acessoLogin || data.nomeContaOperadora || "",
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
        window.addEventListener("pagehide", function () {
            saveUserPreferences(undefined, { syncServer: true, immediate: true });
        });
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                saveUserPreferences(undefined, { syncServer: true, immediate: true });
            }
        });
        var columnPicker = document.getElementById("column-picker");
        if (columnPicker) {
            columnPicker.addEventListener("toggle", function () {
                if (!columnPicker.open) {
                    var columnFilter = document.getElementById("column-picker-filter");
                    if (columnFilter) {
                        columnFilter.value = "";
                        filterColumnPickerList();
                    }
                    return;
                }
                window.setTimeout(function () {
                    var columnFilter = document.getElementById("column-picker-filter");
                    if (columnFilter) {
                        columnFilter.focus();
                    }
                }, 0);
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
        bindAttachmentMetadataDialog();
    }

    function bindAttachmentMetadataDialog() {
        var dialog = document.getElementById("attachment-metadata-dialog");
        var close = document.getElementById("attachment-metadata-close");
        var panel = dialog ? dialog.querySelector(".attachment-metadata__panel") : null;
        if (close) {
            close.addEventListener("click", closeAttachmentMetadataDialog);
        }
        if (dialog && panel) {
            dialog.addEventListener("click", function (event) {
                if (event.target === dialog) {
                    closeAttachmentMetadataDialog();
                }
            });
            panel.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }
            if (dialog && !dialog.hidden) {
                event.preventDefault();
                closeAttachmentMetadataDialog();
            }
        });
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
        menu.appendChild(buildColumnPickerSearch());
        menu.appendChild(buildSelectAllLabel());
        var columnPickerList = document.createElement("div");
        columnPickerList.className = "column-picker__list";
        columnPickerList.id = "column-picker-list";
        var columnPickerEmpty = document.createElement("p");
        columnPickerEmpty.className = "column-picker__empty";
        columnPickerEmpty.id = "column-picker-empty";
        columnPickerEmpty.hidden = true;
        columnPickerEmpty.textContent = "Nenhuma coluna corresponde à busca.";
        orderedColumns().forEach(function (column) {
            var th = document.createElement("th");
            var dragHandle = document.createElement("button");
            var sortButton = document.createElement("button");
            var marker = document.createElement("span");
            var pinButton = document.createElement("button");
            var label = document.createElement("label");
            label.className = "column-picker__item";
            label.setAttribute("data-column-label", column.label);
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
            columnPickerList.appendChild(label);
        });
        columnPickerList.appendChild(columnPickerEmpty);
        menu.appendChild(columnPickerList);
        filterColumnPickerList();
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

    function buildColumnPickerSearch() {
        var wrap = document.createElement("div");
        var input = document.createElement("input");
        wrap.className = "column-picker__search";
        input.type = "search";
        input.id = "column-picker-filter";
        input.className = "column-picker__search-input";
        input.setAttribute("autocomplete", "off");
        input.setAttribute("enterkeyhint", "search");
        input.setAttribute("aria-controls", "column-picker-list");
        input.setAttribute("aria-label", "Buscar coluna por nome");
        input.placeholder = "Buscar coluna…";
        input.addEventListener("input", filterColumnPickerList);
        input.addEventListener("click", function (event) {
            event.stopPropagation();
        });
        input.addEventListener("keydown", function (event) {
            event.stopPropagation();
            if (event.key === "Escape") {
                event.preventDefault();
                input.value = "";
                filterColumnPickerList();
            }
        });
        wrap.appendChild(input);
        return wrap;
    }

    function filterColumnPickerList() {
        var input = document.getElementById("column-picker-filter");
        var list = document.getElementById("column-picker-list");
        var empty = document.getElementById("column-picker-empty");
        if (!input || !list) {
            return;
        }
        var query = input.value.trim().toLowerCase();
        var visibleCount = 0;
        Array.prototype.forEach.call(list.querySelectorAll(".column-picker__item"), function (label) {
            var name = (label.getAttribute("data-column-label") || label.textContent || "").trim().toLowerCase();
            var match = !query || matchesSearchToken(name, query);
            label.hidden = !match;
            if (match) {
                visibleCount += 1;
            }
        });
        if (empty) {
            empty.hidden = visibleCount > 0 || !query;
        }
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

    function getPreferencesStorage() {
        var candidates = [window.localStorage];
        try {
            if (window.top && window.top.localStorage && candidates.indexOf(window.top.localStorage) === -1) {
                candidates.push(window.top.localStorage);
            }
        } catch (error) {
            /* cross-origin */
        }
        for (var i = 0; i < candidates.length; i++) {
            try {
                var storage = candidates[i];
                var probe = "__facilita_apuracao_storage_probe__";
                storage.setItem(probe, "1");
                storage.removeItem(probe);
                return storage;
            } catch (error) {
                /* blocked */
            }
        }
        return null;
    }

    function getUsuarioKey() {
        var user = window.FACILITA_APURACAO_USER;
        if (!user || user.codusu == null) {
            return null;
        }
        var codusu = String(user.codusu).trim();
        if (codusu === "") {
            return null;
        }
        return codusu;
    }

    function userPrefsStorageKey() {
        var codusu = getUsuarioKey();
        return USER_PREFS_KEY_PREFIX + (codusu == null ? "anon" : codusu);
    }

    function syncUsuarioFromServerPayload(payload) {
        if (!payload || payload.codusu == null || String(payload.codusu).trim() === "") {
            return;
        }
        window.FACILITA_APURACAO_USER = window.FACILITA_APURACAO_USER || {};
        window.FACILITA_APURACAO_USER.codusu = String(payload.codusu).trim();
    }

    function serverFiltersEqual(left, right) {
        if (!left || !right) {
            return false;
        }
        var a = resolveServerFilterValues(left);
        var b = resolveServerFilterValues(right);
        return a.P_REFERENCIA === b.P_REFERENCIA
            && a.P_SOMENTE_PENDENTES === b.P_SOMENTE_PENDENTES
            && a.P_POSSUI_ANEXO === b.P_POSSUI_ANEXO;
    }

    function readUserPreferencesFromStorage() {
        var storage = getPreferencesStorage();
        if (!storage) {
            return null;
        }
        try {
            var raw = storage.getItem(userPrefsStorageKey());
            if (!raw) {
                return null;
            }
            var prefs = JSON.parse(raw);
            if (!prefs || prefs.version !== USER_PREFS_VERSION) {
                return null;
            }
            return prefs;
        } catch (error) {
            console.warn("[facilita-apuracao] preferências do usuário indisponíveis", error);
            return null;
        }
    }

    function buildUserPreferencesSnapshot(serverOverride) {
        var search = document.getElementById("filter-text");
        var field = document.getElementById("filter-field");
        syncColumnFiltersFromDom();
        var server = serverOverride || readAuthoritativeServerFilters();
        return {
            version: USER_PREFS_VERSION,
            savedAt: new Date().toISOString(),
            server: {
                P_REFERENCIA: server.P_REFERENCIA,
                P_SOMENTE_PENDENTES: server.P_SOMENTE_PENDENTES,
                P_POSSUI_ANEXO: server.P_POSSUI_ANEXO
            },
            client: {
                search: search ? search.value : "",
                field: field ? field.value : "T",
                page: pageState.page,
                columnFilters: columnFilters
            },
            grid: {
                pageSize: pageState.pageSize,
                columns: visibleColumns,
                pinned: pinnedColumns.slice(),
                order: normalizeColumnOrder(columnOrder),
                sortKey: sortState.key,
                sortDirection: sortState.direction,
                manualColumnSort: manualColumnSort
            }
        };
    }

    function getPrefsCrudConfig() {
        return window.FACILITA_APURACAO_PREFS || {
            rootEntity: "AD_APURACAOCONF",
            confField: "CONF"
        };
    }

    function writeUserPreferencesToLocalStorage(snapshot) {
        var storage = getPreferencesStorage();
        if (!storage || !snapshot) {
            return;
        }
        try {
            storage.setItem(userPrefsStorageKey(), JSON.stringify(snapshot));
        } catch (error) {
            console.warn("[facilita-apuracao] preferências locais não persistidas", error);
        }
    }

    function buildServerFilterSearch(resolved) {
        var values = resolveServerFilterValues(resolved || {});
        return "?"
            + "P_REFERENCIA=" + encodeURIComponent(values.P_REFERENCIA)
            + "&P_SOMENTE_PENDENTES=" + encodeURIComponent(values.P_SOMENTE_PENDENTES)
            + "&P_POSSUI_ANEXO=" + encodeURIComponent(values.P_POSSUI_ANEXO);
    }

    function setServerFilterQueryInSession(resolved) {
        var search = buildServerFilterSearch(resolved);
        try {
            window.sessionStorage.setItem(SERVER_QUERY_KEY, search);
        } catch (error) {
            console.warn("[facilita-apuracao] não foi possível guardar parâmetros do gadget", error);
        }
        return search;
    }

    function hasPersistedServerFilterPrefs() {
        var prefs = readUserPreferencesFromStorage();
        return !!(prefs && prefs.server);
    }

    function hasActiveServerFilterSession() {
        try {
            var stored = window.sessionStorage.getItem(SERVER_QUERY_KEY);
            if (stored) {
                var params = parseServerFilterParams(stored);
                if (params.P_REFERENCIA || params.P_SOMENTE_PENDENTES || params.P_POSSUI_ANEXO) {
                    return true;
                }
            }
        } catch (error) {
            /* ignore */
        }
        var locationParams = parseServerFilterParams(window.location.search);
        return !!(locationParams.P_REFERENCIA || locationParams.P_SOMENTE_PENDENTES || locationParams.P_POSSUI_ANEXO);
    }

    function serverFiltersFromSessionOrPrefs() {
        var fromQuery = resolveServerFilterValues(parseServerFilterParams(getServerFilterQuery()));
        if (hasActiveServerFilterSession()) {
            return fromQuery;
        }
        var prefs = readUserPreferencesFromStorage();
        if (prefs && prefs.server) {
            return resolveServerFilterValues(prefs.server);
        }
        return fromQuery;
    }

    function readAuthoritativeServerFilters() {
        if (document.getElementById("server-filter-reference")) {
            return resolveServerFilterValues(readServerFilterControls());
        }
        return serverFiltersFromSessionOrPrefs();
    }

    function seedServerFilterSessionFromPrefsIfEmpty() {
        if (hasActiveServerFilterSession()) {
            return;
        }
        var prefs = readUserPreferencesFromStorage();
        if (prefs && prefs.server) {
            setServerFilterQueryInSession(prefs.server);
        }
    }

    function tryUpdateLocationServerParams(resolved) {
        try {
            var values = resolveServerFilterValues(resolved || {});
            var targetUrl = new URL(window.location.href);
            targetUrl.searchParams.set("P_REFERENCIA", values.P_REFERENCIA);
            targetUrl.searchParams.set("P_SOMENTE_PENDENTES", values.P_SOMENTE_PENDENTES);
            targetUrl.searchParams.set("P_POSSUI_ANEXO", values.P_POSSUI_ANEXO);
            window.history.replaceState(null, "", targetUrl.toString());
        } catch (error) {
            /* ignore */
        }
    }

    function applyRemotePreferencesFromServer(remotePrefs) {
        if (!remotePrefs || typeof remotePrefs !== "object") {
            return;
        }
        var uiServer = readAuthoritativeServerFilters();
        var remoteServer = remotePrefs.server ? resolveServerFilterValues(remotePrefs.server) : null;

        applyUserPreferencesObject({
            grid: remotePrefs.grid,
            client: remotePrefs.client
        });

        var snapshot = buildUserPreferencesSnapshot();
        writeUserPreferencesToLocalStorage(snapshot);
        applyColumnPreferencesToDom();
        restoreClientFilterState();
        applyFilters(true);
        render();

        if (!remoteServer || !serverFiltersEqual(remoteServer, uiServer)) {
            prefsDirtyForServer = true;
            scheduleServerPreferencesSave(snapshot);
        }
    }

    function parseServerPrefsPayload(payload) {
        if (!payload || !payload.exists) {
            return { exists: false, prefs: null };
        }
        if (!payload.conf || !String(payload.conf).trim()) {
            return { exists: true, prefs: null };
        }
        try {
            var prefs = JSON.parse(payload.conf);
            if (prefs && prefs.version === USER_PREFS_VERSION) {
                return { exists: true, prefs: prefs };
            }
        } catch (error) {
            console.warn("[facilita-apuracao] CONF do servidor inválido", error);
        }
        return { exists: true, prefs: null };
    }

    function loadServerPreferencesAsync() {
        var base = window.FACILITA_APURACAO_BASE || "";
        var url = base + "/prefs_payload.jsp";
        fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.json();
            })
            .then(function (payload) {
                syncUsuarioFromServerPayload(payload);
                prefsServerSyncEnabled = true;
                var parsed = parseServerPrefsPayload(payload);
                prefsRowExists = parsed.exists;
                if (!parsed.prefs) {
                    if (!prefsRowExists && readUserPreferencesFromStorage()) {
                        prefsDirtyForServer = true;
                        flushServerPreferences({
                            snapshot: readUserPreferencesFromStorage(),
                            force: true
                        });
                    }
                    return;
                }
                applyRemotePreferencesFromServer(parsed.prefs);
            })
            .catch(function (error) {
                prefsServerSyncEnabled = true;
                console.warn("[facilita-apuracao] preferências do servidor indisponíveis", error);
            });
    }

    function applyUserPreferencesObject(prefs) {
        if (!prefs || typeof prefs !== "object") {
            return;
        }
        if (prefs.grid) {
            applyGridPreferences(prefs.grid);
            var pageSize = document.getElementById("page-size");
            if (pageSize) {
                pageSize.value = String(pageState.pageSize);
            }
        }
        if (prefs.client && typeof prefs.client === "object") {
            pendingClientPreferences = prefs.client;
            if (prefs.client.page) {
                pageState.page = Math.max(1, parseInt(prefs.client.page, 10) || 1);
            }
        }
    }

    function crudSaveRecord(localFields, rootEntity, primaryKey) {
        var fieldNames = Object.keys(localFields || {});
        var localFieldsPayload = {};
        fieldNames.forEach(function (key) {
            var value = localFields[key];
            if (value !== null && value !== undefined && value !== "") {
                localFieldsPayload[key.toUpperCase()] = { $: String(value) };
            }
        });
        var dataRow = { localFields: localFieldsPayload };
        if (primaryKey) {
            dataRow.key = {};
            Object.keys(primaryKey).forEach(function (key) {
                dataRow.key[key.toUpperCase()] = { $: String(primaryKey[key]) };
            });
        }
        var body = {
            serviceName: "CRUDServiceProvider.saveRecord",
            requestBody: {
                dataSet: {
                    rootEntity: rootEntity,
                    includePresentationFields: "N",
                    dataRow: dataRow,
                    entity: {
                        fieldset: {
                            list: fieldNames.map(function (key) {
                                return key.toUpperCase();
                            }).join(",")
                        }
                    }
                }
            }
        };
        var url = window.location.origin + "/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=json";
        return fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json;charset=UTF-8" },
            body: JSON.stringify(body),
            keepalive: true
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            if (String(data.status) !== "1") {
                throw new Error(data.statusMessage || (data.responseBody && data.responseBody.message) || "Falha ao gravar preferências");
            }
            return data;
        });
    }

    function scheduleServerPreferencesSave(snapshot) {
        if (prefsSaveTimer) {
            window.clearTimeout(prefsSaveTimer);
        }
        var snap = snapshot;
        prefsSaveTimer = window.setTimeout(function () {
            prefsSaveTimer = null;
            flushServerPreferences({ snapshot: snap });
        }, PREFS_SAVE_DEBOUNCE_MS);
    }

    function flushServerPreferences(options) {
        var cfg = getPrefsCrudConfig();
        if (!cfg.rootEntity || !prefsServerSyncEnabled) {
            return Promise.resolve();
        }
        if (options && options.force !== true && !prefsDirtyForServer) {
            return Promise.resolve();
        }
        var codusu = getUsuarioKey();
        if (codusu == null) {
            return Promise.resolve();
        }
        if (options && options.immediate && prefsSaveTimer) {
            window.clearTimeout(prefsSaveTimer);
            prefsSaveTimer = null;
        }
        var snapshot = options && options.snapshot ? options.snapshot : buildUserPreferencesSnapshot();
        if (!snapshot.savedAt) {
            snapshot.savedAt = new Date().toISOString();
        }
        var confField = cfg.confField || "CONF";
        var confText = JSON.stringify(snapshot);
        if (confText.length > USER_PREFS_MAX_BYTES) {
            console.warn("[facilita-apuracao] preferências excedem o limite para AD_APURACAOCONF");
            return Promise.resolve();
        }
        var fields = {};
        fields[confField] = confText;
        var pk = prefsRowExists ? { CODUSU: codusu } : null;
        return crudSaveRecord(fields, cfg.rootEntity, pk).then(function () {
            prefsRowExists = true;
            prefsDirtyForServer = false;
            writeUserPreferencesToLocalStorage(snapshot);
        }).catch(function (error) {
            console.warn("[facilita-apuracao] falha ao gravar AD_APURACAOCONF", error);
        });
    }

    function saveUserPreferences(serverOverride, options) {
        var opts = options || {};
        var snapshot = buildUserPreferencesSnapshot(serverOverride);
        writeUserPreferencesToLocalStorage(snapshot);
        if (opts.syncServer) {
            prefsDirtyForServer = true;
            if (opts.immediate) {
                flushServerPreferences({ snapshot: snapshot, immediate: true, force: true });
                return;
            }
            scheduleServerPreferencesSave(snapshot);
            return;
        }
        if (prefsServerSyncEnabled) {
            prefsDirtyForServer = true;
            scheduleServerPreferencesSave(snapshot);
        }
    }

    function persistCurrentServerFiltersToUserPreferences() {
        writeUserPreferencesToLocalStorage(buildUserPreferencesSnapshot());
    }

    function migrateLegacyUserPreferences() {
        var storage = getPreferencesStorage();
        if (!storage || storage.getItem(userPrefsStorageKey())) {
            return;
        }
        var snapshot = {
            version: USER_PREFS_VERSION,
            server: null,
            client: null,
            grid: null
        };
        try {
            var legacyColumns = storage.getItem(LEGACY_COLUMNS_KEY);
            if (legacyColumns) {
                var columnsPrefs = JSON.parse(legacyColumns);
                snapshot.grid = {
                    pageSize: pageState.pageSize,
                    columns: columnsPrefs.columns || {},
                    pinned: columnsPrefs.pinned || [],
                    order: columnsPrefs.order || [],
                    sortKey: sortState.key,
                    sortDirection: sortState.direction,
                    manualColumnSort: manualColumnSort
                };
            }
            var legacyPageSize = storage.getItem(LEGACY_PAGE_SIZE_KEY);
            if (legacyPageSize) {
                if (!snapshot.grid) {
                    snapshot.grid = {
                        pageSize: parsePageSize(legacyPageSize),
                        columns: visibleColumns,
                        pinned: pinnedColumns.slice(),
                        order: normalizeColumnOrder(columnOrder),
                        sortKey: sortState.key,
                        sortDirection: sortState.direction,
                        manualColumnSort: manualColumnSort
                    };
                } else {
                    snapshot.grid.pageSize = parsePageSize(legacyPageSize);
                }
            }
            if (snapshot.grid) {
                storage.setItem(userPrefsStorageKey(), JSON.stringify(snapshot));
            }
        } catch (error) {
            console.warn("[facilita-apuracao] migração de preferências legadas", error);
        }
    }

    function applyGridPreferences(grid) {
        if (!grid || typeof grid !== "object") {
            return;
        }
        if (grid.columns && typeof grid.columns === "object") {
            Object.keys(visibleColumns).forEach(function (id) {
                if (typeof grid.columns[id] === "boolean") {
                    visibleColumns[id] = grid.columns[id];
                }
            });
            if (!Object.keys(visibleColumns).some(function (id) { return visibleColumns[id]; })) {
                visibleColumns.nuapuracao = true;
            }
        }
        var storedPins = grid.pinned;
        if (typeof storedPins === "string") {
            storedPins = storedPins ? [storedPins] : [];
        }
        if (storedPins && storedPins.length) {
            pinnedColumns = storedPins.filter(function (id) {
                return visibleColumns[id] && columnById(id);
            });
        }
        if (grid.order && grid.order.length) {
            columnOrder = normalizeColumnOrder(grid.order);
        }
        if (grid.pageSize) {
            pageState.pageSize = parsePageSize(String(grid.pageSize));
        }
        if (grid.sortKey) {
            sortState.key = grid.sortKey;
        }
        if (grid.sortDirection === 1 || grid.sortDirection === -1) {
            sortState.direction = grid.sortDirection;
        }
        if (typeof grid.manualColumnSort === "boolean") {
            manualColumnSort = grid.manualColumnSort;
        }
    }

    function loadUserPreferences() {
        applyUserPreferencesObject(readUserPreferencesFromStorage());
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
        var fromLocation = parseServerFilterParams(window.location.search);
        if (fromLocation.P_REFERENCIA || fromLocation.P_SOMENTE_PENDENTES || fromLocation.P_POSSUI_ANEXO) {
            captureServerFilterQuery();
            return window.location.search;
        }
        try {
            var stored = window.sessionStorage.getItem(SERVER_QUERY_KEY);
            if (stored) {
                return stored;
            }
        } catch (error) {
            console.warn("[facilita-apuracao] parâmetros do gadget indisponíveis", error);
        }
        if (window.location.search && window.location.search.length > 1) {
            captureServerFilterQuery();
            return window.location.search;
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
        var resolved = resolveServerFilterValues(values || {});
        var snapshot = buildUserPreferencesSnapshot(resolved);
        writeUserPreferencesToLocalStorage(snapshot);
        prefsDirtyForServer = true;
        scheduleServerPreferencesSave(snapshot);
        setServerFilterQueryInSession(resolved);
        tryUpdateLocationServerParams(resolved);
        syncServerFilterControlsFromQuery(getServerFilterQuery());
        saveClientFilterState();
        refreshGridFromServer();
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
        saveUserPreferences();
    }

    function restoreClientFilterState() {
        try {
            var raw = window.sessionStorage.getItem(CLIENT_FILTER_KEY);
            var state = null;
            if (raw) {
                state = JSON.parse(raw);
            } else if (pendingClientPreferences) {
                state = pendingClientPreferences;
            }
            if (!state) {
                return;
            }
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
            NOMECONTAOPERADORA: [row.nomeContaOperadora],
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
        closeAttachmentMetadataDialog();
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
            valorRaw: data.valor != null ? String(data.valor).trim() : "",
            valor: data.valor != null && String(data.valor).trim() !== "" ? parseNumber(data.valor) : null,
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
        setInputValue("edit-valor", formatValorForInput(detail));
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
        var metadata = document.getElementById("btn-attachment-metadata");
        if (metadata) {
            metadata.disabled = !detail || detail.possuiAnexo !== "S";
            metadata.onclick = function () {
                openAttachmentMetadataDialog();
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
        var valorParsed = parseEditValorInput(getInputValue("edit-valor"));
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setDetailMessage("Informe um vencimento válido.");
            return;
        }
        if (!valorParsed.empty && valorParsed.invalid) {
            setDetailMessage("Informe um valor maior ou igual a zero.");
            return;
        }
        if (!valorParsed.empty && valorParsed.value < 0) {
            setDetailMessage("Informe um valor maior ou igual a zero.");
            return;
        }
        var valorInput = getInputValue("edit-valor");
        var valorChanged = editValorChanged(valorInput, selectedDetail);
        if (!valorChanged && !date) {
            setDetailMessage("Informe o valor ou o vencimento.");
            return;
        }
        var idBotao = Number(facadeConfig.atualizarBotaoId);
        if (!idBotao) {
            setDetailMessage("O botão de ação de valor e vencimento ainda não está configurado.");
            return;
        }
        var requestId = ++actionRequestSequence;
        var payload = {
            NUAPURACAO: String(selectedDetail.nuapuracao)
        };
        if (valorChanged) {
            payload.VALOR = valorParsed.empty ? "" : valorParsed.text;
        }
        if (date) {
            payload.DTVENC = date;
        }
        setActionBusy(true, "Salvando alterações…");
        acionarBotaoJava(payload, idBotao).then(function (mensagem) {
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

    function openAttachmentMetadataDialog() {
        if (!selectedDetail || selectedDetail.possuiAnexo !== "S" || !selectedDetail.nuapuracao) {
            return;
        }
        var dialog = document.getElementById("attachment-metadata-dialog");
        var body = document.getElementById("attachment-metadata-body");
        var subtitle = document.getElementById("attachment-metadata-subtitle");
        var close = document.getElementById("attachment-metadata-close");
        if (!dialog || !body) {
            return;
        }
        var sequence = ++attachmentMetadataSequence;
        attachmentMetadataLastFocus = document.activeElement;
        if (subtitle) {
            subtitle.textContent = "Apuração " + selectedDetail.nuapuracao;
        }
        body.innerHTML = "<p class=\"attachment-metadata__status\" id=\"attachment-metadata-status\">Carregando…</p>";
        dialog.hidden = false;
        if (close) {
            close.focus();
        }
        var base = window.FACILITA_APURACAO_BASE || "";
        var url = base + "/anexos_payload.jsp?nuapuracao=" + encodeURIComponent(selectedDetail.nuapuracao);
        fetch(url, { credentials: "same-origin", headers: { Accept: "text/html" } })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                if (sequence !== attachmentMetadataSequence) {
                    return;
                }
                if (html && /^\s*</.test(html) && html.toLowerCase().indexOf("<html") >= 0 && html.indexOf("anexos-container") < 0) {
                    throw createFacadeError(
                        "Resposta não é JSON (sessão expirada ou serviço indisponível).",
                        "INTEGRATION"
                    );
                }
                var documentResponse = new DOMParser().parseFromString(html, "text/html");
                var container = documentResponse.getElementById("anexos-container");
                if (!container || container.getAttribute("data-valid-key") === "N") {
                    throw new Error("Consulta de anexos inválida.");
                }
                var anexos = readAnexoRows(container);
                renderAttachmentMetadataTable(anexos, body);
                if (close) {
                    close.focus();
                }
            })
            .catch(function (error) {
                if (sequence !== attachmentMetadataSequence) {
                    return;
                }
                body.innerHTML = "";
                var message = document.createElement("p");
                message.className = "attachment-metadata__status";
                message.textContent = (error && error.message) || "Não foi possível carregar os dados do anexo.";
                body.appendChild(message);
                var code = document.createElement("p");
                code.className = "attachment-metadata__status";
                code.textContent = "Código: FA-ANX" + Date.now();
                body.appendChild(code);
                console.error("[facilita-apuracao] metadados anexo", error);
                if (close) {
                    close.focus();
                }
            });
    }

    function closeAttachmentMetadataDialog() {
        attachmentMetadataSequence += 1;
        var dialog = document.getElementById("attachment-metadata-dialog");
        if (dialog) {
            dialog.hidden = true;
        }
        if (attachmentMetadataLastFocus && typeof attachmentMetadataLastFocus.focus === "function") {
            attachmentMetadataLastFocus.focus();
        }
        attachmentMetadataLastFocus = null;
    }

    function readAnexoRows(container) {
        return Array.prototype.map.call(container.querySelectorAll(".anexo-row"), function (element) {
            return {
                nuattach: element.getAttribute("data-nuattach") || "",
                tipo: element.getAttribute("data-tipo") || "",
                descricao: element.getAttribute("data-descricao") || "",
                nomeArquivo: element.getAttribute("data-nome-arquivo") || "",
                codusuInc: element.getAttribute("data-codusu-inc") || "",
                nomeUsuInc: element.getAttribute("data-nome-usu-inc") || "",
                dhcad: element.getAttribute("data-dhcad") || "",
                dhalter: element.getAttribute("data-dhalter") || "",
                codusuAlt: element.getAttribute("data-codusu-alt") || "",
                nomeUsuAlt: element.getAttribute("data-nome-usu-alt") || "",
                tipoApres: element.getAttribute("data-tipo-apres") || "",
                tipoAcesso: element.getAttribute("data-tipo-acesso") || "",
                tipoApresOpcao: element.getAttribute("data-tipo-apres-opcao") || "",
                tipoAcessoOpcao: element.getAttribute("data-tipo-acesso-opcao") || ""
            };
        });
    }

    function formatAnexoUsuario(codigo, nome) {
        var cod = String(codigo || "").trim();
        var nom = String(nome || "").trim();
        if (cod && nom) {
            return cod + " — " + nom;
        }
        return nom || cod || "—";
    }

    function renderAttachmentMetadataTable(anexos, body) {
        body.textContent = "";
        if (!anexos.length) {
            var empty = document.createElement("p");
            empty.className = "attachment-metadata__status";
            empty.textContent = "Nenhum anexo encontrado para esta apuração.";
            body.appendChild(empty);
            return;
        }
        var table = document.createElement("table");
        table.className = "attachment-metadata-table";
        var caption = document.createElement("caption");
        caption.className = "visually-hidden";
        caption.textContent = "Metadados dos anexos da apuração";
        table.appendChild(caption);
        var thead = document.createElement("thead");
        var headRow = document.createElement("tr");
        ["Tipo", "Descrição", "Arquivo", "Inclusão", "Criado em", "Alterado em", "Alteração", "Visível", "Acesso"].forEach(function (label) {
            var th = document.createElement("th");
            th.scope = "col";
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);
        var tbody = document.createElement("tbody");
        anexos.forEach(function (anexo) {
            var tr = document.createElement("tr");
            [
                anexo.tipo || "—",
                anexo.descricao || "—",
                anexo.nomeArquivo || "—",
                formatAnexoUsuario(anexo.codusuInc, anexo.nomeUsuInc),
                anexo.dhcad || "—",
                anexo.dhalter || "—",
                formatAnexoUsuario(anexo.codusuAlt, anexo.nomeUsuAlt),
                anexo.tipoApresOpcao || anexo.tipoApres || "—",
                anexo.tipoAcessoOpcao || anexo.tipoAcesso || "—"
            ].forEach(function (value, index) {
                var td = document.createElement("td");
                td.textContent = value;
                if (index === 2) {
                    td.className = "attachment-metadata-table__file";
                    td.title = anexo.nomeArquivo || "";
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        body.appendChild(table);
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
        ["btn-open-task", "btn-view-attachment", "btn-attachment-metadata", "btn-confirm", "btn-save-edit", "btn-upload-attachment"].forEach(function (id) {
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
            input.value = value == null ? "" : String(value);
        }
    }

    function formatValorForInput(detail) {
        if (!detail) {
            return "";
        }
        if (detail.valorRaw !== undefined && detail.valorRaw !== "") {
            return String(detail.valorRaw).replace(",", ".");
        }
        if (detail.valor == null || !isFinite(detail.valor)) {
            return "";
        }
        return String(detail.valor);
    }

    function parseEditValorInput(valueText) {
        var normalized = String(valueText || "").trim().replace(",", ".");
        if (normalized === "") {
            return { empty: true };
        }
        var value = Number(normalized);
        if (!isFinite(value)) {
            return { empty: false, invalid: true };
        }
        return { empty: false, invalid: false, value: value, text: normalized };
    }

    function editValorChanged(currentText, detail) {
        var current = parseEditValorInput(currentText);
        var original = parseEditValorInput(formatValorForInput(detail));
        if (current.empty && original.empty) {
            return false;
        }
        if (current.empty !== original.empty) {
            return true;
        }
        if (current.invalid || original.invalid) {
            return true;
        }
        return current.value !== original.value;
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
            NOMECONTAOPERADORA: "nomeContaOperadora",
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

    function savePagePreferences() {
        saveUserPreferences();
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
        saveUserPreferences();
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

    function applyColumnPreferencesToDom() {
        try {
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
        saveUserPreferences();
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
