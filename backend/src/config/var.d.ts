declare namespace NodeJS {
  interface ProcessEnv {
    APP_NAME: string;
    APP_PROD: string;
    APP_VERSION: string;
    PORT: number;

    APP_URL: string;
    FRONTEND_URL: string;

    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;

    CLIENT_EMAIL: string;
    CLIENT_PASSWORD: string;

    DB_CONNECTION: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_DATABASE: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;

    HASH_SALT: string;
    JWT_AUTH: string;
    JWT_EXPIRES_IN: string;
    JWT_RECOVERY: string;

    GOOGLE_CLIENT_ID: string;
    GOOGLE_SECRET: string;

    MAILER_SERVICE: string;
    MAILER_EMAIL: string;
    MAILER_SECRET_KEY: string;
    MAILER_API_TOKEN: string;
    MAILER_PORT: number;
  }
}
