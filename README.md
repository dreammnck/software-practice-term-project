# Project 5: Restaurant Reservation API

2110503 Software Development Practice — Term Project. REST API for a restaurant table reservation system, built with Node.js, Express, Mongoose, and MongoDB, secured with JWT.

Team split: **dream** (Identity & Access) and **max** (Restaurants & Reservations). See [`docs/backlog.md`](docs/backlog.md) for the full epic/user-story breakdown and issue tracker on GitHub.

**Status:** foundation scaffold only. DB connection, models, JWT/bcrypt utilities, auth middleware, error handling, and route wiring are in place; every controller (`src/controllers/*.js`) is currently a `501 Not Implemented` stub with a `TODO` pointing at its backlog story (US-05..US-16) for dream/max to fill in.

## Tech stack

- Node.js + Express (REST API)
- MongoDB + Mongoose ODM
- JWT authentication (`jsonwebtoken`) with bcrypt password hashing and a DB-backed token-revocation list (TTL-indexed, for logout)
- express-validator for request validation
- swagger-jsdoc + swagger-ui-express for live OpenAPI docs

## Project structure

```
src/
  config/       # DB connection, Swagger config
  models/       # Mongoose models: User, Restaurant, Reservation, RevokedToken
  middleware/   # auth (JWT + role check), validation, error handling
  controllers/  # business logic per resource
  routes/       # Express routers + OpenAPI JSDoc annotations
  seeders/      # index sync + sample data / admin account seed script
  app.js        # Express app wiring
  server.js     # entrypoint
postman/        # Postman collection + environment (Newman-runnable)
```

## Setup

1. Install MongoDB locally (`brew install mongodb-community@7.0`) or use a hosted instance (e.g. MongoDB Atlas).
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a JWT secret.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Ensure indexes and seed sample data (5 restaurants + one admin account):
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
