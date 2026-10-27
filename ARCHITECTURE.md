# Arquitectura

Vista de alto nivel del sistema SIGICE. El detalle de comandos y convenciones está
en `AGENTS.md`; las versiones concretas, en `TECH_STACK.md`.

## Contexto

SIGICE es una aplicación web para el área de Proyección Social de Ingeniería de
Sistemas. Los estudiantes responden una encuesta semestral de intereses
tecnológicos y consultan capacitaciones; los administradores gestionan periodos,
temas, usuarios, capacitaciones y analítica.

## Vista de despliegue

```text
Navegador
   |
   | HTTPS
   v
Railway / NestJS
   |-- /api/*          API REST
   |-- /api/docs       Swagger (solo si ENABLE_SWAGGER=true)
   |-- /api/uploads/*  imágenes autenticadas de capacitaciones
   |-- /uploads/*      bloqueado (403)
   |-- /*              Angular compilado (SPA fallback)
   |
   v
PostgreSQL
```

En desarrollo hay dos procesos: Nest en `:3000` y Angular Dev Server en `:4200`.
El frontend usa `http://localhost:3000/api` solo cuando el host es `localhost` y el
puerto es `4200`; en cualquier otro entorno usa `/api` (mismo origen).

## Backend

### Módulos

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Login local, JWT, recuperación de clave, SSO Google/Microsoft |
| `users` | CRUD de usuarios y cambio de clave por administrador |
| `periodos` | Periodo académico activo y configuración de encuesta |
| `temas` | Catálogo de temas tecnológicos |
| `encuestas` | Respuestas por temas y modo selección/calificación |
| `asignaturas` | Catálogo de asignaturas por semestre |
| `encuestas-asignaturas` | Inscripción y evaluación de asignaturas |
| `capacitaciones` | Capacitaciones, semestres objetivo, clics y subida de imágenes |
| `dashboard` | Métricas agregadas de encuestas y capacitaciones |
| `recordatorios` | Cron de recordatorios por correo |
| `mail` | Envío por SMTP/Resend o simulación por log |

### Flujo de una petición

1. Nest aplica Helmet, CORS estricto, correlation ID y el prefijo global `api`.
2. `ThrottlerGuard` global limita la tasa.
3. `AccessGuard` exige `@Public()` o `@Auth(...)`; sin decorador responde 403.
4. `JwtAuthGuard` valida el JWT salvo en rutas públicas.
5. `RolesGuard` valida el rol y respeta el modo `audit` de staging.
6. `ValidationPipe` global transforma y valida DTOs (`whitelist` y
   `forbidNonWhitelisted`).
7. El controlador delega en el servicio de dominio.
8. El servicio usa repositorios TypeORM y devuelve datos al controlador.

Las rutas de API inexistentes las captura `UnknownRouteController` y responden
403 uniforme. El orden importa: `UnknownRouteModule` se importa al final.

### Datos

Entidades principales: `User`, `Periodo`, `Tema`, `Respuesta`, `RespuestaTema`,
`Asignatura`, `InscripcionAsignatura`, `RespuestaAsignatura`,
`RespuestaAsignaturaItem`, `Capacitacion`, `CapacitacionSemestre`,
`ClicCapacitacion`, `RecordatorioEnviado` y `PasswordReset`.

Reglas de dominio relevantes:

- Como máximo puede existir un periodo activo; puede no haber ninguno. Sin
  periodo activo no se habilita la encuesta. La BD lo impone con el índice único
  parcial `uq_periodo_activo`.
- `modoEncuesta` es `seleccion` (hasta 5 temas, sin puntajes) o `calificacion`
  (puntaje 1–5).
- El orden de temas se mezcla de forma determinista por usuario y periodo.
- Los tokens de recuperación se guardan hasheados, duran 1 hora, son de un solo
  uso y se consumen de forma atómica.
- Las respuestas, inscripciones, respuestas de asignaturas, capacitaciones y
  activación de periodo se ejecutan en transacciones. La activación usa bloqueo
  pesimista `NOWAIT`; la contención se traduce a 409.

### Seguridad

- Contraseñas nuevas con Argon2id; los hashes bcrypt existentes se verifican y
  solo se rehashean con `PASSWORD_REHASH_ON_LOGIN=true`. Nunca se devuelven
  hashes por la API.
- JWT en `Authorization: Bearer`; roles `ADMIN` y `ESTUDIANTE`.
- `JWT_SECRET` es obligatorio, con al menos 32 caracteres y sin fallback.
- Login local: Angular solicita una clave pública RSA y un desafío de un solo uso.
  Cifra `{correo,password}` con AES-256-GCM y envuelve la clave AES con
  RSA-OAEP/SHA-256 (RSA de al menos 3072 bits). Nest valida y consume el desafío
  atómicamente en PostgreSQL antes de descifrar; los sobres vencen a los 2 minutos
  y no se acepta el contrato legado en claro. HTTPS sigue siendo obligatorio.
  Las claves privadas PKCS#8 DER codificadas en Base64 se configuran solo en
  backend mediante `LOGIN_CRYPTO_KEYS_JSON`; `LOGIN_CRYPTO_ACTIVE_KEY_ID`
  selecciona la clave pública actual. Para rotar, publicar la nueva clave como
  activa y conservar las anteriores al menos 2 minutos antes de retirarlas.
- El cifrado del login no oculta credenciales al propietario del navegador ni a
  JavaScript/XSS; SSO y recuperación mantienen sus flujos separados.
- `token_version` permite invalidar JWT al cambiar la contraseña o al aplicar la
  migración de revocación.
- Uploads restringidos a imágenes jpg/png/webp de máximo 2 MB; el contenido se
  valida por firma binaria y se guarda con nombre aleatorio. Solo se sirven por
  `GET /api/uploads/:nombre`, con JWT y autorización por recurso; `/uploads/*`
  responde 403.
- Política de acceso deny-by-default: toda ruta requiere `@Public()` o `@Auth(...)`;
  los guards son globales. `ACCESS_POLICY_MODE=audit` solo se usa en staging.
- CORS acepta el mismo origen, `FRONTEND_URL` y `http://localhost:4200`; un origen
  distinto recibe 403. Todas las respuestas llevan `X-Correlation-Id`.
- Capacitaciones: estudiantes solo acceden a publicadas, vigentes y de su semestre;
  el detalle, el registro de clics y la imagen aplican autorización por recurso.
- SSO: rutas ocultas si `AUTH_SSO_ENABLED=false`, `state` OAuth firmado en cookie
  HttpOnly y código de un solo uso entregado en cookie `HttpOnly` para canjear en
  `POST /api/auth/sso/exchange`; los códigos se eliminan al consumirse y los
  vencidos se purgan cada hora. El alta pendiente usa un código opaco de 15
  minutos; nunca se ponen tokens en la URL. Google exige correo no marcado como
  no verificado.
- Pendientes conocidos: PKCE en OAuth, MFA y rotación de secretos.

## Frontend

### Organización

```text
src/app/
  core/        auth, guards, interceptor, servicios globales
  features/    auth, admin, encuesta, capacitaciones, estudiante
  layout/      header, footer, navegación inferior
  shared/ui/   componentes reutilizables y UiService
```

- Componentes standalone; rutas lazy en `app.routes.ts`.
- `authGuard` protege rutas autenticadas; `roleGuard` restringe `/admin` a
  `ADMIN`.
- El JWT vive en `sessionStorage.token`; el interceptor lo adjunta solo a `/api/`,
  limpia la sesión ante 401 y avisa ante 403.
- Las imágenes de capacitaciones se cargan como blob autenticado con
  `core/auth-image.directive.ts`; nunca se usan URLs públicas.
- Los estudiantes aterrizan en `/encuesta` y `/capacitaciones`.
- Se prefieren signals y componentes compartidos; evitar `any`, `toPromise` y
  lógica HTTP duplicada en componentes.

## Calidad y operación

- Pruebas backend: unitarias con mocks y una suite de integración contra
  PostgreSQL real.
- No hay lint/formateo configurado ni pruebas frontend.
- `migrationsRun` se aplica al arrancar solo fuera de producción. El comando de
  inicio de Railway ejecuta el runner protegido con `MIGRATE_CONFIRM=YES` antes
  de iniciar la aplicación; se aplican todas las pendientes. El seed sigue siendo
  aprovisionamiento manual y nunca corre en cada despliegue.
- Los cambios de esquema se crean en `backend/src/migrations/` y se registran en
  `backend/src/data-source.ts`.
- Las entidades nuevas se registran en `app.module.ts`, `data-source.ts` y
  `backend/src/test/test-db.ts`.
- El desafío de un solo uso del login usa `login_crypto_challenges`; aplicar su
  migración antes de habilitar el login cifrado en un entorno existente.

## Riesgos arquitectónicos actuales

- Lógica de negocio y validación en controladores.
- Consultas N+1 y agregaciones duplicadas en dashboard/recordatorios.
- La imagen de capacitación se escribe antes de la transacción; si la BD falla se
  elimina, pero un cierre abrupto del proceso puede dejar archivos huérfanos.
- Duplicación de layouts y acceso HTTP directo desde componentes.
- La suite backend cubre unitarias, integración PostgreSQL y contratos HTTP; no
  hay pruebas frontend ni E2E de navegador. La migración `up/down` se valida
  manualmente, no en CI.
