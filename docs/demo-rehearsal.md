# Demo Run-Sheet (US-25) — 7 min + up to 3 min Q&A

Tick the boxes and note the actual time after each dry run.

| # | Segment | Target | Content |
|---|---|---|---|
| 1 | Topic & scope | 0:45 | Project 5 Restaurant Reservation; FR1–FR9, NFR1–NFR4; why PostgreSQL (relational, FK integrity) |
| 2 | Live Newman run | 2:00 | `docker compose up`, then `npm run test:newman` → all green; point out the US-19 403 checks and admin override |
| 3 | Source walkthrough | 2:00 | `routes/` → `auth.middleware.js` (JWT + revocation) → `reservation.controller.js` `loadAuthorized` (ownership/admin) → models + indexes |
| 4 | The 4 docs | 1:15 | `docs/requirements.md`, `use-cases.md`, `sequence-diagrams.md`, `uml-api-profile.md` |
| 5 | Division of work | 0:45 | README "Division of work" table (dream vs max) |
| 6 | Wrap-up | 0:15 | Perf: < 20 ms local (`PERFORMANCE.md`) |
| — | Q&A | 3:00 | Likely: why 403 vs 404? how is logout enforced? how are passwords stored? |

Dry runs: [ ] #1 time ____  [ ] #2 time ____

> Rehearsal itself is a team activity — this sheet only prepares it.
