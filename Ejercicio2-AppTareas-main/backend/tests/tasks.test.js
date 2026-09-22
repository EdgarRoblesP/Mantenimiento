/**
 * Métrica de éxito 5: las tareas y subtareas se almacenan en MySQL y se
 * recuperan después de reiniciar la aplicación (NRF-06 … NRF-10).
 */
import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearOutbox,
  closeDatabase,
  lastEmailToken,
  resetDatabase,
  startServer
} from './helpers/testDb.js';
import { queryOne } from '../src/config/db.js';

const PASSWORD = 'Tareas2026!';
const NUEVA_TAREA = {
  title: 'Preparar exposición del proyecto',
  dueDate: '2026-10-05',
  dueTime: '14:15'
};

let api;

before(async () => {
  api = await startServer();
});

after(async () => {
  await api.close();
  await closeDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  clearOutbox();
});

/** Crea una cuenta verificada y devuelve su token de sesión. */
const signIn = async (email = 'tareas@listwebsite.com') => {
  await api.post('/auth/register', { email, password: PASSWORD });
  await api.post('/auth/verify-email', { token: lastEmailToken() });
  clearOutbox();
  const { body } = await api.post('/auth/login', { email, password: PASSWORD });
  return body.token;
};

const addSubtasks = async (token, taskId, titles) => {
  let task;
  for (const title of titles) {
    ({
      body: { task }
    } = await api.post(`/tasks/${taskId}/subtasks`, { title }, { token }));
  }
  return task;
};

// --- NRF-06: crear tareas ----------------------------------------------------

test('NRF-06 · crea una tarea con nombre, fecha y hora', async () => {
  const token = await signIn();

  const response = await api.post('/tasks', NUEVA_TAREA, { token });

  assert.equal(response.status, 201);
  assert.equal(response.body.task.title, NUEVA_TAREA.title);
  assert.equal(response.body.task.dueDate, '2026-10-05');
  assert.equal(response.body.task.dueTime, '14:15');
  assert.equal(response.body.task.completed, false);
});

test('NRF-06 · exige nombre, fecha y hora válidos', async () => {
  const token = await signIn();

  const sinNombre = await api.post('/tasks', { ...NUEVA_TAREA, title: '   ' }, { token });
  assert.equal(sinNombre.status, 400);
  assert.match(sinNombre.body.error.fields.title, /nombre para la tarea/);

  const malaFecha = await api.post('/tasks', { ...NUEVA_TAREA, dueDate: '05/10/2026' }, { token });
  assert.equal(malaFecha.status, 400);
  assert.ok(malaFecha.body.error.fields.dueDate);
});

test('NRF-06 · no se pueden crear tareas sin sesión', async () => {
  const response = await api.post('/tasks', NUEVA_TAREA);
  assert.equal(response.status, 401);
});

// --- Persistencia (métrica 5) ------------------------------------------------

test('Persistencia · la tarea queda guardada en MySQL', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });

  const row = await queryOne('SELECT * FROM tasks WHERE id = ?', [body.task.id]);

  assert.ok(row, 'la tarea debería existir en la tabla tasks');
  assert.equal(row.title, NUEVA_TAREA.title);
  assert.equal(row.due_date, '2026-10-05');
  assert.equal(row.due_time, '14:15:00');
});

test('Persistencia · tareas y subtareas sobreviven al reinicio de la aplicación', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  await addSubtasks(token, body.task.id, ['Armar el guion', 'Diseñar diapositivas']);

  // Se cierra el servidor y se levanta otro: simula el reinicio. El pool de
  // MySQL es el mismo proceso, pero los datos ya no están en memoria de la app.
  await api.close();
  api = await startServer();

  const response = await api.get('/tasks', { token });

  assert.equal(response.status, 200);
  assert.equal(response.body.tasks.length, 1);
  assert.equal(response.body.tasks[0].title, NUEVA_TAREA.title);
  assert.equal(response.body.tasks[0].subtasks.length, 2);
});

test('Persistencia · cada usuario solo ve y toca sus propias tareas', async () => {
  const tokenA = await signIn('usuario.a@listwebsite.com');
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token: tokenA });

  const tokenB = await signIn('usuario.b@listwebsite.com');

  const lista = await api.get('/tasks', { token: tokenB });
  assert.equal(lista.body.tasks.length, 0);

  const ajena = await api.get(`/tasks/${body.task.id}`, { token: tokenB });
  assert.equal(ajena.status, 404);

  const borrado = await api.del(`/tasks/${body.task.id}`, { token: tokenB });
  assert.equal(borrado.status, 404);
});

test('Persistencia · eliminar una tarea borra también sus subtareas', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  await addSubtasks(token, body.task.id, ['Una', 'Otra']);

  const response = await api.del(`/tasks/${body.task.id}`, { token });
  assert.equal(response.status, 204);

  const huerfanas = await queryOne('SELECT COUNT(*) AS total FROM subtasks WHERE task_id = ?', [
    body.task.id
  ]);
  assert.equal(Number(huerfanas.total), 0);
});

test('Persistencia · eliminar borra la tarea indicada y no otra', async () => {
  // Regresión del defecto original `splice(index + 1, 1)` en TaskService.
  const token = await signIn();
  const primera = await api.post('/tasks', { ...NUEVA_TAREA, title: 'Primera' }, { token });
  const segunda = await api.post('/tasks', { ...NUEVA_TAREA, title: 'Segunda' }, { token });

  await api.del(`/tasks/${primera.body.task.id}`, { token });

  const { body } = await api.get('/tasks', { token });
  assert.equal(body.tasks.length, 1);
  assert.equal(body.tasks[0].id, segunda.body.task.id);
  assert.equal(body.tasks[0].title, 'Segunda');
});

// --- NRF-07: subtareas -------------------------------------------------------

test('NRF-07 · crea subtareas que solo guardan el nombre', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });

  const response = await api.post(
    `/tasks/${body.task.id}/subtasks`,
    { title: 'Ensayar el demo' },
    { token }
  );

  assert.equal(response.status, 201);
  assert.equal(response.body.task.subtasks.length, 1);
  assert.equal(response.body.task.subtasks[0].title, 'Ensayar el demo');
  assert.equal(response.body.task.subtasks[0].completed, false);
});

test('NRF-07 · la subtarea necesita un nombre', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });

  const response = await api.post(`/tasks/${body.task.id}/subtasks`, { title: '' }, { token });

  assert.equal(response.status, 400);
  assert.match(response.body.error.fields.title, /nombre/);
});

// --- NRF-08: completar -------------------------------------------------------

test('NRF-08 · marca y desmarca una tarea como completada', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });

  const completada = await api.patch(
    `/tasks/${body.task.id}/completed`,
    { completed: true },
    { token }
  );
  assert.equal(completada.body.task.completed, true);

  const pendiente = await api.patch(
    `/tasks/${body.task.id}/completed`,
    { completed: false },
    { token }
  );
  assert.equal(pendiente.body.task.completed, false);
});

test('NRF-08 · completar la tarea arrastra a sus subtareas', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  await addSubtasks(token, body.task.id, ['Una', 'Otra']);

  const response = await api.patch(
    `/tasks/${body.task.id}/completed`,
    { completed: true },
    { token }
  );

  assert.ok(response.body.task.subtasks.every((subtask) => subtask.completed));
  assert.equal(response.body.task.progress, 100);
});

// --- NRF-09: completado automático ------------------------------------------

test('NRF-09 · al completar la última subtarea la tarea se marca sola', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  const conSubtareas = await addSubtasks(token, body.task.id, ['Una', 'Otra']);
  const [primera, segunda] = conSubtareas.subtasks;

  const parcial = await api.patch(
    `/subtasks/${primera.id}/completed`,
    { completed: true },
    { token }
  );
  assert.equal(parcial.body.task.completed, false, 'con una subtarea pendiente sigue abierta');

  const total = await api.patch(
    `/subtasks/${segunda.id}/completed`,
    { completed: true },
    { token }
  );
  assert.equal(total.body.task.completed, true);
});

test('NRF-09 · reabrir una subtarea devuelve la tarea a pendiente', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  const conSubtareas = await addSubtasks(token, body.task.id, ['Una', 'Otra']);

  for (const subtask of conSubtareas.subtasks) {
    await api.patch(`/subtasks/${subtask.id}/completed`, { completed: true }, { token });
  }

  const response = await api.patch(
    `/subtasks/${conSubtareas.subtasks[0].id}/completed`,
    { completed: false },
    { token }
  );

  assert.equal(response.body.task.completed, false);
});

test('NRF-09 · añadir una subtarea nueva reabre una tarea ya completada', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  const conSubtareas = await addSubtasks(token, body.task.id, ['Única']);

  await api.patch(
    `/subtasks/${conSubtareas.subtasks[0].id}/completed`,
    { completed: true },
    { token }
  );

  const response = await api.post(
    `/tasks/${body.task.id}/subtasks`,
    { title: 'Aparece después' },
    { token }
  );

  assert.equal(response.body.task.completed, false);
  assert.equal(response.body.task.progress, 50);
});

// --- NRF-10: barra de progreso ----------------------------------------------

test('NRF-10 · el progreso refleja la proporción de subtareas completadas', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  const conSubtareas = await addSubtasks(token, body.task.id, ['Una', 'Otra', 'Tercera']);

  assert.equal(conSubtareas.progress, 0);

  const uno = await api.patch(
    `/subtasks/${conSubtareas.subtasks[0].id}/completed`,
    { completed: true },
    { token }
  );
  assert.equal(uno.body.task.progress, 33);

  const dos = await api.patch(
    `/subtasks/${conSubtareas.subtasks[1].id}/completed`,
    { completed: true },
    { token }
  );
  assert.equal(dos.body.task.progress, 67);
});

test('NRF-10 · sin subtareas el progreso sigue el estado de la tarea', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });

  assert.equal(body.task.progress, 0);

  const completada = await api.patch(
    `/tasks/${body.task.id}/completed`,
    { completed: true },
    { token }
  );
  assert.equal(completada.body.task.progress, 100);
});

test('NRF-10 · eliminar subtareas recalcula el progreso', async () => {
  const token = await signIn();
  const { body } = await api.post('/tasks', NUEVA_TAREA, { token });
  const conSubtareas = await addSubtasks(token, body.task.id, ['Una', 'Otra']);
  const [primera, segunda] = conSubtareas.subtasks;

  await api.patch(`/subtasks/${primera.id}/completed`, { completed: true }, { token });
  const response = await api.del(`/subtasks/${segunda.id}`, { token });

  assert.equal(response.body.task.progress, 100);
  assert.equal(response.body.task.completed, true);
});
