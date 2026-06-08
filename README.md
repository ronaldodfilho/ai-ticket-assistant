# 🤖 AI Ticket Assistant

Sistema de Help Desk com triagem inteligente de chamados. Cada chamado aberto é classificado automaticamente em **categoria**, **prioridade** e **setor responsável**, e o atendente conta com **resumo do histórico** e **sugestão de resposta** gerados por IA (Google Gemini).

O projeto funciona **com ou sem chave de API**: sem a chave, a classificação é feita por palavras-chave e o resumo e a sugestão usam modelos locais. Assim dá para rodar e testar tudo sem configurar nada.

---

## ✨ Funcionalidades

| Tela | O que faz |
|---|---|
| **Portal do Cliente** (`/`) | Abertura de chamados. Ao enviar, mostra a classificação recebida e o protocolo, com link para acompanhar o chamado. |
| **Dashboard** (`/dashboard`) | Métricas (total, abertos, em andamento, resolvidos), lista dos chamados mais recentes, busca por título ou solicitante e filtro por status. |
| **Detalhe do Chamado** (`/tickets/:id`) | Conversa entre cliente e suporte, alteração de status, resumo do histórico e sugestão de resposta. |

**Regras de negócio**
- Chamados novos começam como `ABERTO`.
- A primeira resposta de um atendente move o chamado para `EM_ANDAMENTO`.
- O status pode ser alterado manualmente para `ABERTO`, `EM_ANDAMENTO`, `RESOLVIDO` ou `FECHADO`.

**Classificação**
- Categorias: `FISCAL`, `TI`, `RH`, `FINANCEIRO`, `SISTEMA`, `OUTROS`
- Prioridades: `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`
- Setores: `SUPORTE_N1`, `SUPORTE_ERP`, `INFRAESTRUTURA`, `RH`, `FINANCEIRO`

Com a chave do Gemini configurada, a IA faz a classificação. Se a resposta da IA vier fora do formato, ou se a chamada falhar, o sistema usa a classificação por palavras-chave automaticamente.

---

## 🚀 Tecnologias

**Backend**: Java 21, Spring Boot 4, Spring Data JPA, Bean Validation, Lombok, H2 (dev) / PostgreSQL, Google Gemini API (`gemini-2.5-flash`)

**Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Axios, React Router, Lucide React, Framer Motion, date-fns

---

## ⚙️ Como executar

### Pré-requisitos
- Java 21
- Node.js 20+
- (Opcional) chave do Google Gemini, obtida no [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend
```

```bash
./mvnw spring-boot:run
```

No Windows, use `.\mvnw.cmd spring-boot:run`. A API sobe em `http://localhost:8080`.

Para ativar a IA, defina a variável de ambiente antes de iniciar:

```bash
export GEMINI_API_KEY=sua_chave_aqui
```

### 2. Frontend

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

Acesse `http://localhost:5173`. Em desenvolvimento, o Vite encaminha as chamadas de `/api` para o backend, então não é preciso configurar CORS nem URL da API.

### Testes

```bash
cd backend && ./mvnw test
```

```bash
cd frontend && npm run lint && npm run build
```

---

## 🔧 Configuração

### Backend (variáveis de ambiente)

| Variável | Padrão | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | *(vazio)* | Chave do Gemini. Sem ela, o sistema usa o modo local. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo do Gemini utilizado. |
| `PORT` | `8080` | Porta HTTP da API. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:*,http://127.0.0.1:*` | Origens permitidas, separadas por vírgula. |

### Frontend

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | URL da API usada pelo build de produção. |
| `BACKEND_URL` | `http://localhost:8080` | Destino do proxy `/api` no servidor de desenvolvimento. |

### Banco de dados

Por padrão o backend usa **H2 em memória**: os dados são apagados ao reiniciar. O console fica em `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:aiticket_db`, usuário `sa`, senha `password`).

Para usar **PostgreSQL**, suba o banco com o `docker-compose.yml` da raiz:

```bash
docker compose up -d
```

Depois inicie o backend apontando para ele:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/aiticket_db \
SPRING_DATASOURCE_USERNAME=aiticket \
SPRING_DATASOURCE_PASSWORD=password \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect \
./mvnw spring-boot:run
```

---

## 📡 API

Base: `http://localhost:8080/api`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/tickets` | Cria e classifica um chamado. Corpo: `{ "title", "description", "userName" }` |
| `GET` | `/tickets` | Lista os chamados (mais recentes primeiro) |
| `GET` | `/tickets/{id}` | Detalhes de um chamado |
| `PATCH` | `/tickets/{id}/status` | Altera o status. Corpo: `{ "status": "RESOLVIDO" }` |
| `GET` | `/tickets/{id}/interactions` | Histórico de mensagens |
| `POST` | `/tickets/{id}/interactions` | Adiciona mensagem. Corpo: `{ "message", "author": "USER" \| "ATTENDANT", "authorName" }` |
| `GET` | `/tickets/{id}/summary` | Resumo do histórico |
| `GET` | `/tickets/{id}/suggest-response` | Sugestão de resposta para o atendente |
| `GET` | `/dashboard/stats` | Contagem de chamados por status |

Os erros seguem o formato [Problem Details (RFC 9457)](https://www.rfc-editor.org/rfc/rfc9457): `404` para chamado inexistente e `400` para dados inválidos.

Exemplo:

```bash
curl -X POST http://localhost:8080/api/tickets \
  -H 'Content-Type: application/json' \
  -d '{"title":"Erro ao emitir NF-e","description":"A SEFAZ rejeita a nota, faturamento parado","userName":"Maria"}'
```

---

## 📁 Estrutura

```
backend/
  src/main/java/com/aiticket/backend/
    config/       CORS
    controller/   Endpoints REST
    domain/       Entidades JPA e enums
    dto/          Objetos de entrada e saída
    exception/    Tratamento de erros
    repository/   Repositórios Spring Data
    service/      Regras de negócio, integração com o Gemini e classificadores
frontend/
  src/
    api/          Cliente HTTP
    lib/          Rótulos e cores dos enums
    pages/        Portal, Dashboard e Detalhe do Chamado
    store/        Estado global (Zustand)
```
