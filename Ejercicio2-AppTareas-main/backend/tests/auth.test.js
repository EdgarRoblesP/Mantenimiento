/**
 * Métrica de éxito 4: registro, inicio de sesión, autenticación y recuperación
 * de contraseña, según NRF-01 … NRF-05.
 */
import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearOutbox,
  closeDatabase,
  lastAuthTokenRow,
  lastEmail,
  lastEmailToken,
  resetDatabase,
  startServer
} from './helpers/testDb.js';
import { execute } from '../src/config/db.js';

const EMAIL = 'prueba@listwebsite.com';
const PASSWORD = 'Tareas2026!';

let api;

before(async () => {
  api = await startServer();
});

after(async () => {
  await api.close();
  await closeDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  clearOutbox();
});

/** Registro + verificación, el camino feliz que dejan listo los demás casos. */
const registerVerified = async (email = EMAIL, password = PASSWORD) => {
  await api.post('/auth/register', { email, password });
  const token = lastEmailToken();
  await api.post('/auth/verify-email', { token });
  clearOutbox();
};

const loginOk = async (email = EMAIL, password = PASSWORD) => {
  const response = await api.post('/auth/login', { email, password });
  assert.equal(response.status, 200);
  return response.body.token;
};

// --- NRF-01: registro --------------------------------------------------------

test('NRF-01 · registra al usuario con correo y contraseña y envía verificación', async () => {
  const response = await api.post('/auth/register', { email: EMAIL, password: PASSWORD });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, EMAIL);
  assert.equal(response.body.user.emailVerified, false);
  // La contraseña nunca viaja de vuelta, ni siquiera hasheada.
  assert.equal(response.body.user.passwordHash, undefined);

  assert.equal(lastEmail().to, EMAIL);
  assert.match(lastEmail().url, /verificar-correo\?token=/);
});

test('NRF-01 · rechaza un correo ya registrado', async () => {
  await api.post('/auth/register', { email: EMAIL, password: PASSWORD });
  const response = await api.post('/auth/register', { email: EMAIL, password: PASSWORD });

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'EMAIL_TAKEN');
});

test('NRF-01 · rechaza correos y contraseñas que no cumplen las reglas', async () => {
  const badEmail = await api.post('/auth/register', {
    email: 'correo@sin-dominio',
    password: PASSWORD
  });
  assert.equal(badEmail.status, 400);
  assert.equal(badEmail.body.error.code, 'VALIDATION_ERROR');
  assert.ok(badEmail.body.error.fields.email);

  const shortPassword = await api.post('/auth/register', { email: EMAIL, password: 'Ab1!' });
  assert.equal(shortPassword.status, 400);
  assert.match(shortPassword.body.error.fields.password, /8 caracteres/);

  const noSymbol = await api.post('/auth/register', { email: EMAIL, password: 'Tareas2026' });
  assert.equal(noSymbol.status, 400);
  assert.match(noSymbol.body.error.fields.password, /símbolo/);
});

test('NRF-01 · detecta contraseñas que no coinciden', async () => {
  const response = await api.post('/auth/register', {
    email: EMAIL,
    password: PASSWORD,
    confirmPassword: 'Otra2026!'
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error.fields.confirmPassword, /no coinciden/);
});

// --- NRF-02: autenticación del correo ---------------------------------------

test('NRF-02 · verifica el correo con el token del enlace', async () => {
  await api.post('/auth/register', { email: EMAIL, password: PASSWORD });

  const response = await api.post('/auth/verify-email', { token: lastEmailToken() });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.emailVerified, true);
});

test('NRF-02 · el token de verificación es de un solo uso', async () => {
  await api.post('/auth/register', { email: EMAIL, password: PASSWORD });
  const token = lastEmailToken();

  await api.post('/auth/verify-email', { token });
  const second = await api.post('/auth/verify-email', { token });

  assert.equal(second.status, 400);
  assert.equal(second.body.error.code, 'INVALID_TOKEN');
});

test('NRF-02 · rechaza un token de verificación caducado', async () => {
  await api.post('/auth/register', { email: EMAIL, password: PASSWORD });
  const token = lastEmailToken();

  const row = await lastAuthTokenRow('email_verification');
  await execute('UPDATE auth_tokens SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE id = ?', [
    row.id
  ]);

  const response = await api.post('/auth/verify-email', { token });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_TOKEN');
});

test('NRF-02 · reenvía el enlace de verificación sin revelar si la cuenta existe', async () => {
  await api.post('/auth/register', { email: EMAIL, password: PASSWORD });
  clearOutbox();

  const existente = await api.post('/auth/resend-verification', { email: EMAIL });
  assert.equal(existente.status, 200);
  assert.equal(lastEmail().to, EMAIL);

  clearOutbox();
  const inexistente = await api.post('/auth/resend-verification', {
    email: 'nadie@listwebsite.com'
  });
  assert.equal(inexistente.status, 200);
  assert.equal(inexistente.body.message, existente.body.message);
  assert.equal(lastEmail(), null);
});

// --- NRF-03: inicio de sesión ------------------------------------------------

test('NRF-03 · inicia sesión con correo y contraseña correctos', async () => {
  await registerVerified();

  const response = await api.post('/auth/login', { email: EMAIL, password: PASSWORD });

  assert.equal(response.status, 200);
  assert.ok(response.body.token);
  assert.equal(response.body.user.email, EMAIL);
});

test('NRF-03 · da el mismo error para contraseña incorrecta y usuario inexistente', async () => {
  await registerVerified();

  const malaClave = await api.post('/auth/login', { email: EMAIL, password: 'Incorrecta1!' });
  const sinCuenta = await api.post('/auth/login', {
    email: 'nadie@listwebsite.com',
    password: PASSWORD
  });

  assert.equal(malaClave.status, 401);
  assert.equal(sinCuenta.status, 401);
  assert.equal(malaClave.body.error.code, 'INVALID_CREDENTIALS');
  assert.equal(sinCuenta.body.error.message, malaClave.body.error.message);
});

test('NRF-02 + NRF-03 · bloquea el inicio de sesión si el correo no está verificado', async () => {
  await api.post('/auth/register', { email: EMAIL, password: PASSWORD });

  const response = await api.post('/auth/login', { email: EMAIL, password: PASSWORD });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'EMAIL_NOT_VERIFIED');
});

test('NRF-03 · el token da acceso a los datos del usuario', async () => {
  await registerVerified();
  const token = await loginOk();

  const response = await api.get('/auth/me', { token });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, EMAIL);
});

test('NRF-03 · rechaza peticiones sin token o con token inválido', async () => {
  const sinToken = await api.get('/auth/me');
  assert.equal(sinToken.status, 401);
  assert.equal(sinToken.body.error.code, 'NO_TOKEN');

  const basura = await api.get('/auth/me', { token: 'no-es-un-jwt' });
  assert.equal(basura.status, 401);
  assert.equal(basura.body.error.code, 'SESSION_EXPIRED');
});

// --- NRF-05: cierre de sesión ------------------------------------------------

test('NRF-05 · cerrar sesión invalida el token aunque no haya caducado', async () => {
  await registerVerified();
  const token = await loginOk();

  const logout = await api.post('/auth/logout', null, { token });
  assert.equal(logout.status, 200);

  const despues = await api.get('/auth/me', { token });
  assert.equal(despues.status, 401);
  assert.equal(despues.body.error.code, 'SESSION_EXPIRED');
});

test('NRF-05 · cerrar una sesión no afecta a las demás del mismo usuario', async () => {
  await registerVerified();
  const primera = await loginOk();
  const segunda = await loginOk();

  await api.post('/auth/logout', null, { token: primera });

  assert.equal((await api.get('/auth/me', { token: primera })).status, 401);
  assert.equal((await api.get('/auth/me', { token: segunda })).status, 200);
});

// --- NRF-04: recuperación de contraseña --------------------------------------

test('NRF-04 · envía el enlace de recuperación al correo registrado', async () => {
  await registerVerified();

  const response = await api.post('/auth/forgot-password', { email: EMAIL });

  assert.equal(response.status, 200);
  assert.equal(lastEmail().to, EMAIL);
  assert.match(lastEmail().url, /restablecer-contrasena\?token=/);
});

test('NRF-04 · responde igual para un correo no registrado y no envía nada', async () => {
  await registerVerified();
  clearOutbox();

  const response = await api.post('/auth/forgot-password', { email: 'otro@listwebsite.com' });

  assert.equal(response.status, 200);
  assert.equal(lastEmail(), null);
});

test('NRF-04 · restablece la contraseña y permite entrar con la nueva', async () => {
  await registerVerified();
  await api.post('/auth/forgot-password', { email: EMAIL });
  const token = lastEmailToken();

  const reset = await api.post('/auth/reset-password', { token, password: 'NuevaClave2026!' });
  assert.equal(reset.status, 200);

  const conVieja = await api.post('/auth/login', { email: EMAIL, password: PASSWORD });
  assert.equal(conVieja.status, 401);

  const conNueva = await api.post('/auth/login', { email: EMAIL, password: 'NuevaClave2026!' });
  assert.equal(conNueva.status, 200);
});

test('NRF-04 · restablecer la contraseña cierra las sesiones abiertas', async () => {
  await registerVerified();
  const sesionPrevia = await loginOk();

  await api.post('/auth/forgot-password', { email: EMAIL });
  await api.post('/auth/reset-password', {
    token: lastEmailToken(),
    password: 'NuevaClave2026!'
  });

  const response = await api.get('/auth/me', { token: sesionPrevia });
  assert.equal(response.status, 401);
});

test('NRF-04 · el token de recuperación es de un solo uso y caduca', async () => {
  await registerVerified();
  await api.post('/auth/forgot-password', { email: EMAIL });
  const token = lastEmailToken();

  await api.post('/auth/reset-password', { token, password: 'NuevaClave2026!' });
  const reuso = await api.post('/auth/reset-password', { token, password: 'OtraClave2026!' });

  assert.equal(reuso.status, 400);
  assert.equal(reuso.body.error.code, 'INVALID_TOKEN');
});

test('NRF-04 · la nueva contraseña también debe cumplir los requisitos', async () => {
  await registerVerified();
  await api.post('/auth/forgot-password', { email: EMAIL });

  const response = await api.post('/auth/reset-password', {
    token: lastEmailToken(),
    password: 'corta'
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});
