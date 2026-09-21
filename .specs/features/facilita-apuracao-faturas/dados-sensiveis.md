# Matriz de dados sensíveis — Apuração de Faturas

**Estado:** proposta conservadora; aprovação do responsável do cliente pendente (T3).  
**Regra de segurança:** ausência de aprovação mantém o campo fora do payload e da interface.

| Campo ou dado | Origem observada | Exposição padrão | Regra por perfil | Evidência/decisão |
| --- | --- | --- | --- | --- |
| `NUAPURACAO`, `CODCONTA`, `NUMCONTRATO`, `NUNOTA`, sequência | `BH_FACAPU` | Exibir | Usuário com acesso à apuração | Necessário para operação; validar autorização no Om |
| `REFERENCIA`, `REFERENCIAADIADA`, `DTVENC`, `VALOR`, `VALORREF` | `BH_FACAPU` | Exibir | Usuário autorizado a consultar | Necessário para consulta e edição |
| Estado (`CONFIRMADO`, auditoria, faturamento, anexo) | `BH_FACAPU`/`TSIANX` | Exibir como rótulo | Respeitar permissão da apuração | Não expor flags internas desnecessárias |
| `IDINSTPRN`/identificador da tarefa | `BH_FACAPU`/workflow | Não exibir cru | Usar somente para abrir tarefa autorizada | Retornar apenas pelo contrato da fachada |
| `OPERADORA`, `CLIENTE`, `CODVEND` | `BH_FACAPU` | Ocultar | Exibir somente se o perfil operacional for aprovado | Podem identificar pessoas/terceiros |
| Login, CPF/CNPJ, e-mail, linha gestora | Tela legada/detalhes relacionados | Excluir | Nunca incluir senha; demais campos exigem aprovação explícita | A tela legada expõe dados que não são necessários ao MVP |
| Senha, token, sessão e stack trace | Tela/infraestrutura | Excluir sempre | Proibido | Nunca retornar no HTML, JSON ou mensagem de erro |
| Nome, MIME e conteúdo do anexo | `TSIANX`/repositório | Exibir somente metadados mínimos | Download/visualização exige autorização | Validar contrato, antivírus e auditoria no T13 |

## Aprovação necessária

- [ ] Responsável do cliente confirma os campos exibidos para o perfil de faturamento.
- [ ] Responsável do cliente confirma se `OPERADORA`, `CLIENTE` e `CODVEND` são necessários.
- [ ] Segurança confirma a regra de anexos e visualização.
- [ ] A fachada implementa a mesma whitelist no servidor; ocultar no JavaScript não é controle de acesso.

