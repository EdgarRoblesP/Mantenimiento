import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkConnection, closePool } from './config/db.js';
import { mailerStatus } from './services/mailer.js';

const start = async () => {
  try {
    await checkConnection();
    console.info('[server] Conexión con MySQL establecida.');
  } catch (error) {
    console.error('[server] No se pudo conectar con MySQL:', error.message);
    process.exit(1);
  }

  if (!mailerStatus().configured) {
    console.warn(
      '[server] BREVO_API_KEY sin definir: los enlaces de verificación y ' +
        'recuperación se imprimirán en la consola en lugar de enviarse.'
    );
  }

  const server = createApp().listen(env.port, () => {
    console.info(`[server] API escuchando en http://localhost:${env.port}/api (${env.nodeEnv})`);
  });

  // Railway envía SIGTERM al redesplegar: cerramos conexiones antes de salir.
  const shutdown = (signal) => async () => {
    console.info(`[server] ${signal} recibido, cerrando…`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
};

start();
