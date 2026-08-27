<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isErrorPage="true" isELIgnored="false" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="java.io.StringWriter" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%
Throwable pcfiError = exception;
if (pcfiError == null) {
    Object servletError = request.getAttribute("javax.servlet.error.exception");
    if (servletError instanceof Throwable) pcfiError = (Throwable) servletError;
}
Throwable root = pcfiError;
while (root != null && root.getCause() != null && root.getCause() != root) root = root.getCause();
StringWriter stack = new StringWriter();
if (pcfiError != null) {
    pcfiError.printStackTrace(new PrintWriter(stack));
    application.log("[PCFI] Falha ao carregar o componente.", pcfiError);
}
request.setAttribute("pcfiErrorClass", pcfiError == null ? "Erro não informado" : pcfiError.getClass().getName());
request.setAttribute("pcfiErrorMessage", pcfiError == null || pcfiError.getMessage() == null ? "Sem mensagem." : pcfiError.getMessage());
request.setAttribute("pcfiRootMessage", root == null || root.getMessage() == null ? "Sem causa raiz disponível." : root.getMessage());
request.setAttribute("pcfiStack", stack.toString());
%>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Diagnóstico PCFI</title>
    <style>
        body{margin:0;padding:24px;background:#f4f7fb;color:#172033;font:14px/1.5 "Segoe UI",Arial,sans-serif}
        main{max-width:1000px;margin:auto;padding:22px;background:#fff;border:1px solid #dde4ee;border-radius:12px}
        h1{margin-top:0}.cause{padding:12px;background:#fff0ef;border:1px solid #f1b5b0;border-radius:8px;color:#8f1d16}
        pre{max-height:480px;overflow:auto;padding:12px;background:#202631;color:#edf2f7;white-space:pre-wrap}
    </style>
</head>
<body>
<main>
    <h1>Falha ao carregar o dashboard PCFI</h1>
    <p><strong>Classe:</strong> <code><c:out value="${pcfiErrorClass}"/></code></p>
    <p><strong>Mensagem:</strong> <c:out value="${pcfiErrorMessage}"/></p>
    <p class="cause"><strong>Causa raiz:</strong> <c:out value="${pcfiRootMessage}"/></p>
    <details><summary>Exibir stack trace</summary><pre><c:out value="${pcfiStack}"/></pre></details>
</main>
</body>
</html>
