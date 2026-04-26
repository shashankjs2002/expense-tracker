
# Expense Tracker – Backend

A **production‑grade** personal finance API built with Node.js, Express, and MongoDB.  
Designed to behave correctly under real‑world conditions: unreliable networks, page refreshes, duplicate requests, and concurrent usage.

---

## Features

- **Idempotent expense creation** – Same request → same response, never a duplicate.
- **Integer‑based money handling** – All amounts stored as integer cents; no floating‑point errors.
- **Secure authentication** – JWT access tokens + rotated refresh tokens (HttpOnly cookies), theft detection.
- **Filter & sort** – Expenses can be filtered by category and sorted by date.
- **Total calculation** – Accurate sum of the currently visible expenses.
- **Structured logging & request tracing** – Every request has a unique ID; logs in JSON (production) or pretty (dev).
- **OpenAPI documentation** – Interactive Swagger UI at `/api-docs`.
- **Integration tests** – Idempotency, auth, money validation, and edge cases are automatically verified.

---

## Tech Stack

| Layer          | Choice                          | Reason |
|----------------|---------------------------------|--------|
| Runtime        | Node.js 18+                     | Fast, huge ecosystem |
| Framework      | Express                         | Minimal overhead, easy to test |
| Database       | MongoDB + Mongoose              | No schema migrations needed for demo; TTL indexes; flexibility |
| Validation     | Zod                             | Type‑safe, expressive schemas |
| Authentication | JWT (access + refresh) + bcrypt | Industry standard; refresh rotation adds security |
| Logging        | Pino                            | Low‑overhead structured logs |
| Testing        | Jest + Supertest + in‑memory DB | Fast, isolated, proves correctness |

---

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit secrets (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
   ```

3. **Start MongoDB** (local instance or update `MONGODB_URI` in `.env`)

4. **Run the server**
   ```bash
   npm run dev      # development with hot‑reload
   # or
   npm start        # production mode
   ```

5. **Verify**
   ```bash
   curl http://localhost:4000/api/health
   ```

6. **Explore the API**
   Open `http://localhost:4000/api-docs` for interactive documentation.

---

## API Documentation

Full OpenAPI 3.0 specification is available in `docs/openapi.yml` and served via Swagger UI.  
All endpoints, request/response schemas, headers (including `Idempotency-Key`), and error formats are documented.

---

## Design Decisions

### 1. Idempotency (Key Requirement)
Clients must send an `Idempotency-Key` header with every `POST /expenses`.  
The backend uses a **unique compound index** `{ userId, idempotencyKey }` on the Expense collection.  
- First request → expense created.
- Duplicate request (same user + key) → original expense returned with `201`, no duplicate.
- Race condition: if two requests arrive simultaneously, one succeeds, the other catches a duplicate key error and fetches the now‑existing resource.

This approach is simple, database‑enforced, and requires no external cache. The index is **sparse** (only indexes documents with a key), so it has minimal overhead.

### 2. Money as Integer Cents
All monetary values are stored as `amountCents` (integer).  
- Client sends amount as a **string** (e.g., `"12.50"`) to avoid JSON float precision loss.
- Server parses, rounds with `Math.round`, validates positivity, and stores the integer.
- Responses include `amountCents` and a pre‑formatted `formattedTotal` for convenience.
- Totals are computed using integer addition – exact and fast.

### 3. Authentication Strategy
- **Access tokens** (JWT, 15 min) are returned to the client and sent as `Bearer` headers. They are stored in memory/localStorage (acceptable because the refresh token is HttpOnly).
- **Refresh tokens** are opaque random strings, hashed (SHA‑256) before storage, and sent as `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- **Refresh rotation**: every use invalidates the old token and issues a new one. If a revoked token is reused, the **entire token family is revoked** – this detects theft and protects the user.
- Passwords are hashed with bcrypt (cost factor 12).

### 4. Database Choice – MongoDB
MongoDB was chosen for:
- Zero‑setup local development (no schema migration scripts needed).
- TTL indexes automatically expire refresh tokens and any future cached data.
- Flexible schema – easy to extend without migrations during the interview.
- Mongoose provides schema validation and compound indexes.

### 5. Logging & Observability
Every request is assigned a unique ID (via `uuid`) and logged with structured data by Pino.  
In production, logs are JSON and can be shipped to any aggregator.  
A global error handler logs full errors but returns sanitised messages to clients.

---

## Trade‑offs Made (Timebox)

- **No pagination** – the assignment assumes a personal tool with a limited number of expenses. The list endpoint returns all matching expenses. Pagination can be added easily with `skip`/`limit`.
- **No editing or deletion** – the requirements only asked for creation and listing. The data model supports future `PUT`/`DELETE` routes.
- **Idempotency key storage** – we use the Expense collection itself (with a sparse unique index) rather than a separate store. This is simpler and sufficient, because idempotency is tied to a specific user’s expense. For a high‑throughput system, a separate store with TTL would be preferred.
- **Token family revocation** – if a theft is detected, all sessions for that family are killed. That’s aggressive but safe for a personal tool.
- **No rate limiting** – in a production deployment, rate limiting (especially on auth routes) would be added.

---

## What’s Not Included (Intentionally)

- User management (update profile, delete account) – out of scope.
- Expense update/delete endpoints – can be added later.
- Multi‑tenancy / admin features – not required.
- Frontend – built separately in this monorepo.
- Comprehensive unit tests for all utility functions – integration tests cover critical paths; additional unit tests would be a natural next step.

---

## Testing

Run the test suite:
```bash
npm test
```

It uses an in‑memory MongoDB instance (`mongodb-memory-server`) to ensure isolation.

**Tests cover:**
- **Authentication:** register, login, refresh (including theft detection), logout, duplicate emails, validation.
- **Idempotency:** same key returns `201` + original resource; different keys create distinct expenses; missing key returns `400`.
- **Money handling:** valid string parsing, rejection of negative, zero, excess decimals, non‑numeric.
- **Expense listing:** filtering, sorting, total calculation, empty results, unauthenticated access.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/expense_tracker` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `JWT_ACCESS_SECRET` | Access token signing secret | (required) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | (required) |
| `LOG_LEVEL` | Pino log level | `info` |
| `NODE_ENV` | `development` or `production` | `development` |

---

## Project Structure

```
backend/
├── src/
│   ├── app.js                  # Express setup, middleware, routes
│   ├── server.js               # Entry point, DB connect, listen
│   ├── config/index.js         # Centralised config from env
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Expense.js
│   │   └── RefreshToken.js
│   ├── routes/                 # Route definitions
│   │   ├── auth.js
│   │   └── expenses.js
│   ├── controllers/            # Request handlers
│   │   ├── authController.js
│   │   └── expenseController.js
│   ├── middleware/              # Auth, validation, idempotency, error handling
│   │   ├── authenticate.js
│   │   ├── requireAuth.js
│   │   ├── validate.js
│   │   ├── idempotency.js
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── notFound.js
│   ├── utils/                  # Helpers (money, tokens, logger, custom error)
│   │   ├── money.js
│   │   ├── token.js
│   │   ├── AppError.js
│   │   └── logger.js
│   ├── validators/             # Zod schemas
│   │   └── index.js
│   └── __tests__/              # Integration tests
│       ├── setup.js
│       ├── auth.test.js
│       └── expenses.test.js
├── docs/
│   └── openapi.yml             # OpenAPI 3.0 specification
├── .env.example
├── package.json
└── README.md
```

---
