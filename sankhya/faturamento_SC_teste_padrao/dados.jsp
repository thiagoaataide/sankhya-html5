<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>

<snk:query var="faturamentoSc">
SELECT
      1 AS NUMOS
    , 0 AS NUNOTAPED
    , 0 AS CODUSUVEND
    , 'Teste' AS VENDEDOR
    , 0 AS CODUSUEXEC
    , 'Teste' AS EXECUTANTE
    , 'Teste sem datasource explicito' AS CLASSIFICACAO
    , 0 AS CODNAT
    , 'Teste' AS DESCRNAT
    , 0 AS CODPARC
    , 'Teste de datasource padrao' AS NOMEPARC
    , 0 AS PEDIDO
    , 0 AS TEMPGASTO
    , 0 AS VLRTOT
    , 0 AS VLRUNIT
    , 'N' AS FATURAR
    , 'N' AS AUTORIZADO
    , 0 AS NUNOTANF
    , 'Não' AS FATURADO
    , SYSDATE AS DHENTRADA
    , SYSDATE AS INICEXEC
FROM DUAL
</snk:query>

<c:set scope="request" var="faturamentoScApp" value="${faturamentoSc}" />
