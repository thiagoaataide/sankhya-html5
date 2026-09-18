<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1" isELIgnored="false" errorPage="erro.jsp" %>

<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>

<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>

<c:set var="pCodemp" value="${param.codemp}" />

<c:set var="pCodprod" value="${param.codprod}" />

<c:set var="pControle" value="${param.controle}" />

<c:set var="part" value="${empty param.part ? 'all' : param.part}" />

<c:set var="pRastreavel" value="${param.rastreavel}" />

<c:if test="${pRastreavel != 'S'}">

    <c:set var="pRastreavel" value="N" />

</c:if>

<c:set var="loadInterco" value="${part == 'all' or part == 'interco'}" />

<c:set var="loadOutras" value="${part == 'all' or part == 'outras'}" />



<c:if test="${loadInterco}">

<snk:query var="notasIntercompany" dataSource="MGEDS">

WITH params AS (

    SELECT

        (SELECT INTEIRO FROM TSIPAR WHERE CHAVE = 'CODMODNFENTFIL') AS NUNOTA_MOD_ENT_FIL,

        (SELECT INTEIRO FROM TSIPAR WHERE CHAVE = 'CODMODNFDEVINTC') AS NUNOTA_MOD_DEV,

        NVL(NULLIF(TRIM((SELECT TEXTO FROM TSIPAR WHERE CHAVE = 'LOCAISVALEST')), ''), '10200') AS LOCAIS_TXT

    FROM DUAL

),

locais AS (

    SELECT TO_NUMBER(TRIM(REGEXP_SUBSTR(p.LOCAIS_TXT, '[^,]+', 1, LEVEL))) AS CODLOCAL

    FROM params p

    CONNECT BY REGEXP_SUBSTR(p.LOCAIS_TXT, '[^,]+', 1, LEVEL) IS NOT NULL

),

its_saldo_loc AS (

    SELECT

        i2.NUNOTA,

        i2.SEQUENCIA,

        i2.CODEMP,

        SUM(ROUND(i2.QTDENT - NVL(i2.QTDSAI, 0), 10)) AS SALDO_LOC

    FROM TGFITS i2

    INNER JOIN locais l ON l.CODLOCAL = i2.CODLOCAL

    WHERE i2.CODEMP = ${pCodemp}

      AND i2.CODPROD = ${pCodprod}

    GROUP BY i2.NUNOTA, i2.SEQUENCIA, i2.CODEMP

)

SELECT

    cab.CODEMP,

    TRUNC(ite.CODPROD) AS CODPROD,

    NVL(ite.CONTROLE, ' ') AS CONTROLE,

    cab.NUNOTA,

    cab.NUMNOTA,

    cab.SERIENOTA,

    cab.DTENTSAI,

    cab.CODTIPOPER,

    cab.TIPMOV,

    top.DESCROPER,

    ite.SEQUENCIA,

    ite.QTDNEG AS QTD_COMPRADA,

    ite.QTDENTREGUE AS QTD_DEVOLVIDA_ITEM,

    CASE

        WHEN '${pRastreavel}' = 'N' THEN GREATEST(ite.QTDNEG - ite.QTDENTREGUE, 0)

        ELSE NVL(sl.SALDO_LOC, 0)

    END AS SALDO_ITEM_NF,

    NVL(its.CODLOCAL, 0) AS CODLOCAL_ITS,

    NVL(its.QTDENT, 0) AS QTDENT_ITS,

    NVL(its.QTDSAI, 0) AS QTDSAI_ITS,

    ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) AS SALDO_RAST_LINHA,

    '${pRastreavel}' AS RASTREAVEL,

    CASE

        WHEN '${pRastreavel}' = 'S' THEN

            CASE

                WHEN its.NUNOTA IS NOT NULL

                 AND (NVL(ra.TIPORASTR, 'S') NOT IN ('C', 'L') OR NVL(its.CONTROLE, ' ') = NVL(ite.CONTROLE, ' '))

                 AND (NVL(ra.TIPORASTR, 'S') NOT IN ('O', 'L') OR its.CODLOCAL IN (SELECT CODLOCAL FROM locais))

                THEN GREATEST(ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10), 0)

                ELSE 0

            END

        ELSE GREATEST(ite.QTDNEG - ite.QTDENTREGUE, 0)

    END AS SALDO_VINCULAVEL,

    'INTERCOMPANY' AS TIPO_ENTRADA

FROM params par

INNER JOIN TGFCAB cab_mod_ent ON cab_mod_ent.NUNOTA = par.NUNOTA_MOD_ENT_FIL

INNER JOIN TGFCAB cab

    ON cab.CODTIPOPER = cab_mod_ent.CODTIPOPER

   AND cab.CODEMP = ${pCodemp}

   AND cab.STATUSNOTA = 'L'

INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA AND TRUNC(ite.CODPROD) = ${pCodprod}

INNER JOIN TGFTOP top ON top.CODTIPOPER = cab.CODTIPOPER AND top.DHALTER = cab.DHTIPOPER

INNER JOIN GET_TGFITCNFENT cnf ON cnf.NUNOTA = cab.NUNOTA

LEFT JOIN TGFITS its

    ON its.NUNOTA = ite.NUNOTA AND its.SEQUENCIA = ite.SEQUENCIA AND its.CODEMP = cab.CODEMP

LEFT JOIN TGFRASTEMP ra ON ra.CODPROD = TRUNC(ite.CODPROD) AND ra.CODEMP = cab.CODEMP

LEFT JOIN its_saldo_loc sl

    ON sl.NUNOTA = ite.NUNOTA AND sl.SEQUENCIA = ite.SEQUENCIA AND sl.CODEMP = cab.CODEMP

WHERE NVL(ite.CONTROLE, ' ') = NVL('${pControle}', ' ')

ORDER BY cab.DTENTSAI, cab.NUNOTA, ite.SEQUENCIA

</snk:query>

</c:if>



<c:if test="${loadOutras}">

<snk:query var="notasOutras" dataSource="MGEDS">

WITH params AS (

    SELECT

        (SELECT INTEIRO FROM TSIPAR WHERE CHAVE = 'CODMODNFENTFIL') AS NUNOTA_MOD_ENT_FIL,

        (SELECT INTEIRO FROM TSIPAR WHERE CHAVE = 'CODMODNFDEVINTC') AS NUNOTA_MOD_DEV,

        NVL(NULLIF(TRIM((SELECT TEXTO FROM TSIPAR WHERE CHAVE = 'LOCAISVALEST')), ''), '10200') AS LOCAIS_TXT

    FROM DUAL

),

locais AS (

    SELECT TO_NUMBER(TRIM(REGEXP_SUBSTR(p.LOCAIS_TXT, '[^,]+', 1, LEVEL))) AS CODLOCAL

    FROM params p

    CONNECT BY REGEXP_SUBSTR(p.LOCAIS_TXT, '[^,]+', 1, LEVEL) IS NOT NULL

)

SELECT

    cab.CODEMP,

    TRUNC(ite.CODPROD) AS CODPROD,

    NVL(ite.CONTROLE, ' ') AS CONTROLE,

    cab.NUNOTA,

    cab.NUMNOTA,

    cab.SERIENOTA,

    cab.DTENTSAI,

    cab.CODTIPOPER,

    cab.TIPMOV,

    top.DESCROPER,

    ite.SEQUENCIA,

    ite.QTDNEG AS QTD_ENTRADA,

    ite.QTDENTREGUE AS QTD_DEVOLVIDA_ITEM,

    CASE

        WHEN '${pRastreavel}' = 'N' THEN GREATEST(ite.QTDNEG - ite.QTDENTREGUE, 0)

        ELSE 0

    END AS SALDO_ITEM_NF,

    NVL(its.CODLOCAL, 0) AS CODLOCAL_ITS,

    ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) AS SALDO_RAST_LINHA,

    CASE

        WHEN '${pRastreavel}' = 'S'

         AND its.NUNOTA IS NOT NULL

         AND (NVL(ra.TIPORASTR, 'S') NOT IN ('C', 'L') OR NVL(its.CONTROLE, ' ') = NVL(ite.CONTROLE, ' '))

         AND (NVL(ra.TIPORASTR, 'S') NOT IN ('O', 'L') OR its.CODLOCAL IN (SELECT CODLOCAL FROM locais))

        THEN GREATEST(ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10), 0)

        ELSE 0

    END AS SALDO_SAIDA_TGFITS,

    '${pRastreavel}' AS RASTREAVEL,

    'NAO_INTERCOMPANY' AS TIPO_ENTRADA

FROM TGFCAB cab

INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA AND TRUNC(ite.CODPROD) = ${pCodprod}

INNER JOIN TGFTOP top ON top.CODTIPOPER = cab.CODTIPOPER AND top.DHALTER = cab.DHTIPOPER

CROSS JOIN params par

LEFT JOIN GET_TGFITCNFENT cnf ON cnf.NUNOTA = cab.NUNOTA

LEFT JOIN TGFCAB mod_ent ON mod_ent.NUNOTA = par.NUNOTA_MOD_ENT_FIL

LEFT JOIN TGFITS its

    ON its.NUNOTA = ite.NUNOTA AND its.SEQUENCIA = ite.SEQUENCIA AND its.CODEMP = cab.CODEMP

LEFT JOIN TGFRASTEMP ra ON ra.CODPROD = TRUNC(ite.CODPROD) AND ra.CODEMP = cab.CODEMP

WHERE cab.CODEMP = ${pCodemp}

  AND cab.STATUSNOTA = 'L'

  AND (top.ATUALLIVFIS = 'E' OR cab.TIPMOV IN ('C', 'D'))

  AND NVL(ite.CONTROLE, ' ') = NVL('${pControle}', ' ')

  AND (cnf.NUNOTA IS NULL OR mod_ent.CODTIPOPER <> cab.CODTIPOPER)

  AND (

        ('${pRastreavel}' = 'N'

         AND GREATEST(ite.QTDNEG - ite.QTDENTREGUE, 0) > 0)

        OR

        ('${pRastreavel}' = 'S'

         AND its.NUNOTA IS NOT NULL

         AND (NVL(ra.TIPORASTR, 'S') NOT IN ('C', 'L') OR NVL(its.CONTROLE, ' ') = NVL(ite.CONTROLE, ' '))

         AND (NVL(ra.TIPORASTR, 'S') NOT IN ('O', 'L') OR its.CODLOCAL IN (SELECT CODLOCAL FROM locais))

         AND ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) > 0)

      )

ORDER BY cab.DTENTSAI DESC, cab.NUNOTA, ite.SEQUENCIA

</snk:query>

</c:if>



<div id="data-container" hidden>

    <c:if test="${loadInterco}">

    <c:forEach items="${notasIntercompany.rows}" var="row">

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

              data-tipmov="<c:out value='${row.TIPMOV}'/>"

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

    </c:if>

    <c:if test="${loadOutras}">

    <c:forEach items="${notasOutras.rows}" var="row">

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

              data-tipmov="<c:out value='${row.TIPMOV}'/>"

              data-descrtop="<c:out value='${row.DESCROPER}'/>"

              data-saldoitem="<c:out value='${row.SALDO_ITEM_NF}'/>"

              data-saldorastloc="<c:out value='${row.SALDO_SAIDA_TGFITS}'/>"

              data-rastreavel="<c:out value='${row.RASTREAVEL}'/>">

        </span>

    </c:forEach>

    </c:if>

</div>

