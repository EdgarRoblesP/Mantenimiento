/**
 * Aplica `database/schema.sql` sobre la base configurada en el entorno.
 *
 *   npm run migrate
 *
 * El esquema usa CREATE TABLE IF NOT EXISTS y CREATE OR REPLACE VIEW, así que
 * volver a ejecutarlo es seguro.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, '../../database/schema.sql');

const connectionConfig = () => {
  if (env.db.url) {
    const url = new URL(env.db.url);
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined
    };
  }
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined
  };
};

const run = async () => {
  const sql = await readFile(schemaPath, 'utf8');

  // `multipleStatements` permite mandar el archivo completo en una sola llamada.
  const connection = await mysql.createConnection({
    ...connectionConfig(),
    multipleStatements: true
  });

  try {
    await connection.query(sql);
    console.info(`[migrate] Esquema aplicado sobre "${connectionConfig().database}".`);
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error('[migrate] Falló la migración:', error.message);
  process.exit(1);
});
