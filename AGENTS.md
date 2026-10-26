# AGENTS.md

Monorepo SIGICE: `backend/` (NestJS 11 + TypeORM 0.3 + Postgres) and `frontend/`
(Angular 20 standalone + Material + ng2-charts). The root `package.json` is just
an orchestrator using `npm --prefix`; there are no npm workspaces and no pnpm.
UI copy, comments, validation messages, and test assertions are in Spanish.

Documentación de referencia: `TECH_STACK.md`, `ARCHITECTURE.md` y
`PROJECT_CONTEXT.md`.

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
  build`, start runs `node dist/main` without seeding. The seed is a manual
  provisioning step (`seed:prod`) and is never executed on every deploy.
  Healthcheck: `GET /api/health`. There are no CI workflows.

## Tests

- Jest specs are colocated as `*.spec.ts`; Jest `rootDir` is `backend/src`.
- `backend/src/test/integracion.spec.ts` talks to real Postgres and creates/truncates
  `intereses_db_test` (default name, override with `TEST_DB_NAME`). `npm test` fails
  if Postgres is not running, so start `npm run docker:up` first.
- Unit tests only: `npm --prefix backend test -- --testPathIgnorePatterns=test/integracion`.
- `backend/src/test/acceso-http.spec.ts` levanta una app Nest mínima sin BD para probar
  health público, 403 uniforme, roles, CORS y modo audit.
- `backend/src/common/access-policy.spec.ts` recorre todos los controladores y falla si
  una ruta no tiene `@Public()` o `@Auth(...)`.
- One file: `npm --prefix backend test -- auth.service.spec`.

## Environment

- Configuration lives only in the gitignored root `.env` (see `.env.example`). The
  backend loads `['../.env', '.env']`; `data-source.ts` and `seed.ts` load `../.env`
  first. Run backend scripts with `npm --prefix backend ...` so cwd is `backend/`.
- `JWT_SECRET` is required at startup (32+ chars, not the example value); `npm run
  setup` generates one automatically. Production requires `ADMIN_PASSWORD` when
  the admin does not exist yet.
- Without `SMTP_HOST` or `RESEND_API_KEY`, mail is simulated in the log; reset
  tokens are deliberately **not** logged. SSO routes return 404 unless
  `AUTH_SSO_ENABLED=true`.
- `ALLOWED_EMAIL_DOMAIN` (default `@gmail.com`) is enforced when users are created
  (`POST /api/usuarios`) and on the register DTO, but **not** on login. Seed emails
  use `@unipacifico.edu.co` regardless of this setting.
- Uploads live in `UPLOADS_DIR` (Railway volume `/app/uploads`) and are served only by
  the authenticated `GET /api/uploads/:nombre` endpoint, with object-level visibility
  checks. Legacy `/uploads/*` is blocked. jpg/png/webp only, max 2 MB, validated by
  magic bytes and stored with random names. The frontend loads them as authenticated
  blobs (`core/auth-image.directive.ts`), never with a public URL.
- `ACCESS_POLICY_MODE=enforce` is the default; use `audit` only in staging to log
  would-be denials without blocking. `TRUST_PROXY` defaults to `1` for Railway.

## Architecture notes

- Global API prefix is `api`; Swagger is at `/api/docs` when `ENABLE_SWAGGER=true`
  (default: on in development, off when `NODE_ENV=production`). Request DTOs carry
  `@ApiProperty` examples so Swagger shows JSON examples. `ValidationPipe` runs with
  `whitelist` + `forbidNonWhitelisted`, so extra DTO fields are rejected.
- Access control is deny-by-default. Every route must have `@Public()` or
  `@Auth(...)`; `AccessGuard`, `JwtAuthGuard` and `RolesGuard` are global `APP_GUARD`s.
  `@Auth('ADMIN')` only writes metadata + Swagger bearer, so do not wire guards by hand.
  `GET /api/health`, auth/SSO and `GET /api/periodos/activo` + `GET /api/temas` are the
  only public routes. Unknown API routes return a uniform 403. `UnknownRouteModule`
  must stay imported last so its catch-all does not shadow real controllers.
- CORS allows the same origin, `FRONTEND_URL` (and `http://localhost:4200`); other
  origins get 403. Every response carries `X-Correlation-Id`; 403s are logged as structured
  JSON without bodies or tokens.
- Frontend uses standalone components and lazy `loadComponent` routes. The JWT lives
  in `localStorage.token`; `core/jwt.interceptor.ts` only attaches it to URLs
  containing `/api/`, clears the session on 401 and shows a permission message on 403
  (except image loads). Route protection: `authGuard` + `roleGuard` (`/admin` requires
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
  consumed atomically (single-use). Reminders run daily at 08:00 (`@Cron('0 8 * * *')`),
  days 7 and 14.
- Students only see capacitaciones that are published, inside their visibility window
  and targeted to their semester; `GET /capacitaciones/:id`, the click endpoint and
  the image endpoint enforce this. Admins can see drafts and any semester.
- SSO redirects put the temporary/access token in the URL **fragment**, never the
  query string. OAuth `state` is a signed HttpOnly cookie; Google accounts must not
  report `email_verified: false`.

## Database

- `synchronize: false`; schema changes go through migrations. `migrationsRun` is
  enabled only outside production (`DB_MIGRATIONS_RUN=false` disables it in dev).
  Production migrations are manual: `npm run migrate:prod` requires
  `MIGRATE_CONFIRM=YES`. The seed never runs migrations.
- **New migration** must be created in `backend/src/migrations/` and added to the
  explicit array in `backend/src/data-source.ts`. `AppModule` uses a glob; the CLI
  and guarded runner use that array.
- **New entity** must be registered in three places: `app.module.ts` `entities`,
  `data-source.ts` `entities`, and `backend/src/test/test-db.ts` (`ENTIDADES_TEST`).
  Missing the last one breaks the integration suite.
- Table names are snake_case; map camelCase properties with explicit `name:`.
  Existing tables are `usuarios`, `periodos`, `temas`, `respuestas`, `respuesta_temas`,
  `capacitaciones`, `capacitacion_semestres`, `clics_capacitacion`,
  `recordatorios_enviados`, `recuperacion_claves`.
- `backend/src/seed.ts` is idempotent: it skips recreating themes once an admin
  exists, so admin-deleted themes stay deleted. `seed:prod` runs with `--prod`
  como aprovisionamiento manual: exige `ADMIN_PASSWORD` si no existe el admin,
  rechaza claves demo y omite el estudiante demo salvo `SEED_DEMO_STUDENT=true`.

## Conventions and gotchas

- Las contraseñas se guardan solo como hash bcrypt. No reintroduzcas columnas ni
  respuestas con contraseñas en texto plano. El formulario admin de edición deja la
  contraseña vacía y solo la cambia si se escribe una nueva.
- `token_version` invalida sesiones JWT cuando cambia la contraseña o al aplicar la
  migración de revocación. No elimines esa comprobación del `JwtStrategy`.
- Colors must come from `frontend/src/styles/_tokens.scss` via `var(--...)`; no
  hardcoded colors (only exception: `core/charts.config.ts`). Follow
  `frontend/docs/guia-de-estilo.md` and reuse the shared UI components; use
  `UiService`/`ConfirmDialogComponent` instead of `alert`/`confirm`.
- `backend/src/modules/<domain>/` holds `*.module.ts`, `*.controller.ts`,
  `*.service.ts`, `*.dto.ts`, `*.entity.ts`. DTO validation messages are user-facing
  Spanish strings.
- `backend/package.json` uses npm `overrides` to force patched `multer` and `js-yaml`;
  `nodemailer` is v10. Keep `npm audit --omit=dev` at zero and verify mail flows after
  dependency changes.
- Build output (`backend/dist`, `frontend/dist`), `.env`, and `backend/uploads/*` are
  gitignored; never commit them.
