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
       TO_CHAR(APU.TAMANHOANEXO, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS TAMANHOANEXO,
       TO_CHAR(APU.SEQUENCIAFATURAMENTO) AS SEQUENCIAFATURAMENTO,
       CTA.IDENTIFICADOR AS IDENTIFICADOR,
       OPE.NOMEPARC AS NOMEOPERADORA,
       TIT.NOMEPARC AS NOMETITULAR,
       TIT.CGC_CPF AS CGCTITULAR,
       VEN.APELIDO AS APELIDOVEND,
       TO_CHAR(CTA.VLREST, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS VLREST,
       TO_CHAR(CFG.DATAINI, 'YYYY-MM-DD') AS CFGDATAINI,
       TO_CHAR(CFG.DATAFIN, 'YYYY-MM-DD') AS CFGDATAFIN,
       TO_CHAR(CFG.VLRREF, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS CFGVLRREF,
       TO_CHAR(CFG.VLRFIXO, 'FM999999999999990D00', 'NLS_NUMERIC_CHARACTERS=''.,''') AS CFGVLRFIXO,
       LGO.LOGIN AS ACESSO_LOGIN,
       LGO.CPF AS ACESSO_CPF,
       LGO.EMAIL AS ACESSO_EMAIL,
       LGO.LINHA_GESTORA AS ACESSO_LINHA,
       LGO.CGC_CPF AS ACESSO_CNPJ,
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
  LEFT JOIN BH_FACCON CTA ON CTA.CODCONTA = APU.CODCONTA
  LEFT JOIN TGFPAR OPE ON OPE.CODPARC = CTA.OPERADORA
  LEFT JOIN TGFPAR TIT ON TIT.CODPARC = CTA.TITULARIDADE
  LEFT JOIN BH_FACCTR CTR ON CTR.NUMCONTRATO = APU.NUMCONTRATO
  LEFT JOIN TGFVEN VEN ON VEN.CODVEND = CTR.CODVEND
  LEFT JOIN BH_FACCCT CFG
    ON CFG.NUMCONTRATO = APU.NUMCONTRATO
   AND CFG.SEQUENCIA = APU.SEQUENCIACON
  LEFT JOIN BH_FACLGO LGO
    ON LGO.CODPARC = CTA.CODPARCGESTOR
   AND LGO.CODCONTATO = CTA.CODCONTATOGESTOR
   AND LGO.CODOPERADORA = CTA.OPERADORA
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
             data-tamanho-anexo="<c:out value='${row.TAMANHOANEXO}'/>"
             data-sequencia-faturamento="<c:out value='${row.SEQUENCIAFATURAMENTO}'/>"
             data-identificador="<c:out value='${row.IDENTIFICADOR}'/>"
             data-nome-operadora="<c:out value='${row.NOMEOPERADORA}'/>"
             data-nome-titular="<c:out value='${row.NOMETITULAR}'/>"
             data-cgc-titular="<c:out value='${row.CGCTITULAR}'/>"
             data-apelido-vend="<c:out value='${row.APELIDOVEND}'/>"
             data-vlrest="<c:out value='${row.VLREST}'/>"
             data-cfg-dataini="<c:out value='${row.CFGDATAINI}'/>"
             data-cfg-datafin="<c:out value='${row.CFGDATAFIN}'/>"
             data-cfg-vlrref="<c:out value='${row.CFGVLRREF}'/>"
             data-cfg-vlrfixo="<c:out value='${row.CFGVLRFIXO}'/>"
             data-acesso-login="<c:out value='${row.ACESSO_LOGIN}'/>"
             data-acesso-cpf="<c:out value='${row.ACESSO_CPF}'/>"
             data-acesso-email="<c:out value='${row.ACESSO_EMAIL}'/>"
             data-acesso-linha="<c:out value='${row.ACESSO_LINHA}'/>"
             data-acesso-cnpj="<c:out value='${row.ACESSO_CNPJ}'/>"
             data-possui-anexo="<c:out value='${row.POSSUIANEXO}'/>"></div>
    </c:forEach>
</div>
