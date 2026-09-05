export const EnvConfig = () => ({
  APP_NAME: process.env.APP_NAME || 'NestJS-Template',
  APP_PROD: process.env.APP_PROD || false,
  APP_VERSION: process.env.APP_VERSION || '0.1.0',
  PORT: process.env.PORT || 3000,

  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'test@cloudia.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123',

  CLIENT_EMAIL: process.env.CLIENT_EMAIL || 'client@test.com',
  CLIENT_PASSWORD: process.env.CLIENT_PASSWORD || 'Client@123',
  DB_CONNECTION: process.env.DB_CONNECTION || 'postgres',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_DATABASE: process.env.DB_DATABASE || 'postgres',
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  HASH_SALT: process.env.HASH_SALT || 10,
  JWT_AUTH: process.env.JWT_AUTH || 'secret',
  JWT_RECOVERY: process.env.JWT_RECOVERY || 'secret',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_SECRET: process.env.GOOGLE_SECRET,

  MAILER_SERVICE: process.env.MAILER_SERVICE || 'gmail',
  MAILER_EMAIL: process.env.MAILER_EMAIL || 'example@gmail.com',
  MAILER_SECRET_KEY: process.env.MAILER_SECRET_KEY || 'mail_password',
  MAILER_API_TOKEN: process.env.MAILER_API_TOKEN || 'your_mailtrap_api_token',
  MAILER_PORT: process.env.MAILER_PORT || 587,
});
