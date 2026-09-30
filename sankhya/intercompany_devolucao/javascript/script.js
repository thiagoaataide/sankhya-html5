(function () {
    "use strict";

    const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
    const nfInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

    let resumo = [];
    let interco = [];
    let outras = [];
    let filtered = [];
    let selectedKey = null;

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        scheduleCleaning();
        loadData();
        bindUi();
        refreshKpis(filtered);
        renderGrid();
    }

    function scheduleCleaning() {
        cleanSankhyaUI();
        [500, 2000, 5000].forEach((t) => setTimeout(cleanSankhyaUI, t));
    }

    function cleanSankhyaUI() {
        try {
            [window.parent, window.parent && window.parent.parent]
                .filter(Boolean)
                .forEach((frame) => {
                    const doc = frame.document;
                    if (!doc) return;
                    doc.querySelectorAll("button.chartConfigButton, .VCompactBar, .VCompactBar-opened, .VCompactBar-closed")
                        .forEach((el) => el.remove());
                });
        } catch (e) {
            console.warn("[interco-dash] clean UI", e);
        }
    }

    function loadData() {
        const root = document.getElementById("data-container");
        if (!root) return;

        resumo = Array.from(root.querySelectorAll(".data-resumo")).map(readResumo);
        interco = Array.from(root.querySelectorAll(".data-interco")).map(readInterco);
        outras = Array.from(root.querySelectorAll(".data-outras")).map(readOutras);
        filtered = resumo.slice();
    }

    function readResumo(el) {
        return {
            key: el.dataset.key || "",
            codemp: el.dataset.codemp || "",
            nomeemp: el.dataset.nomeemp || "",
            codprod: el.dataset.codprod || "",
            descrprod: el.dataset.descrprod || "",
            controle: el.dataset.controle || "",
            estoque: num(el.dataset.estoque),
            reservado: num(el.dataset.reservado),
            disponivel: num(el.dataset.disponivel),
            dispPp: num(el.dataset.dispPp),
            dif: num(el.dataset.dif),
            rastreavel: el.dataset.rastreavel || "N",
            motivoCod: el.dataset.motivoCod || "",
            motivoTxt: el.dataset.motivoTxt || ""
        };
    }

    function readInterco(el) {
        return {
            key: el.dataset.key || "",
            nunota: el.dataset.nunota || "",
            numnota: el.dataset.numnota || "",
            serie: el.dataset.serie || "",
            dtentsai: el.dataset.dtentsai || "",
            top: el.dataset.top || "",
            descrtop: el.dataset.descrtop || "",
            qtdComprada: num(el.dataset.qtdcomprada),
            qtdDevolvida: num(el.dataset.qtddevolvida),
            saldoItem: num(el.dataset.saldoitem),
            codlocal: el.dataset.codlocal || "",
            saldoRast: num(el.dataset.saldorast),
            saldoVinc: num(el.dataset.saldovinc),
            rastreavel: el.dataset.rastreavel || "N"
        };
    }

    function readOutras(el) {
        return {
            key: el.dataset.key || "",
            nunota: el.dataset.nunota || "",
            numnota: el.dataset.numnota || "",
            serie: el.dataset.serie || "",
            dtentsai: el.dataset.dtentsai || "",
            top: el.dataset.top || "",
            descrtop: el.dataset.descrtop || "",
            saldoItem: num(el.dataset.saldoitem),
            saldoRastLoc: num(el.dataset.saldorastloc),
            motivo: el.dataset.motivo || ""
        };
    }

    function bindUi() {
        const search = document.getElementById("filter-text");
        if (search) {
            search.addEventListener("input", () => {
                const q = search.value.trim().toLowerCase();
                filtered = resumo.filter((r) => {
                    if (!q) return true;
                    return String(r.codprod).includes(q) || (r.descrprod || "").toLowerCase().includes(q);
                });
                refreshKpis(filtered);
                renderGrid();
            });
        }

        const exportBtn = document.getElementById("btn-export");
        if (exportBtn) exportBtn.addEventListener("click", exportExcel);
    }

    function refreshKpis(rows) {
        setText("kpi-produtos", nfInt.format(rows.length));
        setText("kpi-sem-vinculo", nfInt.format(rows.filter((r) => r.motivoCod === "SEM_VINC_INTERCO" || r.motivoCod === "PARCIAL_VINC").length));
        setText("kpi-elegiveis", nfInt.format(rows.filter((r) => r.motivoCod === "ELEGIVEL").length));
        setText("kpi-disponivel", nf.format(rows.reduce((s, r) => s + r.disponivel, 0)));
    }

    function renderGrid() {
        const body = document.getElementById("grid-produtos-body");
        const meta = document.getElementById("grid-meta");
        if (!body) return;

        body.innerHTML = "";
        const frag = document.createDocumentFragment();

        filtered.forEach((row) => {
            const tr = document.createElement("tr");
            tr.dataset.selectable = "true";
            tr.dataset.key = row.key;
            if (row.key === selectedKey) tr.classList.add("is-selected");

            tr.appendChild(td(row.codemp));
            tr.appendChild(td(formatProd(row.codprod)));
            tr.appendChild(td(row.descrprod));
            tr.appendChild(tdNum(row.estoque));
            tr.appendChild(tdNum(row.reservado));
            tr.appendChild(tdNum(row.disponivel));
            tr.appendChild(tdNum(row.dispPp));
            tr.appendChild(tdNum(row.dif));
            tr.appendChild(td(row.rastreavel));

            const motive = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "badge " + badgeClass(row.motivoCod);
            badge.textContent = row.motivoTxt || row.motivoCod;
            badge.title = row.motivoTxt;
            motive.appendChild(badge);
            tr.appendChild(motive);

            tr.addEventListener("click", () => selectRow(row.key));
            frag.appendChild(tr);
        });

        body.appendChild(frag);
        if (meta) {
            meta.textContent = filtered.length + " produto(s) · selecione para detalhar notas.";
        }
    }

    function selectRow(key) {
        selectedKey = key;
        renderGrid();
        renderDetails(key);
    }

    function renderDetails(key) {
        const empty = document.getElementById("detail-empty");
        const panels = document.getElementById("detail-panels");
        if (!key) {
            if (empty) empty.hidden = false;
            if (panels) panels.hidden = true;
            return;
        }
        if (empty) empty.hidden = true;
        if (panels) panels.hidden = false;

        const intercoRows = interco.filter((r) => r.key === key);
        const outrasRows = outras.filter((r) => r.key === key);

        const intercoBody = document.getElementById("grid-interco-body");
        const outrasBody = document.getElementById("grid-outras-body");
        const intercoMeta = document.getElementById("interco-meta");
        const outrasMeta = document.getElementById("outras-meta");

        if (intercoBody) {
            intercoBody.innerHTML = "";
            const frag = document.createDocumentFragment();
            intercoRows.forEach((r) => {
                const tr = document.createElement("tr");
                if (r.saldoVinc > 0) tr.classList.add("row--has-saldo");
                tr.appendChild(td(r.nunota));
                tr.appendChild(td(r.numnota + (r.serie ? " / " + r.serie : "")));
                tr.appendChild(td(formatDate(r.dtentsai)));
                tr.appendChild(td(r.top + " — " + truncate(r.descrtop, 28)));
                tr.appendChild(tdNum(r.qtdComprada));
                tr.appendChild(tdNum(r.qtdDevolvida));
                tr.appendChild(tdNum(r.saldoItem));
                tr.appendChild(td(r.codlocal));
                tr.appendChild(tdNum(r.saldoRast));
                tr.appendChild(tdNum(r.saldoVinc));
                frag.appendChild(tr);
            });
            intercoBody.appendChild(frag);
        }

        if (outrasBody) {
            outrasBody.innerHTML = "";
            const frag = document.createDocumentFragment();
            outrasRows.forEach((r) => {
                const tr = document.createElement("tr");
                if (r.saldoRastLoc > 0 || r.saldoItem > 0) tr.classList.add("row--has-saldo");
                tr.appendChild(td(r.nunota));
                tr.appendChild(td(r.numnota + (r.serie ? " / " + r.serie : "")));
                tr.appendChild(td(formatDate(r.dtentsai)));
                tr.appendChild(td(r.top + " — " + truncate(r.descrtop, 28)));
                tr.appendChild(tdNum(r.saldoItem));
                tr.appendChild(tdNum(r.saldoRastLoc));
                tr.appendChild(td(r.motivo));
                frag.appendChild(tr);
            });
            outrasBody.appendChild(frag);
        }

        const comSaldo = intercoRows.filter((r) => r.saldoVinc > 0).length;
        if (intercoMeta) {
            intercoMeta.textContent = intercoRows.length + " nota(s) intercompany · " + comSaldo + " com saldo vinculável > 0 (destaque verde).";
        }
        if (outrasMeta) {
            outrasMeta.textContent = outrasRows.length + " entrada(s) fora do critério intercompany.";
        }
    }

    function exportExcel() {
        if (!window.XLSX) {
            alert("Biblioteca Excel não carregada.");
            return;
        }
        const sheetResumo = filtered.map((r) => ({
            Empresa: r.codemp,
            Produto: r.codprod,
            Descricao: r.descrprod,
            Estoque: r.estoque,
            Reservado: r.reservado,
            Disponivel: r.disponivel,
            VincInterco: r.dispPp,
            DifSemVinculo: r.dif,
            Rastreavel: r.rastreavel,
            Motivo: r.motivoTxt
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetResumo), "Resumo");
        XLSX.writeFile(wb, "diagnostico-intercompany.xlsx");
    }

    function badgeClass(cod) {
        switch (cod) {
            case "ELEGIVEL": return "badge--ok";
            case "EXCL_FORN": return "badge--excl";
            case "SEM_VINC_INTERCO": return "badge--sem";
            case "PARCIAL_VINC": return "badge--par";
            default: return "badge--muted";
        }
    }

    function td(text) {
        const el = document.createElement("td");
        el.textContent = text == null || text === "" ? "—" : String(text);
        return el;
    }

    function tdNum(value) {
        const el = td(nf.format(value));
        el.classList.add("num");
        return el;
    }

    function num(v) {
        const n = parseFloat(String(v).replace(",", "."));
        return Number.isFinite(n) ? n : 0;
    }

    function formatProd(v) {
        const n = parseInt(String(v).split(/[.,]/)[0], 10);
        return Number.isFinite(n) ? String(n) : v;
    }

    function formatDate(v) {
        if (!v) return "—";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("pt-BR");
    }

    function truncate(s, max) {
        if (!s) return "";
        return s.length > max ? s.slice(0, max) + "…" : s;
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
})();
