---
description: Implementa a seleção e o envio de arquivos no frontend do DMS.
name: selecionar-arquivos
argument-hint: comportamento desejado (ex. aceitar PDF e DOCX até 10 MB)
agent: agent
---

# Seleção de arquivos do DMS

Implemente ou ajuste o fluxo de seleção de arquivos do frontend do Document
Management System para o comportamento `${input:comportamento:descreva o comportamento desejado}`.

Considere o componente existente em `frontend/src/components/UploadComponent.jsx`
e o cliente de API em `frontend/src/services/documentsApi.js`.

Requisitos:

- Use componentes funcionais e React Hooks.
- Permita selecionar arquivo pelo input nativo e, quando solicitado, por
  arrastar e soltar.
- Exiba o nome e o tamanho do arquivo selecionado antes do envio.
- Valide no frontend apenas regras de experiência do usuário, como ausência de
  arquivo, quantidade de arquivos, tamanho máximo e tipos aceitos quando
  definidos pelo comportamento solicitado.
- Mantenha o campo multipart com o nome `file`, conforme o contrato do backend.
- Envie os dados pelo cliente existente, usando `fetch` com o prefixo `/api`;
  não faça chamadas HTTP diretamente no componente visual.
- Mostre estados de seleção, envio, sucesso e erro sem perder o arquivo
  selecionado antes de uma confirmação de envio bem-sucedida.
- Desabilite controles durante o envio e mantenha o layout utilizável em telas
  pequenas.
- Não implemente armazenamento de arquivos, acesso ao filesystem ou regras de
  backend no frontend.
- Preserve a organização em `components/`, `pages/` e `services/` e evite
  duplicar lógica de requisição ou validação.
- Atualize testes ou adicione testes quando houver infraestrutura existente para
  o comportamento alterado.
- Ao concluir, valide com o build do frontend e descreva os arquivos alterados
  e as validações executadas.