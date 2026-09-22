# List Website · API

API REST de tareas y subtareas con autenticación por correo electrónico.

- Node 20 (ESM) + Express 4
- MySQL 8 con `mysql2/promise`
- JWT con sesión respaldada en base de datos
- Brevo para el envío de correos

## Estructura

```
src/
├── config/        env.js (variables) y db.js (pool de MySQL)
├── middleware/    auth.js, validate.js (Zod), errorHandler.js
├── repositories/  Acceso a datos; única capa que escribe SQL
├── services/      Reglas de negocio (incluye NRF-09) y mailer
├── controllers/   Traducen HTTP ↔ servicios
├── routes/        Montaje y esquemas de validación
├── app.js         Construcción de la app Express
└── server.js      Arranque, comprobación de MySQL y apagado limpio
```

La regla es que los controladores no tocan SQL y los repositorios no conocen
HTTP; toda la lógica que cruza varias tablas vive en `services/`.

## Endpoints

Todas las respuestas de error tienen la forma:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

### Autenticación

| Método | Ruta | Requisito |
|---|---|---|
| POST | `/api/auth/register` | NRF-01 |
| POST | `/api/auth/verify-email` | NRF-02 |
| POST | `/api/auth/resend-verification` | NRF-02 |
| POST | `/api/auth/login` | NRF-03 |
| POST | `/api/auth/logout` 🔒 | NRF-05 |
| POST | `/api/auth/forgot-password` | NRF-04 |
| POST | `/api/auth/reset-password` | NRF-04 |
| GET | `/api/auth/me` 🔒 | — |

### Tareas y subtareas (todas 🔒)

| Método | Ruta | Requisito |
|---|---|---|
| GET | `/api/tasks` | — |
| POST | `/api/tasks` | NRF-06 |
| GET | `/api/tasks/:id` | — |
| PATCH | `/api/tasks/:id` | — |
| PATCH | `/api/tasks/:id/completed` | NRF-08 |
| DELETE | `/api/tasks/:id` | — |
| POST | `/api/tasks/:taskId/subtasks` | NRF-07 |
| PATCH | `/api/subtasks/:id` | — |
| PATCH | `/api/subtasks/:id/completed` | NRF-08 → NRF-09 |
| DELETE | `/api/subtasks/:id` | — |

🔒 exige `Authorization: Bearer <token>`.

Toda operación sobre subtareas devuelve la **tarea padre completa**, ya con su
`progress` recalculado (NRF-10) y su `completed` actualizado (NRF-09), para que
el frontend no tenga que volver a pedir la lista.

## Decisiones

**Sesiones en base de datos.** Un JWT firmado no se puede invalidar antes de que
caduque, y NRF-05 exige que cerrar sesión invalide la sesión activa. Cada token
lleva un `jti` que apunta a una fila de `user_sessions`; el logout marca
`revoked_at` y el middleware rechaza el token a partir de ese momento. Cambiar
la contraseña revoca todas las sesiones del usuario.

**Tokens de correo hasheados.** En `auth_tokens` solo se guarda el SHA-256; el
valor en claro existe únicamente en el enlace enviado. Quien lea la base no
puede secuestrar una recuperación de contraseña.

**Respuestas genéricas.** `forgot-password` y `resend-verification` responden lo
mismo exista o no la cuenta, y el login da el mismo error para contraseña
incorrecta que para usuario inexistente. Así no se puede usar la API para
averiguar qué correos están registrados.

## Comandos

```bash
npm run dev        # recarga automática
npm start          # producción
npm run migrate    # aplica database/schema.sql
npm run seed       # usuario y tareas de ejemplo
npm test           # pruebas (necesitan una base de pruebas)
```
