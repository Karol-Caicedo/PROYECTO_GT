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
npm run setup      # 2. crea .env (con JWT_SECRET aleatorio), instala backend+frontend,
                   #    levanta Postgres, corre migraciones y seed (admin + estudiante + 20 temas)
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
| Admin (Proyección Social) | `admin@unipacifico.edu.co`      | `C0{ABX3Yk4qxs`      | Gestiona periodos, temas, capacitaciones y ve el dashboard |
| Estudiante demo           | `estudiante@unipacifico.edu.co` | `55W922^+nlXS` | Semestre 5; responde la encuesta y ve sus capacitaciones   |

> Estas credenciales son solo para desarrollo local y se usan al crear las
> cuentas por primera vez. Para producción, configura `ADMIN_PASSWORD` como un
> secreto fuerte y único en Railway antes de ejecutar `seed:prod`; no reutilices
> la clave de demostración del README. El seed no cambia la contraseña de un
> administrador que ya existe.

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
| `npm run migrate:prod` | Runner protegido de migraciones de producción; exige confirmación |
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

## 5b. Despliegue en Railway (un solo servicio)

El backend compila y sirve también el frontend (`railway.json` ya trae la
configuración; `Root Directory` en la raíz del repo):

- **Build Command:** `npm run install:all && npm run build`
- **Start Command:** `MIGRATE_CONFIRM=YES npm run migrate:prod && npm --prefix backend run start:prod`
- Antes de iniciar Nest, Railway ejecuta el runner protegido de migraciones.
  Aplica las migraciones pendientes y, si alguna falla, no inicia la aplicación.
  El seed no se ejecuta en cada despliegue; en el primer aprovisionamiento,
  después de la migración, ejecuta `npm --prefix backend run seed:prod` con
  `ADMIN_PASSWORD` seguro.
- Agrega un plugin **Postgres** y define estas variables (usa los valores de
  referencia del plugin, ej. `DB_HOST=${{Postgres.PGHOST}}`):
  `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
  más `JWT_SECRET` (mínimo 32 caracteres, distinto de `dev-secret`),
  `ALLOWED_EMAIL_DOMAIN`, `FRONTEND_URL` (la URL pública del servicio),
  `RESEND_API_KEY` y `RESEND_FROM`. `PORT` lo inyecta Railway solo.
- El healthcheck de Railway es `GET /api/health`. Mantén
  `ACCESS_POLICY_MODE=enforce` en producción; `TRUST_PROXY=1` es el valor
  esperado detrás del proxy de Railway.
- En producción el seed exige `ADMIN_PASSWORD` si aún no existe el admin, omite
  el estudiante demo por defecto (`SEED_DEMO_STUDENT=false`) y rechaza claves de
  demostración, incluida la publicada para desarrollo local en este README.
- Para que los logos/imágenes de capacitaciones sobrevivan a despliegues,
  agrega un **Volume** montado en `/app/uploads` y define
  `UPLOADS_DIR=/app/uploads`.

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
| `LOGIN_CRYPTO_ACTIVE_KEY_ID`, `LOGIN_CRYPTO_KEYS_JSON` | Clave(s) privada(s) RSA PKCS#8 DER (Base64) para login cifrado |
| `ALLOWED_EMAIL_DOMAIN`                          | Dominio del correo permitido (`@gmail.com`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` | Admin creado por el seed                                 |
| `FRONTEND_URL`, `UPLOADS_DIR`                   | CORS, origen permitido y carpeta de imágenes             |
| `ACCESS_POLICY_MODE`                            | `enforce` (por defecto) o `audit` solo en staging        |
| `TRUST_PROXY`                                   | Proxies de confianza para `req.ip` (Railway: `1`)        |
| `ENABLE_SWAGGER`                                | Expone `/api/docs`; por defecto solo fuera de producción |
| `AUTH_SSO_ENABLED`, `GOOGLE_*`, `MICROSOFT_*`   | SSO opcional (apagado por defecto)                       |
| `SMTP_*`, `MAIL_FROM`                           | Correo opcional; sin esto hay modo simulación (log)      |
| `RESEND_API_KEY`, `RESEND_FROM`                 | Recuperación de clave por Resend (ver abajo)             |

El login local usa un sobre cifrado; el endpoint legado en claro ya no se acepta.
`npm run setup` crea una clave RSA local y la guarda en el `.env` ignorado por
Git. Si copias `.env.example` manualmente, ejecuta el setup para que complete la
configuración de login. En Railway, genera una clave RSA de 3072 bits en un
entorno seguro, conviértela a PKCS#8 DER/Base64 y configura el resultado en el
gestor de secretos (no en el repositorio ni en logs):

```text
LOGIN_CRYPTO_ACTIVE_KEY_ID=login-2026-01
LOGIN_CRYPTO_KEYS_JSON={"login-2026-01":"<PKCS8-DER-BASE64>"}
```

La clave privada nunca se distribuye al navegador. Para rotar, añade la nueva
clave al mapa, cambia `LOGIN_CRYPTO_ACTIVE_KEY_ID`, reinicia el backend y
conserva la anterior al menos 2 minutos para completar los desafíos vigentes.
Railway aplica esa migración antes de iniciar la aplicación junto con todas las
otras pendientes. HTTPS sigue siendo obligatorio en producción. El cuerpo cifrado no
oculta las credenciales al propietario del navegador ni protege contra XSS.

Para generar manualmente una clave de al menos 3072 bits, usa un entorno seguro
y guarda los archivos temporales con permisos restringidos:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out login-private.pem
openssl pkcs8 -topk8 -nocrypt -in login-private.pem -outform DER -out login-private.der
base64 -w0 login-private.der
```

Configura el resultado Base64 en el mapa JSON de `LOGIN_CRYPTO_KEYS_JSON` y
elimina los archivos temporales después de almacenarlo en el gestor de secretos.
No compartas la clave ni el resultado de Base64 en chats, issues o registros.

SSO (opcional): crea las credenciales OAuth en Google Cloud / Azure AD con
las callback del `.env`, pon `AUTH_SSO_ENABLED=true` y reinicia el backend.
Con el SSO apagado las rutas OAuth responden 404. El `state` OAuth se valida
con una cookie HttpOnly firmada y el código de un solo uso se entrega en cookie
HttpOnly para canjearlo en `POST /api/auth/sso/exchange`. El token de sesión
se devuelve en JSON y Angular lo conserva en `sessionStorage`; no se incluye
en la URL. Los usuarios nuevos de SSO completan semestre + Ley 1581 en
`/auth/sso-completar`.

SMTP (opcional): sin `SMTP_HOST`, notificaciones y recordatorios solo se
escriben en el log. El cron corre a diario 08:00 (día 7 y día 14 del periodo,
máx. 2 por estudiante). Forzado manual (admin):
`POST /api/recordatorios/ejecutar`.

Recuperación de contraseña (Resend): define `RESEND_API_KEY` y `RESEND_FROM`
en el `.env`. El flujo es: `POST /api/auth/recuperar` (respuesta siempre
genérica, con límite de 5 intentos/min) → correo con un código y enlace limpio
a `/auth/restablecer` → ingreso del código y `POST /api/auth/restablecer`.
El código no va en la URL; es de un solo uso, se consume de forma atómica y
vence en 1 hora (solo se guarda su hash en `recuperacion_claves`).
Sin `RESEND_API_KEY` el envío se simula y el token **no** se escribe en el log;
configura Resend o SMTP para probar el flujo completo.
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
4. Imágenes jpg/png/webp de máx. 2 MB en el volumen de uploads, validadas por
   contenido real y guardadas con nombre aleatorio. Se sirven solo por
   `GET /api/uploads/:nombre` con JWT y autorización por capacitación; `/uploads/*`
   está bloqueado.
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
