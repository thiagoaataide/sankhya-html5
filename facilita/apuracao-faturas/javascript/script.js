(function () {
    "use strict";

    var rows = [];
    var filteredRows = [];
    var selectedRow = null;
    var numberFormat = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        try {
            rows = readRows();
            filteredRows = rows.slice();
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
            body.appendChild(tr);
        });

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
