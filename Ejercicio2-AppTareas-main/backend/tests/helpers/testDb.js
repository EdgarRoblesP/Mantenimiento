/**
 * Utilidades compartidas por las pruebas.
 *
 * Las pruebas corren contra una base MySQL real (métrica de éxito 5: comprobar
 * persistencia en MySQL), no contra dobles. Usa una base dedicada, p. ej.:
 *
 *   mysql -u root -p -e "CREATE DATABASE list_website_test CHARACTER SET utf8mb4"
 *   DB_NAME=list_website_test npm run migrate
 *   DB_NAME=list_website_test npm test
 */
import { pool, query } from '../../src/config/db.js';
import { createApp } from '../../src/app.js';
import { outbox } from '../../src/services/mailer.js';

/**
 * Deja la base vacía entre pruebas.
 *
 * `FOREIGN_KEY_CHECKS` es una variable de sesión, así que todo tiene que correr
 * sobre la MISMA conexión: con el pool, cada sentencia podría tocar una
 * conexión distinta y el desactivado no aplicaría.
 */
export const resetDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['subtasks', 'tasks', 'auth_tokens', 'user_sessions', 'users']) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    connection.release();
  }
};

/** Levanta la app en un puerto libre y devuelve helpers para llamarla. */
export const startServer = async () => {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const request = async (method, path, { body, token } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null
    };
  };

  return {
    request,
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    del: (path, options) => request('DELETE', path, options),
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

/**
 * En la base solo vive el hash del token, así que el valor en claro se toma del
 * buzón simulado del mailer (`BREVO_API_KEY` vacía durante las pruebas).
 */
export const lastEmailToken = () => {
  const last = outbox.at(-1);
  if (!last) {
    throw new Error('No se envió ningún correo.');
  }
  return new URL(last.url).searchParams.get('token');
};

export const lastEmail = () => outbox.at(-1) ?? null;

export const clearOutbox = () => {
  outbox.length = 0;
};

/** Fila cruda de `auth_tokens`, para comprobar caducidad y uso. */
export const lastAuthTokenRow = async (type) => {
  const rows = await query(
    'SELECT * FROM auth_tokens WHERE type = ? ORDER BY id DESC LIMIT 1',
    [type]
  );
  return rows[0] ?? null;
};

export const closeDatabase = () => pool.end();
