# Sincronização da imagem do item PCFI

## Objetivo

Garantir que a foto enviada como Anexo do Sistema seja copiada para o campo
`AD_PCFIITE.IMAGEM` sem impedir a persistência da PCFI quando o arquivo físico
ainda estiver sendo materializado no repositório.

## Requisitos

- **IMG-001 — Persistência não bloqueante:** o evento de `AnexoSistema` não deve
  lançar erro quando `CHAVEARQUIVO` ou o arquivo físico ainda não estiverem
  disponíveis.
- **IMG-002 — Reprocessamento padrão:** após `AnexoSistemaSP.salvar` retornar,
  o HTML5 deve atualizar o próprio registro de `AnexoSistema` usando o CRUD
  padrão, disparando novamente o `Após Alterar`.
- **IMG-003 — Cópia idempotente:** quando o arquivo estiver disponível, o evento
  deve localizar o item por `NUPCFI` e `SEQUENCIA` e atualizar apenas
  `AD_PCFIITE.IMAGEM`.
- **IMG-004 — Sincronização de artefatos:** o fluxo e a regra Java documentados
  no componente `link` devem permanecer alinhados com o projeto do cliente em
  `C:\proj\GET_LINK`.

## Critérios de aceite

1. A ausência temporária do arquivo não causa erro no salvamento da PCFI.
2. O JavaScript dispara uma atualização de `AnexoSistema` após o upload.
3. Um novo processamento com arquivo disponível preenche o BLOB do item.
4. O evento continua usando JAPE direto e não cria um Service Provider novo.
