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

    function rows() {
        return Array.prototype.map.call(document.querySelectorAll(".data-row"), function (node) {
            var d = node.dataset;
            return {
                numos: d.numos, vendedor: d.vendedor, executante: d.executante, classificacao: d.classificacao,
                descrnat: d.descrnat, codparc: d.codparc, nomeparc: d.nomeparc, pedido: d.pedido,
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

    function render(data) {
        document.getElementById("detail-body").innerHTML = data.map(function (r) {
            return "<tr>" +
                "<td>" + text(r.numos) + "</td><td>" + text(r.pedido) + "</td><td>" + text(r.nunotanf) + "</td>" +
                "<td>" + text(r.nomeparc) + "</td><td>" + text(r.vendedor) + "</td><td>" + text(r.executante) + "</td>" +
                "<td>" + text(r.classificacao) + "</td><td>" + text(r.descrnat) + "</td>" +
                '<td class="numeric">' + decimal.format(r.tempgasto) + "</td>" +
                '<td class="numeric">' + money.format(r.vlrtot) + "</td>" +
                '<td class="numeric">' + money.format(r.vlrunit) + "</td>" +
                "<td>" + badge(r.faturado) + "</td><td>" + badge(r.faturar) + "</td><td>" + badge(r.autorizado) + "</td>" +
                "<td>" + text(r.dhentrada) + "</td><td>" + text(r.inicexec) + "</td></tr>";
        }).join("");
    }

    function totals(data) {
        var partners = {}, os = {}, hours = 0, billed = 0, pending = 0;
        data.forEach(function (r) {
            if (r.codparc) partners[r.codparc] = true;
            if (r.numos) os[r.numos] = true;
            hours += r.tempgasto;
            if (isFaturado(r.faturado)) billed += r.vlrunit * r.vlrtot;
            if (!isFaturado(r.faturado) && r.tempgastoPreenchido && r.vlrunitPreenchido && r.vlrtotPreenchido) pending += r.vlrunit * r.vlrtot;
        });
        document.getElementById("total-horas").textContent = decimal.format(hours) + " h";
        document.getElementById("total-parceiros").textContent = Object.keys(partners).length;
        document.getElementById("total-os").textContent = Object.keys(os).length;
        document.getElementById("total-faturado").textContent = money.format(billed);
        document.getElementById("total-pendente").textContent = money.format(pending);
        document.getElementById("table-meta").textContent = data.length + (data.length === 1 ? " registro" : " registros");
        document.getElementById("empty-state").hidden = data.length !== 0;
        document.getElementById("table-panel").hidden = data.length === 0;
    }

    function exportRows(data) {
        return data.map(function (r) {
            return {
                "OS": r.numos, "Pedido": r.pedido, "NF": r.nunotanf, "Parceiro": r.nomeparc,
                "Vendedor": r.vendedor, "Executante": r.executante, "Classificacao": r.classificacao,
                "Natureza": r.descrnat, "Horas": r.tempgasto, "Valor total": r.vlrtot,
                "Valor unitario": r.vlrunit, "Faturado": r.faturado, "Faturar": r.faturar,
                "Autorizado": r.autorizado, "Entrada": r.dhentrada, "Inicio execucao": r.inicexec
            };
        });
    }

    function exportXlsx(data) {
        if (!window.XLSX) { alert("A biblioteca de exportacao Excel nao foi carregada."); return; }
        var worksheet = XLSX.utils.json_to_sheet(exportRows(data));
        worksheet["!cols"] = [8, 12, 12, 30, 22, 22, 18, 28, 12, 15, 15, 12, 10, 12, 18, 18].map(function (width) { return { wch: width }; });
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

    function cleanSankhyaUI() {
        try {
            [window.parent, window.parent && window.parent.parent].filter(Boolean).forEach(function (frame) {
                frame.document.querySelectorAll("button.gwt-Button.chartConfigButton, .VCompactBar, .VCompactBar-opened, .VCompactBar-closed").forEach(function (element) { element.remove(); });
            });
        } catch (error) { console.warn("Nao foi possivel remover elementos nativos.", error); }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var data = rows();
        render(data); totals(data);
        document.getElementById("exportar-xlsx").addEventListener("click", function () { exportXlsx(data); });
        document.getElementById("exportar-pdf").addEventListener("click", function () { exportPdf(data); });
        cleanSankhyaUI();
        [500, 2000, 5000, 10000].forEach(function (delay) { setTimeout(cleanSankhyaUI, delay); });
    });
}());
