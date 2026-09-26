# Backlog — Restaurant Reservation Term Project

Epics and user stories derived from `docs/requirements.md`, `docs/use-cases.md`,
`docs/sequence-diagrams.md`, and `docs/uml-api-profile.md`. Split vertically between
the two contributors so each person ships real code, tests, and docs (not just one
person coding and the other documenting) — see `project-requirement/2110503_...pdf`
p.4 on individual grading of contribution.

Contributors: **dream** (Identity & Access), **max** (Restaurants & Reservations).

Legend: **FR/NFR** = `docs/requirements.md` IDs, **UC** = `docs/use-cases.md` IDs.

---

## EPIC 0 — Project Foundation (shared)

| ID | User Story | Acceptance Criteria | Refs | Owner |
|----|-------------|----------------------|------|-------|
| US-01 | As a developer, I can run `npm install` and start the Express server locally with a documented `.env`, so both of us have an identical dev environment. | `npm start` boots the server; `.env.example` lists every required var; README documents setup. | Constraints | shared |
| US-02 | As a developer, I have a PostgreSQL schema (Sequelize models) for `users`, `restaurants`, `reservations`, `revoked_tokens`, so both verticals can build against real tables. | Models define all 4 tables with the columns/FKs per the ER diagram; `npm run db:sync` (schema sync) is idempotent. | ER diagram (reservation-blueprint.pdf) | shared |
| US-03 | As a developer, I have shared JWT sign/verify + bcrypt hash/compare utilities and a global error-handling middleware, so both resources use consistent auth and error responses. | `src/utils/jwt.js`, `src/utils/hash.js`, `src/middleware/error.js` exist and are unit-testable in isolation. | NFR1 | shared |
| US-04 | As a developer, I have an empty Postman collection + environment committed, so each person adds their own requests as they build. | `postman/` folder with a collection JSON and environment JSON that imports cleanly into Postman. | NFR4 | shared |

## EPIC 1 — Authentication & Identity (dream)

| ID | User Story | Acceptance Criteria | Refs | Owner |
|----|-------------|----------------------|------|-------|
| US-05 | As a guest, I can register with name, telephone, email, password so I become a registered user. | `POST /api/auth/register` creates a `user`-role account; duplicate email → 409; password stored hashed. | FR1, UC1 | dream |
| US-06 | As a registered user, I can log in with email/password and receive a JWT so I can access protected endpoints. | `POST /api/auth/login` verifies bcrypt hash, returns a signed JWT with `sub`, `role`, `jti`; wrong credentials → 401. | FR2, UC2 | dream |
| US-07 | As a registered user, I can log out and have my token revoked so it can't be reused. | `POST /api/auth/logout` inserts `jti` into `revoked_tokens`; a reused token on any endpoint → 401. | FR2, UC3 | dream |
| US-08 | As a registered user or admin, I can fetch my own profile. | `GET /api/auth/me` returns the caller's user record (no password field). | UML profile | dream |
| US-09 | As any authenticated actor, my requests are rejected with 401 if my token is invalid, expired, or revoked. | Auth middleware checks signature, expiry, and revocation table before setting `req.user`. | NFR1 | dream |
| US-10 | As a developer, I write Postman tests + docs for the auth vertical. | Postman requests for register/login/logout/me with pass/fail assertions; auth rows in requirements/use-case docs reviewed and accurate. | FR1–FR2, UC1–UC3 | dream |

## EPIC 2 — Restaurants & Reservations (max)

| ID | User Story | Acceptance Criteria | Refs | Owner |
|----|-------------|----------------------|------|-------|
| US-11 | As a registered user, I can browse the restaurant list so I can pick one when reserving. | `GET /api/restaurants` and `GET /api/restaurants/:id` return name, address, telephone, open/close time. | UC8 | max |
| US-12 | As a registered user, I can create a reservation for a restaurant, date, and 1–3 tables. | `POST /api/reservations` validates `numberOfTables` in [1,3] and restaurant existence; invalid → 400/404; success → 201 owned by caller. | FR3, UC4 | max |
| US-13 | As a registered user, I can view only my own reservations. | `GET /api/reservations`, `GET /api/reservations/:id` return only rows where `userId === caller.id`. | FR4, NFR2, UC5 | max |
| US-14 | As a registered user, I can edit my own reservation but not someone else's. | `PUT /api/reservations/:id` applies changes for the owner; non-owner → 403. | FR5, UC6 | max |
| US-15 | As a registered user, I can delete my own reservation but not someone else's. | `DELETE /api/reservations/:id` removes the row for the owner; non-owner → 403. | FR6, UC7 | max |
| US-16 | As an admin, I can view, edit, and delete any reservation. | Same endpoints as US-13–US-15 bypass the ownership check when `role === 'admin'`. | FR7–FR9, UC9–UC11 | max |
| US-17 | As a developer, I write Postman tests + docs for the reservations vertical. | Postman requests for all reservation/restaurant endpoints with pass/fail assertions; reservation rows in requirements/use-case/sequence/UML docs reviewed and accurate. | FR3–FR9, UC4–UC11 | max |

## EPIC 3 — Non-Functional Requirements & Quality (shared)

| ID | User Story | Acceptance Criteria | Refs | Owner |
|----|-------------|----------------------|------|-------|
| US-18 | As a grader, I can see passwords are bcrypt-hashed and never returned in API responses. | No endpoint response includes a `password` field; DB column is a bcrypt hash. | NFR1 | dream |
| US-19 | As a grader, I can confirm a non-admin cannot read/edit/delete another user's reservation via direct ID guessing. | Manual/Postman test: user A hits `/api/reservations/:id` for user B's reservation → 403/404, not the data. | NFR2 | max |
| US-20 | As a grader, I can see typical responses return well under 3 seconds. | Indexed FKs (`userId`, `restaurantId`); local measured latency < 150ms noted in docs. | NFR3 | shared |
| US-21 | As a grader, I can run the entire collection via Postman Runner or `newman` with all tests passing. | `npm run test:newman` (or Postman Runner) exits green across every request in the collection. | NFR4 | shared |

## EPIC 4 — Deployment, Docs & Presentation (shared, last)

| ID | User Story | Acceptance Criteria | Refs | Owner |
|----|-------------|----------------------|------|-------|
| US-22 | As a grader, I can hit a deployed instance of the API, not just localhost. | A public base URL is documented and responds to a smoke-test request. | Constraints | shared |
| US-23 | As a grader, I can read a README that explains setup, env vars, and how to run the Postman collection. | `README.md` covers install, `.env`, migrate, run, and test steps end-to-end. | NFR4 | shared |
| US-24 | As the team, we have a written "division of work" section ready to present. | A section (README or slide) lists exactly which stories/files each of dream and max delivered. | Syllabus p.4 | shared |
| US-25 | As the team, we've rehearsed the 7-minute demo + Q&A. | Dry run covers: assigned topic, live Postman/Newman run, source code walkthrough, the 4 docs, division of work — within 7 min + up to 3 min Q&A. | Syllabus p.4 | shared |

---

## Traceability check

- FR1 → US-05 · FR2 → US-06, US-07 · FR3 → US-12 · FR4 → US-13 · FR5 → US-14 · FR6 → US-15 · FR7–FR9 → US-16
- NFR1 → US-09, US-18 · NFR2 → US-13, US-19 · NFR3 → US-20 · NFR4 → US-04, US-21, US-23
- Every UC1–UC11 is covered by exactly one story above.
