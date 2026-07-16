---
name: Quiniela Liga MX architecture
description: Key decisions and patterns for the full-stack Quiniela Liga MX Apertura 2026 app
---

## Stack
- React + Vite frontend at slug `quiniela`, preview path `/`
- Express API server at artifact `api-server`
- Drizzle ORM + PostgreSQL for persistence
- express-session + connect-pg-simple + bcryptjs for auth (session-based, no JWT)
- Orval-generated React Query hooks in `@workspace/api-client-react`

## Auth
- Session-based: `SESSION_SECRET` env var required
- Admin credentials: admin/admin123 (seeded)
- Player credentials: maestro/pincelin (seeded)
- `requireAuth` and `requireAdmin` middleware in `artifacts/api-server/src/lib/auth.ts`

## Error handling pattern
- `ErrorType<T>` is `ApiError<T>` with `data: T | null`
- Access API error body as `(err.data as any)?.error` in frontend onError handlers
- Not `err.error` — that property doesn't exist on ApiError

## Scoring
- General: 5 pts exact score, 3 pts correct outcome, 0 pts wrong
- Matchup (head-to-head): 3 pts win, 1 pt draw, 0 pts loss
- Calculated in `artifacts/api-server/src/lib/scoring.ts`

## DB schema (tables)
- users, jornadas, matches, predictions (unique on userId+matchId), matchups

## Seeded data
- 17 jornadas (Jornada 1 = active, rest = upcoming)
- 9 matches in Jornada 1, 9 matches in Jornada 2
- admin and maestro users

## Known limitation
- `JornadaInput` schema doesn't include `status` field
- Admin jornada status updates pass `as any` cast in admin-jornadas.tsx
- To properly fix: add `status` to JornadaInput in `lib/api-spec/openapi.yaml` and re-run codegen

**Why:** Status was deliberately excluded from initial JornadaInput to keep the create form simple, but admin needs to update it.
