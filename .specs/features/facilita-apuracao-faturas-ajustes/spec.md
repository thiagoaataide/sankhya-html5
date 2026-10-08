# Facilita — Apuração de Faturas (ajustes pós-entrega)

**Status:** em execução  
**Feature pai:** [facilita-apuracao-faturas](../facilita-apuracao-faturas/spec.md)  
**Baseline:** commit `0ef48f5` — *alterações pré-apresentação do dashboard de Apuração de Faturas da Facilita*  
**Gadget:** `facilita/apuracao-faturas/`  
**Contrato operacional:** [memory.md](../facilita-apuracao-faturas/memory.md)

## Problema

Após a apresentação e o uso inicial do gadget HTML5, surgem correções e
refinamentos pontuais (UX, comportamento, mensagens, consulta ou integração com
botões de ação 77/78/79). Estes itens não reabrem o escopo da feature original;
são entregas incrementais com rastreio próprio.

## Objetivos

- [ ] Registrar cada pedido de ajuste como task numerada em `tasks.md`.
- [ ] Implementar um ajuste por vez, conforme o solicitante enviar.
- [ ] Manter paridade com o legado onde o ajuste exigir equivalência funcional.
- [ ] Validar no Sankhya Om quando o ajuste alterar comportamento visível ou transacional.

## Fora de escopo

| Item | Motivo |
| --- | --- |
| Nova fachada `ApuracaoDashboardSP` ou retomada do add-on Studio | Caminho vigente: botões de ação em `GET_FACILITA` (`memory.md`). |
| Mudança de modelo de dados ou regras de faturamento | Só UI/consulta/integração já exposta. |
| Tela `Autorização de Faturas` | Outro resource / levantamento próprio. |

## Referências rápidas

| Peça | Onde |
| --- | --- |
| Lista (leitura) | `facilita/apuracao-faturas/dados.jsp` |
| Detalhe (leitura) | `facilita/apuracao-faturas/detalhe_payload.jsp` |
| UI e ações | `tdb_partida.jsp`, `javascript/script.js`, `css/style.css` |
| Botão 77 | `Acoes.apuracao.AtualizarValorVencimento` |
| Botão 78 | `Acoes.apuracao.ObterTarefaPendente` |
| Botão 79 | `Acoes.apuracao.ConfirmarApuracao` |

## Critério de conclusão da feature de ajustes

Encerrada quando o solicitante declarar que o backlog em `tasks.md` está
concluído ou quando não houver tasks abertas; opcionalmente empacotar novo ZIP
do gadget (mesmo roteiro da T16 da feature pai).
