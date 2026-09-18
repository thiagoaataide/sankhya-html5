<%@ page isErrorPage="true" language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1" %>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="ISO-8859-1">
    <title>Erro &mdash; Diagn&oacute;stico Intercompany</title>
</head>
<body>
    <h1>Erro ao carregar o dashboard</h1>
    <pre><%= exception != null ? exception.getMessage() : "Erro desconhecido" %></pre>
</body>
</html>
