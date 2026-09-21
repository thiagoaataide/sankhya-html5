<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" isELIgnored="false" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>

<snk:query var="dados">
WITH PARAMS AS (
    SELECT TO_DATE(
               CASE
                   WHEN TRIM('${P_REFERENCIA}') IS NULL
                     OR LOWER(TRIM('${P_REFERENCIA}')) IN ('null', '0')
                   THEN TO_CHAR(TRUNC(SYSDATE, 'MM'), 'YYYY-MM-DD')
                   ELSE SUBSTR('${P_REFERENCIA}', 1, 10)
               END,
               'YYYY-MM-DD'
           ) AS DT_REF,
           CASE WHEN UPPER(TRIM('${P_SOMENTE_PENDENTES}')) = 'S' THEN 'S' ELSE 'N' END AS SOMENTE_PENDENTES,
           CASE WHEN UPPER(TRIM('${P_POSSUI_ANEXO}')) = 'S' THEN 'S' ELSE 'N' END AS POSSUI_ANEXO
      FROM DUAL
)
SELECT TO_CHAR(APU.NUAPURACAO) AS NUAPURACAO,
       TO_CHAR(APU.CODCONTA) AS CODCONTA,
       TO_CHAR(APU.NUMCONTRATO) AS NUMCONTRATO,
       TO_CHAR(APU.NUNOTA) AS NUNOTA,
       TO_CHAR(APU.SEQUENCIACON) AS SEQUENCIACON,
       TO_CHAR(APU.REFERENCIA, 'YYYY-MM-DD') AS REFERENCIA,
       TO_CHAR(APU.REFERENCIAADIADA, 'YYYY-MM-DD') AS REFERENCIAADIADA,
       TO_CHAR(APU.DTVENC, 'YYYY-MM-DD') AS DTVENC,
       TO_CHAR(APU.VALOR, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS VALOR,
       TO_CHAR(APU.VALORREF, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS VALORREF,
       NVL(APU.CONFIRMADO, 'N') AS CONFIRMADO,
       NVL(APU.AUDITORIAFINALIZADA, 'N') AS AUDITORIAFINALIZADA,
       NVL(APU.EMAILENVIADO, 'N') AS EMAILENVIADO,
       NVL(APU.FATURAMENTOLIBERADO, 'N') AS FATURAMENTOLIBERADO,
       NVL(APU.OPERADORA, '0') AS OPERADORA,
       NVL(APU.CLIENTE, '0') AS CLIENTE,
       NVL(APU.CODVEND, '0') AS CODVEND,
       TO_CHAR(APU.IDINSTPRN) AS IDINSTPRN,
       TO_CHAR(APU.NUFILA) AS NUFILA,
       TO_CHAR(APU.PLANO) AS PLANO,
       TO_CHAR(APU.AD_DHALTER, 'YYYY-MM-DD HH24:MI:SS') AS AD_DHALTER,
       CASE
           WHEN EXISTS (
               SELECT 1
                 FROM TSIANX ANX
                WHERE ANX.NOMEINSTANCIA = 'bhApuracao'
                  AND ANX.PKREGISTRO = TO_CHAR(APU.NUAPURACAO) || '_bhApuracao'
           ) THEN 'S'
           ELSE 'N'
       END AS POSSUIANEXO
  FROM BH_FACAPU APU
 CROSS JOIN PARAMS P
 WHERE APU.REFERENCIA >= P.DT_REF
   AND APU.REFERENCIA < ADD_MONTHS(P.DT_REF, 1)
   AND (P.SOMENTE_PENDENTES <> 'S' OR NVL(APU.CONFIRMADO, 'N') <> 'S')
   AND (
       P.POSSUI_ANEXO <> 'S'
       OR EXISTS (
           SELECT 1
             FROM TSIANX ANX_FILTRO
            WHERE ANX_FILTRO.NOMEINSTANCIA = 'bhApuracao'
              AND ANX_FILTRO.PKREGISTRO = TO_CHAR(APU.NUAPURACAO) || '_bhApuracao'
       )
   )
 ORDER BY APU.DTVENC NULLS LAST, APU.NUAPURACAO
</snk:query>

<div id="data-container" aria-hidden="true">
    <c:forEach items="${dados.rows}" var="row">
        <div class="data-row"
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
             data-operadora="<c:out value='${row.OPERADORA}'/>"
             data-cliente="<c:out value='${row.CLIENTE}'/>"
             data-codvend="<c:out value='${row.CODVEND}'/>"
             data-idinstprn="<c:out value='${row.IDINSTPRN}'/>"
             data-nufila="<c:out value='${row.NUFILA}'/>"
             data-plano="<c:out value='${row.PLANO}'/>"
             data-ad-dhalter="<c:out value='${row.AD_DHALTER}'/>"
             data-possui-anexo="<c:out value='${row.POSSUIANEXO}'/>"></div>
    </c:forEach>
</div>
