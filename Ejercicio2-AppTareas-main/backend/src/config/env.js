import 'dotenv/config';

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
};

const int = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`La variable de entorno ${name} debe ser un número entero.`);
  }
  return parsed;
};

const bool = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  return raw === 'true' || raw === '1';
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: int('PORT', 3000),

  db: {
    url: process.env.DATABASE_URL || process.env.MYSQL_URL || '',
    host: process.env.DB_HOST ?? 'localhost',
    port: int('DB_PORT', 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'list_website',
    ssl: bool('DB_SSL', false)
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d'
  },

  mail: {
    apiKey: process.env.BREVO_API_KEY ?? '',
    fromEmail: process.env.MAIL_FROM_EMAIL ?? 'no-reply@listwebsite.com',
    fromName: process.env.MAIL_FROM_NAME ?? 'List Website'
  },

  frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:4200').replace(/\/$/, ''),

  tokens: {
    verificationTtlMinutes: int('VERIFICATION_TOKEN_TTL_MIN', 60 * 24),
    resetTtlMinutes: int('RESET_TOKEN_TTL_MIN', 30)
  }
};
