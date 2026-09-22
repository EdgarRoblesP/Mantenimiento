/**
 * Se carga con `--import` antes que cualquier otro módulo, así que ajusta el
 * entorno antes de que `src/config/env.js` lo lea.
 *
 * Marca la ejecución como de pruebas (desactiva el rate limit, que de otro modo
 * cortaría la suite tras 20 llamadas a /auth) y garantiza que haya un
 * JWT_SECRET aunque no exista un `.env`.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas-automatizadas';

// Con Brevo sin configurar, el mailer escribe en su buzón en memoria y las
// pruebas pueden leer los enlaces sin salir a la red.
process.env.BREVO_API_KEY = '';
