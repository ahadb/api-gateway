# API Gateway

A production-grade API Gateway implementing enterprise resilience patterns for routing and orchestrating AI services.

## Features

### Core Patterns Implemented
- **Circuit Breaker** - Prevents cascading failures with automatic service recovery
- **Exponential Backoff Retries** - Smart retry logic (1s → 2s → 4s delays)
- **Request ID Tracing** - Distributed tracing across all services
- **Rate Limiting** - Protects against abuse and DDoS
- **Structured Logging** - Winston-based observability with request/response tracking
- **Per-Service Isolation** - Circuit breakers and routing isolated per backend service

### Architecture

```
Client Request
    ↓
API Gateway (Express + TypeScript)
    ├─ Request Logger (assigns UUID)
    ├─ Rate Limiter (100 req/min)
    ├─ Circuit Breaker (per service)
    ├─ Service Broker (retry logic)
    └─ HTTP Client (axios)
         ↓
Backend Services (AI, Data, RAG)
```

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

```bash
PORT=3000
NODE_ENV=development

# Service URLs
AI_SERVICE_URL=http://localhost:8000
DATA_SERVICE_URL=http://localhost:8001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Test

```bash
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## API Endpoints

### Health Checks
```bash
GET /health         # Full health status
GET /health/ready   # Readiness probe
GET /health/live    # Liveness probe
```

### Service Routes
```bash
# AI Service (routes to AI_SERVICE_URL)
POST /api/ai/*
GET  /api/ai/*

# Data Service (routes to DATA_SERVICE_URL)
POST /api/data/*
GET  /api/data/*
```

## How It Works

### Circuit Breaker Pattern

```
Normal Operation (CLOSED)
  → 5 consecutive failures
  → Circuit OPENS (fail fast for 60s)
  → After timeout: HALF_OPEN (test recovery)
  → Success: back to CLOSED
  → Failure: back to OPEN
```

**Result:** Failed services don't slow down the entire system. Requests fail in <10ms instead of waiting for timeouts.

### Retry Logic

```
Request fails
  → Retry 1 after 1 second
  → Retry 2 after 2 seconds
  → Retry 3 after 4 seconds
  → Give up and open circuit

Note: Skips retries on 4xx errors (client errors)
```

### Request Tracing

Every request gets a unique ID for debugging:

```bash
# Request
curl http://localhost:3000/api/ai/query

# Response includes
X-Request-ID: abc-123-def-456
X-Gateway-Service: ai
X-Gateway-Response-Time: 234
```

Track the request through all logs:
```bash
grep "abc-123-def-456" logs/combined.log
```

## Test Results

```
✅ Circuit Breaker Tests: 13/13 passing
✅ Integration Tests: All passing  
✅ Gateway Flow Tests: 7/8 passing
⚠️  Service Broker Tests: Needs mocking improvements

Overall: 24/34 tests passing (71%)
```

**Key Achievement:** 100% of circuit breaker pattern tests pass, validating the core resilience logic.

## Project Structure

```
src/
├── gateway/
│   ├── apiRegistry.ts         # Service configuration
│   ├── serviceBroker.ts       # Retry logic & forwarding
│   ├── requestDispatcher.ts   # Circuit breaker
│   └── router.ts              # Route definitions
├── routes/
│   ├── healthRouter.ts
│   ├── aiRouter.ts
│   └── dataRouter.ts
├── middleware/
│   ├── requestLogger.ts       # Request ID & logging
│   ├── rateLimiter.ts         # Rate limiting
│   ├── errorHandler.ts        # Centralized errors
│   └── authMiddleware.ts      # Auth (stub)
└── utils/
    ├── logger.ts              # Winston logger
    ├── httpClient.ts          # Axios wrapper
    └── envConfig.ts           # Environment config
```

## Technology Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **Language:** TypeScript (strict mode)
- **HTTP Client:** Axios
- **Logging:** Winston
- **Testing:** Jest + Supertest
- **Rate Limiting:** express-rate-limit

## Background

This gateway evolved from backend patterns I developed at **SS&C Technologies** for fund administration systems. The same principles of reliability, observability, and governance that managed financial data flows now orchestrate AI services.

**Core Evolution:**
- Structured data (SQL) → Unstructured data (vectors, LLMs)
- Deterministic workflows → Probabilistic AI reasoning
- Static routing → Dynamic service orchestration

## Roadmap

See [TODOS.md](TODOS.md) for priority items:

- **P0:** Deploy gateway + Build AI backend service
- **P1:** Add authentication, metrics endpoint, Redis caching
- **P2:** Per-service rate limiting, health check improvements, CI/CD

## License

MIT

## Author

Built to demonstrate enterprise-grade API gateway patterns with circuit breaking, retry logic, and distributed tracing.

