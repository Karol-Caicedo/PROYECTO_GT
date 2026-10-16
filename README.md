# PROYECTO_GT

# SIGICE · Ingeniería de Sistemas (Colombia)

Sistema web para el área de Proyección Social: encuesta semestral de intereses
tecnológicos de los estudiantes (9 semestres) y publicación de capacitaciones
dirigidas a semestres específicos.

Monorepo: `/backend` (NestJS + TypeORM + PostgreSQL) + `/frontend`
(Angular + Material + ng2-charts) + Postgres en Docker.

---

## 1. Requisitos

| Requisito               | Versión                                        |
| ----------------------- | ---------------------------------------------- |
| Node.js                 | 20 o superior (`node -v`)                      |
| npm                     | 10 o superior (`npm -v`)                       |
| Docker + plugin compose | (`docker --version`, `docker compose version`) |

Puertos usados: `5432` Postgres · `8081` Adminer · `3000` backend ·
`4200` frontend dev · `4201` frontend Docker.

---

## 2. Puesta en marcha rápida (solo 3 comandos, desde la raíz)

```bash
npm install        # 1. instala el orquestador raíz (concurrently)
npm run setup      # 2. crea .env, instala backend+frontend, levanta Postgres,
                   #    corre migraciones y seed (admin + estudiante + 20 temas)
npm run dev        # 3. levanta backend y frontend juntos
```

Abre:

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Adminer (ver la base): http://localhost:8081
  (servidor `postgres`, usuario/clave/base según tu `.env`)

Usuarios de prueba (los crea el seed, configurables en `.env`):

| Rol                       | Correo                          | Clave            | Detalle                                                    |
| ------------------------- | ------------------------------- | ---------------- | ---------------------------------------------------------- |
| Admin (Proyección Social) | `admin@unipacifico.edu.co`      | `Admin123*`      | Gestiona periodos, temas, capacitaciones y ve el dashboard |
| Estudiante demo           | `estudiante@unipacifico.edu.co` | `Estudiante123*` | Semestre 5; responde la encuesta y ve sus capacitaciones   |

> Cambia las claves en producción con `ADMIN_PASSWORD` y
> `ESTUDIANTE_PASSWORD` en el `.env` antes del primer `npm run seed`.

> El primer arranque tarda unos minutos (instalación de dependencias).
> Para detener todo: `Ctrl+C` en la terminal del `npm run dev`.

---

## 3. Comandos disponibles (todos desde la raíz)

| Comando                | Qué hace                                                        |
| ---------------------- | --------------------------------------------------------------- |
| `npm run setup`        | Setup completo: `.env`, `install`, Postgres, migraciones y seed |
| `npm run dev`          | Backend + frontend en modo desarrollo (alias: `npm start`)      |
| `npm run dev:backend`  | Solo backend (`http://localhost:3000/api`)                      |
| `npm run dev:frontend` | Solo frontend (`http://localhost:4200`)                         |
| `npm run build`        | Compila backend y frontend                                      |
| `npm run migrate`      | Ejecuta migraciones pendientes (TypeORM)                        |
| `npm run seed`         | Crea admin + estudiante demo + 20 temas (idempotente)           |
| `npm run test`         | Pruebas unitarias del backend (Jest)                            |
| `npm run docker:up`    | Solo Postgres + Adminer en Docker                               |
| `npm run docker:full`  | Sistema completo en Docker (perfil `full`)                      |
| `npm run docker:down`  | Detiene los contenedores Docker                                 |

---

## 4. Primeros pasos en la app

1. Ingresa como admin y crea un periodo (ej. `2026-2`), actívalo y elige el
   modo de encuesta: `seleccion` (hasta 5 temas) o `calificacion` (1 a 5).
2. Como admin, crea usuarios en **Administración → Usuarios** (no hay
   registro público: las cuentas las crea Proyección Social). También puedes
   usar el estudiante demo. Si alguien olvida su clave, usa
   **¿Olvidaste tu contraseña?** en el ingreso (llega un enlace por correo,
   válido 1 hora y de un solo uso).
3. Como estudiante, responde la encuesta y revisa `Capacitaciones`.
4. Como admin, publica una capacitación y mira el `Dashboard`
   (filtros por periodo y semestre, exportación a CSV).

---

## 5. Todo con Docker (alternativa)

```bash
docker compose --profile full up --build
```

- Frontend: http://localhost:4201 · Backend: http://localhost:3000/api
- Las migraciones y el seed se ejecutan una vez así:
  ```bash
  docker exec intereses-backend npm run migration:run
  docker exec intereses-backend npm run seed
  ```
- `docker compose up -d postgres adminer` levanta solo la base para
  desarrollo local con `npm run dev`.

---

## 6. Configuración (`.env`)

Copia y ajusta desde `.env.example` (el `setup` lo crea solo):

```bash
cp -n .env.example .env
```

| Variable                                        | Para qué                                                 |
| ----------------------------------------------- | -------------------------------------------------------- |
| `DB_*`                                          | Conexión Postgres                                        |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                  | Firma y vigencia del JWT                                 |
| `ALLOWED_EMAIL_DOMAIN`                          | Dominio del correo permitido (`@gmail.com`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` | Admin creado por el seed                                 |
| `FRONTEND_URL`, `UPLOADS_DIR`                   | CORS y carpeta de imágenes                               |
| `AUTH_SSO_ENABLED`, `GOOGLE_*`, `MICROSOFT_*`   | SSO opcional (apagado por defecto)                       |
| `SMTP_*`, `MAIL_FROM`                           | Correo opcional; sin esto hay modo simulación (log)      |
| `RESEND_API_KEY`, `RESEND_FROM`                 | Recuperación de clave por Resend (ver abajo)             |

SSO (opcional): crea las credenciales OAuth en Google Cloud / Azure AD con
las callback del `.env`, pon `AUTH_SSO_ENABLED=true` y reinicia el backend.
Los usuarios nuevos de SSO completan semestre + Ley 1581 en
`/auth/sso-completar`.

SMTP (opcional): sin `SMTP_HOST`, notificaciones y recordatorios solo se
escriben en el log. El cron corre a diario 08:00 (día 7 y día 14 del periodo,
máx. 2 por estudiante). Forzado manual (admin):
`POST /api/recordatorios/ejecutar`.

Recuperación de contraseña (Resend): define `RESEND_API_KEY` y `RESEND_FROM`
en el `.env`. El flujo es: `POST /api/auth/recuperar` (respuesta siempre
genérica, con límite de 5 intentos/min) → correo con enlace a
`/auth/restablecer?token=…` → `POST /api/auth/restablecer`. El token es de un
solo uso y vence en 1 hora (solo se guarda su hash en `recuperacion_claves`).
Sin `RESEND_API_KEY` el enlace se escribe en el log (modo simulación).
Importante: el remitente debe ser un dominio verificado en
https://resend.com/domains; en modo prueba de Resend el correo solo le llega
al propietario de la cuenta. Nunca publiques la API key: si se expuso,
regenérala en el panel de Resend.

---

## 7. Supuestos del MVP

1. Un solo periodo activo a la vez; sin periodo activo no hay encuesta.
2. Temas en orden aleatorio determinista por usuario (semilla
   usuario+periodo): distinto por usuario, estable entre recargas.
3. Dashboard y exportación solo con datos agregados (privacidad).
4. Imágenes jpg/png/webp de máx. 2 MB en `/uploads` (volumen Docker).
5. Esquema solo vía migraciones (`synchronize: false`).

---

## 8. Solución de problemas

| Síntoma                                 | Causa probable / solución                                                   |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `docker ... permission denied`          | Agrega tu usuario al grupo docker o usa `sudo`                              |
| Backend no conecta a la DB              | Espera al healthcheck: `docker exec intereses-postgres pg_isready`          |
| Puerto ocupado (`5432`, `3000`, `4200`) | Detén el servicio que lo usa o cambia el puerto en `.env`/comando           |
| `No hay periodo activo`                 | Crea y activa un periodo como admin                                         |
| Correos no llegan                       | Normal sin SMTP: revisa el log del backend (modo simulación)                |
| Empezar de cero                         | `docker compose down -v` (borra el volumen `pgdata`), luego `npm run setup` |

---

## Árbol del proyecto

```
/
├── package.json            # orquestador raíz (dev, build, migrate, seed, docker:*)
├── scripts/setup.js        # setup automático idempotente
├── docker-compose.yml      # postgres:16 + adminer (+ perfil "full")
├── .env.example / README.md
├── backend/                # NestJS 11 + TypeORM + JWT/Passport + Swagger /api/docs
│   ├── Dockerfile (multi-stage)
│   └── src/{main, app.module, data-source, seed, common, migrations,
│            modules/{auth, users, periodos, temas, encuestas, dashboard,
│                      capacitaciones, recordatorios, mail}}
└── frontend/               # Angular 20 standalone + Material + ng2-charts
    ├── Dockerfile (build + nginx) + nginx.conf
    └── src/app/{core, features/{auth, encuesta, capacitaciones, admin}}
```
