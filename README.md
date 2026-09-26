# Project 5: Restaurant Reservation API

2110503 Software Development Practice — Term Project. REST API for a restaurant table reservation system, built with Node.js, Express, Sequelize, and PostgreSQL, secured with JWT.

## Why PostgreSQL

The domain is naturally relational: `User`, `Restaurant`, and `Reservation` have fixed schemas and clear foreign-key relationships (a reservation always belongs to exactly one user and one restaurant). PostgreSQL enforces that referential integrity and the ownership rules behind confidentiality (NFR2) at the database level, rather than relying on application code alone.

Team split: **dream** (Identity & Access) and **max** (Restaurants & Reservations). See [`docs/backlog.md`](docs/backlog.md) for the full epic/user-story breakdown and issue tracker on GitHub.

**Status:** foundation scaffold only. DB connection, models, JWT/bcrypt utilities, auth middleware, error handling, and route wiring are in place; every controller (`src/controllers/*.js`) is currently a `501 Not Implemented` stub with a `TODO` pointing at its backlog story (US-05..US-16) for dream/max to fill in.

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
2. Copy `.env.example` to `.env` and fill in your DB credentials and a JWT secret.
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
| POST | /api/reservations | user | Create a reservation (1–3 tables) |
| GET | /api/reservations | user/admin | List own (user) / all (admin) reservations |
| GET | /api/reservations/:id | owner/admin | Get one reservation |
| PUT | /api/reservations/:id | owner/admin | Update a reservation |
| DELETE | /api/reservations/:id | owner/admin | Delete a reservation |

## Team split

See [`docs/backlog.md`](docs/backlog.md) for the full epic/user-story breakdown and GitHub issue tracker.

| Member | Owns |
|---|---|
| dream | Identity & Access: register/login/logout/me, auth middleware, token revocation |
| max | Restaurants & Reservations: browse, create/view/edit/delete, admin override |

## Links

- GitHub: https://github.com/dreammnck/software-practice-term-project
