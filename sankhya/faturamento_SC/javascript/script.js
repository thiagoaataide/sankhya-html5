(function () {
    "use strict";

    var money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    var decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function number(value) {
        if (value === null || value === undefined || value === "") return 0;
        var valueText = String(value).trim();
        if (valueText.indexOf(",") >= 0 && valueText.indexOf(".") >= 0) valueText = valueText.replace(/\./g, "").replace(",", ".");
        else valueText = valueText.replace(",", ".");
        var parsed = Number(valueText);
        return isFinite(parsed) ? parsed : 0;
    }

    function text(value) {
        if (value === null || value === undefined || value === "") return "-";
        return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function formatDate(value) {
        var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? match[3] + "/" + match[2] + "/" + match[1] : text(value);
    }

    function rows() {
        return Array.prototype.map.call(document.querySelectorAll(".data-row"), function (node) {
            var d = node.dataset;
            return {
                numos: d.numos, nunotaped: d.nunotaped, codusuvend: d.codusuvend, vendedor: d.vendedor,
                codusuexec: d.codusuexec, executante: d.executante, classificacao: d.classificacao,
                codnat: d.codnat, descrnat: d.descrnat, codparc: d.codparc, nomeparc: d.nomeparc, pedido: d.pedido,
                tempgasto: number(d.tempgasto), vlrtot: number(d.vlrtot), vlrunit: number(d.vlrunit),
                tempgastoPreenchido: d.tempgasto !== "", vlrtotPreenchido: d.vlrtot !== "", vlrunitPreenchido: d.vlrunit !== "",
                faturar: d.faturar, autorizado: d.autorizado, nunotanf: d.nunotanf, faturado: d.faturado,
                dhentrada: d.dhentrada, inicexec: d.inicexec
            };
        });
    }

    function badge(value) {
        var yes = isFaturado(value);
        return '<span class="badge ' + (yes ? "badge--yes" : "badge--no") + '">' + text(value) + "</span>";
    }

    function isFaturado(value) { return String(value).toLowerCase() === "sim" || String(value).toUpperCase() === "S"; }

    function yesNoBadge(value) {
        var yes = isFaturado(value);
        return '<span class="badge ' + (yes ? "badge--yes" : "badge--no") + '">' + (yes ? "Sim" : "Não") + "</span>";
    }

    function authorizedBadge(value) {
        var status = String(value || "").toUpperCase();
        if (status === "S") return '<span class="badge badge--yes">Sim</span>';
        if (status === "P") return '<span class="badge badge--pending">Pendente</span>';
        return '<span class="badge badge--no">Não</span>';
    }

    function noteAction(label, nunota) {
        if (!nunota) return "";
        return '<button type="button" class="note-action" data-nunota="' + text(nunota) + '">' + label + "</button>";
    }

    function render(data) {
        document.getElementById("detail-body").innerHTML = data.map(function (r) {
            return "<tr>" +
                "<td>" + text(r.numos) + "</td><td>" + text(r.pedido) + "</td>" +
                "<td>" + text(r.nomeparc) + "</td><td>" + text(r.vendedor) + "</td><td>" + text(r.executante) + "</td>" +
                "<td>" + text(r.classificacao) + "</td><td>" + text(r.descrnat) + "</td>" +
                '<td class="numeric">' + decimal.format(r.tempgasto) + "</td>" +
                '<td class="numeric">' + money.format(r.vlrtot) + "</td>" +
                '<td class="numeric">' + money.format(r.vlrunit) + "</td>" +
                "<td>" + badge(r.faturado) + "</td><td>" + yesNoBadge(r.faturar) + "</td><td>" + authorizedBadge(r.autorizado) + "</td>" +
                "<td>" + text(r.nunotaped) + "</td><td>" + text(r.nunotanf) + "</td>" +
                "<td>" + formatDate(r.dhentrada) + "</td><td>" + formatDate(r.inicexec) + "</td>" +
                "<td>" + noteAction("Abrir pedido", r.nunotaped) + noteAction("Abrir NF", r.nunotanf) + "</td></tr>";
        }).join("");
    }

    function openNote(nunota) {
        var app = typeof window.openApp === "function" ? window.openApp : (window.parent && typeof window.parent.openApp === "function" ? window.parent.openApp : null);
        if (!app) { alert("A funcao de abrir a Central de Notas nao esta disponivel."); return; }
        try {
            app("br.com.sankhya.com.mov.CentralNotas", { NUNOTA: nunota });
        } catch (error) {
            console.error("Erro ao abrir a nota.", error);
            alert("Nao foi possivel abrir o registro na Central de Notas.");
        }
    }

    function uniqueOrders(data) {
        var orders = {};
        data.forEach(function (row, index) {
            var key = row.numos || "row-" + index;
            if (!orders[key]) orders[key] = row;
        });
        return Object.keys(orders).map(function (key) { return orders[key]; });
    }

    function totals(data) {
        var partners = {}, hours = 0, billed = 0, pending = 0, orders = uniqueOrders(data);
        orders.forEach(function (r) {
            if (r.codparc) partners[r.codparc] = true;
            hours += r.tempgasto;
            if (isFaturado(r.faturado)) billed += r.vlrtot;
            if (!isFaturado(r.faturado) && r.tempgastoPreenchido && r.vlrunitPreenchido && r.vlrtotPreenchido) pending += r.vlrtot;
        });
        document.getElementById("total-horas").textContent = decimal.format(hours) + " h";
        document.getElementById("total-parceiros").textContent = Object.keys(partners).length;
        document.getElementById("total-os").textContent = orders.length;
        document.getElementById("total-faturado").textContent = money.format(billed);
        document.getElementById("total-pendente").textContent = money.format(pending);
        document.getElementById("table-meta").textContent = data.length + (data.length === 1 ? " registro" : " registros");
        document.getElementById("empty-state").hidden = data.length !== 0;
        document.getElementById("table-panel").hidden = data.length === 0;
    }

    function exportRows(data) {
        return data.map(function (r) {
            return {
                "OS": r.numos, "Nota/Pedido faturamento": r.nunotaped, "Codigo vendedor": r.codusuvend,
                "Vendedor": r.vendedor, "Codigo executante": r.codusuexec, "Executante": r.executante,
                "Classificacao": r.classificacao, "Codigo natureza": r.codnat, "Natureza": r.descrnat,
                "Codigo parceiro": r.codparc, "Parceiro": r.nomeparc, "Pedido": r.pedido,
                "Horas": r.tempgasto, "Valor total": r.vlrtot, "Valor unitario": r.vlrunit,
                "Faturar": r.faturar, "Autorizado": r.autorizado, "NF": r.nunotanf,
                "Faturado": r.faturado, "Entrada": r.dhentrada, "Inicio execucao": r.inicexec
            };
        });
    }

    function exportXlsx(data) {
        if (!window.XLSX) { alert("A biblioteca de exportacao Excel nao foi carregada."); return; }
        var worksheet = XLSX.utils.json_to_sheet(exportRows(data));
        worksheet["!cols"] = [8, 20, 16, 22, 17, 22, 18, 16, 28, 16, 30, 12, 12, 15, 15, 10, 12, 12, 12, 18, 18].map(function (width) { return { wch: width }; });
        var workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Detalhamento");
        XLSX.writeFile(workbook, "faturamento_sc_detalhamento.xlsx");
    }

    function exportPdf(data) {
        if (!window.jspdf || !window.jspdf.jsPDF) { alert("A biblioteca de exportacao PDF nao foi carregada."); return; }
        var doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        doc.setFontSize(14); doc.setTextColor(23, 55, 94); doc.text("Faturamento SC - Detalhamento", 10, 12);
        doc.autoTable({
            head: [["OS", "Pedido", "NF", "Parceiro", "Vendedor", "Executante", "Classificacao", "Natureza", "Horas", "Valor total", "Valor unitario", "Faturado", "Faturar", "Autorizado", "Entrada", "Inicio execucao"]],
            body: data.map(function (r) { return [r.numos, r.pedido, r.nunotanf, r.nomeparc, r.vendedor, r.executante, r.classificacao, r.descrnat, decimal.format(r.tempgasto), money.format(r.vlrtot), money.format(r.vlrunit), r.faturado, r.faturar, r.autorizado, r.dhentrada, r.inicexec]; }),
            startY: 18, margin: { top: 18, right: 6, bottom: 10, left: 6 }, pageBreak: "auto", showHead: "everyPage",
            headStyles: { fillColor: [23, 55, 94], textColor: 255, fontStyle: "bold", fontSize: 6 },
            styles: { fontSize: 5.5, cellPadding: 1.2, overflow: "linebreak" }
        });
        doc.save("faturamento_sc_detalhamento.pdf");
    }

    function initHorizontalScrollAnchor() {
        var tableWrap = document.querySelector(".table-wrap");
        var table = tableWrap && tableWrap.querySelector("table");
        var anchor = document.getElementById("horizontal-scroll-anchor");
        var content = document.getElementById("horizontal-scroll-content");
        if (!tableWrap || !table || !anchor || !content) return;

        function updateWidth() {
            content.style.width = table.scrollWidth + "px";
            anchor.hidden = table.scrollWidth <= tableWrap.clientWidth;
            anchor.scrollLeft = tableWrap.scrollLeft;
        }

        anchor.addEventListener("scroll", function () { tableWrap.scrollLeft = anchor.scrollLeft; });
        tableWrap.addEventListener("scroll", function () { anchor.scrollLeft = tableWrap.scrollLeft; });
        window.addEventListener("resize", updateWidth);
        updateWidth();
        setTimeout(updateWidth, 300);
    }

    function hideSankhyaVerticalScroll(doc) {
        if (!doc) return;
        var rootElements = [doc.documentElement, doc.body, doc.scrollingElement].filter(Boolean);
        rootElements.forEach(function (element) {
            element.style.setProperty("overflow-y", "hidden", "important");
        });
        Array.prototype.forEach.call(doc.querySelectorAll("*"), function (element) {
            var style = doc.defaultView.getComputedStyle(element);
            var canScrollVertically = element.clientHeight > 0 && element.scrollHeight > element.clientHeight &&
                (style.overflowY === "auto" || style.overflowY === "scroll");
            if (canScrollVertically) element.style.setProperty("overflow-y", "hidden", "important");
        });
    }

    function cleanSankhyaUI() {
        try {
            [window.parent, window.parent && window.parent.parent].filter(Boolean).forEach(function (frame) {
                frame.document.querySelectorAll("button.gwt-Button.chartConfigButton").forEach(function (element) { element.remove(); });
                hideSankhyaVerticalScroll(frame.document);
            });
        } catch (error) { console.warn("Nao foi possivel remover elementos nativos.", error); }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var data = rows();
        render(data); totals(data);
        document.getElementById("exportar-xlsx").addEventListener("click", function () { exportXlsx(data); });
        document.getElementById("exportar-pdf").addEventListener("click", function () { exportPdf(data); });
        document.getElementById("detail-body").addEventListener("click", function (event) {
            var button = event.target.closest(".note-action");
            if (button) openNote(button.getAttribute("data-nunota"));
        });
        initHorizontalScrollAnchor();
        cleanSankhyaUI();
        [500, 2000, 5000, 10000].forEach(function (delay) { setTimeout(cleanSankhyaUI, delay); });
    });
}());
