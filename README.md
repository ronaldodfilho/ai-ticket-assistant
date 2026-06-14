# AI Ticket Assistant - Help Desk com Triagem Inteligente de Chamados

<p align="center">
  <img src="docs/demonstracao.gif" alt="Demonstração AI Ticket Assistant" width="100%" />
</p>

Sistema de suporte (Help Desk) que classifica automaticamente cada chamado em categoria, prioridade e setor responsável, e auxilia o atendente com resumo do histórico e sugestão de resposta usando a IA do Google Gemini.

Conta com API REST em Java com Spring Boot, portal do cliente e central de atendimento em React com TypeScript, e funciona mesmo sem chave de API, com classificação e textos gerados localmente.

---

## Recursos e Funcionalidades

* **Triagem Automática:** Cada chamado aberto é classificado em categoria (Fiscal, TI, RH, Financeiro, Sistema, Outros), prioridade (Baixa a Urgente) e setor responsável no momento da abertura.
* **Portal do Cliente:** Abertura de chamados, protocolo para acompanhamento, lista de chamados abertos no navegador e conversa com o suporte.
* **Central de Atendimento:** Fila ordenada por prioridade, com filtros por status, prioridade e categoria, busca e indicadores por status.
* **Resumo e Sugestão de Resposta:** A IA resume o histórico do chamado em até 3 frases e escreve uma sugestão de resposta que o atendente pode revisar antes de enviar.
* **Fluxo de Status:** A primeira resposta do atendente coloca o chamado em andamento, a resposta do cliente reabre um chamado resolvido e chamados fechados não aceitam novas mensagens.
* **Correção da Classificação:** O atendente pode ajustar categoria, prioridade e setor sugeridos pela IA.
* **Modo Local (sem chave de API):** Sem o Gemini configurado, a classificação é feita por palavras-chave e o resumo e a sugestão são montados a partir dos dados do chamado. Se a IA falhar, o sistema usa o modo local automaticamente.

---

## Estrutura do projeto

```text
.
├── backend/                          # API REST (Java 21 + Spring Boot 4)
│   ├── src/main/java/com/aiticket/backend/
│   │   ├── config/                   # Configuração de CORS
│   │   ├── controller/               # Rotas de chamados, dashboard e sistema
│   │   ├── domain/                   # Entidades JPA e enums
│   │   ├── dto/                      # Objetos de entrada e saída com validação
│   │   ├── exception/                # Tratamento de erros (Problem Details)
│   │   ├── repository/               # Repositórios Spring Data JPA
│   │   └── service/                  # Regras de negócio, Gemini e classificadores
│   ├── src/main/resources/
│   │   ├── application.properties            # Configuração padrão (H2 em memória)
│   │   └── application-postgres.properties   # Perfil para PostgreSQL
│   ├── src/test/                     # Testes de classificação e do fluxo de chamados
│   └── pom.xml
├── frontend/                         # Interface web (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                      # Cliente HTTP e tipos da API
│   │   ├── components/               # Conversa, badges, estados e campos reutilizáveis
│   │   ├── hooks/                    # Atualização automática e status da IA
│   │   ├── layouts/                  # Layout do portal e da central de atendimento
│   │   ├── lib/                      # Rótulos, formatação de datas e armazenamento local
│   │   └── pages/                    # Telas do cliente e do atendente
│   ├── package.json
│   └── vite.config.ts                # Proxy de /api para o backend
├── docs/
│   └── demonstracao.gif              # Demonstração do sistema
├── docker-compose.yml                # PostgreSQL para uso fora do modo de desenvolvimento
├── .env.example                      # Exemplo de variáveis de ambiente
└── README.md
```

---

## Como executar

### 1. Pré-requisitos

* Java 21
* Node.js 20 ou superior
* Chave do Google Gemini (opcional), obtida no [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Chave do Gemini (Opcional)

Para ativar a IA, crie o arquivo `.env` na raiz do projeto (ou copie o `.env.example`) e cole a chave:

```env
GEMINI_API_KEY=sua_chave_aqui
```

O backend lê esse arquivo automaticamente ao iniciar. Sem a chave, o sistema roda no modo local. O `.env` está no `.gitignore` e não é enviado ao repositório.

### 3. Execução do Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

No Windows, use `mvnw.cmd spring-boot:run`. A API fica disponível em `http://localhost:8080`.

### 4. Execução do Frontend (React + Vite)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse no navegador:

* Portal do cliente: `http://localhost:5173`
* Central de atendimento: `http://localhost:5173/atendimento`

### 5. Testes

```bash
cd backend
./mvnw test
```

```bash
cd frontend
npm run lint
npm run build
```

---

## Banco de Dados

Por padrão o backend usa **H2 em memória**, e os dados são apagados quando a aplicação reinicia. O console do H2 fica em `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:aiticket_db`, usuário `sa`, senha `password`).

Para usar **PostgreSQL**, suba o banco com Docker e ative o perfil `postgres`:

```bash
docker compose up -d
```

```bash
cd backend
SPRING_PROFILES_ACTIVE=postgres ./mvnw spring-boot:run
```

---

## API REST

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/tickets` | Abre e classifica um chamado |
| `GET` | `/api/tickets` | Lista os chamados, do mais recente ao mais antigo |
| `GET` | `/api/tickets/{id}` | Detalhes de um chamado |
| `PATCH` | `/api/tickets/{id}/status` | Altera o status |
| `PATCH` | `/api/tickets/{id}/classification` | Corrige categoria, prioridade e setor |
| `GET` | `/api/tickets/{id}/interactions` | Histórico de mensagens |
| `POST` | `/api/tickets/{id}/interactions` | Envia mensagem como cliente (`USER`) ou atendente (`ATTENDANT`) |
| `GET` | `/api/tickets/{id}/summary` | Resumo do histórico |
| `GET` | `/api/tickets/{id}/suggest-response` | Sugestão de resposta para o atendente |
| `GET` | `/api/dashboard/stats` | Quantidade de chamados por status |
| `GET` | `/api/system/info` | Indica se a IA está ativa ou em modo local |

Os erros seguem o formato Problem Details (RFC 9457): `400` para dados inválidos, `404` para chamado inexistente e `409` para operações não permitidas no status atual.

---

## Autor

Ronaldo Dutra Filho
