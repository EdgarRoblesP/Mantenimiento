/**
 * Crea el usuario demo (ya verificado) con tareas y subtareas de ejemplo.
 *
 *   npm run seed
 *
 * Credenciales: demo@listwebsite.com / Tareas2026!
 * Es idempotente: si el usuario ya existe, solo repone sus datos de ejemplo.
 */
import { closePool, execute, queryOne } from '../src/config/db.js';
import { hashPassword } from '../src/utils/security.js';

const DEMO_EMAIL = 'demo@listwebsite.com';
const DEMO_PASSWORD = 'Tareas2026!';

const TASKS = [
  {
    title: 'Preparar exposición del proyecto',
    dueDate: '2026-10-05',
    dueTime: '14:15:00',
    completed: false,
    subtasks: [
      { title: 'Armar el guion de la presentación', completed: true },
      { title: 'Diseñar las diapositivas', completed: false },
      { title: 'Ensayar el demo en vivo', completed: false }
    ]
  },
  {
    title: 'Subir código de la práctica 2 al repositorio',
    dueDate: '2026-10-02',
    dueTime: '11:30:00',
    completed: false,
    subtasks: []
  },
  {
    title: 'Revisar apuntes de la clase',
    dueDate: '2026-09-30',
    dueTime: '09:00:00',
    completed: true,
    subtasks: []
  }
];

const run = async () => {
  let user = await queryOne('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);

  if (!user) {
    const result = await execute(
      'INSERT INTO users (email, password_hash, email_verified, verified_at) VALUES (?, ?, 1, NOW())',
      [DEMO_EMAIL, await hashPassword(DEMO_PASSWORD)]
    );
    user = { id: result.insertId };
    console.info(`[seed] Usuario creado: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.info(`[seed] El usuario ${DEMO_EMAIL} ya existía; se reponen sus tareas.`);
    await execute('DELETE FROM tasks WHERE user_id = ?', [user.id]);
  }

  for (const task of TASKS) {
    const result = await execute(
      'INSERT INTO tasks (user_id, title, due_date, due_time, completed, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        user.id,
        task.title,
        task.dueDate,
        task.dueTime,
        task.completed ? 1 : 0,
        task.completed ? new Date() : null
      ]
    );

    for (const subtask of task.subtasks) {
      await execute(
        'INSERT INTO subtasks (task_id, title, completed, completed_at) VALUES (?, ?, ?, ?)',
        [result.insertId, subtask.title, subtask.completed ? 1 : 0, subtask.completed ? new Date() : null]
      );
    }
  }

  console.info(`[seed] ${TASKS.length} tareas de ejemplo insertadas.`);
};

run()
  .catch((error) => {
    console.error('[seed] Falló el sembrado:', error.message);
    process.exitCode = 1;
  })
  .finally(closePool);
