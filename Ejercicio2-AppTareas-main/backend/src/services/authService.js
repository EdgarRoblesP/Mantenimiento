import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import {
  createRandomToken,
  hashPassword,
  hashToken,
  minutesFromNow,
  verifyPassword
} from '../utils/security.js';
import * as users from '../repositories/userRepository.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './mailer.js';

const MAX_TOKENS_PER_HOUR = 5;

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt
});

/** Duración del JWT en milisegundos, para que la sesión en BD caduque igual. */
const sessionLifetimeMs = () => {
  const match = /^(\d+)([smhd])$/.exec(env.jwt.expiresIn);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return Number(match[1]) * unit;
};

/** Emite el JWT y registra la sesión (NRF-03); el `jti` permite revocarla. */
const issueSession = async (user, userAgent) => {
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs());

  await users.createSession(sessionId, user.id, userAgent, expiresAt);

  const token = jwt.sign({ sub: String(user.id), email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    jwtid: sessionId
  });

  return { token, expiresAt: expiresAt.toISOString() };
};

/** Genera, guarda (hasheado) y devuelve un token de un solo uso. */
const issueAuthToken = async (userId, type, ttlMinutes) => {
  const recent = await users.countRecentTokens(userId, type, 60);
  if (recent >= MAX_TOKENS_PER_HOUR) {
    throw AppError.tooManyRequests(
      'TOO_MANY_REQUESTS',
      'Enviaste demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.'
    );
  }

  await users.invalidateAuthTokens(userId, type);
  const token = createRandomToken();
  await users.createAuthToken(userId, hashToken(token), type, minutesFromNow(ttlMinutes));
  return token;
};

/** NRF-01 + NRF-02: alta de cuenta y envío del correo de verificación. */
export const register = async (email, password) => {
  const existing = await users.findByEmail(email);
  if (existing) {
    throw AppError.conflict('EMAIL_TAKEN', 'Ya existe una cuenta con este correo.');
  }

  const user = await users.createUser(email, await hashPassword(password));
  const token = await issueAuthToken(
    user.id,
    'email_verification',
    env.tokens.verificationTtlMinutes
  );
  await sendVerificationEmail(user.email, token);

  return { user: publicUser(user) };
};

/** NRF-02: confirma el correo con el token del enlace. */
export const verifyEmail = async (token) => {
  const record = await users.findValidAuthToken(hashToken(token), 'email_verification');
  if (!record) {
    throw AppError.badRequest(
      'INVALID_TOKEN',
      'El enlace de verificación no es válido o ya caducó.'
    );
  }

  await users.consumeAuthToken(record.id);
  await users.markEmailVerified(record.user_id);

  const user = await users.findById(record.user_id);
  return { user: publicUser(user) };
};

/** NRF-02: reenvía el correo de verificación. Respuesta siempre genérica. */
export const resendVerification = async (email) => {
  const user = await users.findByEmail(email);
  if (user && !user.emailVerified) {
    const token = await issueAuthToken(
      user.id,
      'email_verification',
      env.tokens.verificationTtlMinutes
    );
    await sendVerificationEmail(user.email, token);
  }
};

/** NRF-03: inicio de sesión. Exige el correo verificado (NRF-02). */
export const login = async (email, password, userAgent) => {
  const user = await users.findByEmail(email);

  // Mismo mensaje para usuario inexistente y contraseña incorrecta: no revela
  // qué correos están registrados.
  const genericError = AppError.unauthorized(
    'INVALID_CREDENTIALS',
    'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.'
  );

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw genericError;
  }

  if (!user.emailVerified) {
    throw AppError.forbidden(
      'EMAIL_NOT_VERIFIED',
      'Tu cuenta aún no está verificada. Revisa tu correo para activarla.'
    );
  }

  const session = await issueSession(user, userAgent);
  return { ...session, user: publicUser(user) };
};

/** NRF-05: invalida la sesión activa asociada al `jti` del token. */
export const logout = (sessionId) => users.revokeSession(sessionId);

/**
 * NRF-04: solicita el enlace de recuperación.
 * Siempre resuelve sin error aunque el correo no exista, para no filtrar qué
 * cuentas están registradas.
 */
export const requestPasswordReset = async (email) => {
  const user = await users.findByEmail(email);
  if (user) {
    const token = await issueAuthToken(user.id, 'password_reset', env.tokens.resetTtlMinutes);
    await sendPasswordResetEmail(user.email, token);
  }
};

/** NRF-04: aplica la nueva contraseña y cierra todas las sesiones abiertas. */
export const resetPassword = async (token, newPassword) => {
  const record = await users.findValidAuthToken(hashToken(token), 'password_reset');
  if (!record) {
    throw AppError.badRequest(
      'INVALID_TOKEN',
      'El enlace de recuperación no es válido o ya caducó.'
    );
  }

  await users.consumeAuthToken(record.id);
  await users.updatePassword(record.user_id, await hashPassword(newPassword));
  await users.revokeAllSessions(record.user_id);
};

export const getProfile = async (userId) => {
  const user = await users.findById(userId);
  if (!user) {
    throw AppError.notFound('USER_NOT_FOUND', 'La cuenta ya no existe.');
  }
  return publicUser(user);
};
