# Contexto del proyecto

## Qué es SIGICE

SIGICE es un sistema web para el área de Proyección Social del programa de
Ingeniería de Sistemas. Su propósito es conocer los intereses tecnológicos de los
estudiantes y ofrecer capacitaciones pertinentes por semestre.

## Usuarios y roles

| Rol | Necesidades principales |
| --- | --- |
| `ESTUDIANTE` | Registrarse/ingresar, responder la encuesta de intereses, inscribir y evaluar asignaturas, consultar capacitaciones |
| `ADMIN` | Gestionar usuarios, periodos, temas, asignaturas y capacitaciones; consultar dashboard y enviar recordatorios |

El registro público está deshabilitado en la práctica: los administradores crean
usuarios desde `/admin/usuarios`. El dominio de correo permitido se controla con
`ALLOWED_EMAIL_DOMAIN` al crear usuarios y en el registro, no en el login.

## Flujo principal del estudiante

1. Ingresa con correo y contraseña (o SSO si está habilitado). El SSO canjea un
   código de un solo uso, nunca un token en la URL.
2. Si hay un periodo activo, responde la encuesta:
   - `seleccion`: elige hasta 5 temas, sin puntajes.
   - `calificacion`: asigna 1–5 a cada tema.
3. Los temas se presentan en orden mezclado de forma determinista por usuario y
   periodo.
4. Si aplica, se inscribe en asignaturas y las evalúa.
5. Consulta las capacitaciones publicadas para su semestre y registra clics.

Sin periodo activo, la encuesta no está disponible.

## Flujo principal del administrador

1. Inicia sesión y crea/activa un periodo académico.
2. Configura el modo de encuesta.
3. Gestiona el catálogo de temas y asignaturas.
4. Crea capacitaciones, les asigna semestres objetivo, imagen y vigencia.
5. Consulta métricas de participación, intereses y clics.
6. Envía recordatorios manuales; el sistema también ejecuta recordatorios
   automáticos a los días 7 y 14.

## Reglas de negocio

- Exactamente un periodo puede estar activo.
- La encuesta solo se habilita con periodo activo.
- Una respuesta pertenece a un usuario y periodo; los temas respondidos se
  registran en `respuesta_temas`.
- Las capacitaciones se filtran por semestre y vigencia.
- Los recordatorios son idempotentes por usuario/periodo/día.
- Los enlaces de recuperación son de un solo uso y vencen en 1 hora.
- Los correos de recuperación no revelan si la cuenta existe.
- Los códigos SSO son de un solo uso, vencen en 60 segundos y se guardan hasheados.

## Glosario

- **Periodo:** ciclo académico (por ejemplo `2026-2`) con configuración de
  encuesta.
- **Tema:** interés tecnológico que el estudiante selecciona o califica.
- **Modo selección:** el estudiante elige hasta 5 temas; no hay puntajes.
- **Modo calificación:** el estudiante asigna un valor de 1 a 5 a cada tema.
- **Capacitación:** actividad formativa con semestres objetivo, imagen y vigencia.
- **Inscripción:** relación entre estudiante y asignatura para evaluación.
- **Recordatorio:** correo automático o manual para incentivar participación.

## Restricciones y supuestos

- La aplicación está pensada para estudiantes de Ingeniería de Sistemas de 1 a 9
  semestres.
- El correo institucional es el identificador principal de la cuenta.
- El frontend y el backend se despliegan juntos en Railway; no hay nginx en ese
  camino.
- Sin SMTP o Resend configurados, los correos se simulan en el log.
- El sistema maneja datos personales; aplican Ley 1581 de 2012 y normas
  colombianas de protección de datos.

## Seguridad y operación

- Las contraseñas nuevas se almacenan con Argon2id (parámetros OWASP); los hashes
  bcrypt existentes se verifican y solo se rehashean si
  `PASSWORD_REHASH_ON_LOGIN=true`.
- El JWT de sesión vive en `sessionStorage`, nunca en `localStorage`.
- El callback SSO entrega un código aleatorio en cookie `HttpOnly` y el frontend
  lo canjea en `POST /api/auth/sso/exchange`; no se aceptan tokens ni temporales
  en fragment/query.
- El acceso es deny-by-default: toda ruta requiere `@Public()` o `@Auth(...)`.
- Las migraciones y el seed no se ejecutan automáticamente en producción; el
  arranque fuerza `NODE_ENV=production` y la migración exige
  `MIGRATE_CONFIRM=YES`.
- Los logs no incluyen contraseñas, tokens, códigos SSO, correos ni HTML de
  correos; las auditorías de dependencias de producción deben quedar en cero.

## Estado de documentación

Este documento describe el contexto funcional. Los detalles técnicos están en
`TECH_STACK.md` y `ARCHITECTURE.md`; las convenciones operativas, en `AGENTS.md`.
La auditoría de seguridad y el paquete de cumplimiento son entregables separados.
