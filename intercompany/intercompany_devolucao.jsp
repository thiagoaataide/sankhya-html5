<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1" isELIgnored="false" errorPage="erro.jsp" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR">
<head>
    <meta charset="ISO-8859-1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Diagn&oacute;stico &mdash; Devolu&ccedil;&atilde;o Intercompany</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${BASE_FOLDER}/css/style.css">
    <snk:load/>
</head>
<body>
<snk:load>
    <jsp:include page="dados.jsp"/>
    <script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js"></script>
    <script>window.GET_INTERCO_BASE = "${BASE_FOLDER}";</script>
    <script src="${BASE_FOLDER}/javascript/script.js"></script>
</snk:load>

<main class="shell">
    <header class="hero">
        <div>
            <p class="eyebrow">GET &middot; Estoque &middot; Intercompany</p>
            <h1>Diagn&oacute;stico de devolu&ccedil;&atilde;o</h1>
            <p class="lede">Empresas devolvedoras, saldo f&iacute;sico e v&iacute;nculo com compras intercompany (regras do addon GET).</p>
        </div>
        <div class="hero__actions">
            <button type="button" id="btn-export" class="btn btn--accent">Exportar Excel</button>
        </div>
    </header>

    <section class="kpi-strip" aria-label="Resumo">
        <article class="kpi"><span>Produtos</span><strong id="kpi-produtos">0</strong></article>
        <article class="kpi"><span>Sem v&iacute;nculo intercompany</span><strong id="kpi-sem-vinculo">0</strong></article>
        <article class="kpi kpi--ok"><span>Eleg&iacute;veis</span><strong id="kpi-elegiveis">0</strong></article>
        <article class="kpi"><span>Dispon&iacute;vel total</span><strong id="kpi-disponivel">0</strong></article>
    </section>

    <section class="panel">
        <div class="panel__head">
            <div>
                <h2>Produtos com saldo para an&aacute;lise</h2>
                <p id="grid-meta">Selecione uma linha para ver notas de compra intercompany e outras entradas.</p>
            </div>
            <label class="search">
                <span class="sr-only">Buscar produto</span>
                <input type="search" id="filter-text" placeholder="Filtrar por c&oacute;digo ou descri&ccedil;&atilde;o..." autocomplete="off">
            </label>
        </div>
        <div class="table-wrap" tabindex="0">
            <table id="grid-produtos">
                <thead>
                <tr>
                    <th>Emp</th>
                    <th>Produto</th>
                    <th>Descri&ccedil;&atilde;o</th>
                    <th>Estoque</th>
                    <th>Reservado</th>
                    <th>Dispon&iacute;vel</th>
                    <th>Vinc. interco</th>
                    <th>Dif. s/ v&iacute;nculo</th>
                    <th>Rastre&aacute;vel</th>
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
                    <p id="interco-meta">Todas as compras intercompany liberadas do produto. Destaque verde = saldo vincul&aacute;vel para devolu&ccedil;&atilde;o.</p>
                </div>
            </div>
            <div class="table-wrap">
                <table id="grid-interco">
                    <thead>
                    <tr>
                        <th>N&ordm; &uacute;nico</th>
                        <th>NF</th>
                        <th>Entrada</th>
                        <th>TOP</th>
                        <th>Comprada</th>
                        <th>Devolvida item</th>
                        <th>Saldo item</th>
                        <th>Local ITS</th>
                        <th>Saldo rast.</th>
                        <th>Vincul&aacute;vel</th>
                    </tr>
                    </thead>
                    <tbody id="grid-interco-body"></tbody>
                </table>
            </div>
        </article>

        <article class="panel panel--detail">
            <div class="panel__head">
                <div>
                    <h2>Outras entradas (n&atilde;o intercompany)</h2>
                    <p id="outras-meta">Notas fora do intercompany para devolu&ccedil;&atilde;o de compra. Rastre&aacute;vel: saldo TGFITS para sa&iacute;da. N&atilde;o rastre&aacute;vel: compras com saldo no item.</p>
                </div>
            </div>
            <div class="table-wrap">
                <table id="grid-outras">
                    <thead>
                    <tr>
                        <th>N&ordm; &uacute;nico</th>
                        <th>NF</th>
                        <th>Entrada</th>
                        <th>TOP</th>
                        <th>Saldo item</th>
                        <th>Saldo sa&iacute;da TGFITS</th>
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
</div>
</body>
</html>
