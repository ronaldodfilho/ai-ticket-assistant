# AI Ticket Assistant - Help Desk with AI Ticket Triage

> [Versão em português](README.pt-BR.md)

<p align="center">
  <img src="docs/demonstracao.gif" alt="AI Ticket Assistant demo" width="100%" />
</p>

A help desk system that automatically classifies every ticket by category, priority and responsible department, and assists agents with a summary of the conversation and a suggested reply using Google Gemini.

It has a Java/Spring Boot REST API, a customer portal and an agent console built with React and TypeScript, and it keeps working without an API key, falling back to locally generated classification and text.

---

## Features

* **Automatic triage:** every new ticket is classified by category (Tax, IT, HR, Finance, System, Other), priority and responsible department as soon as it is opened.
* **Priority reasoning:** hovering over the priority shows why it was assigned, quoting the parts of the request that justify the decision.
* **Undefined priority:** messages with no details, such as "good morning" or "I need help", get an Undefined priority. When the customer replies describing the problem, the ticket is reclassified automatically.
* **Customer portal:** open tickets, get a tracking number, see open tickets in the browser and chat with support.
* **Agent console:** queue sorted by priority, with filters by status, priority and category, search and status counters.
* **Summary and suggested reply:** the AI summarizes the ticket history in up to 3 sentences and drafts a reply the agent can review before sending.
* **Status flow:** the agent's first reply moves the ticket to in progress, a customer reply reopens a resolved ticket and closed tickets don't accept new messages.
* **Classification override:** the agent can adjust the category, priority and department suggested by the AI.
* **Accessible and responsive UI:** AA contrast, full keyboard navigation, errors shown next to each field, screen-reader support and a mobile layout where the queue becomes cards instead of a table.
* **Local mode (no API key):** without Gemini configured, classification uses keywords and the summary and suggestion are built from the ticket data. If the AI call fails, the system falls back to local mode automatically.

---

## Priority criteria

The AI and the local mode follow the same criteria, weighing impact, blockage, deadline and security. The word "urgent" written by the customer does not set the priority on its own.

| Priority | When it is assigned |
|---|---|
| **Urgent** | Operations stopped, several people or the whole company affected, security incident (virus, intrusion, data leak) or a blocked tax/finance process with a deadline |
| **High** | One person or team unable to work, with no workaround, or a close deadline |
| **Medium** | A real problem with a workaround, slowness or intermittent failure |
| **Low** | Question, information request, suggestion or improvement, with no immediate impact |
| **Undefined** | The message doesn't describe a problem and the impact can't be assessed |

In the agent queue, undefined tickets appear right after high-priority ones: a single reply asking for details is enough to triage them. If the agent changes the priority manually, the reason records the change.

---

## Project structure

```text
.
├── backend/                          # REST API (Java 21 + Spring Boot 4)
│   ├── src/main/java/com/aiticket/backend/
│   │   ├── config/                   # CORS configuration
│   │   ├── controller/               # Ticket, dashboard and system routes
│   │   ├── domain/                   # JPA entities and enums
│   │   ├── dto/                      # Validated request and response objects
│   │   ├── exception/                # Error handling (Problem Details)
│   │   ├── repository/               # Spring Data JPA repositories
│   │   └── service/                  # Business rules, Gemini and classifiers
│   ├── src/main/resources/
│   │   ├── application.properties            # Default configuration (in-memory H2)
│   │   └── application-postgres.properties   # PostgreSQL profile
│   ├── src/test/                     # Classification and ticket flow tests
│   └── pom.xml
├── frontend/                         # Web interface (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                      # HTTP client and API types
│   │   ├── components/               # Chat, badges, states and reusable fields
│   │   ├── hooks/                    # Auto-refresh and AI status
│   │   ├── layouts/                  # Portal and agent console layouts
│   │   ├── lib/                      # Labels, date formatting and local storage
│   │   └── pages/                    # Customer and agent screens
│   ├── package.json
│   └── vite.config.ts                # Proxies /api to the backend
├── docs/
│   └── demonstracao.gif              # System demo
├── docker-compose.yml                # PostgreSQL outside development mode
├── .env.example                      # Example environment variables
└── README.md
```

---

## Getting started

### 1. Prerequisites

* Java 21
* Node.js 20 or later
* Google Gemini API key (optional), from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Gemini key (optional)

To enable the AI, create a `.env` file in the project root (or copy `.env.example`) and paste the key:

```env
GEMINI_API_KEY=your_key_here
```

The backend reads this file automatically on startup. Without the key, the system runs in local mode. `.env` is in `.gitignore` and is never committed.

### 3. Run the backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`. The API runs at `http://localhost:8080`.

### 4. Run the frontend (React + Vite)

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open in your browser:

* Customer portal: `http://localhost:5173`
* Agent console: `http://localhost:5173/atendimento`

### 5. Tests

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

## Database

By default the backend uses **in-memory H2**, so data is wiped when the application restarts. The H2 console is at `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:aiticket_db`, user `sa`, password `password`).

To use **PostgreSQL**, start the database with Docker and enable the `postgres` profile:

```bash
docker compose up -d
```

```bash
cd backend
SPRING_PROFILES_ACTIVE=postgres ./mvnw spring-boot:run
```

---

## REST API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/tickets` | Opens and classifies a ticket |
| `GET` | `/api/tickets` | Lists tickets, newest first |
| `GET` | `/api/tickets/{id}` | Ticket details |
| `PATCH` | `/api/tickets/{id}/status` | Changes the status |
| `PATCH` | `/api/tickets/{id}/classification` | Corrects category, priority and department |
| `GET` | `/api/tickets/{id}/interactions` | Message history |
| `POST` | `/api/tickets/{id}/interactions` | Sends a message as customer (`USER`) or agent (`ATTENDANT`) |
| `GET` | `/api/tickets/{id}/summary` | History summary |
| `GET` | `/api/tickets/{id}/suggest-response` | Suggested reply for the agent |
| `GET` | `/api/dashboard/stats` | Ticket count by status |
| `GET` | `/api/system/info` | Whether the AI is active or in local mode |

Errors follow the Problem Details format (RFC 9457): `400` for invalid data, `404` for a missing ticket and `409` for operations not allowed in the current status.

---

## Author

Ronaldo Dutra Filho
