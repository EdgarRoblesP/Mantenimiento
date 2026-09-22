import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/authController.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { emailSchema, passwordSchema, validateBody, z } from '../middleware/validate.js';

const router = Router();

/**
 * Freno a la fuerza bruta sobre login y a los reenvíos de correo.
 * En las pruebas se desactiva: la suite hace muchas más de 20 llamadas desde
 * la misma IP y todas caerían en el límite.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    }
  }
});

const tokenSchema = z
  .string({ required_error: 'Falta el token del enlace.' })
  .min(1, 'Falta el token del enlace.');

/** NRF-01: el registro solo pide correo y contraseña. */
const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional()
  })
  .refine(
    (data) => data.confirmPassword === undefined || data.confirmPassword === data.password,
    { message: 'Las contraseñas no coinciden.', path: ['confirmPassword'] }
  );

const loginSchema = z.object({
  email: emailSchema,
  // En el login no se aplican las reglas de fuerza: una contraseña antigua
  // que no las cumpla debe poder seguir entrando.
  password: z.string({ required_error: 'Escribe tu contraseña.' }).min(1, 'Escribe tu contraseña.')
});

const resetSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional()
  })
  .refine(
    (data) => data.confirmPassword === undefined || data.confirmPassword === data.password,
    { message: 'Las contraseñas no coinciden.', path: ['confirmPassword'] }
  );

router.post('/register', authLimiter, validateBody(registerSchema), controller.register);
router.post('/verify-email', validateBody(z.object({ token: tokenSchema })), controller.verifyEmail);
router.post(
  '/resend-verification',
  authLimiter,
  validateBody(z.object({ email: emailSchema })),
  controller.resendVerification
);
router.post('/login', authLimiter, validateBody(loginSchema), controller.login);
router.post('/logout', requireAuth, controller.logout);
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(z.object({ email: emailSchema })),
  controller.forgotPassword
);
router.post('/reset-password', authLimiter, validateBody(resetSchema), controller.resetPassword);
router.get('/me', requireAuth, controller.me);

export default router;
