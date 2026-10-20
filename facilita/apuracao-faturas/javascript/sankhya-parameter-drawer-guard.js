(function () {
    "use strict";

    var STYLE_ID = "facilita-apuracao-disable-vcompactbar";
    var PATCHED_DOCS = typeof WeakSet === "function" ? new WeakSet() : null;

    function dashboardDocuments() {
        var docs = [];
        var current = window;
        var depth = 0;
        while (current && depth < 4) {
            try {
                if (current.document && docs.indexOf(current.document) === -1) {
                    docs.push(current.document);
                }
                if (!current.parent || current.parent === current) {
                    break;
                }
                current = current.parent;
            } catch (error) {
                break;
            }
            depth += 1;
        }
        return docs;
    }

    function ensureStyle(doc) {
        if (!doc || !doc.head || doc.getElementById(STYLE_ID)) {
            return false;
        }
        var style = doc.createElement("style");
        style.id = STYLE_ID;
        style.textContent = [
            "/* Facilita Apuração A15: desativa hover da barra de parâmetros do dashboard */",
            ".VCompactBar {",
            "  pointer-events: none !important;",
            "  width: 0 !important;",
            "  min-width: 0 !important;",
            "  max-width: 0 !important;",
            "  border: none !important;",
            "  background: transparent !important;",
            "  overflow: hidden !important;",
            "}",
            ".VCompactBar-opened {",
            "  width: 0 !important;",
            "  padding: 0 !important;",
            "}",
            ".VCompactBar > div {",
            "  display: none !important;",
            "  visibility: hidden !important;",
            "}",
            ".dashboard {",
            "  padding-left: 0 !important;",
            "}"
        ].join("\n");
        doc.head.appendChild(style);
        return true;
    }

    function collapseBars(doc) {
        if (!doc || !doc.querySelectorAll) {
            return;
        }
        var bars = doc.querySelectorAll(".VCompactBar");
        Array.prototype.forEach.call(bars, function (bar) {
            bar.classList.remove("VCompactBar-opened");
            bar.setAttribute("aria-hidden", "true");
        });
    }

    function patchDocument(doc) {
        if (!doc || !doc.body) {
            return;
        }
        if (PATCHED_DOCS && PATCHED_DOCS.has(doc)) {
            return;
        }
        ensureStyle(doc);
        collapseBars(doc);
        if (PATCHED_DOCS) {
            PATCHED_DOCS.add(doc);
        }
    }

    function run() {
        dashboardDocuments().forEach(patchDocument);
    }

    run();
    window.setTimeout(run, 400);
    window.setTimeout(run, 1500);
})();
