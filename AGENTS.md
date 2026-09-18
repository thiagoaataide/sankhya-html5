# Instruções do projeto

## Dashboards e interfaces Sankhya

Ao criar ou alterar uma interface de dashboard HTML5 para o Sankhya:

1. Consulte e siga a skill `sankhya-dashboard-html5` (e as demais skills
   Sankhya relevantes ao escopo).
2. Use `frontend-design` durante a concepção e a implementação da UI.
   Defina propósito, público, hierarquia visual, direção estética, paleta,
   tipografia, espaçamento, responsividade e estados de interação antes de
   consolidar o código.
3. Produza uma interface funcional, distinta e coerente com o contexto
   operacional do Sankhya. Evite layouts genéricos, excesso de cards,
   gradientes decorativos, ícones sem função, sombras ou bordas usadas apenas
   como ornamentação e outros padrões visuais de aparência automática.
4. Preserve as restrições e integrações do Sankhya: JSP, `snk:query`, APIs
   nativas, parâmetros, drill-down, filtros e elementos da moldura do ERP.
   Não remova elementos nativos sem confirmar a intenção do usuário e sem
   aplicar a estratégia prevista pela skill Sankhya.
5. Inclua estados claros de carregamento, vazio, erro, sucesso e ausência de
   permissão quando forem relevantes. Use HTML semântico, labels associados,
   foco visível, navegação por teclado e mensagens acessíveis.

## Revisão obrigatória da UI

Depois de implementar ou alterar a interface, aplique a skill
`web-design-guidelines` aos arquivos JSP, CSS e JavaScript envolvidos:

1. Leia as regras em `web-design-guidelines/references/guideline.md`.
2. Revise acessibilidade, foco e teclado, formulários, animações e redução de
   movimento, tipografia, overflow, estados vazios, imagens, responsividade,
   navegação, toque, temas e segurança de interação.
3. Corrija os achados aplicáveis antes de considerar a entrega concluída.
4. Faça uma nova verificação após as correções e registre os achados restantes
   no formato `arquivo:linha`, com uma descrição curta e objetiva.

## Critério de conclusão

Uma UI Sankhya só está pronta quando atende às regras funcionais da skill
Sankhya, foi concebida e refinada com `frontend-design`, passou pela revisão
de `web-design-guidelines` e teve os arquivos JavaScript validados com
`node --check` quando aplicável.
