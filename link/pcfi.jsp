<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp"%>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCFI - Conferência de Pedidos de Compra</title>
    <link rel="stylesheet" href="${BASE_FOLDER}/css/style.css">
    
    <snk:load />
    
</head>
<body>
<snk:load>
<jsp:include page="dados.jsp" />
<div id="app" class="app-shell">
    <header class="topbar">
        <div>
            <p class="eyebrow">PCFI</p>
            <h1 id="pageTitle">Pedidos de Compra Pendentes</h1>
            <p id="pageSubtitle">Duplo clique em um pedido para iniciar a conferência.</p>
        </div>
        <div class="topbar-actions">
            <button id="btnVoltar" class="btn btn-ghost hidden" type="button" hidden>Voltar</button>
            <button id="btnAtualizar" class="btn btn-secondary" type="button">Atualizar</button>
        </div>
    </header>

    <main>
        <section id="viewLista" class="view">
            <div class="summary-grid">
                <article class="summary-card"><span>Pedidos</span><strong id="sumPedidos">0</strong></article>
                <article class="summary-card"><span>Itens pendentes</span><strong id="sumItens">0</strong></article>
                <article class="summary-card"><span>Quantidade pendente</span><strong id="sumQtd">0</strong></article>
            </div>
            <div class="panel">
                <div class="panel-head">
                    <div><h2>Ordens de compra</h2></div>
                    <input id="buscaPedidos" class="search" type="search" placeholder="Buscar OC, fornecedor ou centro...">
                </div>
                <div class="table-wrap">
                    <table>
                        <colgroup><col><col><col><col><col><col><col><col></colgroup>
                        <thead><tr><th>OC</th><th>Data</th><th>Empresa</th><th>Fornecedor</th><th>CR</th><th>Qtd. pendente</th><th>Status atual</th><th>Conferência</th></tr></thead>
                        <tbody id="pedidosBody"></tbody>
                    </table>
                </div>
                <div id="paginacaoPedidos" class="footer-actions" hidden>
                    <button id="btnPaginaAnterior" class="btn btn-secondary" type="button">Anterior</button>
                    <span id="paginaPedidos" class="badge"></span>
                    <button id="btnProximaPagina" class="btn btn-secondary" type="button">Próxima</button>
                </div>
                <div id="listaVazia" class="empty hidden">Nenhum pedido pendente encontrado para os filtros.</div>
            </div>
        </section>

        <section id="viewPcfis" class="view hidden" hidden>
            <div id="ocContextPcfis" class="context-card"></div>
            <div class="panel">
                <div class="panel-head"><div><h2>PCFIs da ordem de compra</h2><p>Selecione a PCFI e a etapa disponível.</p></div></div>
                <div id="pcfisContainer" class="pcfi-list"></div>
            </div>
            <div class="footer-actions"><button id="btnVoltarPcfis" class="btn btn-ghost" type="button">Voltar</button></div>
        </section>

        <section id="viewConferencia" class="view hidden" hidden>
            <div id="ocContext" class="context-card"></div>
            <div class="panel form-panel">
                <div class="section-title"><div><h2 id="tituloConferencia">Identificação do recebimento</h2><p id="subtituloConferencia">O número da nota fiscal é obrigatório.</p></div><span id="qualBadge" class="badge"></span></div>
                <div id="dadosRecebimento" class="form-grid">
                    <label class="field"><span>Número da nota fiscal *</span><input id="numNotaNf" maxlength="20" autocomplete="off"></label>
                    <label class="field field-wide"><span>Observação geral</span><textarea id="obsGeral" rows="2" maxlength="4000"></textarea></label>
                </div>
            </div>
            <div id="itensContainer"></div>
            <div class="footer-actions">
                <button id="btnCancelar" class="btn btn-ghost" type="button">Cancelar</button>
                <button id="btnSalvar" class="btn btn-primary" type="button">Salvar conferência</button>
            </div>
        </section>
    </main>
</div>

<div id="loading" class="loading hidden" hidden><div class="spinner"></div><p id="loadingText">Carregando...</p></div>
<div id="toast" class="toast hidden" role="status" hidden></div>

<div id="data-root" hidden aria-hidden="true">
    <div id="data-pedidos">
        <c:forEach items="${pcfiPedidosApp.rows}" var="row">
            <span class="data-pedido" data-nunota="<c:out value='${row.NUNOTA}'/>" data-numnota="<c:out value='${row.NUMNOTA}'/>" data-dtneg="<c:out value='${row.DTNEG}'/>" data-codemp="<c:out value='${row.CODEMP}'/>" data-codparc="<c:out value='${row.CODPARC}'/>" data-nomeparc="<c:out value='${row.NOMEPARC}'/>" data-codcencus="<c:out value='${row.CODCENCUS}'/>" data-descr-cr="<c:out value='${row.DESCRCR}'/>" data-qtd-itens="<c:out value='${row.QTD_ITENS}'/>" data-qtd-pendente="<c:out value='${row.QTD_PENDENTE}'/>" data-qtd-pcfi="<c:out value='${row.QTD_PCFI}'/>" data-qualpelconf="<c:out value='${row.QUALPELCONF}'/>" data-codusu-logado="<c:out value='${row.CODUSULOGADO}'/>" data-pode-prioridade="<c:out value='${row.PODEPRIORIDADE}'/>" data-pode-qtde="<c:out value='${row.PODEQTDE}'/>" data-pode-qual="<c:out value='${row.PODEQUAL}'/>" data-pode-fisc="<c:out value='${row.PODEFISC}'/>" data-status-oc="<c:out value='${row.STATUSOC}'/>"></span>
        </c:forEach>
    </div>
    <div id="data-pcfis">
        <c:forEach items="${pcfiRegistrosApp.rows}" var="row">
            <span class="data-pcfi" data-nupcfi="<c:out value='${row.NUPCFI}'/>" data-nunotaoc="<c:out value='${row.NUNOTAOC}'/>" data-numnotanf="<c:out value='${row.NUMNOTANF}'/>" data-statuspcfi="<c:out value='${row.STATUSPCFI}'/>" data-statusqual="<c:out value='${row.STATUSQUAL}'/>" data-statusfiscal="<c:out value='${row.STATUSFISCAL}'/>" data-prioridade="<c:out value='${row.PRIORIDADE}'/>" data-entregaparcial="<c:out value='${row.ENTREGAPARCIAL}'/>" data-observacao="<c:out value='${row.OBSERVACAO}'/>"></span>
        </c:forEach>
    </div>
    <div id="data-itens">
        <c:forEach items="${pcfiItensApp.rows}" var="row">
            <span class="data-item" data-nunota="<c:out value='${row.NUNOTA}'/>" data-sequencia="<c:out value='${row.SEQUENCIA}'/>" data-codprod="<c:out value='${row.CODPROD}'/>" data-descrprod="<c:out value='${row.DESCRPROD}'/>" data-codvol="<c:out value='${row.CODVOL}'/>" data-qtdneg="<c:out value='${row.QTDNEG}'/>" data-qtdpendente="<c:out value='${row.QTDPENDENTE}'/>" data-qtdentregue="<c:out value='${row.QTDENTREGUE}'/>" data-observacao="<c:out value='${row.OBSERVACAO}'/>"></span>
        </c:forEach>
    </div>
    <div id="data-itens-pcfi">
        <c:forEach items="${pcfiItensRegistradosApp.rows}" var="row">
            <span class="data-item-pcfi" data-nupcfi="<c:out value='${row.NUPCFI}'/>" data-seqpcfiitem="<c:out value='${row.SEQPCFIITEM}'/>" data-nunota="<c:out value='${row.NUNOTAOC}'/>" data-sequencia="<c:out value='${row.SEQITEMOC}'/>" data-codprod="<c:out value='${row.CODPROD}'/>" data-qtdrecebida="<c:out value='${row.QTDRECEBIDA}'/>" data-improprio="<c:out value='${row.IMPROPRIO}'/>" data-qtdimpropria="<c:out value='${row.QTDIMPROPRIA}'/>" data-divergencia="<c:out value='${row.DIVERGENCIA}'/>" data-embalagem="<c:out value='${row.EMBALAGEM}'/>" data-materiaprima="<c:out value='${row.MATERIAPRIMA}'/>" data-bem="<c:out value='${row.BEM}'/>" data-observacao="<c:out value='${row.OBSERVACAO}'/>"></span>
        </c:forEach>
    </div>
</div>

<script>
window.PCFI_CONFIG = {
    codUsu: "<c:out value='${CODUSU_LOG}'/>"
};
</script>
<script src="${BASE_FOLDER}/javascript/script.js"></script>
</snk:load>
</body>
</html>