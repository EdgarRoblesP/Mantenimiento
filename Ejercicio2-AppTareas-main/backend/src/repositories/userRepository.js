import { execute, query, queryOne } from '../config/db.js';
import { toMysqlDateTime } from '../utils/security.js';

const mapUser = (row) =>
  row && {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerified: row.email_verified === 1,
    createdAt: row.created_at
  };

export const findByEmail = async (email) =>
  mapUser(await queryOne('SELECT * FROM users WHERE email = ? LIMIT 1', [email]));

export const findById = async (id) =>
  mapUser(await queryOne('SELECT * FROM users WHERE id = ? LIMIT 1', [id]));

export const createUser = async (email, passwordHash) => {
  const result = await execute(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  );
  return findById(result.insertId);
};

export const markEmailVerified = (userId) =>
  execute(
    'UPDATE users SET email_verified = 1, verified_at = NOW() WHERE id = ?',
    [userId]
  );

export const updatePassword = (userId, passwordHash) =>
  execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

// --- auth_tokens -------------------------------------------------------------

export const createAuthToken = (userId, tokenHash, type, expiresAt) =>
  execute(
    'INSERT INTO auth_tokens (user_id, token_hash, type, expires_at) VALUES (?, ?, ?, ?)',
    [userId, tokenHash, type, toMysqlDateTime(expiresAt)]
  );

/** Busca un token vigente (no usado y no caducado). */
export const findValidAuthToken = (tokenHash, type) =>
  queryOne(
    `SELECT * FROM auth_tokens
     WHERE token_hash = ? AND type = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash, type]
  );

export const consumeAuthToken = (id) =>
  execute('UPDATE auth_tokens SET used_at = NOW() WHERE id = ?', [id]);

/** Invalida los tokens anteriores del mismo tipo antes de emitir uno nuevo. */
export const invalidateAuthTokens = (userId, type) =>
  execute(
    'UPDATE auth_tokens SET used_at = NOW() WHERE user_id = ? AND type = ? AND used_at IS NULL',
    [userId, type]
  );

/** Cuenta los tokens emitidos en los últimos `minutes` para limitar reenvíos. */
export const countRecentTokens = async (userId, type, minutes) => {
  const rows = await query(
    `SELECT COUNT(*) AS total FROM auth_tokens
     WHERE user_id = ? AND type = ? AND created_at > (NOW() - INTERVAL ? MINUTE)`,
    [userId, type, minutes]
  );
  return Number(rows[0].total);
};

// --- user_sessions (NRF-05) --------------------------------------------------

export const createSession = (id, userId, userAgent, expiresAt) =>
  execute(
    'INSERT INTO user_sessions (id, user_id, user_agent, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, userAgent?.slice(0, 255) ?? null, toMysqlDateTime(expiresAt)]
  );

export const findActiveSession = (id) =>
  queryOne(
    `SELECT * FROM user_sessions
     WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [id]
  );

export const revokeSession = (id) =>
  execute('UPDATE user_sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL', [id]);

/** Se usa al cambiar la contraseña: cierra todas las sesiones del usuario. */
export const revokeAllSessions = (userId) =>
  execute(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  );
