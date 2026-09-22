import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/** Ruta inexistente: se transforma en AppError para pasar por el mismo formato. */
export const notFoundHandler = (req, _res, next) => {
  next(AppError.notFound('ROUTE_NOT_FOUND', `No existe la ruta ${req.method} ${req.originalUrl}.`));
};

/**
 * Único punto de salida de errores. Siempre responde
 * `{ error: { code, message, fields? } }`, que es lo que el frontend usa para
 * decidir entre banner global y mensaje bajo un campo.
 */
// eslint-disable-next-line no-unused-vars -- Express identifica el handler por sus 4 parámetros
export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { fields: error.details } : {})
      }
    });
  }

  // Red de seguridad por si una restricción de MySQL se escapa de los servicios.
  if (error?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: 'El registro ya existe.' }
    });
  }

  console.error('[error]', error);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos momentos.',
      ...(env.isProduction ? {} : { detail: String(error?.message ?? error) })
    }
  });
};

/**
 * Envuelve un handler async para que los rechazos lleguen a `errorHandler`
 * sin repetir try/catch en cada controlador (Express 4 no los propaga solo).
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
