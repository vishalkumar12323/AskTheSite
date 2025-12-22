# 🧠 AskTheSite

    AskTheSite is a full-stack application that allows users to submit a website URL and ask a question about it.
    The system scrapes the website, processes the content in the background, and uses an AI model to generate an answer — all asynchronously.

    This project demonstrates real-world backend architecture, background job processing, and modern frontend data-fetching patterns.

## 🚀 Features

    🌐 Submit a website URL + question

    ⚙️ Background processing using BullMQ

    🕸️ Website scraping (Playwright with Cheerio fallback)

    🤖 AI-powered answers

    🗄️ PostgreSQL persistence using Drizzle ORM

    🔄 Task status tracking (PENDING → PROCESSING → COMPLETED / FAILED)

    ⚡ Live status updates on frontend using TanStack Query

    🐳 Dockerized for development & production

## 🏗️ Tech Stack

### Frontend

    Next.js (App Router)

    TypeScript

    TanStack Query

    Axios

### Backend

    Node.js + Express

    TypeScript

    BullMQ + Redis

    Playwright / Cheerio

    AI API (OpenAI-compatible)

    Database

    PostgreSQL

    Drizzle ORM

### Infrastructure

    Docker & Docker Compose

    pnpm

## 📂 Monorepo Structure

    apps/
    ├── web/          # Next.js frontend
    ├── api/          # Express API
    ├── worker/       # Background worker (BullMQ)
    ├── database/     # Drizzle ORM schema & config
    docker-compose.yml
    README.md

## 🔄 System Architecture

    Frontend (Next.js)
    ↓
    API (Express)
    ↓
    PostgreSQL (Task created)
    ↓
    BullMQ Queue (Redis)
    ↓
    Worker
    ├─ Scrape Website
    ├─ Call AI API
    └─ Update Task Status
    ↓
    Frontend polls task status

## 🧪 Task Lifecycle

    | Status       | Description                     |
    | ------------ | ------------------------------- |
    | `PENDING`    | Task created                    |
    | `PROCESSING` | Worker is scraping & processing |
    | `COMPLETED`  | AI answer generated             |
    | `FAILED`     | Error occurred (with message)   |

## ⚙️ Environment Variables

### API (apps/api/.env)

    DATABASE_URL=postgresql://postgres:password@postgres:5432/askthesite
    REDIS_URL=redis://redis:6379
    PORT=4000

### Worker (apps/worker/.env)

    DATABASE_URL=postgresql://postgres:password@postgres:5432/askthesite
    REDIS_URL=redis://redis:6379
    AI_API_KEY=your_api_key
    AI_BASE_URL=https://api.openai.com/v1

### Frontend (apps/web/.env.local)

    NEXT_PUBLIC_API_URL=http://localhost:4000

## 🐳 Running with Docker

### Development

    docker compose up --build

### Services started:

    PostgreSQL

    Redis

    API (dev mode)

    Worker

    Frontend runs separately using Next.js dev server.

### Production

    Change API build target in docker-compose.yml:
    target: prod

    docker compose up --build

## 🧠 Key Design Decisions

    Async-first architecture → no long-running requests

    Worker isolation → scraping & AI calls never block API

    Polling with TanStack Query → no WebSockets needed

    Drizzle ORM → type-safe, SQL-first approach

    Docker multi-stage builds → fast dev, small prod images
