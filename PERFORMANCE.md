# Response-Time Verification (US-20 / NFR3)

The required ceiling is **3,000 ms per request**. The project also uses a stricter local
engineering target of **150 ms** so regressions are visible well before the requirement is
at risk.

## Recorded baseline

Measured on 2026-10-04 using Node.js v26.8.2 and PostgreSQL 16.15 on a local arm64 macOS
machine. The API and database ran locally. Each path received five unrecorded warm-up requests
followed by 30 sequential measured requests.

| Path | What it exercises | Samples | Min | Average | p50 | p95 | Max |
|---|---|---:|---:|---:|---:|---:|---:|
| `GET /health` | Express, security middleware, JSON response | 30 | 0.40 ms | 0.84 ms | 0.69 ms | 1.67 ms | 2.16 ms |
| `GET /api/auth/me` | JWT verification, revocation lookup, user lookup, serialization | 30 | 1.11 ms | 1.64 ms | 1.48 ms | 3.12 ms | 4.09 ms |

The slowest observed request was **4.09 ms**, comfortably below both the 150 ms local target
and the 3,000 ms requirement.

## Database support

- `reservations.userId` has an index for owner-scoped reservation queries.
- `reservations.restaurantId` has an index for restaurant-scoped queries.
- `users.email` is unique and therefore indexed for login lookup.
- `revoked_tokens.jti` is the primary key and therefore indexed for authentication checks.

## Reproduce

Start the API with a registered user, then run:

```bash
PERF_TARGET_MS=150 \
PERF_PATHS=/health,/api/auth/me \
PERF_LOGIN_EMAIL=user@example.com \
PERF_LOGIN_PASSWORD=your-password \
npm run benchmark:response
```

Configuration:

- `PERF_BASE_URL` defaults to `http://127.0.0.1:3000`.
- `PERF_PATHS` defaults to `/health` and accepts comma-separated paths.
- `PERF_ITERATIONS` defaults to 30 measured requests per path.
- `PERF_WARMUP` defaults to five warm-up requests per path.
- `PERF_TARGET_MS` defaults to the required 3,000 ms ceiling.
- `PERF_BEARER_TOKEN` can be supplied instead of benchmark login credentials.

The command exits non-zero if a request fails or any measured maximum reaches the configured
target. Re-run the benchmark after implementing the remaining restaurant and reservation
endpoints and append those DB-backed paths to the recorded baseline.
