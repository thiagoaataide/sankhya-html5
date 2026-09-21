<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" isErrorPage="true" isELIgnored="false" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="java.io.StringWriter" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%
Throwable apuracaoError = exception;
if (apuracaoError == null) {
    Object servletError = request.getAttribute("javax.servlet.error.exception");
    if (servletError instanceof Throwable) apuracaoError = (Throwable) servletError;
}
Throwable root = apuracaoError;
while (root != null && root.getCause() != null && root.getCause() != root) root = root.getCause();
StringWriter stack = new StringWriter();
String correlationId = "FA-" + System.currentTimeMillis();
if (apuracaoError != null) {
    apuracaoError.printStackTrace(new PrintWriter(stack));
    application.log("[Apuracao Faturas][" + correlationId + "] Falha ao carregar o componente.", apuracaoError);
}
request.setAttribute("errorCorrelation", correlationId);
request.setAttribute("errorClass", apuracaoError == null ? "Erro nao informado" : apuracaoError.getClass().getName());
request.setAttribute("errorMessage", apuracaoError == null || apuracaoError.getMessage() == null ? "Sem mensagem." : apuracaoError.getMessage());
request.setAttribute("rootMessage", root == null || root.getMessage() == null ? "Sem causa raiz disponivel." : root.getMessage());
request.setAttribute("errorStack", stack.toString());
%>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Diagn&oacute;stico &mdash; Apura&ccedil;&atilde;o de Faturas</title>
    <style>
        body { margin: 0; padding: 24px; background: #f4f1ea; color: #263238; font: 14px/1.5 "Segoe UI", Arial, sans-serif; }
        main { max-width: 1000px; margin: auto; padding: 22px; background: #fffdf8; border: 1px solid #d8d2c8; }
        h1 { margin-top: 0; color: #7c2d24; }
        .cause { padding: 12px; background: #fff0ef; border: 1px solid #e5aaa4; color: #7c2d24; }
        .correlation { color: #5b6570; font-size: 12px; }
        pre { max-height: 480px; overflow: auto; padding: 12px; background: #202631; color: #edf2f7; white-space: pre-wrap; }
    </style>
</head>
<body>
<main role="alert" aria-labelledby="error-title">
    <h1 id="error-title">Falha ao carregar a Apura&ccedil;&atilde;o de Faturas</h1>
    <p><strong>Classe:</strong> <code><c:out value="${errorClass}"/></code></p>
    <p><strong>Mensagem:</strong> <c:out value="${errorMessage}"/></p>
    <p class="cause"><strong>Causa raiz:</strong> <c:out value="${rootMessage}"/></p>
    <p class="correlation"><strong>Correlation ID:</strong> <c:out value="${errorCorrelation}"/></p>
    <details>
        <summary>Exibir stack trace</summary>
        <pre><c:out value="${errorStack}"/></pre>
    </details>
</main>
</body>
</html>
