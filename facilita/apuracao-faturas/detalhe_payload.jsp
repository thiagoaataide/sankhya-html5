<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%
    String nuapuracaoParam = request.getParameter("nuapuracao");
    boolean chaveValida = nuapuracaoParam != null && nuapuracaoParam.matches("[0-9]+");
    String chaveSql = chaveValida ? nuapuracaoParam : "-1";
%>
<snk:query var="detalhe">
    SELECT
        APU.NUAPURACAO,
        APU.CODCONTA,
        APU.NUMCONTRATO,
        APU.NUNOTA,
        APU.SEQUENCIACON,
        TO_CHAR(APU.REFERENCIA, 'YYYY-MM-DD') AS REFERENCIA,
        TO_CHAR(APU.REFERENCIAADIADA, 'YYYY-MM-DD') AS REFERENCIAADIADA,
        TO_CHAR(APU.DTVENC, 'YYYY-MM-DD') AS DTVENC,
        TO_CHAR(APU.VALOR, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS VALOR,
        TO_CHAR(APU.VALORREF, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS VALORREF,
        NVL(APU.CONFIRMADO, 'N') AS CONFIRMADO,
        NVL(APU.AUDITORIAFINALIZADA, 'N') AS AUDITORIAFINALIZADA,
        NVL(APU.EMAILENVIADO, 'N') AS EMAILENVIADO,
        NVL(APU.FATURAMENTOLIBERADO, 'N') AS FATURAMENTOLIBERADO,
        APU.IDINSTPRN,
        APU.NUFILA,
        APU.PLANO,
        TO_CHAR(APU.AD_DHALTER, 'YYYY-MM-DD HH24:MI:SS') AS AD_DHALTER,
        CASE WHEN EXISTS (
            SELECT 1
              FROM TSIANX ANX
             WHERE ANX.NOMEINSTANCIA = 'bhApuracao'
               AND ANX.PKREGISTRO = TO_CHAR(APU.NUAPURACAO) || '_bhApuracao'
        ) THEN 'S' ELSE 'N' END AS POSSUIANEXO
    FROM BH_FACAPU APU
    WHERE APU.NUAPURACAO = <%= chaveSql %>
</snk:query>
<div id="detail-container" data-valid-key="<%= chaveValida ? "S" : "N" %>">
    <c:forEach items="${detalhe.rows}" var="row">
        <div class="detail-row"
             data-nuapuracao="<c:out value='${row.NUAPURACAO}'/>"
             data-codconta="<c:out value='${row.CODCONTA}'/>"
             data-numcontrato="<c:out value='${row.NUMCONTRATO}'/>"
             data-nunota="<c:out value='${row.NUNOTA}'/>"
             data-sequenciacon="<c:out value='${row.SEQUENCIACON}'/>"
             data-referencia="<c:out value='${row.REFERENCIA}'/>"
             data-referenciaadiada="<c:out value='${row.REFERENCIAADIADA}'/>"
             data-dtvenc="<c:out value='${row.DTVENC}'/>"
             data-valor="<c:out value='${row.VALOR}'/>"
             data-valorref="<c:out value='${row.VALORREF}'/>"
             data-confirmado="<c:out value='${row.CONFIRMADO}'/>"
             data-auditoriafinalizada="<c:out value='${row.AUDITORIAFINALIZADA}'/>"
             data-emailenviado="<c:out value='${row.EMAILENVIADO}'/>"
             data-faturamentoliberado="<c:out value='${row.FATURAMENTOLIBERADO}'/>"
             data-idinstprn="<c:out value='${row.IDINSTPRN}'/>"
             data-nufila="<c:out value='${row.NUFILA}'/>"
             data-plano="<c:out value='${row.PLANO}'/>"
             data-ad-dhalter="<c:out value='${row.AD_DHALTER}'/>"
             data-possui-anexo="<c:out value='${row.POSSUIANEXO}'/>">
        </div>
    </c:forEach>
</div>
