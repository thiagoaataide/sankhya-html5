<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
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
    WHERE e.CODEMP IN (:P_CODEMP)
      AND (TRUNC(e.CODPROD) = :P_CODPROD OR :P_CODPROD IS NULL)
    GROUP BY e.CODEMP, TRUNC(e.CODPROD), NVL(e.CONTROLE, ' ')
    HAVING SUM(e.ESTOQUE - e.RESERVADO) > 0
),
rastreio AS (
    SELECT
        es.CODEMP,
        es.CODPROD,
        es.CONTROLE,
        CASE
            WHEN Get_Tem_Rastreamento_Itens(
                     cab_mod.TIPMOV,
                     es.CODEMP,
                     cab_mod.CODTIPOPER,
                     cab_mod.DHTIPOPER,
                     es.CODPROD
                 ) = 'S' THEN 'S'
            ELSE 'N'
        END AS RASTREAVEL
    FROM estoque es
    CROSS JOIN params par
    INNER JOIN TGFCAB cab_mod ON cab_mod.NUNOTA = par.NUNOTA_MOD_DEV
),
cap_vinculo AS (
    SELECT
        es.CODEMP,
        es.CODPROD,
        es.CONTROLE,
        NVL(SUM(
            CASE
                WHEN r.RASTREAVEL = 'S' THEN
                    LEAST(
                        ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA,
                        ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10)
                    )
                ELSE
                    ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA
            END
        ), 0) AS DISP_PP
    FROM estoque es
    INNER JOIN rastreio r
        ON r.CODEMP = es.CODEMP AND r.CODPROD = es.CODPROD AND r.CONTROLE = es.CONTROLE
    CROSS JOIN params par
    INNER JOIN TGFITE ite ON TRUNC(ite.CODPROD) = es.CODPROD
    INNER JOIN TGFCAB cab ON cab.NUNOTA = ite.NUNOTA AND cab.CODEMP = es.CODEMP AND cab.STATUSNOTA = 'L'
    INNER JOIN GET_TGFITCNFENT cnf ON cnf.NUNOTA = cab.NUNOTA
    INNER JOIN TGFCAB cab_mod_ent ON cab_mod_ent.NUNOTA = par.NUNOTA_MOD_ENT_FIL
                                 AND cab_mod_ent.CODTIPOPER = cab.CODTIPOPER
    LEFT JOIN TGFITS its ON its.NUNOTA = ite.NUNOTA AND its.SEQUENCIA = ite.SEQUENCIA
    LEFT JOIN TGFRASTEMP ra ON ra.CODPROD = its.CODPROD AND ra.CODEMP = its.CODEMP
    WHERE cab.TIPMOV = 'C'
      AND ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA > 0
      AND (
            r.RASTREAVEL = 'N'
            OR (
                its.CODEMP = es.CODEMP
                AND (ra.TIPORASTR NOT IN ('C', 'L') OR NVL(its.CONTROLE, ' ') = NVL(ite.CONTROLE, ' '))
                AND (ra.TIPORASTR NOT IN ('O', 'L') OR its.CODLOCAL IN (SELECT CODLOCAL FROM locais))
                AND ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) > 0
            )
          )
    GROUP BY es.CODEMP, es.CODPROD, es.CONTROLE
),
fornec_exclusivo AS (
    SELECT
        es.CODEMP,
        es.CODPROD,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM TGFPRO pro
                INNER JOIN TGFPAR parc ON parc.CODPARC = pro.CODPARCFORN
                WHERE TRUNC(pro.CODPROD) = es.CODPROD
                  AND parc.CODEMPPREF = es.CODEMP
            ) THEN 'S'
            ELSE 'N'
        END AS EXCL_FORN
    FROM estoque es
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
    fe.EXCL_FORN,
    CASE
        WHEN fe.EXCL_FORN = 'S' THEN 'EXCL_FORN'
        WHEN NVL(cv.DISP_PP, 0) <= 0 AND es.DISPONIVEL > 0 THEN 'SEM_VINC_INTERCO'
        WHEN NVL(cv.DISP_PP, 0) > 0 AND NVL(cv.DISP_PP, 0) < es.DISPONIVEL THEN 'PARCIAL_VINC'
        WHEN NVL(cv.DISP_PP, 0) >= es.DISPONIVEL AND es.DISPONIVEL > 0 THEN 'ELEGIVEL'
        ELSE 'OUTRO'
    END AS MOTIVO_COD,
    CASE
        WHEN fe.EXCL_FORN = 'S'
            THEN 'Fornecedor com CODEMPPREF = empresa (excluido na carga da devolucao)'
        WHEN NVL(cv.DISP_PP, 0) <= 0 AND es.DISPONIVEL > 0
            THEN 'Estoque fisico sem saldo vinculavel em NF entrada intercompany'
        WHEN NVL(cv.DISP_PP, 0) > 0 AND NVL(cv.DISP_PP, 0) < es.DISPONIVEL
            THEN 'Parte do estoque nao possui vinculo intercompany (outras entradas / rastreio)'
        WHEN NVL(cv.DISP_PP, 0) >= es.DISPONIVEL AND es.DISPONIVEL > 0
            THEN 'Elegivel a devolucao intercompany no saldo disponivel'
        ELSE 'Verificar estoque e parametros'
    END AS MOTIVO_TXT
FROM estoque es
INNER JOIN TGFPRO pro ON TRUNC(pro.CODPROD) = es.CODPROD
INNER JOIN TSIEMP emp ON emp.CODEMP = es.CODEMP
LEFT JOIN cap_vinculo cv
    ON cv.CODEMP = es.CODEMP AND cv.CODPROD = es.CODPROD AND cv.CONTROLE = es.CONTROLE
LEFT JOIN rastreio r
    ON r.CODEMP = es.CODEMP AND r.CODPROD = es.CODPROD AND r.CONTROLE = es.CONTROLE
LEFT JOIN fornec_exclusivo fe
    ON fe.CODEMP = es.CODEMP AND fe.CODPROD = es.CODPROD
ORDER BY es.CODEMP, es.CODPROD
</snk:query>

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
    top.DESCROPER,
    ite.SEQUENCIA,
    ite.QTDNEG AS QTD_COMPRADA,
    ite.QTDENTREGUE AS QTD_DEVOLVIDA_ITEM,
    (ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA) AS SALDO_ITEM_NF,
    NVL(its.CODLOCAL, 0) AS CODLOCAL_ITS,
    NVL(its.QTDENT, 0) AS QTDENT_ITS,
    NVL(its.QTDSAI, 0) AS QTDSAI_ITS,
    ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) AS SALDO_RAST_LINHA,
    CASE
        WHEN Get_Tem_Rastreamento_Itens(
                 cab_mod.TIPMOV, cab.CODEMP, cab_mod.CODTIPOPER, cab_mod.DHTIPOPER, TRUNC(ite.CODPROD)
             ) = 'S' THEN 'S' ELSE 'N'
    END AS RASTREAVEL,
    CASE
        WHEN Get_Tem_Rastreamento_Itens(
                 cab_mod.TIPMOV, cab.CODEMP, cab_mod.CODTIPOPER, cab_mod.DHTIPOPER, TRUNC(ite.CODPROD)
             ) = 'S' THEN
            LEAST(
                (ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA),
                (SELECT NVL(SUM(ROUND(i2.QTDENT - NVL(i2.QTDSAI, 0), 10)), 0)
                 FROM TGFITS i2
                 INNER JOIN locais l ON l.CODLOCAL = i2.CODLOCAL
                 WHERE i2.NUNOTA = ite.NUNOTA AND i2.SEQUENCIA = ite.SEQUENCIA AND i2.CODEMP = cab.CODEMP)
            )
        ELSE (ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA)
    END AS SALDO_VINCULAVEL,
    'INTERCOMPANY' AS TIPO_ENTRADA
FROM TGFCAB cab
INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA
INNER JOIN TGFTOP top ON top.CODTIPOPER = cab.CODTIPOPER AND top.DHALTER = cab.DHTIPOPER
INNER JOIN GET_TGFITCNFENT cnf ON cnf.NUNOTA = cab.NUNOTA
CROSS JOIN params par
INNER JOIN TGFCAB cab_mod_ent ON cab_mod_ent.NUNOTA = par.NUNOTA_MOD_ENT_FIL
                             AND cab_mod_ent.CODTIPOPER = cab.CODTIPOPER
INNER JOIN TGFCAB cab_mod ON cab_mod.NUNOTA = par.NUNOTA_MOD_DEV
LEFT JOIN TGFITS its ON its.NUNOTA = ite.NUNOTA AND its.SEQUENCIA = ite.SEQUENCIA AND its.CODEMP = cab.CODEMP
WHERE cab.CODEMP IN (:P_CODEMP)
  AND cab.STATUSNOTA = 'L'
  AND cab.TIPMOV = 'C'
  AND (TRUNC(ite.CODPROD) = :P_CODPROD OR :P_CODPROD IS NULL)
ORDER BY cab.CODEMP, TRUNC(ite.CODPROD), cab.DTENTSAI, cab.NUNOTA, ite.SEQUENCIA
</snk:query>

<snk:query var="notasOutras" dataSource="MGEDS">
WITH params AS (
    SELECT
        (SELECT INTEIRO FROM TSIPAR WHERE CHAVE = 'CODMODNFENTFIL') AS NUNOTA_MOD_ENT_FIL,
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
    top.DESCROPER,
    ite.SEQUENCIA,
    ite.QTDNEG AS QTD_ENTRADA,
    ite.QTDENTREGUE AS QTD_DEVOLVIDA_ITEM,
    (ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA) AS SALDO_ITEM_NF,
    NVL(its.CODLOCAL, 0) AS CODLOCAL_ITS,
    ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) AS SALDO_RAST_LINHA,
    (SELECT NVL(SUM(ROUND(i2.QTDENT - NVL(i2.QTDSAI, 0), 10)), 0)
     FROM TGFITS i2
     INNER JOIN locais l ON l.CODLOCAL = i2.CODLOCAL
     WHERE i2.NUNOTA = ite.NUNOTA AND i2.SEQUENCIA = ite.SEQUENCIA AND i2.CODEMP = cab.CODEMP) AS SALDO_RAST_LOC_VALIDO,
    CASE
        WHEN cnf.NUNOTA IS NULL THEN 'Fora GET_TGFITCNFENT'
        WHEN mod_ent.CODTIPOPER <> cab.CODTIPOPER THEN 'TOP diferente modelo filial'
        ELSE 'Outro'
    END AS MOTIVO_NAO_INTERCO,
    'NAO_INTERCOMPANY' AS TIPO_ENTRADA
FROM TGFCAB cab
INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA
INNER JOIN TGFTOP top ON top.CODTIPOPER = cab.CODTIPOPER AND top.DHALTER = cab.DHTIPOPER
CROSS JOIN params par
LEFT JOIN GET_TGFITCNFENT cnf ON cnf.NUNOTA = cab.NUNOTA
LEFT JOIN TGFCAB mod_ent ON mod_ent.NUNOTA = par.NUNOTA_MOD_ENT_FIL
LEFT JOIN TGFITS its ON its.NUNOTA = ite.NUNOTA AND its.SEQUENCIA = ite.SEQUENCIA AND its.CODEMP = cab.CODEMP
WHERE cab.CODEMP IN (:P_CODEMP)
  AND cab.STATUSNOTA = 'L'
  AND cab.TIPMOV = 'C'
  AND (TRUNC(ite.CODPROD) = :P_CODPROD OR :P_CODPROD IS NULL)
  AND (cnf.NUNOTA IS NULL OR mod_ent.CODTIPOPER <> cab.CODTIPOPER)
  AND (
        (ite.QTDNEG - ite.QTDENTREGUE - ite.QTDCONFERIDA) > 0
        OR ROUND(NVL(its.QTDENT, 0) - NVL(its.QTDSAI, 0), 10) > 0
      )
ORDER BY cab.CODEMP, TRUNC(ite.CODPROD), cab.DTENTSAI DESC, cab.NUNOTA
</snk:query>

<c:set scope="request" var="resumoProdutosApp" value="${resumoProdutos}" />
<c:set scope="request" var="notasIntercompanyApp" value="${notasIntercompany}" />
<c:set scope="request" var="notasOutrasApp" value="${notasOutras}" />
