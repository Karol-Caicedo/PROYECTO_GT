# Informe de auditoría de seguridad — Backend SIGICE

- **Repositorio:** `/home/PradoV09/Escritorio/karol`
- **Commit auditado:** `c904235`
- **Alcance:** backend NestJS 11, autenticación, autorización, API REST, uploads, correo, migraciones, seed, Docker/Compose y configuración de despliegue.
- **Fecha:** 2026-10-26
- **Modalidad:** auditoría autorizada, estática y de configuración. No se realizaron exploits, pruebas destructivas ni pruebas contra producción.
- **Estado:** hallazgos confirmados por lectura de código; los puntos condicionados al entorno se marcan como `POR VERIFICAR`.

## Resumen ejecutivo

La aplicación tiene una base técnica razonable: usa `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`, protege la mayoría de endpoints con JWT + roles, usa Helmet, CORS con orígenes explícitos, throttling, bcrypt, tokens de recuperación hasheados y consultas parametrizadas. No se encontró inyección SQL evidente ni un IDOR generalizado en las encuestas.

Sin embargo, el riesgo general es **alto** por cuatro problemas que deben atenderse antes de considerar el sistema apto para producción:

1. **Contraseñas en texto plano** en base de datos, API administrativa, interfaz y `localStorage`.
2. **Secreto JWT con fallback** `dev-secret` y sin validación de configuración al arrancar.
3. **Credenciales por defecto del seed** (`Admin123*` / `Estudiante123*`) y ejecución de `seed:prod` en cada despliegue.
4. **Migraciones peligrosas**, incluida una que ejecuta `TRUNCATE` sobre respuestas y otra que rellena claves conocidas.

Además hay hallazgos altos en SSO (JWT en URL y vinculación por correo sin verificación), revocación de sesiones, BOLA/IDOR en capacitaciones, bypass de validación en `PATCH`, tokens de recuperación en logs, dependencias vulnerables y validación insuficiente de uploads.

### Conteo de hallazgos

| Severidad | Cantidad |
|---|---:|
| Crítica | 4 |
| Alta | 8 |
| Media | 15 |
| Baja | 12 |

### Prioridad inmediata

- Eliminar `password_plano` y todas sus lecturas/escrituras.
- Rotar `JWT_SECRET`, credenciales de base de datos y claves de todos los usuarios.
- Exigir variables de entorno seguras y fallar al arrancar si faltan.
- Desactivar credenciales demo y `seed:prod` con valores por defecto.
- Revisar y neutralizar migraciones destructivas antes del próximo despliegue.
- Sacar el JWT de la URL en SSO y agregar revocación de sesiones.
- Corregir BOLA en capacitaciones y el bypass de validación de `PATCH`.
- Actualizar dependencias vulnerables.

## Metodología y limitaciones

Se revisaron:

- Controladores, servicios, DTOs, entidades, guards y decoradores.
- Migraciones, seed, `data-source.ts`, `app.module.ts`, `main.ts`.
- `Dockerfile`, `docker-compose.yml`, `railway.json`, `.env.example`, `package.json`.
- Frontend en lo relacionado con almacenamiento de token y credenciales.
- Dependencias con `npm audit --omit=dev` y `npm ls`.

No se inspeccionaron los valores reales de `.env` para no exponer secretos. No se ejecutaron pruebas autenticadas, de carga, de SSO ni de subida de archivos. Por eso, la explotabilidad de algunos hallazgos depende de la configuración real de producción y se indica como `POR VERIFICAR`.

---

# Hallazgos críticos

## C-01 — Contraseñas almacenadas y expuestas en texto plano

- **Severidad:** Crítica.
- **Estado:** Confirmado.
- **OWASP/CWE:** A02:2021 Cryptographic Failures; A01:2021 Broken Access Control; CWE-256, CWE-522, CWE-200.
- **CVSS 3.1 estimado:** 8.1–8.7 según se modele el acceso administrativo requerido. La severidad de cumplimiento es crítica por exposición de credenciales reutilizables.

### Ubicación

- `backend/src/modules/users/user.entity.ts:26-27`
- `backend/src/modules/auth/auth.service.ts:57,155`
- `backend/src/modules/users/users.controller.ts:20,37,43,86,91,113`
- `backend/src/seed.ts:86,97,114,125`
- `backend/src/migrations/1700000000002-password-plano.ts:7-9`
- `frontend/src/app/features/admin/usuarios.component.ts:26,130,168,446,459`

### Riesgo

La columna `password_plano` guarda la contraseña real de cada usuario. `GET /api/usuarios` elimina `passwordHash` pero no `passwordPlano`, por lo que un administrador autenticado recibe todas las contraseñas en claro. Los endpoints de creación y actualización también devuelven el campo. La interfaz administrativa lo usa para prefijar el formulario de edición y lo muestra por defecto. El formulario de creación guarda el borrador completo, incluida la contraseña, en `localStorage`.

Consecuencias:

- Fuga masiva de credenciales si se compromete una cuenta admin, una sesión, el navegador de un administrador o un backup.
- Reutilización de credenciales en otros sistemas.
- Incumplimiento directo de Ley 1581 de 2012 y de principios de seguridad y confidencialidad.
- La contraseña queda además en logs, backups y copias de la base de datos.

### Verificación segura

En un entorno de pruebas, con una cuenta admin de prueba:

1. Ejecutar `GET /api/usuarios` y comprobar si la respuesta contiene `passwordPlano` (no imprimir valores reales).
2. Consultar en solo lectura: `SELECT count(*) FROM usuarios WHERE password_plano IS NOT NULL;`.
3. Abrir el formulario de edición y verificar que la contraseña aparece precargada.
4. Crear un usuario de prueba y revisar `localStorage` en DevTools; no usar datos reales.

No realizar estas pruebas contra producción.

### Corrección

1. Eliminar la columna y todas las referencias:

```ts
// user.entity.ts
// Eliminar por completo:
// @Column({ name: 'password_plano', nullable: true, type: 'varchar' })
// passwordPlano: string | null;
```

2. Crear una migración nueva (no editar una ya aplicada):

```ts
export class DropPasswordPlano1700000000007 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query('ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "password_plano"');
  }
  async down() {
    // No restaurar una columna insegura.
  }
}
```

3. Eliminar asignaciones en `auth.service.ts`, `users.controller.ts` y `seed.ts`.
4. En `GET /usuarios`, crear/actualizar y `GET /auth/me`, no devolver nunca campos de contraseña.
5. En el frontend:
   - Quitar `passwordPlano` de la interfaz `Usuario`.
   - No precargar la contraseña en el formulario de edición.
   - No guardar `password` en `localStorage`; excluirlo del borrador.
   - Mostrar la contraseña solo al crearla, una vez, o enviarla por un canal seguro.
6. Rotar todas las contraseñas y forzar restablecimiento. La contraseña en claro ya debe considerarse comprometida.
7. Invalidar todas las sesiones existentes después de la rotación.
8. Revisar backups y logs históricos; si contienen el campo, tratarlos como datos comprometidos.

### Prevención

- Regla de revisión: ningún campo de contraseña en respuestas de API.
- Test de contrato que falle si `passwordPlano` o `passwordHash` aparecen en cualquier respuesta.
- `git grep -n "passwordPlano\|password_plano"` debe devolver cero resultados.
- Escaneo de secretos en CI y revisión de modelos de datos.
- Política de “nunca almacenar secretos reversibles”.

---

## C-02 — Secreto JWT con fallback y sin validación de configuración

- **Severidad:** Crítica condicional. Si producción no define `JWT_SECRET`, es explotable de forma directa.
- **Estado:** Confirmado en código; `POR VERIFICAR` en producción.
- **OWASP/CWE:** A02:2021, A07:2021; CWE-798, CWE-321, CWE-1188.
- **CVSS 3.1 estimado:** 9.8 si se usa el fallback (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`).

### Ubicación

- `backend/src/modules/auth/auth.module.ts:24`
- `backend/src/modules/auth/jwt.strategy.ts:12`
- `.env.example:10`

### Riesgo

Si `JWT_SECRET` no está definido, el backend firma y valida tokens con `dev-secret`. Cualquiera que conozca ese valor puede fabricar un JWT con `sub` de un administrador y asumir su identidad. Lo mismo ocurre si se despliega el valor de ejemplo `cambia-este-secreto-largo-y-aleatorio`.

No hay validación al arrancar: el servicio inicia aunque el secreto falte, sea corto o sea el placeholder.

### Verificación segura

1. En el entorno de despliegue, verificar presencia y longitud sin imprimir el valor:
   ```bash
   test -n "$JWT_SECRET" && echo "definido" || echo "faltante"
   printf '%s' "$JWT_SECRET" | wc -c
   ```
2. Revisar la configuración del proveedor (Railway) sin copiar el secreto a la conversación.
3. En un contenedor aislado de staging, arrancar sin `JWT_SECRET` y comprobar si falla o inicia con `dev-secret`.
4. No fabricar tokens contra producción.

### Corrección

Validar la configuración al arrancar y fallar si no cumple:

```ts
const secret = config.get<string>('JWT_SECRET');
if (!secret || secret.length < 32 || secret === 'dev-secret' || secret.includes('cambia-este')) {
  throw new Error('JWT_SECRET ausente o inseguro');
}
```

Aplicarlo en un único módulo de configuración y reutilizarlo en `JwtModule` y `JwtStrategy`. Agregar `issuer` y `audience`, y verificar ambos.

Recomendaciones:

- Secreto aleatorio de al menos 32 bytes, generado con CSPRNG y guardado en el gestor de secretos.
- Rotación documentada. Al rotar, todas las sesiones se invalidan.
- Separar el secreto de tokens temporales SSO del secreto de acceso, si se mantiene el flujo actual.
- Reducir `JWT_EXPIRES_IN` a 15–30 minutos y usar refresh tokens rotativos.

### Prevención

- Validación de esquema de entorno con `joi`, `zod` o `class-validator` al inicio.
- Test que arranque la app sin `JWT_SECRET` y espere error.
- CI que falle si `.env.example` contiene valores utilizables como secretos.
- Escaneo de secretos y revisión de configuración de despliegue.

---

## C-03 — Credenciales por defecto del seed y ejecución en cada despliegue

- **Severidad:** Crítica condicional.
- **Estado:** Confirmado.
- **OWASP/CWE:** A07:2021, A05:2021; CWE-798, CWE-1392, CWE-1188.
- **CVSS 3.1 estimado:** 9.8 si el seed se ejecuta con los valores por defecto en producción.

### Ubicación

- `backend/src/seed.ts:76-77,104-105`
- `.env.example:18,23`
- `railway.json:8`
- `README.md:51-52`

### Riesgo

El seed crea un administrador con `ADMIN_PASSWORD` o `Admin123*` y un estudiante demo con `ESTUDIANTE_PASSWORD` o `Estudiante123*`. `railway.json` ejecuta `seed:prod` en cada despliegue. Si las variables no están definidas o se copia `.env.example` sin cambiarlas, producción queda con credenciales conocidas y una cuenta demo.

Además, el seed crea un estudiante demo que no debería existir en producción.

### Verificación segura

1. Confirmar en el gestor de secretos si `ADMIN_PASSWORD` y `ESTUDIANTE_PASSWORD` están definidas y no son los valores de ejemplo.
2. En staging, ejecutar el seed sin esas variables y comprobar qué usuarios crea.
3. Consultar en solo lectura si existe `estudiante@unipacifico.edu.co` en producción.
4. No probar las credenciales por defecto contra producción.

### Corrección

- En producción, exigir `ADMIN_PASSWORD` y `ADMIN_EMAIL`; fallar si faltan.
- No crear el estudiante demo si `NODE_ENV=production`.
- No asignar `passwordPlano`.
- Forzar cambio de contraseña en el primer inicio de sesión del admin.
- No ejecutar `seed:prod` en cada arranque; ejecutarlo como tarea de aprovisionamiento controlada.
- Si se mantiene el seed idempotente, separar “datos iniciales” de “credenciales de bootstrap”.

Ejemplo:

```ts
if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD es obligatoria en producción');
}
if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO === 'true') {
  // Solo si se habilita explícitamente.
}
```

### Prevención

- Test que verifique que el seed no crea demo en producción.
- Revisión de `railway.json` y del pipeline de despliegue.
- Rotación inmediata si alguna vez se usó un valor por defecto.
- Checklist de despliegue con verificación de secretos.

---

## C-04 — Migraciones destructivas y ejecución automática

- **Severidad:** Crítica por pérdida de datos; Alta si la migración ya fue aplicada en todos los entornos.
- **Estado:** Confirmado.
- **OWASP/CWE:** A08:2021 Software and Data Integrity Failures, A04:2021 Insecure Design; CWE-1188, CWE-693.
- **CVSS:** No se asigna CVSS estándar porque el impacto principal es integridad/disponibilidad de datos.

### Ubicación

- `backend/src/migrations/1700000000005-reset-respuestas.ts:5-8`
- `backend/src/migrations/1700000000002-password-plano.ts:7-9`
- `backend/src/app.module.ts:49-50`
- `backend/src/seed.ts:72`
- `railway.json:8`

### Riesgo

La migración `ResetRespuestas1700000000005` ejecuta:

```sql
TRUNCATE TABLE "respuesta_temas", "respuestas" CASCADE;
TRUNCATE TABLE "respuesta_asignatura_items", "respuestas_asignaturas" CASCADE;
```

`migrationsRun: true` y `seed:prod` aplican migraciones pendientes automáticamente. Si esa migración aún no se aplicó en un entorno con datos, el próximo despliegue borra todas las respuestas de forma irreversible. El `down` es no-op.

La migración `PasswordPlano1700000000002` rellena `password_plano` con `Estudiante123*` y `Admin123*` para usuarios existentes. Aunque no cambia el hash, crea secretos conocidos y agrava C-01.

### Verificación segura

1. Consultar en solo lectura la tabla de migraciones:
   ```sql
   SELECT name FROM migrations ORDER BY id;
   ```
2. Confirmar si `ResetRespuestas1700000000005` ya está aplicada.
3. Revisar si hay backups recientes y probar restauración en un entorno aislado.
4. No ejecutar `migration:run` contra producción sin backup verificado.

### Corrección

- Si la migración aún no se aplicó: **no desplegar** hasta tener backup y aprobación explícita; idealmente eliminarla del historial y reemplazarla por una migración no destructiva.
- Si ya se aplicó: documentarlo, conservar el historial y no volver a ejecutarla.
- Sacar `TRUNCATE` de migraciones de esquema. Si se necesita un reset de datos, hacerlo como tarea manual, con backup, ventana de mantenimiento y confirmación.
- No rellenar contraseñas en migraciones. Eliminar la columna con una migración nueva.
- Revisar todas las migraciones con una política: sin `DROP`/`TRUNCATE`/`DELETE` masivo sin aprobación.

### Prevención

- Revisión obligatoria de migraciones en PR.
- Prueba de migración sobre copia de producción.
- Backup automático antes de migrar.
- `migrationsRun: false` en producción y ejecución controlada en el pipeline.
- Test que detecte operaciones destructivas en migraciones.

---

# Hallazgos altos

## H-01 — JWT de SSO y token temporal en la URL

- **Severidad:** Alta.
- **Estado:** Confirmado.
- **OWASP/CWE:** A07:2021, A02:2021; CWE-598, CWE-200, CWE-522.
- **CVSS 3.1 estimado:** 8.0 (`AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N`).

### Ubicación

- `backend/src/modules/auth/auth.controller.ts:72,75,93,96`
- `frontend/src/app/features/auth/sso-callback.component.ts:18-20`
- `frontend/src/app/features/auth/restablecer.component.ts:91`
- `backend/src/modules/auth/auth.service.ts:129`

### Riesgo

Los callbacks de Google y Microsoft redirigen a:

```text
/auth/sso-callback?token=<JWT>
/auth/sso-completar?temp=<JWT temporal>
```

El JWT completo queda en:

- Historial del navegador.
- Logs de acceso, proxies, CDN y WAF.
- Cabecera `Referer` si la página carga recursos externos.
- Herramientas de analítica o extensiones.
- Capturas de pantalla y soporte.

El token de acceso dura 12 horas y no se revoca. El token temporal SSO dura 15 minutos y también queda en URL. El enlace de recuperación también lleva el token en la URL, aunque es un patrón más aceptable si se mitiga con `Referrer-Policy` y un solo uso.

### Verificación segura

En staging:

1. Iniciar SSO con una cuenta de prueba.
2. Inspeccionar la cabecera `Location` de la respuesta del callback sin seguirla.
3. Revisar el historial y la pestaña Network.
4. Comprobar si la respuesta incluye `Cache-Control: no-store` y `Referrer-Policy: no-referrer`.
5. No reutilizar tokens reales.

### Corrección

Opción recomendada: código de un solo uso exchange.

1. En el callback, generar un código aleatorio de 32 bytes.
2. Guardar solo su hash, asociado al usuario, con expiración de 60 segundos y un solo uso.
3. Redirigir a `/auth/sso-callback?code=<code>` o, mejor, establecer una cookie `HttpOnly; Secure; SameSite=Lax` con el código y redirigir sin parámetros.
4. El frontend hace `POST /auth/sso/exchange` con el código; el backend responde con el JWT en el cuerpo JSON.
5. Invalidar el código después del primer uso.

Además:

- `Referrer-Policy: no-referrer` en callbacks y páginas con tokens.
- `Cache-Control: no-store, no-cache, must-revalidate`.
- No registrar URLs con tokens.
- Considerar cookies `HttpOnly` para la sesión en lugar de `localStorage`.

### Prevención

- Test que verifique que el callback no contiene `access_token` en la URL.
- Revisión de logs para detectar tokens.
- Prueba de un solo uso y expiración del código.

---

## H-02 — Sin revocación de sesiones; el cambio de contraseña no invalida JWT

- **Severidad:** Alta.
- **Estado:** Confirmado.
- **OWASP/CWE:** A07:2021; CWE-613, CWE-384, CWE-620.
- **CVSS 3.1 estimado:** 8.0 si se reutiliza un token robado.

### Ubicación

- `backend/src/modules/auth/jwt.strategy.ts:15-18`
- `backend/src/modules/auth/auth.service.ts:144-160`
- `backend/src/modules/users/users.controller.ts:81-88,107-116`
- `backend/src/modules/auth/auth.module.ts:25`

### Riesgo

El JWT es válido durante 12 horas. `JwtStrategy.validate` solo busca al usuario por `sub`; no compara versión de token, no consulta denylist y no invalida sesiones al:

- Restablecer contraseña.
- Cambiar contraseña desde administración.
- Cambiar rol.
- Eliminar usuario (el usuario eliminado sí falla, pero el token de otros usuarios no).
- Cerrar sesión (el logout es solo del lado del cliente).

Si un token se filtra, sigue funcionando aunque la víctima cambie la contraseña. El flujo SSO agrava el problema porque el token viaja en URL.

### Verificación segura

En staging:

1. Iniciar sesión con un usuario de prueba y guardar el token.
2. Cambiar la contraseña desde otro cliente.
3. Usar el token anterior en `GET /auth/me`.
4. Si responde 200, el token no se revocó.
5. No usar tokens de producción.

### Corrección

Agregar versión de token:

```ts
@Column({ name: 'token_version', type: 'int', default: 0 })
tokenVersion: number;
```

Incluir `ver` en el JWT y validarlo:

```ts
async validate(payload: { sub: string; ver?: number }) {
  const user = await this.users.findById(payload.sub);
  if (!user || payload.ver !== user.tokenVersion) return null;
  return { id: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre, nombre: user.nombre };
}
```

Incrementar `tokenVersion` en:

- `restablecerClave`.
- `cambiarClave`.
- Cambio de contraseña desde `PATCH /usuarios/:id`.
- Cambio de rol.
- “Cerrar todas las sesiones”.

Para logout individual, agregar `jti` y una denylist con TTL igual al token, o usar refresh tokens con rotación y revocación.

### Prevención

- Test: token viejo debe devolver 401 después de cambiar contraseña.
- Test: token viejo debe devolver 401 después de cambiar rol.
- Reducir la vida del access token y usar refresh rotativo.

---

## H-03 — Vinculación SSO por correo sin verificación y sin `state`

- **Severidad:** Alta condicional.
- **Estado:** Confirmado en código; `POR VERIFICAR` el comportamiento real de los proveedores.
- **OWASP/CWE:** A07:2021; CWE-287, CWE-290, CWE-352, CWE-384.

### Ubicación

- `backend/src/modules/auth/auth.service.ts:91-108`
- `backend/src/modules/auth/google.strategy.ts:16-21`
- `backend/src/modules/auth/microsoft.strategy.ts:19-29`
- `backend/src/modules/auth/auth.controller.ts:58-97`

### Riesgo

`loginSso` busca un usuario por correo. Si existe y no tiene `proveedorId`, lo vincula automáticamente al proveedor SSO y permite el login sin contraseña. No exige que el correo esté verificado por el proveedor.

Google devuelve `emails[0].verified`, pero el código no lo comprueba. Microsoft usa `mail` o `userPrincipalName` sin validar el dominio del tenant ni la verificación del correo. Si un atacante puede obtener una cuenta de proveedor con el correo de la víctima, o si el proveedor permite correos no verificados, puede tomar la cuenta local.

Tampoco se observa configuración de `state` ni PKCE en las estrategias. Sin `state`, un atacante puede inducir un login CSRF: la víctima termina autenticada en la cuenta del atacante y luego introduce datos sensibles.

### Verificación segura

En staging, con cuentas de prueba:

1. Revisar el parámetro `state` en la URL de autorización.
2. Probar un correo no verificado si el proveedor lo permite; no usar cuentas reales.
3. Verificar si un usuario local existente se vincula automáticamente al primer login SSO.
4. Revisar el tenant de Microsoft y el dominio permitido.
5. No probar con cuentas institucionales reales.

### Corrección

- Exigir `email_verified === true` en Google.
- En Microsoft, validar `tenant`, dominio y que el correo sea el principal del usuario; no confiar solo en `mail`.
- No vincular automáticamente cuentas locales. Para vincular:
  - Exigir contraseña local, o
  - Enviar un correo de confirmación, o
  - Requerir aprobación administrativa.
- Si el usuario ya tiene `proveedorId`, exigir que coincida con el proveedor actual.
- Implementar `state` firmado y de un solo uso, y PKCE cuando aplique.
- Rechazar correos vacíos o sin dominio permitido.

### Prevención

- Tests de OAuth con proveedor simulado: correo no verificado, `state` inválido, `proveedorId` distinto.
- Revisión de configuración de Google/Microsoft.
- Documentar el flujo de vinculación de cuentas.

---

## H-04 — BOLA/IDOR en capacitaciones

- **Severidad:** Media-Alta.
- **Estado:** Confirmado.
- **OWASP/CWE:** A01:2021 Broken Access Control; CWE-639, CWE-285.
- **CVSS 3.1 estimado:** 6.4–7.1 según sensibilidad del contenido en borrador.

### Ubicación

- `backend/src/modules/capacitaciones/capacitaciones.controller.ts:49-53,79-84`
- `backend/src/modules/capacitaciones/capacitaciones.service.ts:17-22,72-77,109-114`

### Riesgo

`GET /capacitaciones/:id` está disponible para `ADMIN` y `ESTUDIANTE`, pero `detalle` no comprueba:

- Que la capacitación esté publicada.
- Que esté dentro de `visibleDesde`/`visibleHasta`.
- Que el semestre del estudiante esté en `capacitacion_semestres`.

`POST /capacitaciones/:id/clic` hace lo mismo y devuelve el enlace de una capacitación en borrador, vencida o dirigida a otro semestre. El UUID es difícil de adivinar, pero puede filtrarse por logs, enlaces, correos, paneles o errores. Es un caso clásico de BOLA.

`GET /capacitaciones/mias` sí filtra correctamente; el problema está en el detalle y en el clic.

### Verificación segura

En staging:

1. Crear una capacitación en borrador para el semestre 1.
2. Iniciar sesión como estudiante del semestre 9.
3. Solicitar `GET /capacitaciones/<uuid>` y `POST /capacitaciones/<uuid>/clic`.
4. Esperar 404/403; si devuelve contenido o enlace, hay BOLA.
5. Repetir con una capacitación publicada pero fuera de la ventana de visibilidad.

### Corrección

Separar la vista administrativa de la vista del estudiante:

```ts
async detalleParaEstudiante(id: string, semestre: number) {
  const c = await this.cap.findOne({ where: { id }, relations: ['semestres'] });
  if (!c || !CapacitacionesService.esVigente(c)) throw new NotFoundException();
  const permitidos = c.semestres.map((s) => s.semestre);
  if (!permitidos.includes(semestre)) throw new NotFoundException();
  return c;
}
```

Aplicar la misma comprobación en `registrarClic` antes de guardar el clic y devolver el enlace. Usar `ParseUUIDPipe` en `:id`.

### Prevención

- Tests de autorización por rol, estado, fechas y semestre.
- Revisar cada endpoint con `:id` y preguntar “¿quién puede acceder a este objeto?”.
- No confiar en UUID como control de acceso.

---

## H-05 — Bypass de validación en `PATCH /capacitaciones/:id`

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A04:2021, A08:2021; CWE-20, CWE-915.
- **CVSS 3.1 estimado:** 4.9 (requiere admin).

### Ubicación

- `backend/src/modules/capacitaciones/capacitaciones.controller.ts:68`
- `backend/src/modules/capacitaciones/capacitaciones.service.ts:79-99`
- `backend/src/modules/capacitaciones/capacitacion.dto.ts`

### Riesgo

El controlador declara:

```ts
@Body() dto: Partial<CapacitacionDto>
```

`Partial<T>` es solo de TypeScript; en runtime el metatipo es `Object`. El `ValidationPipe` no encuentra la clase `CapacitacionDto`, por lo que no aplica `whitelist`, `forbidNonWhitelisted` ni las validaciones de campos. Un admin puede enviar:

- `estado` con un valor no permitido.
- `fechaEvento` inválida, que se convierte en `Invalid Date`.
- `temaId` que no sea UUID, provocando error 500.
- `semestres` con valores fuera de 1–9, `NaN` o duplicados.
- `titulo` vacío o de tipo incorrecto.

No permite escribir columnas arbitrarias porque el servicio usa `Object.assign` con campos conocidos, pero sí rompe integridad y puede causar errores de base de datos.

### Verificación segura

En staging, con admin de prueba:

1. Enviar `PATCH` con `estado: "inventado"` y comprobar si responde 200.
2. Enviar `fechaEvento: "no-es-fecha"` y comprobar si responde 200 o 500.
3. Enviar `semestres: [99, null]` y comprobar si se guarda.
4. No usar datos reales.

### Corrección

Crear un DTO específico:

```ts
export class ActualizarCapacitacionDto {
  @IsOptional() @IsString() @MaxLength(200)
  titulo?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  descripcion?: string;

  @IsOptional() @IsUrl()
  enlace?: string;

  @IsOptional() @IsUUID('4')
  temaId?: string | null;

  @IsOptional() @IsDateString()
  fechaEvento?: string | null;

  @IsOptional() @IsIn(['virtual', 'presencial'])
  modalidad?: 'virtual' | 'presencial';

  @IsOptional() @IsDateString()
  visibleDesde?: string | null;

  @IsOptional() @IsDateString()
  visibleHasta?: string | null;

  @IsOptional() @IsIn(['borrador', 'publicado'])
  estado?: 'borrador' | 'publicado';

  @IsOptional() @IsArray() @ArrayUnique()
  @IsInt({ each: true }) @Min(1, { each: true }) @Max(9, { each: true })
  semestres?: number[];
}
```

Usar `@Body() dto: ActualizarCapacitacionDto` y `@Param('id', ParseUUIDPipe)`. Reemplazar semestres dentro de una transacción.

### Prevención

- Regla: nunca usar `Partial<Dto>` en un parámetro decorado con `@Body`.
- Test de validación que espere 400 para `estado`, fechas y semestres inválidos.
- Activar `forbidNonWhitelisted` ya está global; el problema es el metatipo.

---

## H-06 — Token de recuperación en logs y carrera de uso

- **Severidad:** Alta condicional por logs; Media por carrera.
- **Estado:** Confirmado.
- **OWASP/CWE:** A07:2021, A09:2021; CWE-532, CWE-362, CWE-367.

### Ubicación

- `backend/src/modules/mail/resend.service.ts:96`
- `backend/src/modules/auth/auth.service.ts:130-138,148-159`
- `backend/src/modules/mail/mail.service.ts:30`

### Riesgo

Sin `RESEND_API_KEY`, `ResendService` escribe en el log:

```text
[Resend simulación] Para: ... | URL: ...?token=<token>
```

Si producción no tiene configurado Resend, cualquier persona con acceso a logs puede usar el enlace para restablecer la contraseña. `AuthService` también registra el correo en errores. `MailService` registra los primeros 400 caracteres del HTML, que pueden incluir nombres y contenido.

La validación del token no es atómica:

1. Se lee el registro.
2. Se actualiza el usuario.
3. Se marca el token como usado.

Dos solicitudes concurrentes con el mismo token pueden pasar la validación y establecer contraseñas distintas; la última gana. También pueden crearse varios tokens válidos si dos solicitudes de recuperación corren en paralelo.

### Verificación segura

En staging, con usuario de prueba:

1. Solicitar recuperación sin `RESEND_API_KEY` y revisar el log; confirmar si aparece el token (no copiarlo).
2. Enviar dos `POST /auth/restablecer` concurrentes con el mismo token y contraseñas distintas.
3. Verificar cuántas respuestas son exitosas y cuál contraseña queda.
4. No usar cuentas reales.

### Corrección

Consumo atómico con transacción:

```ts
await this.dataSource.transaction(async (manager) => {
  const res = await manager.createQueryBuilder()
    .update(PasswordReset)
    .set({ usadoAt: new Date() })
    .where('token_hash = :hash AND usado_at IS NULL AND expira_at > now()', {
      hash: AuthService.hashToken(token),
    })
    .returning('*')
    .execute();

  if (!res.affected) throw new BadRequestException('El enlace es inválido o ya venció.');

  const registro = res.raw[0] as PasswordReset;
  await manager.update(User, registro.usuarioId, {
    passwordHash: await bcrypt.hash(password, 12),
    tokenVersion: () => 'token_version + 1',
  });
});
```

Además:

- Nunca registrar tokens, URLs de recuperación ni HTML con PII.
- Si no hay proveedor de correo en producción, fallar el arranque o deshabilitar recuperación; no usar simulación.
- Invalidar todos los tokens pendientes del usuario al emitir uno nuevo, dentro de la misma transacción.
- Limpiar tokens expirados con un cron.

### Prevención

- Test de concurrencia: dos usos del mismo token, solo uno debe funcionar.
- Test de logs: no debe aparecer `token=` ni correos completos.
- Revisión de configuración de correo en producción.

---

## H-07 — Dependencias de producción vulnerables

- **Severidad:** Alta.
- **Estado:** Confirmado con `npm audit --omit=dev`.
- **OWASP/CWE:** A06:2021 Vulnerable and Outdated Components; CWE-1104, CWE-1395.
- **CVSS 3.1:** Varias advisories de 7.5 (DoS); otras moderadas.

### Evidencia

`npm audit --omit=dev` en `backend/` reportó **6 vulnerabilidades: 4 high y 2 moderate**.

| Paquete | Versión instalada | Problema | Corrección |
|---|---:|---|---|
| `@nestjs/platform-express` | 11.2.7 | Depende de `multer` vulnerable | Actualizar/override |
| `multer` | 2.4.0 | DoS por `fileFilter` asíncrono | >= 2.5.0 |
| `body-parser` | 2.3.0 | DoS con bytes extra tras body comprimido | >= 2.4.0 |
| `nodemailer` | 6.10.1 | Múltiples advisories, incl. DoS, CRLF, SSRF/file read | 10.2.1 (major) |
| `@nestjs/swagger` | 11.4.7 | Depende de `js-yaml` vulnerable | Actualizar |
| `js-yaml` | 5.3.0 | Consumo de CPU con merge keys | > 5.4.0 |

El frontend no reportó vulnerabilidades de producción en `npm audit --omit=dev`.

### Riesgo

Las vulnerabilidades de `multer` y `body-parser` permiten denegación de servicio. Las de `nodemailer` incluyen inyección de cabeceras, SSRF/lectura de archivos en escenarios específicos y DoS. Aunque no todas sean explotables con el uso actual, la superficie existe y el costo de actualizar es bajo.

### Verificación segura

```bash
npm --prefix backend audit --omit=dev
npm --prefix backend ls multer body-parser nodemailer js-yaml @nestjs/platform-express @nestjs/swagger
```

No ejecutar `npm audit fix --force` sin revisar cambios major.

### Corrección

1. Actualizar `@nestjs/platform-express`, `express`/`body-parser`, `@nestjs/swagger` y `nodemailer`.
2. Si una actualización major de `nodemailer` no es compatible, evaluar migración controlada; no quedarse en 6.x.
3. Ejecutar tests y build después de actualizar.
4. Agregar `overrides` solo si el árbol de dependencias lo requiere, y documentarlo.

### Prevención

- `npm audit` en CI con fallo para `high`/`critical`.
- Dependabot o Renovate.
- SBOM y escaneo de contenedor.
- Revisión mensual de dependencias.

---

## H-08 — Validación insuficiente de uploads y posible XSS almacenado

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A03:2021 Injection, A05:2021; CWE-434, CWE-79, CWE-646.
- **CVSS 3.1 estimado:** 4.8–5.4 (requiere admin).

### Ubicación

- `backend/src/modules/capacitaciones/capacitaciones.controller.ts:12-29,58,67`
- `backend/src/main.ts:29`

### Riesgo

El upload:

- Solo valida el `mimetype` enviado por el cliente, que puede falsificarse.
- Conserva la extensión original (`extname(file.originalname)`).
- No valida magic bytes ni contenido.
- Guarda en el mismo origen que la aplicación.
- Sirve desde `/uploads/` sin `Content-Disposition`.

Un admin comprometido o malicioso puede subir un archivo con MIME `image/png` pero extensión `.html` o `.svg`. Si se sirve como `text/html` o `image/svg+xml`, al abrirse directamente puede ejecutar JavaScript en el origen de la aplicación y robar el JWT de `localStorage`. Helmet agrega `X-Content-Type-Options: nosniff`, lo que reduce el sniffing, pero no elimina el riesgo si la extensión y el tipo coinciden.

### Verificación segura

En staging:

1. Subir un archivo de prueba inocuo con contenido HTML y `Content-Type: image/png`.
2. Comprobar la extensión guardada y el `Content-Type` con el que se sirve.
3. Revisar `Content-Disposition` y `Content-Security-Policy`.
4. No abrir el archivo en un navegador con sesión real.

### Corrección

- Validar magic bytes con `file-type` o re-encodificar con `sharp`.
- Permitir solo JPEG, PNG y WebP reales; descartar SVG.
- Generar nombre con UUID y extensión derivada del tipo detectado, no del nombre original.
- Guardar fuera del webroot y servir mediante un controlador con:
  - `Content-Type` detectado.
  - `Content-Disposition: inline; filename="..."`.
  - `Content-Security-Policy: sandbox`.
  - `X-Content-Type-Options: nosniff`.
- Limitar dimensiones y procesar la imagen para eliminar metadatos.
- Opcional: antivirus/malware scanning y cuarentena.

### Prevención

- Tests de upload con MIME falso, extensión `.html`, `.svg`, archivo vacío y archivo sobredimensionado.
- Revisión de configuración de `express.static`.
- Servir uploads desde un dominio separado si es posible.

---

# Hallazgos medios

## M-01 — Swagger expuesto en producción

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A05:2021; CWE-200, CWE-489.
- **Ubicación:** `backend/src/main.ts:50-57`.
- **Riesgo:** `/api/docs` se publica siempre, sin condicionar a `NODE_ENV`. Expone rutas, DTOs, esquemas y el esquema de autenticación. No es una brecha directa, pero facilita el reconocimiento.
- **Verificación segura:** En staging, `curl -I /api/docs` y comprobar si responde 200 sin autenticación.
- **Corrección:** Deshabilitar en producción o proteger con autenticación/IP allowlist:
  ```ts
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, doc);
  }
  ```
- **Prevención:** Test de configuración de producción; revisar `NODE_ENV` en Railway.

## M-02 — Rate limiting detrás de proxy y sin bloqueo por cuenta

- **Severidad:** Media.
- **Estado:** Confirmado en código; `POR VERIFICAR` topología de Railway.
- **OWASP/CWE:** A04:2021, A07:2021; CWE-307, CWE-770, CWE-348.
- **Ubicación:** `backend/src/main.ts:17-24`, `backend/src/app.module.ts:34,67`, `backend/src/modules/auth/auth.controller.ts:16,23,30`.
- **Riesgo:** `ThrottlerGuard` usa la IP. Si la app está detrás de un proxy y no se configura `trust proxy`, todas las peticiones pueden parecer de la IP del proxy: el límite global de 100/min se aplica a todos los usuarios juntos y el login de 10/min puede bloquear a todos o no distinguir atacantes. Además, el límite es por IP, no por cuenta; un ataque distribuido puede probar contraseñas. El almacenamiento es en memoria, así que varias instancias no comparten contadores.
- **Verificación segura:** En staging, revisar `req.ip` y `X-Forwarded-For`; enviar >10 logins inválidos desde una IP y comprobar 429; no hacer pruebas de carga contra producción.
- **Corrección:** `app.set('trust proxy', 1)` con el número correcto de proxies; personalizar `ThrottlerGuard` para clave `usuario|correo|ip`; agregar bloqueo progresivo, CAPTCHA y alertas. Usar Redis si hay varias instancias.
- **Prevención:** Test de rate limit con proxy simulado; monitoreo de 429 y fallos de login.

## M-03 — JWT en `localStorage`

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A07:2021, A03:2021; CWE-522, CWE-79.
- **Ubicación:** `frontend/src/app/core/auth.service.ts:20,43-45`, `frontend/src/app/core/jwt.interceptor.ts:4`.
- **Riesgo:** Cualquier XSS puede leer el token y usarlo durante 12 horas. No hay `HttpOnly`, por lo que el navegador no protege el token. Se mitiga parcialmente porque no se encontraron sinks `innerHTML`/`bypassSecurityTrust` en el frontend, pero el riesgo persiste.
- **Verificación segura:** Revisar DevTools > Application > Local Storage en staging; comprobar que el token es accesible por JS.
- **Corrección:** Evaluar cookies `HttpOnly; Secure; SameSite` con protección CSRF, o un BFF. Si se mantiene `localStorage`, reducir TTL, agregar CSP estricta y monitoreo de XSS.
- **Prevención:** Pruebas de XSS, CSP, revisión de dependencias del frontend.

## M-04 — Sin MFA para administradores y sin bloqueo por cuenta

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A07:2021; CWE-308, CWE-307.
- **Ubicación:** `backend/src/modules/users/users.controller.ts:47-57`, endpoints admin.
- **Riesgo:** Una sola contraseña protege funciones que permiten ver usuarios, cambiar roles, restablecer claves, exportar datos y ver capacitaciones en borrador. `verificar-admin` reautentica con contraseña, pero no agrega segundo factor. No hay bloqueo por cuenta ni detección de credential stuffing.
- **Verificación segura:** En staging, comprobar que el login admin solo pide contraseña; revisar si hay MFA en el flujo.
- **Corrección:** MFA TOTP/WebAuthn para `ADMIN`; step-up para acciones sensibles; bloqueo progresivo y alertas; no mostrar secretos en la UI.
- **Prevención:** Tests de autenticación; revisión de flujos de administración.

## M-05 — Inyección de fórmulas en exportación CSV

- **Severidad:** Media-Baja.
- **Estado:** Confirmado.
- **OWASP/CWE:** A03:2021; CWE-1236, CWE-74.
- **Ubicación:** `backend/src/modules/dashboard/dashboard.controller.ts:49-51`.
- **Riesgo:** Los nombres de temas/asignaturas se insertan en CSV sin escapar celdas. Un nombre como `=HYPERLINK("http://...")` o `+cmd|...` puede ejecutarse al abrir el CSV en Excel/LibreOffice. Requiere que un admin cree el nombre y que otro admin abra el archivo; el riesgo es bajo, pero evitable.
- **Verificación segura:** En staging, crear un tema llamado `=1+1`, exportar y revisar el CSV como texto; no abrirlo en Excel.
- **Corrección:** Escapar celdas y prefijar `'` cuando empiecen por `= + - @` o tab/CR; usar una librería CSV; comillas dobles y saltos de línea correctos.
- **Prevención:** Test de exportación con nombres maliciosos; revisión de todos los exports.

## M-06 — Inyección HTML en correos

- **Severidad:** Media-Baja.
- **Estado:** Confirmado.
- **OWASP/CWE:** A03:2021; CWE-79, CWE-93.
- **Ubicación:** `backend/src/modules/recordatorios/recordatorios.service.ts:52`, `backend/src/modules/capacitaciones/capacitaciones.controller.ts:93`.
- **Riesgo:** Se interpolan `est.nombre`, `periodo.nombre`, `cap.titulo`, `cap.descripcion`, `cap.modalidad` y `cap.enlace` en HTML sin escapar. Un nombre o título con HTML puede alterar el correo, inyectar enlaces de phishing o romper el contenido. `escaparHtml` existe en `resend.service.ts` pero no se usa en estas plantillas. El asunto también podría contener CRLF si no se valida.
- **Verificación segura:** En staging, crear un nombre con `<b>prueba</b>` y revisar el HTML generado; no enviar a usuarios reales.
- **Corrección:** Escapar todos los valores dinámicos con `escaparHtml`; validar URLs; usar una plantilla con autoescape; agregar versión texto; validar que asuntos no contengan `\r`/`\n`.
- **Prevención:** Tests de plantillas con caracteres especiales; revisión de todos los correos.

## M-07 — Contenedor Docker ejecutado como root

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A05:2021; CWE-250, CWE-269.
- **Ubicación:** `backend/Dockerfile:10-18`.
- **Riesgo:** La etapa runtime no define `USER`, por lo que el proceso corre como root dentro del contenedor. Si hay RCE o un compromiso de dependencia, el atacante tiene privilegios elevados en el contenedor y puede escribir en el volumen de uploads.
- **Verificación segura:** `docker run --rm --entrypoint id <imagen>` en local; no contra producción.
- **Corrección:** Crear/usar usuario sin privilegios, asignar ownership a `/app` y `/app/uploads`, y `USER node` (o usuario propio). Añadir `HEALTHCHECK`, `read_only`, `tmpfs` y `cap_drop: [ALL]` en Compose.
- **Prevención:** Escaneo de imagen, `hadolint`, política de Dockerfile.

## M-08 — Postgres y Adminer expuestos con credenciales por defecto

- **Severidad:** Media en desarrollo; Crítica si se despliega el Compose tal cual.
- **Estado:** Confirmado.
- **OWASP/CWE:** A05:2021; CWE-1392, CWE-284, CWE-306.
- **Ubicación:** `docker-compose.yml:9-13,29-30,41-42`.
- **Riesgo:** Postgres publica `5432` y Adminer `8081` en todas las interfaces. Los valores por defecto son `postgres/postgres`. Adminer no tiene autenticación propia. Si el host es accesible, la base queda expuesta.
- **Verificación segura:** `docker compose config` y `ss -ltnp` en local; no escanear producción.
- **Corrección:** Bind a `127.0.0.1`, contraseñas fuertes, no publicar Adminer en producción, usar red interna y secretos. Para producción, base gestionada con TLS y acceso restringido.
- **Prevención:** Revisión de Compose; política de “no exponer puertos de datos”.

## M-09 — Sin auditoría de acciones administrativas

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A09:2021; CWE-778, CWE-223.
- **Ubicación:** `backend/src/modules/users/users.controller.ts`, `backend/src/modules/dashboard/dashboard.controller.ts`, `backend/src/modules/auth/auth.service.ts`.
- **Riesgo:** No hay registro estructurado de quién consultó usuarios, quién vio/restableció claves, quién cambió roles, quién exportó datos o quién eliminó registros. Sin auditoría no se puede investigar un incidente ni demostrar control ante la SIC.
- **Verificación segura:** Revisar si existe tabla/tabla de auditoría y si los endpoints admin escriben en ella. Solo lectura.
- **Corrección:** Agregar `audit_log` con actor, acción, objetivo, IP, user-agent, timestamp, resultado y correlación; redactar secretos; retención definida; acceso restringido.
- **Prevención:** Tests de auditoría; revisión de logs; alertas.

## M-10 — PII y tokens en logs

- **Severidad:** Media.
- **Estado:** Confirmado.
- **OWASP/CWE:** A09:2021; CWE-532, CWE-200.
- **Ubicación:** `backend/src/modules/mail/resend.service.ts:96`, `backend/src/modules/auth/auth.service.ts:137`, `backend/src/modules/mail/mail.service.ts:30`, `backend/src/seed.ts:94,101,122,129`.
- **Riesgo:** Se registran correos, URLs con token y fragmentos de HTML con nombres. Los logs pueden ser accedidos por soporte, proveedores o atacantes. Es un tratamiento de datos personales sin minimización.
- **Verificación segura:** Revisar la configuración de logging en staging; buscar `token=` y correos sin imprimir valores reales.
- **Corrección:** Logging estructurado con redacción; IDs de correlación; no loguear tokens, URLs de recuperación, contraseñas ni PII innecesaria; retención y acceso.
- **Prevención:** Tests de redacción; revisión de logs; políticas de retención.

## M-11 — Sin TLS para la base de datos y credenciales por defecto

- **Severidad:** Media condicional.
- **Estado:** `POR VERIFICAR` según el proveedor de base de datos.
- **OWASP/CWE:** A02:2021; CWE-319, CWE-311.
- **Ubicación:** `backend/src/app.module.ts:37-53`, `backend/src/data-source.ts:25-35`.
- **Riesgo:** No se configura `ssl` para Postgres. Si la base es externa y el tráfico sale de la red privada, las credenciales y datos pueden viajar sin cifrar. Además, los defaults `DB_USER=postgres`, `DB_PASSWORD=postgres` permiten arrancar con credenciales débiles si falta configuración.
- **Verificación segura:** Revisar la configuración de Railway/DB; confirmar si la conexión es interna y si el proveedor exige TLS. No probar desde fuera.
- **Corrección:** Soportar `DB_SSL=true` con `ssl: { rejectUnauthorized: true }`; exigir variables de DB en producción; usar un usuario de mínimo privilegio.
- **Prevención:** Validación de entorno; revisión de configuración de infraestructura.

## M-12 — Carreras y falta de transacciones/constraints

- **Severidad:** Media-Baja.
- **Estado:** Confirmado.
- **OWASP/CWE:** A04:2021; CWE-362, CWE-367, CWE-841.
- **Ubicación:**
  - `backend/src/modules/periodos/periodos.service.ts:20,28,41-46`
  - `backend/src/modules/recordatorios/recordatorios.service.ts:53-54`
  - `backend/src/modules/encuestas/encuestas.service.ts:87-98,110-119`
  - `backend/src/modules/encuestas-asignaturas/encuestas-asignaturas.service.ts:103-112,190-224`
- **Riesgo:**
  - Dos activaciones de periodo pueden dejar dos periodos activos.
  - Dos ejecuciones del cron pueden duplicar recordatorios.
  - La respuesta de encuesta y sus ítems no son transaccionales; un fallo intermedio deja datos parciales.
  - La edición borra ítems y luego inserta; un fallo deja la respuesta vacía.
  - Inscripciones: `delete` + `save` sin transacción.
  - Las constraints únicas existen para respuestas e inscripciones, pero no para ítems, semestres de capacitación, recordatorios ni periodo activo.
- **Verificación segura:** En staging, ejecutar dos activaciones concurrentes y dos respuestas concurrentes; comprobar estado final. No hacerlo en producción.
- **Corrección:** Usar `DataSource.transaction` en operaciones multi-tabla; agregar índice único parcial para un solo periodo activo; unique `(usuario_id, periodo_id, numero)` en recordatorios; unique `(respuesta_id, tema_id)`; unique `(capacitacion_id, semestre)`; capturar `23505` y devolver 409.
- **Prevención:** Tests de concurrencia; revisión de constraints.

## M-13 — CORS con `localhost` y fallback de `FRONTEND_URL`

- **Severidad:** Media-Baja.
- **Estado:** Confirmado.
- **OWASP/CWE:** A05:2021; CWE-942, CWE-1188.
- **Ubicación:** `backend/src/main.ts:23-24`, `.env.example:13`.
- **Riesgo:** En producción se permite siempre `http://localhost:4200`. Si `FRONTEND_URL` no se define, los callbacks SSO redirigen a localhost y CORS bloquea el frontend real. `credentials: true` amplía el impacto de una mala configuración de origen. No se observa wildcard, lo cual es positivo.
- **Verificación segura:** Revisar cabeceras CORS en staging con `Origin: http://localhost:4200` y con el origen real; no usar credenciales reales.
- **Corrección:** En producción, permitir solo el origen exacto; eliminar localhost si no se usa; validar `FRONTEND_URL` al arrancar; usar `credentials: false` si no se usan cookies.
- **Prevención:** Test de CORS por entorno; configuración validada.

## M-14 — DTOs inline y falta de `ParseUUIDPipe`

- **Severidad:** Media-Baja.
- **Estado:** Confirmado.
- **OWASP/CWE:** A04:2021; CWE-20, CWE-704.
- **Ubicación:**
  - `backend/src/modules/periodos/periodos.controller.ts:45-49`
  - `backend/src/modules/auth/auth.controller.ts:47`
  - `backend/src/modules/users/users.controller.ts:49`
  - `backend/src/modules/capacitaciones/capacitaciones.controller.ts:49,64,79,86`
  - `backend/src/modules/users/users.controller.ts:59,95,107`
  - `backend/src/modules/dashboard/dashboard-materias.controller.ts:14,20,26,32,38,44`
- **Riesgo:** Los cuerpos inline no pasan por `ValidationPipe` con metatipo de clase; los `:id` no validados como UUID llegan a TypeORM y pueden producir 500. `mi-semestre` convierte con `Number()` y puede guardar `NaN`. `configurarEncuestaAsignaturas` acepta fechas sin validar.
- **Verificación segura:** En staging, enviar `semestre: "abc"`, `id: "no-uuid"` y fechas inválidas; comprobar 400 vs 500.
- **Corrección:** Crear DTOs para todos los cuerpos; usar `ParseUUIDPipe` en todos los `:id`; usar `ParseIntPipe`/DTOs para query params; validar fechas y rangos.
- **Prevención:** Regla de revisión: ningún `@Body` con tipo inline; tests de validación.

## M-15 — Ausencia de controles de seguridad en CI

- **Severidad:** Media-Baja.
- **Estado:** Confirmado.
- **OWASP/CWE:** A06:2021, A09:2021; CWE-1104, CWE-778.
- **Ubicación:** Repositorio sin workflows de CI; `AGENTS.md` confirma que no hay CI.
- **Riesgo:** No hay `npm audit`, escaneo de secretos, SAST, escaneo de contenedor ni tests de autorización automatizados. Los hallazgos pueden reaparecer.
- **Verificación segura:** Revisar `.github/workflows` (no existe) y la configuración de Railway.
- **Corrección:** Pipeline mínimo:
  - `npm ci`
  - `npm audit --omit=dev --audit-level=high`
  - `gitleaks`/`trufflehog`
  - `semgrep` o CodeQL
  - `trivy fs`/`docker scout`
  - tests unitarios y de integración
  - build de backend y frontend
- **Prevención:** Hacer los checks obligatorios en PR.

---

# Hallazgos bajos

## L-01 — Enumeración de usuarios por timing en login

- **Severidad:** Baja.
- **OWASP/CWE:** A07:2021; CWE-208, CWE-203.
- **Ubicación:** `backend/src/modules/auth/auth.service.ts:67-70`.
- **Riesgo:** Si el usuario no existe, se responde sin ejecutar bcrypt; si existe, se ejecuta `bcrypt.compare`. La diferencia de tiempo permite inferir si un correo está registrado, aunque el mensaje sea genérico.
- **Verificación segura:** Medir tiempos en staging con un usuario existente y uno inexistente; no hacerlo contra producción.
- **Corrección:** Ejecutar un hash dummy cuando el usuario no exista o no tenga `passwordHash`, y comparar siempre.
- **Prevención:** Test de tiempos y revisión de flujos de autenticación.

## L-02 — Política de contraseñas débil y costo de bcrypt

- **Severidad:** Baja.
- **OWASP/CWE:** A07:2021; CWE-521, CWE-916.
- **Ubicación:** `backend/src/modules/auth/auth.service.ts:52,145,154`, `backend/src/modules/users/user.dto.ts`.
- **Riesgo:** Solo se exigen 8 caracteres, sin complejidad, sin bloqueo de contraseñas comprometidas y con bcrypt cost 10. Para 2026, cost 12 es más adecuado.
- **Verificación segura:** Revisar DTOs y pruebas de registro; no probar fuerza bruta.
- **Corrección:** Mínimo 12 caracteres o passphrase, verificación contra listas de contraseñas comprometidas, bcrypt cost 12, MFA para admin.
- **Prevención:** Tests de política; revisión periódica.

## L-03 — `numeroIdentificacion` sin unicidad

- **Severidad:** Baja.
- **OWASP/CWE:** A01:2021, A04:2021; CWE-20.
- **Ubicación:** `backend/src/modules/users/user.entity.ts:19-21`.
- **Riesgo:** Se pueden crear varios usuarios con la misma identificación; afecta integridad y trazabilidad.
- **Verificación segura:** En staging, crear dos usuarios con la misma identificación y comprobar si se permite.
- **Corrección:** Índice único parcial si la identificación es obligatoria; normalizar y validar formato.
- **Prevención:** Test de unicidad.

## L-04 — `temaId` y `semestres` con validación incompleta

- **Severidad:** Baja.
- **OWASP/CWE:** A04:2021; CWE-20.
- **Ubicación:** `backend/src/modules/capacitaciones/capacitacion.dto.ts:22-24,46-62`.
- **Riesgo:** `temaId` es solo string, no UUID; `semestres` no valida cada elemento. Puede causar 500 o datos inválidos.
- **Verificación segura:** En staging, enviar `temaId` inválido y `semestres: [0, 10, "x"]`.
- **Corrección:** `@IsUUID('4')` y `@IsInt({ each: true }) @Min(1, { each: true }) @Max(9, { each: true })`.
- **Prevención:** Tests de DTO.

## L-05 — `sso-status` revela si SSO está habilitado

- **Severidad:** Baja.
- **OWASP/CWE:** A05:2021; CWE-200.
- **Ubicación:** `backend/src/modules/auth/auth.controller.ts:51-55`.
- **Riesgo:** Información de reconocimiento de bajo impacto.
- **Verificación segura:** `GET /auth/sso-status` en staging.
- **Corrección:** Es aceptable si el frontend lo necesita; no revelar configuración adicional.
- **Prevención:** Revisión de endpoints públicos.

## L-06 — `enlace` permite HTTP y redirecciones externas

- **Severidad:** Baja.
- **OWASP/CWE:** A03:2021; CWE-601, CWE-79.
- **Ubicación:** `backend/src/modules/capacitaciones/capacitacion.dto.ts:19`.
- **Riesgo:** Un admin puede publicar enlaces HTTP o de phishing; es una función esperada, pero conviene restringir a HTTPS y dominios permitidos.
- **Verificación segura:** Revisar DTO y datos de staging.
- **Corrección:** Exigir HTTPS, permitir dominios institucionales o mostrar advertencia; no usar `javascript:`/`data:`.
- **Prevención:** Validación estricta de URLs.

## L-07 — Clics ilimitados por usuario

- **Severidad:** Baja.
- **OWASP/CWE:** A04:2021; CWE-770.
- **Ubicación:** `backend/src/modules/capacitaciones/capacitaciones.service.ts:109-114`.
- **Riesgo:** Un usuario puede inflar métricas de clics; no hay deduplicación ni límite.
- **Verificación segura:** En staging, enviar varios clics y revisar conteo.
- **Corrección:** Unique por usuario/capacitación/día o ventana, o contar solo el primero.
- **Prevención:** Test de métricas.

## L-08 — Tokens de recuperación expirados sin limpieza

- **Severidad:** Baja.
- **OWASP/CWE:** A04:2021, A09:2021; CWE-459.
- **Ubicación:** `backend/src/modules/auth/password-reset.entity.ts`, `backend/src/modules/auth/auth.service.ts`.
- **Riesgo:** Crecimiento indefinido de la tabla y retención innecesaria de hashes.
- **Verificación segura:** Consultar cantidad de tokens expirados en staging.
- **Corrección:** Cron de limpieza y retención definida.
- **Prevención:** Monitoreo de crecimiento.

## L-09 — Comentario y comportamiento de recuperación para usuarios SSO

- **Severidad:** Baja.
- **OWASP/CWE:** A04:2021; CWE-20.
- **Ubicación:** `backend/src/modules/auth/auth.service.ts:111-141,156`.
- **Riesgo:** El comentario dice “solo usuarios con clave local”, pero el código no valida `proveedorAuth`. Un usuario SSO puede establecer una clave local por correo. Puede ser deseado, pero debe decidirse y documentarse.
- **Verificación segura:** En staging, solicitar recuperación para un usuario SSO de prueba.
- **Corrección:** Validar `proveedorAuth === 'local'` o documentar el flujo.
- **Prevención:** Tests de flujo SSO.

## L-10 — Sin IDs de correlación ni logging estructurado

- **Severidad:** Baja.
- **OWASP/CWE:** A09:2021; CWE-778.
- **Ubicación:** `backend/src/main.ts`, servicios.
- **Riesgo:** Dificulta investigar incidentes y correlacionar acciones.
- **Verificación segura:** Revisar logs de staging.
- **Corrección:** Middleware de `request-id`, logs JSON, redacción de PII.
- **Prevención:** Estándar de logging.

## L-11 — Recordatorios duplicados por falta de unique

- **Severidad:** Baja.
- **OWASP/CWE:** A04:2021; CWE-362.
- **Ubicación:** `backend/src/modules/recordatorios/recordatorio.entity.ts`.
- **Riesgo:** Si el cron se solapa o hay varias instancias, se envían correos duplicados.
- **Verificación segura:** En staging, ejecutar dos veces el cron concurrentemente.
- **Corrección:** Unique `(usuario_id, periodo_id, numero)` y transacción/`ON CONFLICT`.
- **Prevención:** Test de idempotencia.

## L-12 — `password_plano` también en migración de datos existentes

- **Severidad:** Baja como hallazgo separado; forma parte de C-01/C-04.
- **OWASP/CWE:** A02:2021; CWE-256.
- **Ubicación:** `backend/src/migrations/1700000000002-password-plano.ts:7-9`.
- **Riesgo:** Crea valores conocidos para todos los usuarios existentes.
- **Verificación segura:** Consultar solo conteo, no valores.
- **Corrección:** Eliminar la columna y no rellenar contraseñas en migraciones.
- **Prevención:** Revisión de migraciones.

---

# Controles positivos encontrados

- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform` (`main.ts:19-21`).
- Uso consistente de `@Auth(...)` para JWT + roles; el rol se recarga desde la base en `JwtStrategy`, no se confía solo en el rol del token.
- `RolesGuard` verifica el rol actual del usuario.
- Helmet habilitado (`main.ts:17`).
- CORS con orígenes explícitos, sin wildcard (`main.ts:23-24`).
- Throttler global y límites específicos en login, recuperación y restablecimiento.
- bcrypt para hash de contraseñas.
- Token de recuperación aleatorio de 32 bytes, almacenado como hash SHA-256, con expiración de 1 hora y un solo uso; se invalidan tokens previos al solicitar uno nuevo.
- Respuestas genéricas en login y recuperación, sin revelar existencia de cuenta en el mensaje.
- `passwordHash` excluido de `GET /auth/me` y de `GET /usuarios` (aunque `passwordPlano` sí se filtra).
- Consultas raw parametrizadas; no se encontró inyección SQL evidente.
- `synchronize: false`; esquema mediante migraciones.
- Restricciones únicas en respuestas de encuesta e inscripciones.
- Upload con límite de 2 MB y allowlist MIME inicial.
- Seed idempotente para temas y asignaturas; respeta temas eliminados por el admin.
- `.env` está gitignored; solo `.env.example` está versionado.
- No se encontraron sinks `innerHTML`/`bypassSecurityTrust` en el frontend.
- `npm audit --omit=dev` del frontend: 0 vulnerabilidades de producción.

---

# Plan de remediación priorizado

## 0–72 horas

1. Eliminar `password_plano` de entidad, API, UI, seed y migraciones nuevas.
2. Rotar `JWT_SECRET` y todas las credenciales de usuarios; forzar restablecimiento.
3. Invalidar sesiones existentes (aunque sea rotando el secreto JWT).
4. Exigir `ADMIN_PASSWORD` y `ESTUDIANTE_PASSWORD` seguras; desactivar demo en producción.
5. Revisar la tabla `migrations`; si `ResetRespuestas1700000000005` está pendiente, no desplegar sin backup.
6. Sacar el JWT de la URL de SSO; usar código de un solo uso o cookie `HttpOnly`.
7. Corregir BOLA en `GET /capacitaciones/:id` y `POST /:id/clic`.
8. Corregir el DTO de `PATCH /capacitaciones/:id`.
9. Actualizar dependencias vulnerables.
10. Deshabilitar Swagger en producción.

## 1–2 semanas

1. Implementar `tokenVersion` y revocación de sesiones.
2. Implementar `state`/PKCE y verificación de correo en SSO.
3. Consumo atómico de tokens de recuperación y eliminación de tokens en logs.
4. Validación real de uploads por magic bytes/re-encode; servir con cabeceras seguras.
5. Configurar `trust proxy` y rate limiting por cuenta; agregar MFA para admin.
6. Agregar auditoría de acciones administrativas y redacción de PII.
7. Endurecer Docker: usuario no root, `read_only`, `cap_drop`, healthcheck.
8. Bind de Postgres/Adminer a localhost; secretos fuertes; TLS de base de datos.
9. Escapar CSV y HTML de correos.
10. Agregar DTOs faltantes y `ParseUUIDPipe`.

## 30 días

1. Transacciones y constraints para periodo activo, recordatorios, respuestas e inscripciones.
2. Pipeline CI con `npm audit`, escaneo de secretos, SAST, escaneo de contenedor y tests.
3. Tests de autorización por rol/estado/semestre, concurrencia y validación.
4. Revisión de retención de logs y datos personales.
5. Plan de respuesta a incidentes y procedimiento de notificación a la SIC (15 días hábiles).
6. Prueba de restauración de backups.
7. Revisión de configuración de producción y threat model.

---

# Herramientas gratuitas recomendadas

- **Dependencias:** `npm audit`, `osv-scanner`, `OWASP Dependency-Check`, Dependabot/Renovate.
- **Secretos:** `gitleaks`, `trufflehog`, GitHub secret scanning.
- **SAST:** Semgrep, CodeQL, NodeJsScan, Bearer.
- **DAST:** OWASP ZAP, Nuclei (solo entornos autorizados).
- **Contenedores/IaC:** Trivy, Docker Scout, Hadolint, Checkov.
- **Cabeceras/TLS:** Mozilla Observatory, `testssl.sh`, securityheaders.com.
- **JWT:** `jwt_tool` (solo pruebas autorizadas), decodificación manual sin enviar tokens reales.
- **Carga/rate limit:** k6, Artillery (staging).
- **Frontend:** Lighthouse, Retire.js.
- **Revision:** `git grep`, `ripgrep`, revisión de PR.

---

# Checklist post-corrección

- [ ] `git grep -n "passwordPlano\|password_plano"` no devuelve resultados.
- [ ] Ninguna respuesta de API contiene `passwordHash` ni `passwordPlano`.
- [ ] `JWT_SECRET` es fuerte, está en el gestor de secretos y la app falla si falta.
- [ ] `ADMIN_PASSWORD`/`ESTUDIANTE_PASSWORD` no usan valores por defecto; no hay demo en producción.
- [ ] Migraciones revisadas; no hay `TRUNCATE`/`DELETE` masivo sin backup.
- [ ] SSO no pone tokens en URL; usa código de un solo uso/cookie; `state` y PKCE.
- [ ] SSO valida correo verificado y no vincula cuentas locales automáticamente.
- [ ] `tokenVersion` invalida tokens al cambiar contraseña/rol.
- [ ] Tokens de recuperación se consumen atómicamente y no aparecen en logs.
- [ ] BOLA corregido en capacitaciones; tests por rol/estado/semestre.
- [ ] `PATCH` usa DTO validado; todos los `:id` usan `ParseUUIDPipe`.
- [ ] Uploads validan magic bytes, se re-encodifican y se sirven con cabeceras seguras.
- [ ] `npm audit --omit=dev` sin high/critical.
- [ ] Swagger deshabilitado o protegido en producción.
- [ ] `trust proxy` configurado; rate limit por IP y cuenta; MFA admin.
- [ ] CORS solo con el origen exacto; sin localhost en producción.
- [ ] Auditoría de acciones admin y redacción de PII.
- [ ] Docker no corre como root; Postgres/Adminer no expuestos.
- [ ] TLS de base de datos si es externa.
- [ ] Transacciones y constraints en operaciones multi-tabla.
- [ ] CSV y correos escapan datos dinámicos.
- [ ] CI con audit, secretos, SAST, contenedor y tests.
- [ ] Backup y restauración probados.
- [ ] Plan de respuesta a incidentes y notificación SIC.

---

# Anexo A — Evidencia y comandos ejecutados

```bash
npm --prefix backend audit --omit=dev
npm --prefix backend ls multer body-parser nodemailer js-yaml @nestjs/platform-express @nestjs/swagger
npm --prefix frontend audit --omit=dev
git grep -nE 'JWT_SECRET|passwordPlano|password_plano|dev-secret|RESEND_API_KEY|SMTP_|ADMIN_PASSWORD|ESTUDIANTE_PASSWORD|console\.log|query\(|createQueryBuilder|res\.redirect|redirect\('
git grep -nE 'innerHTML|bypassSecurityTrust|DomSanitizer|\[innerHTML\]|eval\(|document\.write|localStorage\.setItem|token='
git ls-files | grep -Ei '(^|/)\.env|secret|credential|\.pem$|\.key$|\.p12$|\.pfx$'
```

Resultados relevantes:

- Backend: 6 vulnerabilidades de producción (4 high, 2 moderate).
- Frontend: 0 vulnerabilidades de producción.
- Solo `.env.example` está versionado; `.env` está gitignored y no se leyó.
- No se encontraron sinks `innerHTML`/`bypassSecurityTrust` en el frontend.
- No se modificó código de la aplicación durante la auditoría.

# Anexo B — `POR VERIFICAR` en producción

- Valor y longitud reales de `JWT_SECRET`.
- Existencia de `ADMIN_PASSWORD`/`ESTUDIANTE_PASSWORD` seguras y ausencia de demo.
- Configuración de `RESEND_API_KEY`/SMTP; si no existe, los tokens se registran en logs.
- `AUTH_SSO_ENABLED` y configuración real de Google/Microsoft.
- Si `/api/docs` y `/uploads` son públicamente accesibles.
- Si Railway/proxy configura `X-Forwarded-For` y si `trust proxy` es necesario.
- Si la base de datos es externa y requiere TLS.
- Si Postgres/Adminer están expuestos en el entorno desplegado.
- Si la imagen Docker se usa en producción o solo Railway/Nixpacks.
- Si `password_plano` sigue poblado en producción.
- Si `ResetRespuestas1700000000005` está aplicada; si no, riesgo de pérdida de datos.
- Si `FRONTEND_URL` es el origen exacto y no localhost.
- Si `ALLOWED_EMAIL_DOMAIN` es el dominio institucional correcto.
- Si los logs son accesibles a terceros o se retienen más de lo necesario.
- Si existen backups y se ha probado su restauración.

# Anexo C — Nota de cumplimiento

Varios hallazgos tienen impacto directo en Ley 1581 de 2012 y en el régimen de protección de datos:

- Contraseñas en claro y PII en logs: falla de seguridad y confidencialidad.
- Falta de auditoría: dificulta demostrar medidas de control.
- Retención de logs y backups: debe definirse y documentarse.
- Incidentes: si hay acceso no autorizado a credenciales, evaluar notificación a la SIC en 15 días hábiles y a los titulares.
- El paquete `paquete-cumplimiento-proteccion-datos.md` contiene el marco legal, políticas y procedimientos; este informe cubre la parte técnica.
