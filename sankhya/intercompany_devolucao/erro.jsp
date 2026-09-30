<%@ page isErrorPage="true" language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Erro — Diagnóstico Intercompany</title>
</head>
<body>
    <h1>Erro ao carregar o dashboard</h1>
    <pre><%= exception != null ? exception.getMessage() : "Erro desconhecido" %></pre>
</body>
</html>
