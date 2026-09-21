<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" isELIgnored="false" errorPage="erro.jsp" %>
<!DOCTYPE html>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Apura&ccedil;&atilde;o de Faturas</title>
    <link rel="stylesheet" href="${BASE_FOLDER}/css/style.css">
    <snk:load/>
</head>
<body>
<snk:load>
    <jsp:include page="dados.jsp"/>
    <script>window.FACILITA_APURACAO_BASE = "${BASE_FOLDER}";</script>
    <script>window.FACILITA_APURACAO_FACADE = { servicePrefix: "facilitatelecom@ApuracaoDashboardSP" };</script>
    <script src="${BASE_FOLDER}/javascript/script.js"></script>
</snk:load>

<main class="shell" id="apuracao-dashboard">
    <header class="hero">
        <div>
            <p class="eyebrow">FACILITA &middot; FATURAMENTO</p>
            <h1>Apura&ccedil;&atilde;o de Faturas</h1>
            <p class="lede">Consulte, revise e acompanhe o estado das contas antes do faturamento.</p>
        </div>
        <div class="hero__actions" aria-label="A&ccedil;&otilde;es da lista">
            <button type="button" id="btn-refresh" class="btn btn--quiet">Atualizar</button>
            <button type="button" id="btn-export" class="btn btn--accent">Exportar CSV</button>
        </div>
    </header>

    <section class="filter-bar" aria-labelledby="filters-title">
        <div class="filter-bar__heading">
            <span class="eyebrow" id="filters-title">VIS&Atilde;O DE TRABALHO</span>
            <span id="filter-summary" class="muted">Carregando apura&ccedil;&otilde;es...</span>
        </div>
        <label class="filter-control filter-control--search">
            <span>Pesquisar</span>
            <input type="search" id="filter-text" placeholder="N&uacute;mero, conta, contrato..." autocomplete="off">
        </label>
        <label class="filter-control">
            <span>Campo</span>
            <select id="filter-field">
                <option value="T">Todos os campos</option>
                <option value="NUAPURACAO">Sequ&ecirc;ncia</option>
                <option value="CODCONTA">Conta</option>
                <option value="NUMCONTRATO">Contrato</option>
                <option value="NUNOTA">Faturamento</option>
                <option value="VALOR">Valor</option>
                <option value="DTVENC">Vencimento</option>
            </select>
        </label>
        <span class="filter-chip" id="filter-reference">M&ecirc;s corrente</span>
    </section>

    <section class="status-strip" aria-live="polite">
        <div><span class="status-strip__label">Registros</span><strong id="row-count">0</strong></div>
        <div><span class="status-strip__label">Pendentes</span><strong id="pending-count">0</strong></div>
        <div><span class="status-strip__label">Com anexo</span><strong id="attachment-count">0</strong></div>
        <div class="status-strip__message" id="state-message">Preparando consulta...</div>
    </section>

    <section class="panel" aria-labelledby="grid-title">
        <div class="panel__head">
            <div>
                <span class="eyebrow">LISTA PRINCIPAL</span>
                <h2 id="grid-title">Contas em apura&ccedil;&atilde;o</h2>
            </div>
            <div class="panel__tools">
                <details class="column-picker" id="column-picker">
                    <summary>Colunas</summary>
                    <div class="column-picker__menu" aria-label="Escolher colunas vis&iacute;veis">
                        <label><input type="checkbox" data-column="0" checked> Sequ&ecirc;ncia</label>
                        <label><input type="checkbox" data-column="1" checked> Conta</label>
                        <label><input type="checkbox" data-column="2" checked> Contrato</label>
                        <label><input type="checkbox" data-column="3" checked> Refer&ecirc;ncia</label>
                        <label><input type="checkbox" data-column="4" checked> Vencimento</label>
                        <label><input type="checkbox" data-column="5" checked> Valor</label>
                        <label><input type="checkbox" data-column="6" checked> Estado</label>
                        <label><input type="checkbox" data-column="7" checked> Anexo</label>
                    </div>
                </details>
                <span class="muted" id="grid-meta">Uma linha por apura&ccedil;&atilde;o</span>
            </div>
        </div>
        <div class="table-wrap" tabindex="0">
            <table id="grid-apuracoes">
                <thead>
                <tr>
                    <th scope="col" data-column="0"><button type="button" class="sort-trigger" data-sort="nuapuracao">Sequ&ecirc;ncia <span aria-hidden="true"></span></button></th>
                    <th scope="col" data-column="1"><button type="button" class="sort-trigger" data-sort="codconta">Conta <span aria-hidden="true"></span></button></th>
                    <th scope="col" data-column="2"><button type="button" class="sort-trigger" data-sort="numcontrato">Contrato <span aria-hidden="true"></span></button></th>
                    <th scope="col" data-column="3"><button type="button" class="sort-trigger" data-sort="referencia">Refer&ecirc;ncia <span aria-hidden="true"></span></button></th>
                    <th scope="col" data-column="4"><button type="button" class="sort-trigger" data-sort="dtvenc">Vencimento <span aria-hidden="true"></span></button></th>
                    <th scope="col" class="num" data-column="5"><button type="button" class="sort-trigger" data-sort="valor">Valor <span aria-hidden="true"></span></button></th>
                    <th scope="col" data-column="6">Estado</th>
                    <th scope="col" data-column="7">Anexo</th>
                </tr>
                </thead>
                <tbody id="grid-apuracoes-body"></tbody>
            </table>
        </div>
        <div id="grid-empty" class="empty-state" hidden>
            <strong>Nenhuma apura&ccedil;&atilde;o encontrada</strong>
            <span>Revise o m&ecirc;s ou os filtros selecionados.</span>
        </div>
        <div id="grid-loading" class="loading-state">Carregando dados...</div>
        <div id="grid-error" class="error-state" role="alert" hidden>
            <strong>N&atilde;o foi poss&iacute;vel carregar as apura&ccedil;&otilde;es.</strong>
            <span id="grid-error-detail">Tente atualizar a consulta.</span>
        </div>
    </section>

    <section id="detail-empty" class="detail-empty" aria-live="polite">
        <span class="eyebrow">DETALHE</span>
        <p>Selecione uma apura&ccedil;&atilde;o para consultar seus dados e a&ccedil;&otilde;es.</p>
    </section>

    <section id="detail-panel" class="detail-panel" hidden aria-labelledby="detail-title">
        <div class="detail-panel__head">
            <div>
                <span class="eyebrow">APURA&Ccedil;&Atilde;O SELECIONADA</span>
                <h2 id="detail-title">Detalhes</h2>
            </div>
            <span id="detail-state" class="badge badge--muted">Aguardando</span>
        </div>
        <div id="detail-body" class="detail-grid"></div>
        <form id="detail-edit" class="detail-edit" novalidate>
            <fieldset>
                <legend>Dados edit&aacute;veis</legend>
                <div class="detail-edit__fields">
                    <label class="filter-control" for="edit-dtvenc">
                        <span>Vencimento</span>
                        <input type="date" id="edit-dtvenc" name="dtvenc" autocomplete="off">
                    </label>
                    <label class="filter-control" for="edit-valor">
                        <span>Valor</span>
                        <input type="number" id="edit-valor" name="valor" min="0" step="0.01" inputmode="decimal" autocomplete="off">
                    </label>
                    <button type="submit" class="btn btn--quiet" id="btn-save-edit" disabled>Salvar altera&ccedil;&otilde;es</button>
                </div>
            </fieldset>
        </form>
        <fieldset class="attachment-editor">
            <legend>Anexo</legend>
            <div class="attachment-editor__fields">
                <label class="filter-control" for="attachment-file">
                    <span>Arquivo</span>
                    <input type="file" id="attachment-file" name="attachment" autocomplete="off">
                </label>
                <label class="filter-control" for="attachment-type">
                    <span>Tipo</span>
                    <select id="attachment-type" name="attachmentType" autocomplete="off">
                        <option value="">Selecione</option>
                        <option value="Original">Original</option>
                        <option value="2ª via">2&ordf; via</option>
                        <option value="Ajustada">Ajustada</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Nota Fiscal">Nota Fiscal</option>
                        <option value="Resumida">Resumida</option>
                    </select>
                </label>
                <button type="button" class="btn btn--quiet" id="btn-upload-attachment" disabled>Enviar anexo</button>
            </div>
        </fieldset>
        <div class="detail-actions" aria-label="A&ccedil;&otilde;es da apura&ccedil;&atilde;o">
            <button type="button" class="btn btn--quiet" id="btn-open-task" disabled>Abrir tarefa</button>
            <button type="button" class="btn btn--quiet" id="btn-view-attachment" disabled>Ver anexo</button>
            <button type="button" class="btn btn--accent" id="btn-confirm" disabled>Confirmar</button>
        </div>
        <div id="detail-message" class="inline-message" role="status" aria-live="polite" hidden></div>
    </section>
</main>
</body>
</html>
