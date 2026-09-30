<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Diagnóstico — Devolução Intercompany</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${BASE_FOLDER}/css/style.css">
    <snk:load/>
</head>
<body>
<snk:load>
    <jsp:include page="dados.jsp"/>
    <script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js"></script>
    <script src="${BASE_FOLDER}/javascript/script.js"></script>
</snk:load>

<main class="shell">
    <header class="hero">
        <div>
            <p class="eyebrow">Estoque · Intercompany</p>
            <h1>Diagnóstico de devolução</h1>
            <p class="lede">Empresas devolvedoras, saldo físico e vínculo com compras intercompany (regras do addon GET).</p>
        </div>
        <div class="hero__actions">
            <button type="button" id="btn-export" class="btn btn--accent">Exportar Excel</button>
        </div>
    </header>

    <section class="kpi-strip" aria-label="Resumo">
        <article class="kpi"><span>Produtos</span><strong id="kpi-produtos">0</strong></article>
        <article class="kpi"><span>Sem vínculo interco</span><strong id="kpi-sem-vinculo">0</strong></article>
        <article class="kpi kpi--ok"><span>Elegíveis</span><strong id="kpi-elegiveis">0</strong></article>
        <article class="kpi"><span>Disponível total</span><strong id="kpi-disponivel">0</strong></article>
    </section>

    <section class="panel">
        <div class="panel__head">
            <div>
                <h2>Produtos com saldo para análise</h2>
                <p id="grid-meta">Selecione uma linha para ver notas de compra intercompany e outras entradas.</p>
            </div>
            <label class="search">
                <span class="sr-only">Buscar produto</span>
                <input type="search" id="filter-text" placeholder="Filtrar por código ou descrição…" autocomplete="off">
            </label>
        </div>
        <div class="table-wrap" tabindex="0">
            <table id="grid-produtos">
                <thead>
                <tr>
                    <th>Emp</th>
                    <th>Produto</th>
                    <th>Descrição</th>
                    <th>Estoque</th>
                    <th>Reservado</th>
                    <th>Disponível</th>
                    <th>Vinc. interco</th>
                    <th>Dif. s/ vínculo</th>
                    <th>Rast.</th>
                    <th>Motivo</th>
                </tr>
                </thead>
                <tbody id="grid-produtos-body"></tbody>
            </table>
        </div>
    </section>

    <section id="detail-empty" class="detail-empty">
        <p>Selecione um produto na tabela acima para abrir os quadrantes de notas.</p>
    </section>

    <section id="detail-panels" class="detail-grid" hidden>
        <article class="panel panel--detail">
            <div class="panel__head">
                <div>
                    <h2>Compras intercompany</h2>
                    <p id="interco-meta">Saldo vinculável conforme rastreio (TGFITS) ou item da NF.</p>
                </div>
            </div>
            <div class="table-wrap">
                <table id="grid-interco">
                    <thead>
                    <tr>
                        <th>Nº único</th>
                        <th>NF</th>
                        <th>Entrada</th>
                        <th>TOP</th>
                        <th>Comprada</th>
                        <th>Devolvida item</th>
                        <th>Saldo item</th>
                        <th>Local ITS</th>
                        <th>Saldo rast.</th>
                        <th>Vinculável</th>
                    </tr>
                    </thead>
                    <tbody id="grid-interco-body"></tbody>
                </table>
            </div>
        </article>

        <article class="panel panel--detail">
            <div class="panel__head">
                <div>
                    <h2>Outras entradas (não intercompany)</h2>
                    <p id="outras-meta">Possíveis origens do estoque sem vínculo intercompany.</p>
                </div>
            </div>
            <div class="table-wrap">
                <table id="grid-outras">
                    <thead>
                    <tr>
                        <th>Nº único</th>
                        <th>NF</th>
                        <th>Entrada</th>
                        <th>TOP</th>
                        <th>Saldo item</th>
                        <th>Saldo rast. loc.</th>
                        <th>Motivo</th>
                    </tr>
                    </thead>
                    <tbody id="grid-outras-body"></tbody>
                </table>
            </div>
        </article>
    </section>
</main>

<div id="data-container" hidden>
    <c:forEach items="${resumoProdutosApp.rows}" var="row" varStatus="st">
        <span class="data-resumo"
              data-key="${row.CODEMP}-${row.CODPROD}-${row.CONTROLE}"
              data-codemp="<c:out value='${row.CODEMP}'/>"
              data-nomeemp="<c:out value='${row.NOMEEMP}'/>"
              data-codprod="<c:out value='${row.CODPROD}'/>"
              data-descrprod="<c:out value='${row.DESCRPROD}'/>"
              data-controle="<c:out value='${row.CONTROLE}'/>"
              data-estoque="<c:out value='${row.ESTOQUE}'/>"
              data-reservado="<c:out value='${row.RESERVADO}'/>"
              data-disponivel="<c:out value='${row.DISPONIVEL}'/>"
              data-disp-pp="<c:out value='${row.DISP_PP}'/>"
              data-dif="<c:out value='${row.DIF_SEM_VINCULO}'/>"
              data-rastreavel="<c:out value='${row.RASTREAVEL}'/>"
              data-motivo-cod="<c:out value='${row.MOTIVO_COD}'/>"
              data-motivo-txt="<c:out value='${row.MOTIVO_TXT}'/>">
        </span>
    </c:forEach>
    <c:forEach items="${notasIntercompanyApp.rows}" var="row" varStatus="st">
        <span class="data-interco"
              data-key="${row.CODEMP}-${row.CODPROD}-${row.CONTROLE}"
              data-codemp="<c:out value='${row.CODEMP}'/>"
              data-codprod="<c:out value='${row.CODPROD}'/>"
              data-controle="<c:out value='${row.CONTROLE}'/>"
              data-nunota="<c:out value='${row.NUNOTA}'/>"
              data-numnota="<c:out value='${row.NUMNOTA}'/>"
              data-serie="<c:out value='${row.SERIENOTA}'/>"
              data-dtentsai="<c:out value='${row.DTENTSAI}'/>"
              data-top="<c:out value='${row.CODTIPOPER}'/>"
              data-descrtop="<c:out value='${row.DESCROPER}'/>"
              data-qtdcomprada="<c:out value='${row.QTD_COMPRADA}'/>"
              data-qtddevolvida="<c:out value='${row.QTD_DEVOLVIDA_ITEM}'/>"
              data-saldoitem="<c:out value='${row.SALDO_ITEM_NF}'/>"
              data-codlocal="<c:out value='${row.CODLOCAL_ITS}'/>"
              data-saldorast="<c:out value='${row.SALDO_RAST_LINHA}'/>"
              data-saldovinc="<c:out value='${row.SALDO_VINCULAVEL}'/>"
              data-rastreavel="<c:out value='${row.RASTREAVEL}'/>">
        </span>
    </c:forEach>
    <c:forEach items="${notasOutrasApp.rows}" var="row" varStatus="st">
        <span class="data-outras"
              data-key="${row.CODEMP}-${row.CODPROD}-${row.CONTROLE}"
              data-codemp="<c:out value='${row.CODEMP}'/>"
              data-codprod="<c:out value='${row.CODPROD}'/>"
              data-controle="<c:out value='${row.CONTROLE}'/>"
              data-nunota="<c:out value='${row.NUNOTA}'/>"
              data-numnota="<c:out value='${row.NUMNOTA}'/>"
              data-serie="<c:out value='${row.SERIENOTA}'/>"
              data-dtentsai="<c:out value='${row.DTENTSAI}'/>"
              data-top="<c:out value='${row.CODTIPOPER}'/>"
              data-descrtop="<c:out value='${row.DESCROPER}'/>"
              data-saldoitem="<c:out value='${row.SALDO_ITEM_NF}'/>"
              data-saldorastloc="<c:out value='${row.SALDO_RAST_LOC_VALIDO}'/>"
              data-motivo="<c:out value='${row.MOTIVO_NAO_INTERCO}'/>">
        </span>
    </c:forEach>
</div>
</body>
</html>
