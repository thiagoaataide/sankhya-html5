<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1" isELIgnored="false" errorPage="erro.jsp" %>

<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>

<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>



<snk:query var="resumoProdutos" dataSource="MGEDS">

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

estoque AS (

    SELECT

        e.CODEMP,

        TRUNC(e.CODPROD) AS CODPROD,

        NVL(e.CONTROLE, ' ') AS CONTROLE,

        SUM(e.ESTOQUE) AS ESTOQUE,

        SUM(e.RESERVADO) AS RESERVADO,

        SUM(e.ESTOQUE - e.RESERVADO) AS DISPONIVEL

    FROM TGFEST e

    INNER JOIN locais l ON l.CODLOCAL = e.CODLOCAL

    WHERE e.CODEMP IN (${P_CODEMP})

      AND (TRUNC(e.CODPROD) = :P_CODPROD OR :P_CODPROD IS NULL)

    GROUP BY e.CODEMP, TRUNC(e.CODPROD), NVL(e.CONTROLE, ' ')

    HAVING SUM(e.ESTOQUE - e.RESERVADO) > 0

),

prod_estoque AS (

    SELECT DISTINCT CODEMP, CODPROD FROM estoque

),

mod_dev AS (

    SELECT cab_mod.TIPMOV, cab_mod.CODTIPOPER, cab_mod.DHTIPOPER

    FROM params par

    INNER JOIN TGFCAB cab_mod ON cab_mod.NUNOTA = par.NUNOTA_MOD_DEV

),

prod_rastreio AS (

    SELECT

        pe.CODEMP,

        pe.CODPROD,

        CASE

            WHEN Get_Tem_Rastreamento_Itens(

                     m.TIPMOV, pe.CODEMP, m.CODTIPOPER, m.DHTIPOPER, pe.CODPROD

                 ) = 'S' THEN 'S'

            ELSE 'N'

        END AS RASTREAVEL

    FROM prod_estoque pe

    CROSS JOIN mod_dev m

),

rastreio AS (

    SELECT es.CODEMP, es.CODPROD, es.CONTROLE, pr.RASTREAVEL

    FROM estoque es

    INNER JOIN prod_rastreio pr

        ON pr.CODEMP = es.CODEMP AND pr.CODPROD = es.CODPROD

),

itens_interco AS (

    SELECT

        cab.CODEMP,

        TRUNC(ite.CODPROD) AS CODPROD,

        ite.NUNOTA,

        ite.SEQUENCIA,

        NVL(ite.CONTROLE, ' ') AS CONTROLE,

        pr.RASTREAVEL,

        CASE

            WHEN pr.RASTREAVEL = 'N' THEN ite.QTDNEG - ite.QTDENTREGUE

            ELSE 0

        END AS SALDO_ITEM

    FROM params par

    INNER JOIN TGFCAB cab_mod_ent ON cab_mod_ent.NUNOTA = par.NUNOTA_MOD_ENT_FIL

    INNER JOIN TGFCAB cab

        ON cab.CODTIPOPER = cab_mod_ent.CODTIPOPER

       AND cab.CODEMP IN (${P_CODEMP})

       AND cab.STATUSNOTA = 'L'

       AND cab.TIPMOV = 'C'

    INNER JOIN GET_TGFITCNFENT cnf ON cnf.NUNOTA = cab.NUNOTA

    INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA

    INNER JOIN prod_estoque pe

        ON pe.CODEMP = cab.CODEMP AND pe.CODPROD = TRUNC(ite.CODPROD)

    INNER JOIN prod_rastreio pr

        ON pr.CODEMP = pe.CODEMP AND pr.CODPROD = pe.CODPROD

    WHERE (pe.CODPROD = :P_CODPROD OR :P_CODPROD IS NULL)

      AND (

            (pr.RASTREAVEL = 'N' AND ite.QTDNEG - ite.QTDENTREGUE > 0)

            OR pr.RASTREAVEL = 'S'

          )

),

cap_nr AS (

    SELECT

        es.CODEMP,

        es.CODPROD,

        es.CONTROLE,

        NVL(SUM(ia.SALDO_ITEM), 0) AS DISP_PP

    FROM estoque es

    INNER JOIN rastreio r

        ON r.CODEMP = es.CODEMP AND r.CODPROD = es.CODPROD AND r.CONTROLE = es.CONTROLE

       AND r.RASTREAVEL = 'N'

    INNER JOIN itens_interco ia

        ON ia.CODEMP = es.CODEMP AND ia.CODPROD = es.CODPROD AND ia.RASTREAVEL = 'N'

    GROUP BY es.CODEMP, es.CODPROD, es.CONTROLE

),

cap_rast AS (

    SELECT

        es.CODEMP,

        es.CODPROD,

        es.CONTROLE,

        NVL(SUM(ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10)), 0) AS DISP_PP

    FROM estoque es

    INNER JOIN rastreio r

        ON r.CODEMP = es.CODEMP AND r.CODPROD = es.CODPROD AND r.CONTROLE = es.CONTROLE

       AND r.RASTREAVEL = 'S'

    INNER JOIN itens_interco ia

        ON ia.CODEMP = es.CODEMP AND ia.CODPROD = es.CODPROD AND ia.RASTREAVEL = 'S'

    INNER JOIN TGFITS its

        ON its.NUNOTA = ia.NUNOTA AND its.SEQUENCIA = ia.SEQUENCIA AND its.CODEMP = ia.CODEMP

    INNER JOIN TGFRASTEMP ra ON ra.CODPROD = its.CODPROD AND ra.CODEMP = its.CODEMP

    INNER JOIN locais l ON l.CODLOCAL = its.CODLOCAL

    WHERE (ra.TIPORASTR NOT IN ('C', 'L') OR NVL(its.CONTROLE, ' ') = NVL(ia.CONTROLE, ' '))

      AND ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) > 0

    GROUP BY es.CODEMP, es.CODPROD, es.CONTROLE

),

cap_vinculo AS (

    SELECT CODEMP, CODPROD, CONTROLE, DISP_PP FROM cap_nr

    UNION ALL

    SELECT CODEMP, CODPROD, CONTROLE, DISP_PP FROM cap_rast

),

cap_vinculo_agg AS (

    SELECT CODEMP, CODPROD, CONTROLE, SUM(DISP_PP) AS DISP_PP

    FROM cap_vinculo

    GROUP BY CODEMP, CODPROD, CONTROLE

),

excl_prod AS (

    SELECT DISTINCT pe.CODPROD, pe.CODEMP

    FROM prod_estoque pe

    INNER JOIN TGFPRO pro ON TRUNC(pro.CODPROD) = pe.CODPROD

    INNER JOIN TGFPAR parc ON parc.CODPARC = pro.CODPARCFORN AND parc.CODEMPPREF = pe.CODEMP

)

SELECT

    es.CODEMP,

    emp.NOMEFANTASIA AS NOMEEMP,

    es.CODPROD,

    pro.DESCRPROD,

    es.CONTROLE,

    es.ESTOQUE,

    es.RESERVADO,

    es.DISPONIVEL,

    NVL(cv.DISP_PP, 0) AS DISP_PP,

    es.DISPONIVEL - NVL(cv.DISP_PP, 0) AS DIF_SEM_VINCULO,

    r.RASTREAVEL,

    CASE WHEN ep.CODPROD IS NOT NULL THEN 'S' ELSE 'N' END AS EXCL_FORN,

    CASE

        WHEN ep.CODPROD IS NOT NULL THEN 'EXCL_FORN'

        WHEN NVL(cv.DISP_PP, 0) <= 0 AND es.DISPONIVEL > 0 THEN 'SEM_VINC_INTERCO'

        WHEN NVL(cv.DISP_PP, 0) > 0 AND NVL(cv.DISP_PP, 0) < es.DISPONIVEL THEN 'PARCIAL_VINC'

        WHEN NVL(cv.DISP_PP, 0) >= es.DISPONIVEL AND es.DISPONIVEL > 0 THEN 'ELEGIVEL'

        ELSE 'OUTRO'

    END AS MOTIVO_COD,

    CASE

        WHEN ep.CODPROD IS NOT NULL

            THEN UNISTR('Fornecedor com CODEMPPREF = empresa (exclu\00EDdo na carga da devolu\00E7\00E3o)')

        WHEN NVL(cv.DISP_PP, 0) <= 0 AND es.DISPONIVEL > 0

            THEN UNISTR('Estoque f\00EDsico sem saldo vincul\00E1vel em NF entrada intercompany')

        WHEN NVL(cv.DISP_PP, 0) > 0 AND NVL(cv.DISP_PP, 0) < es.DISPONIVEL

            THEN UNISTR('Parte do estoque n\00E3o possui v\00EDnculo intercompany (outras entradas / rastreio)')

        WHEN NVL(cv.DISP_PP, 0) >= es.DISPONIVEL AND es.DISPONIVEL > 0

            THEN UNISTR('Eleg\00EDvel a devolu\00E7\00E3o intercompany no saldo dispon\00EDvel')

        ELSE UNISTR('Verificar estoque e par\00E2metros')

    END AS MOTIVO_TXT

FROM estoque es

INNER JOIN TGFPRO pro ON TRUNC(pro.CODPROD) = es.CODPROD

INNER JOIN TSIEMP emp ON emp.CODEMP = es.CODEMP

LEFT JOIN cap_vinculo_agg cv

    ON cv.CODEMP = es.CODEMP AND cv.CODPROD = es.CODPROD AND cv.CONTROLE = es.CONTROLE

LEFT JOIN rastreio r

    ON r.CODEMP = es.CODEMP AND r.CODPROD = es.CODPROD AND r.CONTROLE = es.CONTROLE

LEFT JOIN excl_prod ep

    ON ep.CODEMP = es.CODEMP AND ep.CODPROD = es.CODPROD

ORDER BY es.CODEMP, es.CODPROD

</snk:query>



<c:set scope="request" var="resumoProdutosApp" value="${resumoProdutos}" />

