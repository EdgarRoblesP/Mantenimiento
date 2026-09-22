import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

/** Token en claro para enlaces de correo (verificación / recuperación). */
export const createRandomToken = () => crypto.randomBytes(32).toString('hex');

/** Solo el hash se guarda en `auth_tokens.token_hash`. */
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/** Fecha futura en minutos, lista para columnas DATETIME. */
export const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60_000);

/** Convierte un Date al formato `YYYY-MM-DD HH:MM:SS` que espera MySQL. */
export const toMysqlDateTime = (date) =>
  date.toISOString().slice(0, 19).replace('T', ' ');
