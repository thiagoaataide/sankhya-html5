<%@ page language="java" contentType="application/json; charset=UTF-8"
         pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<%@ page import="java.io.StringWriter" %>
<%@ page import="java.io.PrintWriter" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%!
    private static String prefText(Object value) throws Exception {
        if (value == null) {
            return null;
        }
        if (value instanceof java.sql.Clob) {
            java.sql.Clob clob = (java.sql.Clob) value;
            long length = clob.length();
            if (length <= 0) {
                return "";
            }
            int size = length > 131072L ? 131072 : (int) length;
            return clob.getSubString(1, size);
        }
        String text = String.valueOf(value);
        if (text.indexOf("CLOB@") < 0 && text.indexOf("Clob@") < 0) {
            return text;
        }
        java.lang.reflect.Method lengthMethod = value.getClass().getMethod("length");
        long length = ((Number) lengthMethod.invoke(value)).longValue();
        if (length <= 0) {
            return "";
        }
        int size = length > 131072L ? 131072 : (int) length;
        java.lang.reflect.Method substring = value.getClass().getMethod("getSubString", long.class, int.class);
        Object content = substring.invoke(value, Long.valueOf(1L), Integer.valueOf(size));
        return content == null ? null : String.valueOf(content);
    }
%>
<%
    StringWriter buffer = new StringWriter();
    PrintWriter json = new PrintWriter(buffer);
    boolean exists = false;
    boolean rowFound = false;
    String conf = null;
    String codusu = null;
    String dhalter = null;
    try {
%>
<snk:query var="prefExists">
    SELECT TO_CHAR(P.CODUSU) AS CODUSU
      FROM AD_APURACAOCONF P
     WHERE P.CODUSU = ${CODUSU_LOG}
</snk:query>
<%
        java.util.List existing = (java.util.List) pageContext.getAttribute("prefExists");
        if (existing != null && !existing.isEmpty()) {
            rowFound = true;
            exists = true;
            Object first = existing.get(0);
            if (first instanceof java.util.Map) {
                java.util.Map row = (java.util.Map) first;
                Object codObj = row.get("CODUSU");
                if (codObj == null) {
                    codObj = row.get("codusu");
                }
                if (codObj != null) {
                    codusu = String.valueOf(codObj);
                }
            }
        }
    } catch (Exception error) {
        exists = false;
        rowFound = false;
    }
    if (rowFound) {
        try {
%>
<snk:query var="prefRows">
    SELECT P.CONF,
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
                    if (confObj == null) {
                        confObj = row.get("conf");
                    }
                    conf = prefText(confObj);
                    Object dhObj = row.get("DHALTER_FMT");
                    if (dhObj == null) {
                        dhObj = row.get("dhalter_fmt");
                    }
                    if (dhObj != null) {
                        dhalter = String.valueOf(dhObj);
                    }
                }
            }
        } catch (Exception error) {
            conf = null;
        }
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
