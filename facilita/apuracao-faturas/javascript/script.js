(function () {
    "use strict";

    var rows = [];
    var filteredRows = [];
    var selectedRow = null;
    var selectedDetail = null;
    var detailRequestSequence = 0;
    var sortState = { key: null, direction: 1 };
    var visibleColumns = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true };
    var numberFormat = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        try {
            rows = readRows();
            filteredRows = rows.slice();
            loadColumnPreferences();
            bindEvents();
            render();
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
                codvend: data.codvend || "",
                idinstprn: data.idinstprn || "",
                nufila: data.nufila || "",
                plano: data.plano || "",
                possuiAnexo: flag(data.possuiAnexo)
            };
        });
    }

    function bindEvents() {
        var search = document.getElementById("filter-text");
        var field = document.getElementById("filter-field");
        var refresh = document.getElementById("btn-refresh");
        var exportButton = document.getElementById("btn-export");

        if (search) {
            search.addEventListener("input", applyFilters);
        }
        if (field) {
            field.addEventListener("change", applyFilters);
        }
        if (refresh) {
            refresh.addEventListener("click", function () {
                window.location.reload();
            });
        }
        if (exportButton) {
            exportButton.addEventListener("click", exportCsv);
        }
        document.addEventListener("facilita-apuracao:selected", function (event) {
            loadDetail(event.detail);
        });
        document.addEventListener("facilita-apuracao:cleared", clearDetailSelection);
        Array.prototype.forEach.call(document.querySelectorAll(".sort-trigger"), function (trigger) {
            trigger.addEventListener("click", function () {
                sortBy(trigger.getAttribute("data-sort"));
            });
        });
        Array.prototype.forEach.call(document.querySelectorAll(".column-picker input[data-column]"), function (checkbox) {
            checkbox.addEventListener("change", function () {
                var checkedColumns = document.querySelectorAll(".column-picker input[data-column]:checked");
                if (!checkbox.checked && checkedColumns.length === 0) {
                    checkbox.checked = true;
                    return;
                }
                visibleColumns[checkbox.getAttribute("data-column")] = checkbox.checked;
                saveColumnPreferences();
                applyColumnVisibility();
            });
        });
    }

    function applyFilters() {
        var search = document.getElementById("filter-text");
        var field = document.getElementById("filter-field");
        var query = search ? search.value.trim().toLowerCase() : "";
        var selectedField = field ? field.value : "T";

        filteredRows = rows.filter(function (row) {
            if (!query) {
                return true;
            }
            return searchableValues(row, selectedField).some(function (value) {
                return String(value).toLowerCase().indexOf(query) !== -1;
            });
        });
        applySorting();

        if (selectedRow && !filteredRows.some(function (row) {
            return row.nuapuracao === selectedRow.nuapuracao;
        })) {
            selectedRow = null;
            document.dispatchEvent(new CustomEvent("facilita-apuracao:cleared"));
        }
        render();
    }

    function searchableValues(row, selectedField) {
        var fields = {
            NUAPURACAO: [row.nuapuracao],
            CODCONTA: [row.codconta],
            NUMCONTRATO: [row.numcontrato],
            NUNOTA: [row.nunota],
            VALOR: [numberFormat.format(row.valor)],
            DTVENC: [row.dtvenc],
            REFERENCIA: [row.referencia]
        };

        if (selectedField !== "T" && fields[selectedField]) {
            return fields[selectedField];
        }
        return [
            row.nuapuracao,
            row.codconta,
            row.numcontrato,
            row.nunota,
            numberFormat.format(row.valor),
            row.dtvenc,
            row.referencia
        ];
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
        filteredRows.forEach(function (row) {
            var tr = document.createElement("tr");
            tr.tabIndex = 0;
            tr.setAttribute("role", "button");
            tr.setAttribute("aria-label", "Selecionar apuração " + row.nuapuracao);
            tr.setAttribute("aria-selected", String(isSelected(row)));
            tr.className = isSelected(row) ? "is-selected" : "";
            tr.addEventListener("click", function () {
                selectRow(row);
            });
            tr.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectRow(row);
                }
            });

            tr.appendChild(textCell(row.nuapuracao));
            tr.appendChild(textCell(row.codconta));
            tr.appendChild(textCell(row.numcontrato));
            tr.appendChild(textCell(formatDate(row.referencia)));
            tr.appendChild(textCell(formatDate(row.dtvenc)));
            tr.appendChild(numberCell(row.valor));
            tr.appendChild(statusCell(row));
            tr.appendChild(textCell(row.possuiAnexo === "S" ? "Sim" : "Não"));
            Array.prototype.forEach.call(tr.children, function (cell, index) {
                cell.setAttribute("data-column", String(index));
            });
            body.appendChild(tr);
        });
        applyColumnVisibility();

        if (empty) {
            empty.hidden = filteredRows.length !== 0;
        }
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
        var message = filteredRows.length === 0
            ? "Nenhum resultado para os filtros atuais."
            : filteredRows.length + " apuração(ões) disponível(is).";
        setText("filter-summary", message);
        setText("grid-meta", selectedRow ? "Apuração " + selectedRow.nuapuracao + " selecionada." : "Uma linha por apuração");
        setText("state-message", message);
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
        var body = document.getElementById("detail-body");
        if (!panel || !empty || !body) {
            return;
        }
        selectedDetail = null;
        empty.hidden = true;
        panel.hidden = false;
        setText("detail-title", "Apuração " + row.nuapuracao);
        setText("detail-state", "Carregando");
        body.textContent = "Carregando detalhe...";
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
                body.textContent = "Não foi possível carregar o detalhe.";
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
            possuiAnexo: flag(data.possuiAnexo)
        };
    }

    function renderDetail(detail) {
        var labels = [
            ["Conta", detail.codconta],
            ["Contrato", detail.numcontrato],
            ["Nota de faturamento", detail.nunota],
            ["Sequência contratual", detail.sequenciacon],
            ["Referência", formatDate(detail.referencia)],
            ["Referência adiada", formatDate(detail.referenciaadiada)],
            ["Vencimento", formatDate(detail.dtvenc)],
            ["Valor", numberFormat.format(detail.valor || 0)],
            ["Valor de referência", numberFormat.format(detail.valorref || 0)],
            ["Auditoria finalizada", detail.auditoriafinalizada === "S" ? "Sim" : "Não"],
            ["E-mail enviado", detail.emailenviado === "S" ? "Sim" : "Não"],
            ["Faturamento liberado", detail.faturamentoliberado === "S" ? "Sim" : "Não"],
            ["Plano", detail.plano],
            ["Anexo", detail.possuiAnexo === "S" ? "Sim" : "Não"]
        ];
        var body = document.getElementById("detail-body");
        if (!body) {
            return;
        }
        body.textContent = "";
        labels.forEach(function (entry) {
            var item = document.createElement("div");
            var label = document.createElement("span");
            var value = document.createElement("strong");
            item.className = "detail-grid__item";
            label.className = "detail-grid__label";
            value.className = "detail-grid__value";
            label.textContent = entry[0];
            value.textContent = entry[1] || "—";
            item.appendChild(label);
            item.appendChild(value);
            body.appendChild(item);
        });
        setText("detail-state", detail.confirmado === "S" ? "Confirmada" : "Pendente");
        setDetailActions(detail);
    }

    function setDetailActions(detail) {
        var task = document.getElementById("btn-open-task");
        var attachment = document.getElementById("btn-view-attachment");
        var confirm = document.getElementById("btn-confirm");
        if (task) {
            task.disabled = true;
            task.title = detail && detail.idinstprn ? "Aguardando contrato homologado de abertura da tarefa" : "Sem processo de workflow";
            task.onclick = function () {
                setDetailMessage("A abertura exige o identificador de tarefa retornado por ApuracaoSP.getTarefa; contrato ainda não homologado no HTML5.");
            };
        }
        if (attachment) {
            attachment.disabled = !detail || detail.possuiAnexo !== "S";
            attachment.onclick = function () {
                if (!selectedDetail || selectedDetail.possuiAnexo !== "S") {
                    return;
                }
                window.open("/facilitatelecom/visualizadorArquivos.facilita?nuApuracao=" + encodeURIComponent(selectedDetail.nuapuracao), "_blank", "noopener");
            };
        }
        if (confirm) {
            confirm.disabled = true;
            confirm.title = "Aguardando fachada transacional homologada";
            confirm.onclick = function () {
                setDetailMessage("A confirmação requer fachada transacional homologada; nenhuma alteração foi enviada.");
            };
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

    function sortBy(key) {
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
            return;
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

    function sortableValue(row, key) {
        if (key === "valor") {
            return row.valor;
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
            var stored = window.localStorage.getItem("facilita-apuracao-faturas:columns:v1");
            var preferences = stored ? JSON.parse(stored) : null;
            if (!preferences || typeof preferences !== "object") {
                return;
            }
            Object.keys(visibleColumns).forEach(function (index) {
                if (typeof preferences[index] === "boolean") {
                    visibleColumns[index] = preferences[index];
                }
            });
            if (!Object.keys(visibleColumns).some(function (index) { return visibleColumns[index]; })) {
                visibleColumns[0] = true;
            }
            Array.prototype.forEach.call(document.querySelectorAll(".column-picker input[data-column]"), function (checkbox) {
                checkbox.checked = visibleColumns[checkbox.getAttribute("data-column")];
            });
        } catch (error) {
            console.warn("[facilita-apuracao] preferências de colunas indisponíveis");
        }
    }

    function saveColumnPreferences() {
        try {
            window.localStorage.setItem("facilita-apuracao-faturas:columns:v1", JSON.stringify(visibleColumns));
        } catch (error) {
            console.warn("[facilita-apuracao] preferências de colunas não persistidas");
        }
    }

    function exportCsv() {
        var headers = ["Sequência", "Conta", "Contrato", "Referência", "Vencimento", "Valor", "Estado", "Anexo"];
        var keys = ["nuapuracao", "codconta", "numcontrato", "referencia", "dtvenc", "valor", "confirmado", "possuiAnexo"];
        var columns = headers.map(function (header, index) {
            return { header: header, key: keys[index], index: index };
        }).filter(function (column) {
            return visibleColumns[column.index];
        });
        var lines = [columns.map(function (column) { return csvCell(column.header); }).join(";")];
        filteredRows.forEach(function (row) {
            lines.push(columns.map(function (column) {
                var value = row[column.key];
                if (column.key === "valor") {
                    value = numberFormat.format(value || 0);
                } else if (column.key === "confirmado") {
                    value = value === "S" ? "Confirmada" : "Pendente";
                } else if (column.key === "possuiAnexo") {
                    value = value === "S" ? "Sim" : "Não";
                }
                return csvCell(value || "");
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
