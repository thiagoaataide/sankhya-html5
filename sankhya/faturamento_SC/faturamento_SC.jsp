<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Faturamento SC</title>
    <link rel="stylesheet" href="${BASE_FOLDER}/css/style.css">
    <snk:load/>
</head>
<body>
<snk:load>
    <jsp:include page="dados.jsp"/>

<main class="dashboard">
    <header class="dashboard-header">
        <div>
            <p class="eyebrow">Sankhya</p>
            <h1>Faturamento SC</h1>
            <p class="subtitle">Acompanhamento de ordens de serviço e faturamento.</p>
        </div>
        <div class="header-actions">
            <button id="exportar-xlsx" class="button" type="button">Exportar Excel</button>
            <button id="exportar-pdf" class="button button--secondary" type="button">Exportar PDF</button>
        </div>
    </header>

    <section class="summary-grid" aria-label="Totalizadores">
        <article class="summary-card"><span>Horas faturadas</span><strong id="total-horas">0,00 h</strong></article>
        <article class="summary-card"><span>Parceiros atendidos</span><strong id="total-parceiros">0</strong></article>
        <article class="summary-card"><span>OS</span><strong id="total-os">0</strong></article>
        <article class="summary-card summary-card--highlight"><span>Total faturado</span><strong id="total-faturado">R$ 0,00</strong></article>
        <article class="summary-card summary-card--pending"><span>Pendente de faturamento</span><strong id="total-pendente">R$ 0,00</strong></article>
    </section>

    <section id="empty-state" class="empty-state" hidden>Nenhum registro foi encontrado para os filtros selecionados.</section>

    <section id="table-panel" class="table-panel">
        <div class="table-header">
            <div><h2>Detalhamento</h2><p id="table-meta">0 registros</p></div>
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr>
                    <th>OS</th><th>Pedido</th><th>Parceiro</th><th>Vendedor</th><th>Executante</th>
                    <th>Classificação</th><th>Natureza</th><th>Horas</th><th>Valor total</th><th>Valor unitário</th>
                    <th>Faturado</th><th>Faturar</th><th>Autorizado</th><th>Ped. Venda</th><th>NF</th><th>Entrada</th><th>Início execução</th><th>Ações</th>
                </tr></thead>
                <tbody id="detail-body"></tbody>
            </table>
        </div>
        <div id="horizontal-scroll-anchor" class="horizontal-scroll-anchor" hidden aria-label="Rolagem horizontal da tabela">
            <div id="horizontal-scroll-content"></div>
        </div>
    </section>
</main>

<div id="data-container" hidden>
    <c:forEach items="${faturamentoScApp.rows}" var="row" varStatus="status">
        <span class="data-row" data-index="${status.index}"
              data-numos="<c:out value='${row.NUMOS}'/>"
              data-nunotaped="<c:out value='${row.NUNOTAPED}'/>"
              data-codusuvend="<c:out value='${row.CODUSUVEND}'/>"
              data-vendedor="<c:out value='${row.VENDEDOR}'/>"
              data-codusuexec="<c:out value='${row.CODUSUEXEC}'/>"
              data-executante="<c:out value='${row.EXECUTANTE}'/>"
              data-classificacao="<c:out value='${row.CLASSIFICACAO}'/>"
              data-codnat="<c:out value='${row.CODNAT}'/>"
              data-descrnat="<c:out value='${row.DESCRNAT}'/>"
              data-codparc="<c:out value='${row.CODPARC}'/>"
              data-nomeparc="<c:out value='${row.NOMEPARC}'/>"
              data-pedido="<c:out value='${row.PEDIDO}'/>"
              data-tempgasto="<c:out value='${row.TEMPGASTO}'/>"
              data-vlrtot="<c:out value='${row.VLRTOT}'/>"
              data-vlrunit="<c:out value='${row.VLRUNIT}'/>"
              data-faturar="<c:out value='${row.FATURAR}'/>"
              data-autorizado="<c:out value='${row.AUTORIZADO}'/>"
              data-nunotanf="<c:out value='${row.NUNOTANF}'/>"
              data-faturado="<c:out value='${row.FATURADO}'/>"
              data-dhentrada="<c:out value='${row.DHENTRADA}'/>"
              data-inicexec="<c:out value='${row.INICEXEC}'/>"></span>
    </c:forEach>
</div>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"></script>
<script src="${BASE_FOLDER}/javascript/script.js"></script>
</snk:load>
</body>
</html>
