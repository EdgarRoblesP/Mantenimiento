import * as brevo from '@getbrevo/brevo';
import { env } from '../config/env.js';

/**
 * Envío de correo con Brevo (RNF-02).
 *
 * Si `BREVO_API_KEY` está vacía el backend no falla: escribe el correo en la
 * consola. Así el equipo puede probar registro y recuperación en local sin
 * cuenta de Brevo, y las pruebas automatizadas no dependen de la red.
 */
const isConfigured = Boolean(env.mail.apiKey);

const client = (() => {
  if (!isConfigured) {
    return null;
  }
  const api = new brevo.TransactionalEmailsApi();
  api.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.mail.apiKey);
  return api;
})();

/**
 * Buzón en memoria de los correos simulados. Solo se llena cuando Brevo no
 * está configurado, y existe para que las pruebas automatizadas puedan leer el
 * enlace sin tocar la red.
 */
export const outbox = [];

const sendEmail = async ({ to, subject, htmlContent, textContent, url }) => {
  if (!client) {
    outbox.push({ to, subject, url, sentAt: new Date() });
    console.info(
      `[mailer] Brevo no configurado; correo simulado\n` +
        `  para:    ${to}\n` +
        `  asunto:  ${subject}\n` +
        `  enlace:  ${url}`
    );
    return { simulated: true };
  }

  const message = new brevo.SendSmtpEmail();
  message.sender = { email: env.mail.fromEmail, name: env.mail.fromName };
  message.to = [{ email: to }];
  message.subject = subject;
  message.htmlContent = htmlContent;
  message.textContent = textContent;

  const response = await client.sendTransacEmail(message);
  return { simulated: false, messageId: response?.body?.messageId };
};

/** Plantilla común: mantiene el tono de las pantallas del diseño. */
const layout = ({ title, intro, buttonLabel, url, note }) => `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px 16px;background:#0f0a2e;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0"
               style="background:#1a1145;border-radius:20px;padding:40px;">
          <tr><td style="color:#f4f2ff;font-size:16px;font-weight:700;padding-bottom:24px;">List Website</td></tr>
          <tr><td style="color:#f4f2ff;font-size:24px;font-weight:700;padding-bottom:12px;">${title}</td></tr>
          <tr><td style="color:#b9b2e8;font-size:15px;line-height:1.5;padding-bottom:24px;">${intro}</td></tr>
          <tr><td style="padding-bottom:24px;">
            <a href="${url}"
               style="display:inline-block;background:#6d4aff;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:600;padding:14px 20px;border-radius:10px;">${buttonLabel}</a>
          </td></tr>
          <tr><td style="color:#b9b2e8;font-size:12px;line-height:1.5;">
            ${note}<br><br>
            Si el botón no funciona, copia esta dirección en tu navegador:<br>
            <span style="color:#8f7bff;word-break:break-all;">${url}</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

/** NRF-02 - enlace de verificación de correo. */
export const sendVerificationEmail = async (to, token) => {
  const url = `${env.frontendUrl}/verificar-correo?token=${token}`;
  return sendEmail({
    to,
    url,
    subject: 'Verifica tu correo en List Website',
    htmlContent: layout({
      title: 'Verifica tu correo',
      intro: 'Confirma esta dirección para terminar de crear tu cuenta y empezar a organizar tus tareas.',
      buttonLabel: 'Verificar mi correo',
      url,
      note: `Este enlace caduca en ${env.tokens.verificationTtlMinutes} minutos. Si no creaste esta cuenta, ignora el mensaje.`
    }),
    textContent: `Verifica tu correo en List Website: ${url}`
  });
};

/** NRF-04 - enlace de restablecimiento de contraseña. */
export const sendPasswordResetEmail = async (to, token) => {
  const url = `${env.frontendUrl}/restablecer-contrasena?token=${token}`;
  return sendEmail({
    to,
    url,
    subject: 'Restablece tu contraseña de List Website',
    htmlContent: layout({
      title: 'Recupera tu contraseña',
      intro: 'Recibimos una solicitud para restablecer tu contraseña. Elige una nueva desde el siguiente enlace.',
      buttonLabel: 'Crear nueva contraseña',
      url,
      note: `Este enlace caduca en ${env.tokens.resetTtlMinutes} minutos. Si no lo solicitaste, tu contraseña sigue siendo la misma.`
    }),
    textContent: `Restablece tu contraseña de List Website: ${url}`
  });
};

export const mailerStatus = () => ({ provider: 'brevo', configured: isConfigured });
