# AGENTS.md

Monorepo SIGICE: `backend/` (NestJS 11 + TypeORM 0.3 + Postgres) and `frontend/`
(Angular 20 standalone + Material + ng2-charts). The root `package.json` is just
an orchestrator using `npm --prefix`; there are no npm workspaces and no pnpm.
UI copy, comments, validation messages, and test assertions are in Spanish.

## Commands (run from the repo root)

- `npm run setup` — creates `.env` from `.env.example`, installs both apps, starts
  Docker Postgres + Adminer, runs migrations and seed. Needs Node >= 20 and Docker;
  the first run is slow.
- `npm run dev` — backend on `:3000/api` plus frontend on `:4200` (alias `npm start`).
- `npm run dev:backend` / `npm run dev:frontend` — one side only.
- `npm run build` — backend `tsc` **then** frontend production build. Order matters:
  the backend serves `frontend/dist/app/browser` when it exists.
- `npm run migrate` / `npm run seed` — TypeORM CLI and seed; require the root `.env`
  and a running Postgres.
- `npm test` — backend Jest only. There is **no lint or format script/config**
  (no ESLint/Prettier in the repo); do not invent `npm run lint`. The frontend has
  **no test runner**; `npm run build:frontend` is its only automated check.
- `npm run docker:up` — Postgres `:5432` and Adminer `:8081` (containers
  `intereses-postgres` / `intereses-adminer`). `npm run docker:full` adds backend
  `:3000` and frontend `:4201`.
- Deploy target is Railway (`railway.json`): build `npm run install:all && npm run
  build`, start runs `seed:prod` on every deploy (idempotent) then `node dist/main`.
  There are no CI workflows.

## Tests

- Jest specs are colocated as `*.spec.ts`; Jest `rootDir` is `backend/src`.
- `backend/src/test/integracion.spec.ts` talks to real Postgres and creates/truncates
  `intereses_db_test` (default name, override with `TEST_DB_NAME`). `npm test` fails
  if Postgres is not running, so start `npm run docker:up` first.
- Unit tests only: `npm --prefix backend test -- --testPathIgnorePatterns=test/integracion`.
- One file: `npm --prefix backend test -- auth.service.spec`.

## Environment

- Configuration lives only in the gitignored root `.env` (see `.env.example`). The
  backend loads `['../.env', '.env']`; `data-source.ts` and `seed.ts` load `../.env`
  first. Run backend scripts with `npm --prefix backend ...` so cwd is `backend/`.
- Without `SMTP_HOST` or `RESEND_API_KEY`, mail/reset links are only written to the
  log (simulation mode). SSO is off unless `AUTH_SSO_ENABLED=true`.
- `ALLOWED_EMAIL_DOMAIN` (default `@gmail.com`) is enforced when users are created
  (`POST /api/usuarios`) and on the register DTO, but **not** on login. Seed emails
  use `@unipacifico.edu.co` regardless of this setting.
- Uploads are served at `/uploads/` from `UPLOADS_DIR` (Railway volume `/app/uploads`);
  jpg/png/webp only, max 2 MB.

## Architecture notes

- Global API prefix is `api`; Swagger is at `/api/docs`. `ValidationPipe` runs with
  `whitelist` + `forbidNonWhitelisted`, so extra DTO fields are rejected.
- Roles are uppercase `ADMIN` / `ESTUDIANTE`. Protect endpoints with `@Auth('ADMIN')`
  from `backend/src/common/auth.decorator.ts` (adds JWT guard + roles guard + Swagger
  bearer) instead of wiring guards by hand.
- Frontend uses standalone components and lazy `loadComponent` routes. The JWT lives
  in `localStorage.token`; `core/jwt.interceptor.ts` only attaches it to URLs
  containing `/api/`. Route protection: `authGuard` + `roleGuard` (`/admin` requires
  `ADMIN`). Students land on `/encuesta` and `/capacitaciones`.
- `frontend/src/environments/environment.ts` is the only environment file: it uses
  `http://localhost:3000/api` **only** when hostname is `localhost` and port is
  `4200`; everywhere else `apiUrl` is `/api` (same-origin).
- In production the Nest app serves the built Angular app with an SPA fallback; there
  is no nginx in the Railway path. `frontend/nginx.conf` is only for the Docker image.
- Domain rules: exactly one active `periodos` row; no active period blocks the survey.
  `modoEncuesta` is `seleccion` (up to 5 themes, no scores) or `calificacion` (1–5).
  Theme order is deterministically shuffled per user+period.
- Password reset tokens are stored hashed in `recuperacion_claves`, valid 1 hour and
  single-use. Reminders run daily at 08:00 (`@Cron('0 8 * * *')`), days 7 and 14.

## Database

- `synchronize: false`; schema changes go through migrations. `migrationsRun: true`
  means the backend applies pending migrations on bootstrap; seed also runs them.
- **New migration** must be created in `backend/src/migrations/` and added to the
  explicit array in `backend/src/data-source.ts`. `AppModule` uses a glob; the CLI
  and seed use that array.
- **New entity** must be registered in three places: `app.module.ts` `entities`,
  `data-source.ts` `entities`, and `backend/src/test/test-db.ts` (`ENTIDADES_TEST`).
  Missing the last one breaks the integration suite.
- Table names are snake_case; map camelCase properties with explicit `name:`.
  Existing tables are `usuarios`, `periodos`, `temas`, `respuestas`, `respuesta_temas`,
  `capacitaciones`, `capacitacion_semestres`, `clics_capacitacion`,
  `recordatorios_enviados`, `recuperacion_claves`.
- `backend/src/seed.ts` is idempotent: it skips recreating themes once an admin
  exists, so admin-deleted themes stay deleted.

## Conventions and gotchas

- `password_plano` stores passwords in clear text so `/admin/usuarios` can prefill the
  edit form; admin user endpoints return it (`/auth/me` strips it). Treat this as
  existing debt: do not replicate it or expose it outside admin endpoints.
- Colors must come from `frontend/src/styles/_tokens.scss` via `var(--...)`; no
  hardcoded colors (only exception: `core/charts.config.ts`). Follow
  `frontend/docs/guia-de-estilo.md` and reuse the shared UI components; use
  `UiService`/`ConfirmDialogComponent` instead of `alert`/`confirm`.
- `backend/src/modules/<domain>/` holds `*.module.ts`, `*.controller.ts`,
  `*.service.ts`, `*.dto.ts`, `*.entity.ts`. DTO validation messages are user-facing
  Spanish strings.
- Build output (`backend/dist`, `frontend/dist`), `.env`, and `backend/uploads/*` are
  gitignored; never commit them.
