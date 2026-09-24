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
    var visibleColumns = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true };
    var facadeConfig = window.FACILITA_APURACAO_FACADE || {};
    var facadeAppKey = facadeConfig.appKey || "";
    var facadeServiceName = facadeConfig.serviceName || "ApuracaoDashboardSP";
    var facadeServicePath = facadeConfig.servicePath || "/mge/service.sbr";
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
            loadPagePreferences();
            bindEvents();
            syncSortWithSearchField();
            applySorting();
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
            search.addEventListener("input", applyFilters);
        }
        if (field) {
            field.addEventListener("change", function () {
                manualColumnSort = false;
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
                window.location.reload();
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
                return matchesSearchToken(value, query);
            });
        });
        pageState.page = 1;
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

    function searchableValues(row, selectedField) {
        var fields = {
            NUAPURACAO: [row.nuapuracao],
            CODCONTA: [row.codconta],
            NUMCONTRATO: [row.numcontrato],
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
            adDhalter: data.adDhalter || "",
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
        setInputValue("edit-dtvenc", detail.dtvenc);
        setInputValue("edit-valor", detail.valor ? String(detail.valor) : "");
        setText("detail-state", detail.confirmado === "S" ? "Confirmada" : "Pendente");
        setDetailActions(detail);
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
                openSelectedTask();
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
        if (facadeAppKey) {
            return facadeAppKey + "@" + facadeServiceName + "." + operation;
        }
        return facadeServiceName + "." + operation;
    }

    function resolveFacadeServiceUrl(serviceName) {
        if (facadeConfig.servicePrefix) {
            return window.location.origin + "/mge/service.sbr?serviceName="
                + encodeURIComponent(serviceName) + "&outputType=json";
        }
        return window.location.origin + facadeServicePath + "?serviceName="
            + encodeURIComponent(serviceName) + "&outputType=json";
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
        var requestId = ++actionRequestSequence;
        setActionBusy(true, "Salvando alterações…");
        callFacade("atualizar", {
            nuApuracao: selectedDetail.nuapuracao,
            dtvenc: date || null,
            valor: value,
            version: observedEditionVersion(selectedDetail),
            idempotencyKey: "atualizar-" + selectedDetail.nuapuracao + "-" + Date.now()
        }).then(function () {
            if (requestId !== actionRequestSequence) {
                return;
            }
            setDetailMessage("Alterações salvas. Recarregando a apuração…");
            reloadAfterAction();
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
        var requestId = ++actionRequestSequence;
        setActionBusy(true, "Processando operação…");
        callFacade(operation, {
            nuApuracao: selectedDetail.nuapuracao,
            version: observedEditionVersion(selectedDetail),
            idempotencyKey: operation + "-" + selectedDetail.nuapuracao + "-" + Date.now()
        }).then(function () {
            if (requestId !== actionRequestSequence) {
                return;
            }
            setDetailMessage("Operação concluída. Recarregando a apuração…");
            reloadAfterAction();
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
        var sessionKey = "APURACAO_DASHBOARD_" + selectedDetail.nuapuracao + "_" + Date.now();
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
            return callFacade("anexar", {
                nuApuracao: selectedDetail.nuapuracao,
                sessionKey: sessionKey,
                nameAttach: file.name || "anexo",
                tipo: type,
                version: observedEditionVersion(selectedDetail),
                idempotencyKey: "anexar-" + selectedDetail.nuapuracao + "-" + sessionKey
            });
        }).then(function () {
            setDetailMessage("Anexo associado. Recarregando a apuração…");
            reloadAfterAction();
        }).catch(function (error) {
            showActionError(error, "Não foi possível associar o anexo.");
        }).finally(function () {
            setActionBusy(false);
        });
    }

    function viewSelectedAttachments() {
        if (!selectedDetail || selectedDetail.possuiAnexo !== "S") {
            return;
        }
        setActionBusy(true, "Consultando anexos…");
        callFacade("listarAnexos", { nuApuracao: selectedDetail.nuapuracao }).then(function (data) {
            var files = data && Array.isArray(data.files) ? data.files : Array.isArray(data) ? data : [];
            var first = files[0] || data;
            var url = first && (first.url || first.downloadUrl);
            if (!url) {
                throw createFacadeError("A fachada não retornou um visualizador autorizado.", "INTEGRATION");
            }
            window.open(url, "_blank", "noopener");
        }).catch(function (error) {
            showActionError(error, "Não foi possível abrir os anexos.");
        }).finally(function () {
            setActionBusy(false);
        });
    }

    function openSelectedTask() {
        if (!selectedDetail || !selectedDetail.idinstprn) {
            setDetailMessage("Não há tarefa pendente para esta apuração.");
            return;
        }
        setActionBusy(true, "Consultando tarefa…");
        callFacade("getTarefa", { nuApuracao: selectedDetail.nuapuracao }).then(function (data) {
            var taskId = data && (data.idInstTar || data.IDINSTTAR || data.idinsttar || data.value);
            taskId = taskId || data;
            if (!taskId) {
                throw createFacadeError("Não há tarefa pendente para esta apuração.", "BUSINESS_RULE");
            }
            var openApp = typeof window.openApp === "function"
                ? window.openApp
                : window.parent && typeof window.parent.openApp === "function" ? window.parent.openApp.bind(window.parent) : null;
            if (!openApp) {
                throw createFacadeError("A abertura de tarefas não está disponível neste contexto.", "INTEGRATION");
            }
            openApp("br.com.sankhya.workflow.listatarefa", {
                IDINSTPRN: selectedDetail.idinstprn,
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
        var correlationId = error && error.correlationId ? error.correlationId : "FA-" + Date.now();
        var message = error && error.message ? error.message : fallback;
        setDetailMessage(message + " Código: " + correlationId);
        console.error("[facilita-apuracao] operação transacional", error);
    }

    function reloadAfterAction() {
        window.setTimeout(function () {
            window.location.reload();
        }, 700);
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

    function sortableValue(row, key) {
        if (key === "valor") {
            return row.valor || 0;
        }
        if (key === "nuapuracao" || key === "codconta" || key === "numcontrato" || key === "nunota") {
            var numeric = parseInt(String(row[key] || "0"), 10);
            return isFinite(numeric) ? numeric : 0;
        }
        if (key === "dtvenc" || key === "referencia") {
            return String(row[key] || "");
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
