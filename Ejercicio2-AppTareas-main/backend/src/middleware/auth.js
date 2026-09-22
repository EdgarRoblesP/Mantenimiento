import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { findActiveSession } from '../repositories/userRepository.js';

/** Se construye en cada uso para no compartir una misma traza entre peticiones. */
const sessionExpired = () =>
  AppError.unauthorized('SESSION_EXPIRED', 'Tu sesión expiró. Inicia sesión de nuevo.');

/**
 * Autenticación por JWT con sesión respaldada en base de datos.
 *
 * No basta con que la firma sea válida: el `jti` debe corresponder a una fila
 * activa de `user_sessions`. Así el cierre de sesión (NRF-05) y el cambio de
 * contraseña (NRF-04) invalidan tokens que aún no han caducado.
 */
export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw AppError.unauthorized('NO_TOKEN', 'Necesitas iniciar sesión para continuar.');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch {
      throw sessionExpired();
    }

    const session = await findActiveSession(payload.jti);
    if (!session) {
      throw sessionExpired();
    }

    req.user = { id: Number(payload.sub), email: payload.email };
    req.sessionId = payload.jti;
    next();
  } catch (error) {
    next(error);
  }
};
