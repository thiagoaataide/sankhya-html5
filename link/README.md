# Dashboard PCFI — conferência de pedidos de compra

Componente HTML5 para Sankhya Om 4.35, preparado para banco SQL Server e para os metadados PCFI fornecidos em 15/07/2026.

## Fluxo implementado

1. A primeira visão lista somente pedidos de compra (`TGFCAB.TIPMOV = 'O'`) que possuam itens pendentes (`TGFITE.PENDENTE = 'S'`).
2. Um duplo clique abre a conferência na segunda visão, dentro do mesmo JSP. Os dados permanecem em memória até o salvamento.
3. A configuração ativa é localizada em `AD_PCFICFG` pelo Centro de Resultado e, quando preenchido, pelo Tipo de Operação.
4. Com `QUALPELCONF = 'S'`, o conferente informa quantidade e todos os campos qualitativos de `AD_PCFIITE`.
5. Marcar **Matéria-prima** abre os campos de `AD_PCFILOT`. Todos são obrigatórios e a soma dos lotes deve ser igual à quantidade recebida.
6. Marcar **Patrimônio** abre os campos de `AD_PCFIPAT`. É obrigatório informar um número por unidade recebida.
7. O número da nota fiscal é obrigatório.

## Persistência

O JavaScript expõe `window.saveRecords()` como wrapper do serviço `CRUDServiceProvider.saveRecord`, seguindo o mesmo contrato do componente HTML5 de referência, e salva nesta ordem:

1. `AD_PCFI`, capturando o `NUPCFI` automático retornado;
2. cada `AD_PCFIITE`, capturando sua `SEQUENCIA` automática;
3. `AD_PCFILOT` e `AD_PCFIPAT`, usando `foreignKey` com as chaves do item.

Na Qualidade, **Aprovado** e **Aprovado com ressalva** gravam,
respectivamente, `STATUSQUAL = 'A'` e `STATUSQUAL = 'R'`. Ambos seguem para a
Fiscal com `STATUSPCFI = 'F'` e `STATUSFISCAL = 'P'`. **Negado** grava
`STATUSQUAL = 'N'`, `STATUSPCFI = 'N'` e `STATUSFISCAL = 'C'`, encerrando a
PCFI sem etapa fiscal. Quando executa somente quantidade, o processo segue
para `STATUSPCFI = 'Q'` e qualidade pendente.

## Foto do item

Na conferência de Quantidade, cada item permite capturar uma imagem pela câmera
do dispositivo. A foto é enviada como Anexo do Sistema para `AD_PCFIITE`, com a chave
`NUPCFI_SEQUENCIA_AD_PCFIITE`. A ação agendada Java
`AcoesAgendadas.PCFI.SincronizaImagemPcfiAgendada` lê o arquivo no repositório
de anexos e grava o conteúdo binário no campo `AD_PCFIITE.IMAGEM`.

As chaves automáticas são extraídas de `responseBody.entities.entity`. O serviço é chamado mais de uma vez e não forma uma transação única entre cabeçalho e filhos. Se houver falha após a criação do cabeçalho, consulte o PCFI informado na mensagem antes de repetir o lançamento.

## Filtros

- Empresa: obrigatório e múltiplo;
- Data inicial e final: obrigatórias;
- Fornecedor: opcional.

Pedidos sem configuração ativa em `AD_PCFICFG` não são apresentados.

## Implantação

1. Importe primeiro o `metadata.xml` fornecido e confirme a criação das seis entidades adicionais.
2. Em **Administração > Gadgets**, crie ou edite o gadget.
3. Cole o conteúdo de `tdb_dashboard.xml` na configuração XML.
4. Faça o upload de `pcfi_dashboard.zip` em **Upload Pacote HTML**.
5. Configure o ponto de entrada como `pcfi.jsp`.
6. Limpe o cache com `Ctrl+Shift+R` após substituir o pacote.

## Arquivos do pacote

- `pcfi.jsp`: estrutura das duas visões, containers de dados e identificação do usuário autenticado por `${CODUSU_LOG}`;
- `dados.jsp`: consultas `snk:query` em `MGEDS`;
- `javascript/script.js`: memória, validações e persistência;
- `css/style.css`: apresentação responsiva;
- `erro.jsp`: diagnóstico de falhas JSP/SQL;
- `tdb_dashboard.xml`: parâmetros e definição do componente.

Os recursos usam `${BASE_FOLDER}` nas pastas `css/` e `javascript/`, conforme o padrão de componente HTML5.

## Homologação recomendada

- OC com configuração inexistente ou inativa;
- conferência somente quantitativa;
- qualidade habilitada sem matéria-prima/patrimônio;
- matéria-prima com mais de um lote;
- patrimônio com quantidade inteira maior que um;
- entrega parcial;
- falha simulada ao salvar um filho, verificando a reconciliação do cabeçalho já criado.

### Sincronização assíncrona da imagem

O anexo pode ser criado antes de o arquivo físico estar disponível. A ação
agendada processa somente itens com BLOB nulo, sem bloquear a PCFI quando o
arquivo ainda não existe.

O processamento definitivo é feito pela ação agendada
`AcoesAgendadas.PCFI.SincronizaImagemPcfiAgendada`, em lote de até 50 registros.
O evento Java legado `AtualizaImagemItemPcfi` não precisa ser cadastrado para
este fluxo.
