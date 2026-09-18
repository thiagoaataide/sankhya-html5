(function () {
    "use strict";

    const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
    const nfInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
    const EM_DASH = "\u2014";
    const MIDDLE_DOT = "\u00b7";
    const ELLIPSIS = "\u2026";
    const CENTRAL_NOTAS = "br.com.sankhya.com.mov.CentralNotas";
    const NOTA_DBLCLICK_HINT = "Duplo clique para abrir na Central de Notas.";

    let resumo = [];
    let interco = [];
    let outras = [];
    let filtered = [];
    let selectedKey = null;
    const detailCache = Object.create(null);
    let detailRequestId = 0;

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
        interco = [];
        outras = [];
        filtered = resumo.slice();
    }

    function parseKey(key) {
        const first = key.indexOf("-");
        const second = key.indexOf("-", first + 1);
        if (first < 0 || second < 0) return null;
        return {
            codemp: key.slice(0, first),
            codprod: key.slice(first + 1, second),
            controle: key.slice(second + 1)
        };
    }

    function ingestDetailHtml(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const root = doc.getElementById("data-container");
        if (!root) return { interco: [], outras: [] };
        return {
            interco: Array.from(root.querySelectorAll(".data-interco")).map(readInterco),
            outras: Array.from(root.querySelectorAll(".data-outras")).map(readOutras)
        };
    }

    function readResponseIso8859(res) {
        if (!res.ok) {
            return Promise.reject(new Error("HTTP " + res.status));
        }
        return res.arrayBuffer().then((buf) => new TextDecoder("iso-8859-1").decode(buf));
    }

    function detailUrl(base, part, qs) {
        return base + "/detalhe_payload.jsp?part=" + part + "&" + qs.toString();
    }

    function fetchDetails(key) {
        const base = window.GET_INTERCO_BASE;
        const parts = parseKey(key);
        if (!base || !parts) {
            interco = [];
            outras = [];
            renderDetails(key);
            return;
        }
        if (detailCache[key]) {
            interco = detailCache[key].interco;
            outras = detailCache[key].outras;
            renderDetails(key);
            return;
        }

        const reqId = ++detailRequestId;
        setDetailLoading(true, key);

        const row = resumo.find((r) => r.key === key);
        const qs = new URLSearchParams({
            codemp: parts.codemp,
            codprod: parts.codprod,
            controle: parts.controle
        });
        const rast = row && String(row.rastreavel || "").trim().toUpperCase();
        if (rast === "S" || rast === "SIM") {
            qs.set("rastreavel", "S");
        } else {
            qs.set("rastreavel", "N");
        }

        const opts = { credentials: "same-origin" };
        Promise.all([
            fetch(detailUrl(base, "interco", qs), opts).then(readResponseIso8859),
            fetch(detailUrl(base, "outras", qs), opts).then(readResponseIso8859)
        ])
            .then(([htmlInterco, htmlOutras]) => {
                if (reqId !== detailRequestId) return;
                const data = {
                    interco: ingestDetailHtml(htmlInterco).interco,
                    outras: ingestDetailHtml(htmlOutras).outras
                };
                detailCache[key] = data;
                interco = data.interco;
                outras = data.outras;
                renderDetails(key);
                if (reqId === detailRequestId) setDetailLoading(false, key);
            })
            .catch((err) => {
                if (reqId !== detailRequestId) return;
                console.warn("[interco-dash] detalhe", err);
                interco = [];
                outras = [];
                renderDetails(key, true);
                setDetailLoading(false, key);
            });
    }

    function setDetailLoading(loading, key) {
        const intercoMeta = document.getElementById("interco-meta");
        const outrasMeta = document.getElementById("outras-meta");
        if (loading && selectedKey === key) {
            const msg = "Carregando notas do produto\u2026";
            if (intercoMeta) intercoMeta.textContent = msg;
            if (outrasMeta) outrasMeta.textContent = msg;
        }
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
            tipmov: (el.dataset.tipmov || "C").trim().toUpperCase(),
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
            tipmov: (el.dataset.tipmov || "C").trim().toUpperCase(),
            descrtop: el.dataset.descrtop || "",
            saldoItem: num(el.dataset.saldoitem),
            saldoRastLoc: num(el.dataset.saldorastloc)
        };
    }

    function getOpenApp() {
        if (typeof window.openApp === "function") return window.openApp;
        if (window.parent && typeof window.parent.openApp === "function") {
            return window.parent.openApp.bind(window.parent);
        }
        return null;
    }

    function openNotaCentral(row) {
        const nunota = row && row.nunota;
        if (!nunota) return;
        const openApp = getOpenApp();
        if (!openApp) {
            alert("Abrir nota n\u00e3o est\u00e1 dispon\u00edvel fora do ambiente Sankhya (openApp).");
            return;
        }
        try {
            openApp(CENTRAL_NOTAS, { NUNOTA: nunota });
        } catch (err) {
            console.error("[interco-dash] openApp CentralNotas", err);
            alert("N\u00e3o foi poss\u00edvel abrir o documento " + nunota + " na Central de Notas.");
        }
    }

    function bindNotaRowDblclick(tr, row) {
        tr.classList.add("row--open-nota");
        tr.title = NOTA_DBLCLICK_HINT;
        tr.addEventListener("dblclick", (ev) => {
            ev.preventDefault();
            openNotaCentral(row);
        });
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
                if (filtered.length === 1) {
                    selectRow(filtered[0].key);
                } else if (selectedKey && !filtered.some((r) => r.key === selectedKey)) {
                    selectedKey = null;
                    interco = [];
                    outras = [];
                    renderDetails(null);
                }
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
            tr.appendChild(td(formatRastreavel(row.rastreavel)));

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
            meta.textContent = filtered.length + " produto(s) " + MIDDLE_DOT + " selecione para detalhar notas.";
        }
    }

    function selectRow(key) {
        selectedKey = key;
        renderGrid();
        fetchDetails(key);
    }

    function renderDetails(key, failed) {
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
                tr.appendChild(td(r.top + " " + EM_DASH + " " + truncate(r.descrtop, 28)));
                tr.appendChild(tdNum(r.qtdComprada));
                tr.appendChild(tdNum(r.qtdDevolvida));
                tr.appendChild(tdNum(r.saldoItem));
                tr.appendChild(td(r.codlocal));
                tr.appendChild(tdNum(r.saldoRast));
                tr.appendChild(tdNum(r.saldoVinc));
                bindNotaRowDblclick(tr, r);
                frag.appendChild(tr);
            });
            intercoBody.appendChild(frag);
        }

        if (outrasBody) {
            outrasBody.innerHTML = "";
            const frag = document.createDocumentFragment();
            outrasRows.forEach((r) => {
                const tr = document.createElement("tr");
                if (r.saldoRastLoc > 0) tr.classList.add("row--has-saldo");
                tr.appendChild(td(r.nunota));
                tr.appendChild(td(r.numnota + (r.serie ? " / " + r.serie : "")));
                tr.appendChild(td(formatDate(r.dtentsai)));
                tr.appendChild(td(r.top + " " + EM_DASH + " " + truncate(r.descrtop, 28)));
                tr.appendChild(tdNum(r.saldoItem));
                tr.appendChild(tdNum(r.saldoRastLoc));
                bindNotaRowDblclick(tr, r);
                frag.appendChild(tr);
            });
            outrasBody.appendChild(frag);
        }

        const dblHint = " Duplo clique na linha abre a Central de Notas.";
        const comSaldo = intercoRows.filter((r) => r.saldoVinc > 0).length;
        if (intercoMeta) {
            intercoMeta.textContent = intercoRows.length + " compra(s) intercompany listada(s) " + MIDDLE_DOT + " "
                + comSaldo + " com saldo vincul\u00e1vel > 0 (destaque verde)." + dblHint;
        }
        if (outrasMeta) {
            const comSaldoSaida = outrasRows.filter((r) => r.saldoRastLoc > 0).length;
            outrasMeta.textContent = failed
                ? "Falha ao carregar entradas. Tente selecionar o produto novamente."
                : outrasRows.length + " nota(s) eleg\u00edveis para dev. compra (n\u00e3o intercompany) \u00b7 "
                    + comSaldoSaida + " com saldo de sa\u00edda TGFITS (verde, se rastre\u00e1vel)." + dblHint;
        }
        if (failed && intercoMeta) {
            intercoMeta.textContent = "Falha ao carregar notas intercompany.";
        }
    }

    function exportExcel() {
        if (!window.XLSX) {
            alert("Biblioteca Excel n\u00e3o carregada.");
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
            Rastreavel: formatRastreavel(r.rastreavel),
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
        el.textContent = text == null || text === "" ? EM_DASH : String(text);
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

    function formatRastreavel(v) {
        const flag = String(v || "").trim().toUpperCase();
        if (flag === "S") return "Sim";
        if (flag === "N") return "N\u00e3o";
        return v == null || v === "" ? EM_DASH : String(v);
    }

    function formatDate(v) {
        if (!v) return EM_DASH;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("pt-BR");
    }

    function truncate(s, max) {
        if (!s) return "";
        return s.length > max ? s.slice(0, max) + ELLIPSIS : s;
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
})();
