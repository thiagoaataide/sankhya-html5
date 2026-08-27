<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isErrorPage="true" isELIgnored="false" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="java.io.StringWriter" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%
Throwable faturamentoError = exception;
if (faturamentoError == null) {
    Object servletError = request.getAttribute("javax.servlet.error.exception");
    if (servletError instanceof Throwable) faturamentoError = (Throwable) servletError;
}
Throwable root = faturamentoError;
while (root != null && root.getCause() != null && root.getCause() != root) root = root.getCause();
StringWriter stack = new StringWriter();
if (faturamentoError != null) {
    faturamentoError.printStackTrace(new PrintWriter(stack));
    application.log("[Faturamento SC] Falha ao carregar o componente.", faturamentoError);
}
request.setAttribute("errorClass", faturamentoError == null ? "Erro nao informado" : faturamentoError.getClass().getName());
request.setAttribute("errorMessage", faturamentoError == null || faturamentoError.getMessage() == null ? "Sem mensagem." : faturamentoError.getMessage());
request.setAttribute("rootMessage", root == null || root.getMessage() == null ? "Sem causa raiz disponivel." : root.getMessage());
request.setAttribute("errorStack", stack.toString());
%>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Diagnostico - Faturamento SC</title>
    <style>
        body{margin:0;padding:24px;background:#f4f8f8;color:#1e2d3d;font:14px/1.5 "Segoe UI",Arial,sans-serif}
        main{max-width:1000px;margin:auto;padding:22px;background:#fff;border:1px solid #dce5ea;border-radius:12px}
        h1{margin-top:0;color:#17375e}.cause{padding:12px;background:#fff4e7;border:1px solid #efbf75;border-radius:8px;color:#7c4d00}
        pre{max-height:480px;overflow:auto;padding:12px;background:#202631;color:#edf2f7;white-space:pre-wrap}
    </style>
</head>
<body>
<main>
    <h1>Falha ao carregar o dashboard Faturamento SC</h1>
    <p><strong>Classe:</strong> <code><c:out value="${errorClass}"/></code></p>
    <p><strong>Mensagem:</strong> <c:out value="${errorMessage}"/></p>
    <p class="cause"><strong>Causa raiz:</strong> <c:out value="${rootMessage}"/></p>
    <details><summary>Exibir stack trace</summary><pre><c:out value="${errorStack}"/></pre></details>
</main>
</body>
</html>
