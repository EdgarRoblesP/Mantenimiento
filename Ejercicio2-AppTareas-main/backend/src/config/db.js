import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Railway entrega la conexión como una URL (`mysql://user:pass@host:port/base`).
 * En local se usan las variables sueltas. Ambas rutas terminan en la misma
 * configuración de pool.
 */
const buildPoolConfig = () => {
  const base = {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    // Devuelve DATE/DATETIME como string para evitar corrimientos de zona
    // horaria entre MySQL, el backend y el navegador.
    dateStrings: true,
    timezone: 'Z'
  };

  if (env.db.url) {
    const url = new URL(env.db.url);
    return {
      ...base,
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined
    };
  }

  return {
    ...base,
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined
  };
};

export const pool = mysql.createPool(buildPoolConfig());

/** Ejecuta una consulta y devuelve solo las filas. */
export const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/** Ejecuta una consulta de escritura y devuelve el ResultSetHeader. */
export const execute = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

/** Devuelve la primera fila o `null`. */
export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Ejecuta `work` dentro de una transacción, con commit/rollback automáticos.
 * `work` recibe la conexión para poder encadenar consultas.
 */
export const withTransaction = async (work) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/** Comprueba que la base responde; se usa al arrancar y en /api/health. */
export const checkConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const closePool = () => pool.end();
