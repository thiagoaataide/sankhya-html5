<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%
    String nuapuracaoParam = request.getParameter("nuapuracao");
    boolean chaveValida = nuapuracaoParam != null && nuapuracaoParam.matches("[0-9]+");
    String chaveSql = chaveValida ? nuapuracaoParam : "-1";
    String pkRegistro = chaveValida ? chaveSql + "_bhApuracao" : "__invalid__";
    pageContext.setAttribute("pkRegistro", pkRegistro);
%>
<snk:query var="anexos">
    SELECT TO_CHAR(ANX.NUATTACH) AS NUATTACH,
           ANX.BH_TIPO,
           ANX.DESCRICAO,
           ANX.NOMEARQUIVO,
           TO_CHAR(ANX.CODUSU) AS CODUSU,
           UINC.NOMEUSU AS NOMEUSUINC,
           TO_CHAR(ANX.DHCAD, 'DD/MM/YYYY HH24:MI') AS DHCAD,
           TO_CHAR(ANX.DHALTER, 'DD/MM/YYYY HH24:MI') AS DHALTER,
           TO_CHAR(ANX.CODUSUALT) AS CODUSUALT,
           UALT.NOMEUSU AS NOMEUSUALT,
           ANX.TIPOAPRES,
           ANX.TIPOACESSO,
           NVL(OP_APRES.OPCAO, ANX.TIPOAPRES) AS TIPOAPRES_OPCAO,
           NVL(OP_ACESSO.OPCAO, ANX.TIPOACESSO) AS TIPOACESSO_OPCAO
      FROM TSIANX ANX
      LEFT JOIN TSIUSU UINC ON UINC.CODUSU = ANX.CODUSU
      LEFT JOIN TSIUSU UALT ON UALT.CODUSU = ANX.CODUSUALT
      LEFT JOIN TDDOPC OP_APRES
        ON OP_APRES.VALOR = ANX.TIPOAPRES
       AND OP_APRES.NUCAMPO = (
             SELECT MIN(C.NUCAMPO)
               FROM TDDCAM C
              WHERE C.NOMETAB = 'TSIANX'
                AND C.NOMECAMPO = 'TIPOAPRES'
           )
      LEFT JOIN TDDOPC OP_ACESSO
        ON OP_ACESSO.VALOR = ANX.TIPOACESSO
       AND OP_ACESSO.NUCAMPO = (
             SELECT MIN(C.NUCAMPO)
               FROM TDDCAM C
              WHERE C.NOMETAB = 'TSIANX'
                AND C.NOMECAMPO = 'TIPOACESSO'
           )
     WHERE ANX.NOMEINSTANCIA = 'bhApuracao'
       AND ANX.PKREGISTRO = '${pkRegistro}'
     ORDER BY ANX.DHCAD DESC
</snk:query>
<div id="anexos-container" data-valid-key="<%= chaveValida ? "S" : "N" %>"
     data-nuapuracao="<%= chaveValida ? chaveSql : "" %>">
    <c:forEach items="${anexos.rows}" var="row">
        <div class="anexo-row"
             data-nuattach="<c:out value='${row.NUATTACH}'/>"
             data-tipo="<c:out value='${row.BH_TIPO}'/>"
             data-descricao="<c:out value='${row.DESCRICAO}'/>"
             data-nome-arquivo="<c:out value='${row.NOMEARQUIVO}'/>"
             data-codusu-inc="<c:out value='${row.CODUSU}'/>"
             data-nome-usu-inc="<c:out value='${row.NOMEUSUINC}'/>"
             data-dhcad="<c:out value='${row.DHCAD}'/>"
             data-dhalter="<c:out value='${row.DHALTER}'/>"
             data-codusu-alt="<c:out value='${row.CODUSUALT}'/>"
             data-nome-usu-alt="<c:out value='${row.NOMEUSUALT}'/>"
             data-tipo-apres="<c:out value='${row.TIPOAPRES}'/>"
             data-tipo-acesso="<c:out value='${row.TIPOACESSO}'/>"
             data-tipo-apres-opcao="<c:out value='${row.TIPOAPRES_OPCAO}'/>"
             data-tipo-acesso-opcao="<c:out value='${row.TIPOACESSO_OPCAO}'/>"></div>
    </c:forEach>
</div>
