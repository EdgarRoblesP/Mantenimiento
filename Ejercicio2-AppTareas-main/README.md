# List Website

Gestor de tareas con cuentas de usuario, subtareas y persistencia en MySQL.
Mantenimiento del *Ejercicio 2 – App de Tareas* según `Mantenimiento_SDD.md`.

```
Ejercicio2-AppTareas-main/
├── backend/         API REST (Node 20 + Express + MySQL)
│   └── database/    Esquema MySQL y datos de ejemplo
├── task-manager/    Frontend (Angular 19)
└── Mantenimiento_SDD.md
```

---

## Requisitos previos

- Node.js >= 20
- npm >= 9
- MySQL >= 8
- Angular CLI >= 17 (`npm install -g @angular/cli`)

---

## Puesta en marcha

### 1. Base de datos

```bash
mysql -u root -p -e "CREATE DATABASE list_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

### 2. Backend

```bash
cd backend
cp .env.example .env     # Windows: copy .env.example .env
npm install
npm run migrate          # aplica database/schema.sql
npm run seed             # opcional: demo@listwebsite.com / Tareas2026!
npm run dev              # http://localhost:3000/api
```

En `.env` hay que rellenar como mínimo `JWT_SECRET` y los datos de `DB_*`.
Genera el secreto con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Correo sin cuenta de Brevo:** si `BREVO_API_KEY` queda vacía, el backend no
envía nada y escribe los enlaces de verificación y recuperación en su consola.
Basta con copiarlos al navegador para probar el flujo completo en local.

### 3. Frontend

```bash
cd task-manager
npm install
npm start                # http://localhost:4200
```

La URL de la API se configura en `src/environments/environment.ts`.

---

## Pruebas automatizadas

Cubren las métricas de éxito 4 (autenticación) y 5 (persistencia) del SDD.
Corren contra una base MySQL real, distinta de la de desarrollo:

```bash
mysql -u root -p -e "CREATE DATABASE list_website_test CHARACTER SET utf8mb4"

cd backend
DB_NAME=list_website_test npm run migrate
DB_NAME=list_website_test npm test
```

En PowerShell:

```powershell
$env:DB_NAME = 'list_website_test'
npm run migrate
npm test
```

| Archivo | Cubre |
|---|---|
| `tests/auth.test.js` | NRF-01 a NRF-05: registro, verificación, login, logout y recuperación |
| `tests/tasks.test.js` | NRF-06 a NRF-10: tareas, subtareas, completado automático y progreso |

---

## Requisitos del SDD y dónde se cumplen

| ID | Requisito | Implementación |
|---|---|---|
| NRF-01 | Registro con correo y contraseña | `POST /api/auth/register` · `pages/register` |
| NRF-02 | Autenticación del correo | `auth_tokens` + Brevo · `pages/verify-email` |
| NRF-03 | Inicio de sesión | `POST /api/auth/login` · `pages/login` |
| NRF-04 | Recuperación de contraseña | `forgot-password` / `reset-password` |
| NRF-05 | Cierre de sesión | Tabla `user_sessions`; el logout revoca el `jti` del JWT |
| NRF-06 | Tareas con nombre, fecha y hora | `tasks.due_date` / `due_time` · `task-input` |
| NRF-07 | Subtareas con solo nombre | Tabla `subtasks` · `subtask-list` |
| NRF-08 | Marcar como completadas | `PATCH .../completed` en tareas y subtareas |
| NRF-09 | Completado automático de la tarea | `syncCompletionFromSubtasks` en `taskService.js` |
| NRF-10 | Barra de progreso | Campo `progress` calculado en SQL · `progress-bar` |
| RNF-01 | Colores saturados | `task-manager/src/styles/tokens.css` |
| RNF-02 | Railway y Brevo | `backend/railway.json` · `services/mailer.js` |
| RNF-03 | Base de datos en MySQL | `backend/database/schema.sql` |
| RNF-04 | Refactorización | Ver la sección siguiente |

---

## Refactorización y defectos corregidos (RNF-04)

Durante la migración se encontraron cuatro defectos en el código original.
Todos están corregidos y con prueba de regresión donde aplica.

| Defecto | Dónde estaba | Efecto | Corrección |
|---|---|---|---|
| `splice(index + 1, 1)` | `TaskService.deleteTask` | Borraba la tarea **siguiente** a la seleccionada; la última no se podía borrar | Se borra por id en el backend (`DELETE /api/tasks/:id`). Prueba: *«eliminar borra la tarea indicada y no otra»* |
| Filtro `completed` devolvía `!task.completed` | `TaskService.filterTasks` | «Completadas» mostraba las pendientes | Cada rama filtra por el estado que anuncia |
| `pendingCount` contaba las completadas | `TaskCounterComponent` | El contador de pendientes mostraba el número equivocado | Se separan `pendingCount` y `completedCount` |
| `updateTaskTitle` mutaba sin emitir | `TaskService` | La vista no se actualizaba al renombrar una tarea | Se aplica la tarea que devuelve la API mediante el `BehaviorSubject` |

Otros cambios estructurales:

- Capas separadas en el backend: `routes → controllers → services → repositories`.
- Manejo de errores centralizado (`middleware/errorHandler.js`), con un formato
  único `{ code, message, fields }` que el frontend traduce a los estados de
  error del diseño.
- Estilos sin colores literales: todo pasa por `styles/tokens.css`.
- Componentes de UI reutilizables (`form-field`, `password-input`, `banner`,
  `auth-card`) en lugar de repetir el mismo formulario en cinco pantallas.

---

## Despliegue en Railway (RNF-02)

1. Crear un proyecto y añadirle un servicio **MySQL**.
2. Añadir un servicio desde el repositorio con raíz
   `Ejercicio2-AppTareas-main/backend` (incluye `database/schema.sql`).
   `railway.json` ya define el `startCommand` (migra y arranca) y el healthcheck
   en `/api/health`.
3. Variables del servicio backend:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` |
   | `DB_SSL` | `true` |
   | `JWT_SECRET` | cadena aleatoria larga |
   | `BREVO_API_KEY` | API key de Brevo |
   | `MAIL_FROM_EMAIL` | remitente verificado en Brevo |
   | `FRONTEND_URL` | URL pública del frontend |
   | `NODE_ENV` | `production` |

4. Poner la URL pública del backend en
   `task-manager/src/environments/environment.production.ts`.
5. Añadir otro servicio desde el repositorio (GitHub Repository) con raíz
   `Ejercicio2-AppTareas-main/task-manager`. Su `railway.json` compila con
   `npm run build` y sirve `dist/task-manager/browser` con `serve -s`, que
   responde `index.html` en cualquier ruta (necesario para los enlaces de
   los correos, p. ej. `/verify-email?token=…`).
6. Copiar la URL pública del frontend en `FRONTEND_URL` del backend.

---

## Diseño

Archivo de Figma: **List Website – Mantenimiento SDD**
`https://www.figma.com/design/iB0ecveG98qUzLqb2vJBFp`

Los nombres de los tokens en `src/styles/tokens.css` replican los de la
colección de variables «List Website · Colores» del archivo, de modo que el
CSS y el diseño hablan el mismo vocabulario.

El archivo `figma-estados-error.script.js` (plugin Scripter) genera en Figma las
pantallas de error y validación: registro con errores, correo ya registrado,
credenciales incorrectas, cuenta sin verificar, correo no encontrado, enlace
enviado, requisitos de contraseña y validación de nueva tarea.
