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

    📋 Centralized structured logging (API Service, SYSTEM, Error, Worker)

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

    DATABASE_URL=postgresql://postgres:pgpassword@postgres:5432/askthesite
    REDIS_URL=redis://redis:6379
    PORT=4000

### Worker (apps/worker/.env)

    DATABASE_URL=postgresql://postgres:pgpassword@postgres:5432/askthesite
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

    Centralized logging → structured JSON logs per service, no scattered console.log

## 📋 Logging Architecture

    Both the API and Worker services share an identical logger singleton
    (src/logger/logger.ts) that writes to stdout (colored) and to disk (JSONL).
    No third-party logging library is required.

### Log Categories

    | Category      | Color   | When Used                                              | Disk File         |
    | ------------- | ------- | ------------------------------------------------------ | ----------------- |
    | `API_SERVICE` | Cyan    | Every HTTP request → and response ←, with timing       | logs/api.log      |
    | `WORKER`      | Magenta | BullMQ job lifecycle: received, scrape, AI, complete   | logs/worker.log   |
    | `SYSTEM`      | Green   | Server start, Redis PubSub events, Socket.IO connect   | logs/system.log   |
    | `ERROR`       | Red     | Caught exceptions — includes full stack trace          | logs/error.log    |
    | `INFO`        | Yellow  | General-purpose informational messages                 | logs/system.log   |

### Disk Log Structure

    apps/api/logs/
    ├── api.log       # HTTP request & response lines (JSONL)
    ├── worker.log    # BullMQ job events (JSONL)
    ├── system.log    # Server/Redis/Socket.IO lifecycle (JSONL)
    └── error.log     # Caught exceptions with stack traces (JSONL)

    apps/worker/logs/
    ├── worker.log    # Scrape + AI + job events (JSONL)
    ├── system.log    # Worker startup events (JSONL)
    └── error.log     # Scrape failures, job failures (JSONL)

    Note: All logs/ directories are git-ignored.

### Example Terminal Output

    2026-06-07T08:30:00Z [SYSTEM ] API + WebSocket server started          { port: 4000 }
    2026-06-07T08:30:01Z [SYSTEM ] Worker started — waiting for jobs       { queue: 'task-queue' }
    2026-06-07T08:31:05Z [API   ] → POST /api/conversations                { ip: '::1', ua: 'Mozilla/5.0' }
    2026-06-07T08:31:05Z [API   ] ← POST /api/conversations 201  43ms
    2026-06-07T08:31:06Z [WORKER ] Job received from queue                 { taskId: 'abc-123' }
    2026-06-07T08:31:06Z [WORKER ] Scraping via Playwright                 { url: 'https://example.com' }
    2026-06-07T08:31:09Z [WORKER ] Playwright scrape succeeded             { url: 'https://example.com' }
    2026-06-07T08:31:10Z [WORKER ] AI answer generation complete
    2026-06-07T08:31:10Z [SYSTEM ] [Redis PubSub] task:abc-123            { status: 'COMPLETED' }
    2026-06-07T08:31:10Z [SYSTEM ] [Socket.IO] Client connected            { socketId: 'xYz1' }
    2026-06-07T08:32:00Z [ERROR  ] Job failed                              { taskId: 'xyz', stack: '...' }

### Logger API

    import { logger } from "./logger/logger.js";

    logger.api("message", meta?)      // HTTP tracking — used by requestLogger middleware
    logger.worker("message", meta?)   // BullMQ job events
    logger.system("message", meta?)   // Infrastructure checkpoints
    logger.error("message", error?, meta?)  // Caught exceptions (auto-extracts stack)
    logger.info("message", meta?)     // General-purpose
