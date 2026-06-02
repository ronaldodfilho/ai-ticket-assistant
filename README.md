# 🤖 AI Ticket Assistant

Um sistema de suporte inteligente (Help Desk) que utiliza a Inteligência Artificial do Google Gemini para triagem, classificação automática de chamados, resumo de histórico e sugestão de respostas para os atendentes.

## 🚀 Tecnologias

Este projeto é dividido em duas partes principais: um backend robusto construído com Java e um frontend moderno feito com React.

### Backend
* **Java 21**
* **Spring Boot 3**
* **Spring Data JPA & Hibernate**
* **Banco de Dados:** H2 Database (em memória para dev) / PostgreSQL (produção via Docker)
* **Integração de IA:** Google Gemini API (modelo `gemini-1.5-flash`)
* **Lombok & Validation**

### Frontend
* **React 19**
* **TypeScript**
* **Vite**
* **Tailwind CSS v4** (Estilização premium, com temas customizados)
* **Zustand** (Gerenciamento de estado leve e rápido)
* **Axios** (Integração com API)
* **Lucide React & Framer Motion** (Ícones e Animações)

## ✨ Funcionalidades

1. **Abertura de Chamados (Portal do Cliente):** Os usuários podem relatar problemas. O sistema automaticamente utiliza a IA para classificar a **Categoria**, a **Prioridade** e o **Setor** responsável pelo ticket baseado na descrição.
2. **Dashboard do Atendente:** Visão geral de métricas (Total de chamados, abertos, em andamento, resolvidos) e uma tabela com os chamados recentes.
3. **Detalhes do Chamado & Chat:** Visualização de toda a conversa entre cliente e suporte.
4. **Resumo Inteligente:** A IA do Gemini resume o histórico completo de interações em até 3 frases para economizar tempo do atendente.
5. **Sugestão de Resposta:** A IA analisa todo o contexto do ticket e escreve uma sugestão profissional de resposta para o atendente enviar ao cliente.

## ⚙️ Como executar o projeto localmente

### Pré-requisitos
* Java 21 instalado
* Node.js v18+ instalado
* Chave de API do Google Gemini (pegue a sua no [Google AI Studio](https://aistudio.google.com/app/apikey))

### Configuração da API Key
Abra o arquivo `backend/src/main/resources/application.properties` e adicione sua chave de API válida (iniciada com `AIza...`):
```properties
gemini.api.key=SUA_CHAVE_AQUI
```

### 1. Rodando o Backend (Spring Boot)
Abra um terminal na pasta raiz do projeto e navegue até o diretório `backend`:
```bash
cd backend

# No Windows (usando o Maven Wrapper)
.\mvnw.cmd spring-boot:run

# No Linux/Mac
./mvnw spring-boot:run
```
O backend estará rodando em `http://localhost:8080`.

### 2. Rodando o Frontend (React + Vite)
Abra um segundo terminal na pasta raiz do projeto e navegue até o diretório `frontend`:
```bash
cd frontend

# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```
O frontend estará acessível no navegador na porta indicada no terminal (geralmente `http://localhost:5173` ou `http://localhost:5174`).

## 🐳 Executando com Docker (PostgreSQL)

O projeto também possui um `docker-compose.yml` pré-configurado na raiz para levantar um banco de dados PostgreSQL.
```bash
docker-compose up -d
```
> *Nota:* Para utilizar o PostgreSQL em vez do H2, ajuste a configuração no `application.properties` (trocando a URL do datasource, driver e credenciais).

## 📄 Estrutura de Pastas
```text
.
├── backend/                  # API REST em Spring Boot
│   ├── src/main/java/        # Código fonte Java
│   └── src/main/resources/   # Propriedades e configurações
├── frontend/                 # Interface React Vite
│   ├── src/pages/            # Telas da aplicação (Dashboard, Portal, Ticket)
│   ├── src/store/            # Estado global (Zustand)
│   └── src/api/              # Configuração do Axios
└── docker-compose.yml        # Infraestrutura do banco de dados (Prod/Staging)
```

## 👨‍💻 Autor

Desenvolvido com 🩵 e ☕ durante a exploração de novas tecnologias de IA e frameworks modernos de desenvolvimento web.
