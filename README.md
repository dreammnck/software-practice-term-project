# Project 5: Restaurant Reservation API

2110503 Software Development Practice — Term Project. REST API for a restaurant table reservation system, built with Node.js, Express, Sequelize, and PostgreSQL, secured with JWT.

## Why PostgreSQL

The domain is naturally relational: `User`, `Restaurant`, and `Reservation` have fixed schemas and clear foreign-key relationships (a reservation always belongs to exactly one user and one restaurant). PostgreSQL enforces that referential integrity and the ownership rules behind confidentiality (NFR2) at the database level, rather than relying on application code alone.

Team split: **dream** (Identity & Access) and **max** (Restaurants & Reservations). See [`docs/backlog.md`](docs/backlog.md) for the full epic/user-story breakdown and issue tracker on GitHub.

**Status:** all API endpoints implemented (auth, restaurants, reservations). Full Postman/Newman collection passes (36 requests, 56 assertions).

## Tech stack

- Node.js + Express (REST API)
- PostgreSQL + Sequelize ORM
- JWT authentication (`jsonwebtoken`) with bcrypt password hashing and a DB-backed token-revocation list (for logout)
- Docker + Docker Compose for local Postgres and the app itself
- express-validator for request validation
- swagger-jsdoc + swagger-ui-express for live OpenAPI docs

## Project structure

```
src/
  config/       # DB connection, Swagger config
  models/       # Sequelize models: User, Restaurant, Reservation, RevokedToken
  middleware/   # auth (JWT + role check), validation, error handling
  controllers/  # business logic per resource
  routes/       # Express routers + OpenAPI JSDoc annotations
  seeders/      # schema sync + sample data / admin account seed script
  app.js        # Express app wiring
  server.js     # entrypoint
postman/        # Postman collection + environment (Newman-runnable)
Dockerfile, docker-compose.yml   # containerized Postgres + app
```

## Setup (Docker — recommended)

1. `docker compose up --build` — starts Postgres, runs schema sync + seed, then starts the API.
2. API is at `http://localhost:3010/api` (mapped from the container's port 3000 to avoid clashing with a local dev server). Live OpenAPI docs at `http://localhost:3010/api-docs`. Postgres itself is reachable on the host at `localhost:5433` if you want to inspect it with a client.
3. Stop with `docker compose down` (add `-v` to also wipe the Postgres volume).

Override any default (ports, credentials, JWT secret) by creating a `.env` file next to `docker-compose.yml` — Compose reads it automatically for `${VAR}` substitution.

## Setup (without Docker)

1. Install PostgreSQL locally (e.g. `brew install postgresql@16`) and create a database:
   ```bash
   createdb restaurant_reservation
   ```
2. Copy `.env.example` to `.env` and fill in your DB credentials and a JWT secret. Without a `.env`, `db:sync` fails with `database "<your user>" does not exist`. If you use the Docker Postgres from the host instead of a local one, set `DB_PORT=5433`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create the schema and seed sample data (5 restaurants + one admin account):
   ```bash
   npm run db:sync
   npm run db:seed
   ```
5. Start the server:
   ```bash
   npm run dev    # with nodemon
   # or
   npm start
   ```
6. API is at `http://localhost:3000/api`. Live OpenAPI docs at `http://localhost:3000/api-docs`.

## Foundation checks and Postman

Run the shared US-01 through US-04 checks without changing a database:

```bash
npm run test:foundation
```

Import both JSON files from `postman/` into Postman. The environment defaults `baseUrl` to
`http://localhost:3000/api`; switch it to `http://localhost:3010/api` when using Docker.
The collection (`postman/RestaurantReservation.postman_collection.json`) covers every auth,
restaurant, and reservation endpoint with pass/fail assertions, including the US-19 cross-user
checks (user B reading/editing/deleting user A's reservation → 403) and admin overrides.
It registers its own throw-away users on each run and logs in as the seeded admin
(`adminEmail` / `adminPassword` collection variables).

### Run the tests

```bash
npm run db:sync && npm run db:seed        # once, against a running Postgres
npm start                                  # terminal 1
npm run test:newman                        # terminal 2 — exits non-zero on any failure
# Docker: newman run ... --env-var baseUrl=http://localhost:3010/api
npm test                                   # node unit tests (no DB needed)
```

## Response-time benchmark

With the API running, measure one or more endpoints using the 3-second NFR threshold:

```bash
npm run benchmark:response
```

For the stricter local target and an authenticated endpoint:

```bash
PERF_TARGET_MS=150 \
PERF_PATHS=/health,/api/auth/me \
PERF_LOGIN_EMAIL=user@example.com \
PERF_LOGIN_PASSWORD=your-password \
npm run benchmark:response
```

The benchmark performs five warm-up requests followed by 30 measured requests per path and
reports minimum, average, p50, p95, and maximum latency. See `PERFORMANCE.md` for the
recorded baseline and methodology.

Seeded admin login (change `SEED_ADMIN_*` in `.env` before seeding in a real deployment):
- email: `admin@restaurant.com`
- password: `Admin123!`

## API summary

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | none | Register a new user |
| POST | /api/auth/login | none | Log in, get JWT |
| POST | /api/auth/logout | user/admin | Revoke current JWT |
| GET | /api/auth/me | user/admin | Current user profile |
| GET | /api/restaurants | user/admin | List restaurants |
| GET | /api/restaurants/:id | user/admin | Get one restaurant |
| POST | /api/reservations | user | Create a reservation (1–3 tables; a user may hold at most 3 tables in total, otherwise 409) |
| GET | /api/reservations | user/admin | List own (user) / all (admin) reservations |
| GET | /api/reservations/:id | owner/admin | Get one reservation |
| PUT | /api/reservations/:id | owner/admin | Update a reservation (409 if the owner would exceed 3 tables in total) |
| DELETE | /api/reservations/:id | owner/admin | Delete a reservation |

## Deployment

Public base URL: **TODO — not deployed yet (US-22).** Deploy the Docker image (e.g. Render/Railway/Fly.io
with a managed Postgres), set the env vars from `.env.example`, run `npm run db:sync && npm run db:seed`,
then record the URL here and smoke-test with `curl <url>/health` (expects `{"status":"ok"}`) and
`newman run ... --env-var baseUrl=<url>/api`.

## Division of work

See [`docs/backlog.md`](docs/backlog.md) for the full epic/user-story breakdown and GitHub issue tracker.

| Member | Stories | Files |
|---|---|---|
| dream (Identity & Access) | US-05–US-10, US-18 | `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`, `src/middleware/auth.middleware.js`, `src/models/user.model.js`, `src/models/revokedToken.model.js`, `src/utils/{jwt,hash}.js`, `test/us05–us09,us18` |
| max (Restaurants & Reservations) | US-11–US-17, US-19 | `src/controllers/restaurant.controller.js`, `src/controllers/reservation.controller.js`, `src/routes/{restaurant,reservation}.routes.js`, `test/us11-16.test.js`, reservation/restaurant + cross-user requests in `postman/` |
| Shared | US-01–US-04, US-20–US-25 | scaffold/models/Docker, `scripts/benchmark-response-time.js`, `PERFORMANCE.md`, README, `postman/` collection, `docs/demo-rehearsal.md` |

Demo run-sheet (7 min + 3 min Q&A): [`docs/demo-rehearsal.md`](docs/demo-rehearsal.md).

## Links

- GitHub: https://github.com/dreammnck/software-practice-term-project
