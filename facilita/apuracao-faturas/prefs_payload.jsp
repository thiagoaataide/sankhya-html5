<%@ page language="java" contentType="application/json; charset=UTF-8"
         pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<%@ page import="java.io.StringWriter" %>
<%@ page import="java.io.PrintWriter" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%
    StringWriter buffer = new StringWriter();
    PrintWriter json = new PrintWriter(buffer);
    boolean exists = false;
    String conf = null;
    String codusu = null;
    String dhalter = null;
    try {
%>
<snk:query var="prefRows">
    SELECT TO_CHAR(P.CODUSU) AS CODUSU,
           P.CONF,
           TO_CHAR(P.DHALTER, 'DD/MM/YYYY HH24:MI:SS') AS DHALTER_FMT
      FROM AD_APURACAOCONF P
     WHERE P.CODUSU = ${CODUSU_LOG}
</snk:query>
<%
        java.util.List rows = (java.util.List) pageContext.getAttribute("prefRows");
        if (rows != null && !rows.isEmpty()) {
            Object first = rows.get(0);
            if (first instanceof java.util.Map) {
                java.util.Map row = (java.util.Map) first;
                Object confObj = row.get("CONF");
                if (confObj != null) {
                    exists = true;
                    conf = String.valueOf(confObj);
                    Object codObj = row.get("CODUSU");
                    if (codObj != null) {
                        codusu = String.valueOf(codObj);
                    }
                    Object dhObj = row.get("DHALTER_FMT");
                    if (dhObj != null) {
                        dhalter = String.valueOf(dhObj);
                    }
                }
            }
        }
    } catch (Exception error) {
        exists = false;
        conf = null;
    }
    json.print("{\"exists\":");
    json.print(exists ? "true" : "false");
    json.print(",\"codusu\":");
    if (codusu == null || codusu.trim().isEmpty()) {
        json.print("null");
    } else {
        json.print("\"");
        json.print(codusu.replace("\\", "\\\\").replace("\"", "\\\""));
        json.print("\"");
    }
    json.print(",\"dhalter\":");
    if (dhalter == null || dhalter.trim().isEmpty()) {
        json.print("null");
    } else {
        json.print("\"");
        json.print(dhalter.replace("\\", "\\\\").replace("\"", "\\\""));
        json.print("\"");
    }
    json.print(",\"conf\":");
    if (conf == null) {
        json.print("null");
    } else {
        json.print("\"");
        json.print(conf
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n")
            .replace("\t", "\\t")
            .replace("\u2028", "\\u2028")
            .replace("\u2029", "\\u2029"));
        json.print("\"");
    }
    json.print("}");
    json.flush();
    out.print(buffer.toString());
%>
