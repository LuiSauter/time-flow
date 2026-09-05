const FRONTEND_URL = process.env.FRONTEND_URL;
const APP_URL = process.env.APP_URL;

const allowedOrigins = [FRONTEND_URL, APP_URL].filter(Boolean);

export const CORS_OPTIONS = {
  origin: (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-client-date',
    'client-date',
  ],
  credentials: true,
};
