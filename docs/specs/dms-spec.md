# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para que usuários enviem documentos, consultem os documentos associados ao seu identificador e baixem esses arquivos do armazenamento local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos metadados dos documentos do usuário identificado na requisição.
- Download de um documento do usuário pelo identificador do documento.
- Gravação dos arquivos no filesystem local em `backend/storage`, usando Multer com `diskStorage`.
- Armazenamento em memória dos metadados durante a execução do processo.
- Interface web em React para upload, listagem e download, integrada ao backend pelo prefixo `/api` do proxy Vite.
- Endpoint de saúde `GET /health` já presente no seed.

### Fora do escopo

- Autenticação, autorização robusta, cadastro de usuários ou gestão de contas.
- Armazenamento em nuvem, banco de dados, provedores externos ou serviços de upload de terceiros.
- Persistência dos metadados após reinicialização do processo.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Busca avançada, paginação e categorização.
- Restrição de upload por tipo MIME ou extensão nesta fase.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo em uma requisição `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema exige um identificador de usuário não vazio no cabeçalho `X-User-Id` para upload, listagem e download. O valor é removido de espaços nas extremidades. |
| RF-03 | Ao aceitar um upload, o sistema gera um identificador UUID, grava o arquivo com nome interno gerado pelo sistema e registra os metadados do documento em memória. |
| RF-04 | O sistema associa cada documento ao valor de `X-User-Id` recebido no upload. |
| RF-05 | O usuário pode listar os documentos associados ao seu `X-User-Id`; a resposta não expõe caminhos nem nomes internos do filesystem. |
| RF-06 | A listagem é ordenada do upload mais recente para o mais antigo. Em caso de empate, a ordenação por `id` é determinística. |
| RF-07 | O usuário pode baixar um documento pelo `id` se ele existir e pertencer ao mesmo `X-User-Id` da requisição. |
| RF-08 | Documento inexistente e documento pertencente a outro usuário produzem a mesma resposta `404`, sem revelar a existência ou o dono do documento. |
| RF-09 | Uma requisição sem arquivo, com campo de arquivo inesperado ou acima do limite configurado é rejeitada sem criar metadados. |
| RF-10 | Se o registro de metadados falhar após o arquivo ter sido gravado, o arquivo temporário/final é removido para evitar deixar um upload incompleto. |
| RF-11 | O endpoint `GET /health` informa que o processo está ativo, sem expor detalhes internos. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados somente no filesystem local, sob `backend/storage`, por meio de Multer configurado com `diskStorage`. Não usar `memoryStorage` nem armazenamento externo. |
| RNF-02 | O diretório `backend/storage` é criado quando necessário e não deve ser publicado como diretório estático. |
| RNF-03 | O nome original nunca é usado como caminho de destino. O nome interno é gerado pelo sistema para evitar colisões, traversal e sobrescrita de arquivos. |
| RNF-04 | Metadados são mantidos em memória nesta fase. Reiniciar o backend remove o índice de metadados; os arquivos existentes no disco não devem ser considerados acessíveis sem metadados. |
| RNF-05 | O limite padrão por arquivo é 10 MiB (`10485760` bytes), configurável pela variável `MAX_UPLOAD_SIZE_BYTES`. Valores inválidos ou não positivos devem impedir a inicialização ou ser rejeitados como configuração inválida, sem desativar silenciosamente o limite. |
| RNF-06 | A porta HTTP é configurada por `PORT`, com padrão `3000`. A configuração segue o princípio 12-Factor e não contém segredos no código. |
| RNF-07 | As rotas e respostas devem ser consistentes com Express, JavaScript CommonJS no backend e React/Vite no frontend; não introduzir TypeScript nesta fase. |
| RNF-08 | A aplicação não pode confiar em nomes de arquivo fornecidos pelo cliente para compor caminhos ou cabeçalhos sem sanitização. |
| RNF-09 | Erros inesperados são tratados no limite HTTP e não retornam stack traces, caminhos locais ou detalhes internos ao cliente. |
| RNF-10 | O comportamento principal deve ser coberto por testes nativos `node:test`, sem depender de serviços externos. Os testes de upload devem usar arquivos temporários e limpar os dados criados. |

### Limitação de identidade

`X-User-Id` é apenas um identificador recebido do cliente, não uma credencial. Como autenticação está fora do escopo, o isolamento descrito nos requisitos evita acesso acidental entre identificadores, mas não protege contra falsificação do cabeçalho. Uma implantação exposta a usuários não confiáveis exige autenticação e derivação do dono a partir da identidade validada, antes de ser considerada segura.

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | UUID gerado pelo backend e usado nas rotas de download. |
| `originalName` | string | Nome original informado pelo cliente, preservado apenas como metadado e nome sugerido no download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Identificador do usuário recebido no cabeçalho `X-User-Id`. |

### Dados internos de armazenamento

O backend associa os metadados a um nome de arquivo interno aleatório ou baseado em UUID dentro de `backend/storage`. O nome/caminho interno é detalhe de persistência: não é retornado ao cliente nem aceito diretamente em requisições. A estrutura interna pode incluir o nome armazenado e o caminho resolvido, além dos cinco campos públicos acima.

Os metadados são mantidos em uma estrutura em memória indexada por `id`. A implementação não precisa criar uma camada de persistência durável nesta fase.

## 6. Contratos de API

### Convenções

- Os caminhos abaixo são os caminhos HTTP do backend, sem `/api`.
- Durante o desenvolvimento, o frontend chama os mesmos caminhos com prefixo `/api`; o proxy Vite encaminha para `http://localhost:3000` e remove o prefixo antes de enviar a requisição.
- Upload, listagem e download exigem `X-User-Id` com valor não vazio.
- Respostas JSON de erro seguem o formato `{ "error": { "code": "...", "message": "..." } }`.
- Os metadados retornados contêm apenas `id`, `originalName`, `size`, `uploadedAt` e `owner`.

### `POST /upload`

**Entrada**

- Cabeçalho: `X-User-Id: <identificador>`.
- Corpo: `multipart/form-data` com exatamente um arquivo no campo `file`.
- Limite: `MAX_UPLOAD_SIZE_BYTES`, padrão `10485760` bytes.

**Sucesso: `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 12345,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": "usuario-123"
}
```

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Cabeçalho ausente ou vazio. |
| `400` | `FILE_REQUIRED` | Campo `file` ausente. |
| `400` | `INVALID_UPLOAD` | Mais de um arquivo, campo inesperado ou corpo multipart inválido. |
| `413` | `FILE_TOO_LARGE` | Arquivo excede o limite configurado. |
| `500` | `INTERNAL_ERROR` | Falha inesperada ao gravar o arquivo ou registrar metadados. |

### `GET /documents`

**Entrada**

- Cabeçalho: `X-User-Id: <identificador>`.
- Sem parâmetros de consulta nesta fase.

**Sucesso: `200 OK`**

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 12345,
      "uploadedAt": "2026-09-29T12:00:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

Uma lista sem documentos retorna `200 OK` com `documents: []`.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Cabeçalho ausente ou vazio. |
| `500` | `INTERNAL_ERROR` | Falha inesperada ao consultar os metadados. |

### `GET /documents/:id/download`

**Entrada**

- Cabeçalho: `X-User-Id: <identificador>`.
- Parâmetro `id`: UUID do documento.

**Sucesso: `200 OK`**

- Corpo binário do arquivo.
- `Content-Disposition: attachment` com nome de download derivado de `originalName`, devidamente sanitizado e sem permitir injeção de cabeçalhos.
- O caminho físico do arquivo não é revelado.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Cabeçalho ausente ou vazio. |
| `404` | `DOCUMENT_NOT_FOUND` | ID inexistente, documento de outro dono ou arquivo local ausente. |
| `500` | `INTERNAL_ERROR` | Falha inesperada ao ler ou transmitir o arquivo. |

### `GET /health`

**Sucesso: `200 OK`**

```json
{ "status": "ok" }
```

## 7. Decisões arquiteturais

### Backend

O backend usa Express e JavaScript CommonJS, com fluxo de dependência unidirecional:

`routes -> controllers -> services -> repositories`

- **Routes:** registram os caminhos HTTP e conectam middleware e controllers. A configuração de Multer com `diskStorage` é aplicada na borda HTTP para processar o campo `file` e gravá-lo no diretório local.
- **Controllers:** validam os dados HTTP básicos, obtêm o usuário de `X-User-Id`, chamam os services e convertem resultados/erros em status e respostas HTTP. Não contêm regras de negócio nem acesso direto ao repositório.
- **Services:** aplicam regras de negócio, coordenam o registro dos metadados e garantem limpeza do arquivo em caso de falha após a gravação. Não dependem de Express ou de objetos `req`/`res`.
- **Repositories:** mantêm e consultam os metadados em memória e encapsulam a localização/consulta dos arquivos locais necessária ao download. Não conhecem HTTP.

Camadas internas não importam camadas externas. Erros esperados de validação e ausência são mapeados pelo controller; falhas inesperadas seguem para tratamento central no limite HTTP.

### Frontend

- React com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`.
- Comunicação com o backend via `fetch` e prefixo `/api`, conforme o proxy já configurado no Vite.
- Fluxos da interface: selecionar e enviar arquivo, exibir documentos do usuário atual e solicitar download pelo ID.
- A identidade simplificada deve ser consistente entre chamadas durante a sessão; não apresentar `X-User-Id` como mecanismo de autenticação.

### Armazenamento e ciclo de vida

- O destino é exclusivamente o filesystem local em `backend/storage`, usando `multer.diskStorage`.
- Multer gera o nome interno de armazenamento; o nome enviado pelo usuário é mantido separadamente como `originalName`.
- Os metadados permanecem em memória. Após reinicialização, os documentos antigos não aparecem na listagem e não são recuperáveis pela API nesta fase, mesmo que seus arquivos ainda estejam no diretório.
- O diretório de armazenamento não é servido estaticamente. Downloads passam pela rota que verifica o dono e o ID.

## 8. Plano de execução

Este plano orienta uma implementação futura. Ele não faz parte da entrega desta especificação e não autoriza alterações em arquivos de backend ou frontend enquanto a tarefa estiver limitada à criação do documento.

1. **Especificação e configuração:** revisar esta especificação, definir/configurar `PORT` e `MAX_UPLOAD_SIZE_BYTES` e preparar diretório local de armazenamento. Critério: configurações têm padrões documentados e o limite não pode ser desativado por valor inválido.
2. **Persistência local:** implementar o repositório de metadados em memória e a integração de arquivos em `backend/storage`. Critério: nomes internos únicos, metadados públicos sem caminho físico e erros de filesystem tratados.
3. **Upload:** configurar Multer com `diskStorage`, conectar rota/controller/service/repository e limpar arquivo quando não for possível completar o registro. Critério: upload válido responde `201`; entradas ausentes/inválidas e arquivo acima do limite retornam os erros definidos.
4. **Listagem e download:** implementar consultas por dono, ordenação determinística e download com verificação de propriedade e nome de resposta sanitizado. Critério: isolamento entre usuários e resposta `404` indistinguível para ID inexistente ou não pertencente ao solicitante.
5. **Testes do backend:** adicionar testes `node:test` para sucesso, validação, limite, isolamento, download, arquivo ausente e limpeza após falha. Critério: testes não exigem serviços externos e limpam seus arquivos temporários.
6. **Interface React:** implementar os fluxos de upload, listagem e download usando `fetch` sob `/api`. Critério: estados de carregamento, sucesso e erro são apresentados e as chamadas correspondem aos contratos desta especificação.
7. **Integração e verificação:** executar testes do backend, build do frontend e verificar proxy, endpoint de saúde e fluxos ponta a ponta em ambiente local. Critério: os fluxos principais funcionam sem serviços externos e nenhum endpoint expõe caminhos locais.

## 9. Critérios de aceite do produto

- Um arquivo dentro do limite pode ser enviado e retorna metadados com UUID, tamanho, nome original, dono e data ISO UTC.
- O arquivo é gravado localmente via Multer `diskStorage` em `backend/storage`, usando nome interno distinto do nome original.
- Listagem retorna somente documentos do identificador solicitado, em ordem mais recente primeiro.
- Download permite obter somente arquivo associado ao identificador solicitado e nunca revela caminho físico.
- Erros de validação, limite, ausência, acesso por outro dono e falhas internas seguem os contratos definidos.
- Reiniciar o backend limpa os metadados acessíveis pela API, conforme a limitação de armazenamento em memória.
- A implementação mantém dependências na direção `routes -> controllers -> services -> repositories` e não introduz armazenamento externo.