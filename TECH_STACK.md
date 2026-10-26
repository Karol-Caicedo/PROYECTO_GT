# Stack tecnológico

Documento de referencia del monorepo SIGICE. Refleja las versiones declaradas en
`package.json`; no sustituye a los lockfiles.

## Resumen

| Capa | Tecnología | Versión declarada |
| --- | --- | --- |
| Runtime | Node.js | `>=20` |
| Backend | NestJS | `^11.0.0` |
| Backend | TypeScript | `^5.5.0` |
| Backend | TypeORM | `^0.3.20` |
| Backend | PostgreSQL | Imagen Docker local |
| Backend | Autenticación | JWT + Passport + bcryptjs |
| Backend | Validación | `class-validator` + `class-transformer` |
| Backend | Documentación API | Swagger (`@nestjs/swagger`) con ejemplos JSON en DTOs |
| Frontend | Angular | `^20.3.0` |
| Frontend | Angular Material | `^20.2.0` |
| Frontend | Gráficas | Chart.js `^4.4.3` + ng2-charts `^6.0.0` |
| Frontend | Reactividad | Signals + RxJS `^7.8.1` |
| Pruebas | Jest + ts-jest | `^29.7.0` / `^29.2.0` |
| Orquestación local | Docker Compose | Postgres + Adminer |
| Despliegue | Railway | `railway.json` |

## Backend

- **Framework:** NestJS 11, módulos por dominio, controladores + servicios +
  repositorios TypeORM.
- **Base de datos:** PostgreSQL; `synchronize: false`; migraciones en
  `backend/src/migrations/`.
- **Autenticación:** JWT firmado con `JWT_SECRET`; roles `ADMIN` y `ESTUDIANTE`;
  guards globales de throttling, acceso, JWT y roles. Las rutas se declaran con
  `@Public()` o `@Auth(...)` (deny-by-default).
- **Correo:** Nodemailer/SMTP o Resend. Sin credenciales, el envío se simula y
  queda en el log; los tokens de recuperación nunca se registran.
- **Archivos:** Multer para imágenes de capacitaciones; se sirven solo por
  `GET /api/uploads/:nombre` con JWT y autorización por recurso.
- **Tareas programadas:** `@nestjs/schedule`; recordatorios diarios a las 08:00.
- **Pruebas:** Jest con specs colocadas `*.spec.ts`; integración contra una base
  PostgreSQL aislada (`intereses_db_test`).

## Frontend

- **Angular 20 standalone:** componentes independientes y rutas lazy con
  `loadComponent`.
- **Angular Material:** tarjetas, formularios, tablas, diálogos y navegación.
- **Estado:** signals para estado local; `localStorage.token` para el JWT.
- **HTTP:** `HttpClient` con interceptor que adjunta el token solo a URLs `/api/`.
- **Gráficas:** ng2-charts sobre Chart.js.
- **Estilos:** SCSS con tokens en `frontend/src/styles/_tokens.scss`; evitar
  colores hardcodeados.
- **Build:** `ng build --configuration production`; salida en
  `frontend/dist/app/browser`.

## Infraestructura local

- `docker-compose.yml` levanta Postgres en `:5432` y Adminer en `:8081`.
- El perfil `full` agrega backend y frontend en contenedores.
- En desarrollo, el backend usa `http://localhost:3000/api` y el frontend
  `http://localhost:4200`.
- En producción, Nest sirve la aplicación Angular compilada y expone la API bajo
  `/api`; no hay nginx en el camino de Railway.

## Comandos de referencia

```bash
npm run setup          # .env, dependencias, Postgres, migraciones y seed
npm run dev            # backend :3000/api + frontend :4200
npm run build          # backend tsc y frontend producción
npm run migrate        # migraciones TypeORM
npm run seed           # seed idempotente de desarrollo
npm test               # Jest backend (requiere Postgres para integración)
npm run docker:up      # Postgres + Adminer
```

No existe script de lint ni formateo en el repositorio. El frontend no tiene
runner de pruebas; su verificación automatizada actual es el build de producción.

## Variables de entorno relevantes

- Base de datos: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Seguridad: `JWT_SECRET` (obligatorio y robusto), `JWT_EXPIRES_IN`.
- Dominio: `ALLOWED_EMAIL_DOMAIN`.
- Aplicación: `FRONTEND_URL`, `UPLOADS_DIR`, `PORT`, `ENABLE_SWAGGER`.
- Seed: `ADMIN_*`, `ESTUDIANTE_*`.
- SSO opcional: `AUTH_SSO_ENABLED`, `GOOGLE_*`, `MICROSOFT_*`.
- Correo: `SMTP_*`, `RESEND_*`.

La configuración se carga desde el `.env` de la raíz (ignorado por git); los
scripts del backend se ejecutan con `cwd=backend/`.
