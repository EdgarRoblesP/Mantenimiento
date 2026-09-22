import * as authService from '../services/authService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/** NRF-01 */
export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.register(email, password);

  res.status(201).json({
    ...result,
    message: 'Cuenta creada. Revisa tu correo para verificarla.'
  });
});

/** NRF-02 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);
  res.json({ ...result, message: 'Tu correo quedó verificado. Ya puedes iniciar sesión.' });
});

/**
 * NRF-02 - reenvío.
 * Responde igual exista o no la cuenta, para no revelar qué correos hay
 * registrados.
 */
export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  res.json({
    message: 'Si la cuenta existe y sigue sin verificar, enviamos un nuevo enlace.'
  });
});

/** NRF-03 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, req.get('user-agent'));
  res.json(result);
});

/** NRF-05 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.sessionId);
  res.json({ message: 'Sesión cerrada.' });
});

/** NRF-04 - solicitud. Respuesta genérica por el mismo motivo que el reenvío. */
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  res.json({
    message: 'Si la cuenta existe, enviamos un enlace de recuperación a ese correo.'
  });
});

/** NRF-04 - aplicación de la nueva contraseña. */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.json({
    message: 'Tu contraseña se actualizó. Inicia sesión con la nueva contraseña.'
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ user });
});
