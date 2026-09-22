import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Convierte los errores de Zod al formato `{ field: mensaje }` que consumen
 * las pantallas de validación del diseño (mensaje bajo cada campo).
 */
const toFieldErrors = (error) => {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    fields[key] ??= issue.message;
  }
  return fields;
};

/** Valida `req.body` y lo reemplaza por el resultado ya tipado. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return next(
      AppError.badRequest(
        'VALIDATION_ERROR',
        'Revisa los datos del formulario.',
        toFieldErrors(result.error)
      )
    );
  }
  req.body = result.data;
  return next();
};

/** Valida `req.params` (ids numéricos de tareas y subtareas). */
export const validateParams = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params ?? {});
  if (!result.success) {
    return next(AppError.badRequest('VALIDATION_ERROR', 'Identificador no válido.'));
  }
  req.params = result.data;
  return next();
};

// --- Esquemas reutilizables --------------------------------------------------

export const emailSchema = z
  .string({ required_error: 'Escribe tu correo electrónico.' })
  .trim()
  .min(1, 'Escribe tu correo electrónico.')
  .max(254, 'El correo es demasiado largo.')
  .email('Ingresa un correo electrónico válido (ej. nombre@dominio.com).')
  .toLowerCase();

/**
 * Los cuatro requisitos que la pantalla «05b · Restablecer contraseña» muestra
 * como lista de verificación.
 */
export const passwordSchema = z
  .string({ required_error: 'Escribe una contraseña.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(128, 'La contraseña es demasiado larga.')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'La contraseña debe incluir al menos una letra mayúscula.')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe incluir al menos un símbolo (! @ # $ …).');

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const taskIdParamSchema = z.object({
  taskId: z.coerce.number().int().positive()
});

export const titleSchema = (message) =>
  z
    .string({ required_error: message })
    .trim()
    .min(1, message)
    .max(255, 'El nombre no puede pasar de 255 caracteres.');

export { z };
