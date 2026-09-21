<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
         pageEncoding="ISO-8859-1" isErrorPage="true" %>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="ISO-8859-1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Apura&ccedil;&atilde;o de Faturas &mdash; Erro</title>
    <style>
        :root { color-scheme: light; font-family: Arial, sans-serif; }
        body { margin: 0; background: #f4f1ea; color: #263238; }
        main { max-width: 38rem; margin: 12vh auto; padding: 2rem; background: #fffdf8; border: 1px solid #d8d2c8; }
        h1 { margin-top: 0; font-size: 1.4rem; }
        p { line-height: 1.5; }
        .hint { color: #5b6570; font-size: .92rem; }
        button { border: 0; padding: .7rem 1rem; background: #1c6b5a; color: #fff; cursor: pointer; }
        button:focus-visible { outline: 3px solid #d8833f; outline-offset: 2px; }
    </style>
</head>
<body>
<main role="alert" aria-labelledby="error-title">
    <h1 id="error-title">N&atilde;o foi poss&iacute;vel abrir a Apura&ccedil;&atilde;o de Faturas</h1>
    <p>Ocorreu uma falha ao preparar esta consulta. Nenhum dado parcial deve ser considerado atualizado.</p>
    <p class="hint">Registre o hor&aacute;rio e a a&ccedil;&atilde;o realizada ao solicitar suporte.</p>
    <button type="button" onclick="window.history.back()">Voltar</button>
</main>
</body>
</html>
