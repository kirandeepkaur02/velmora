import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { v1Router } from './routes/v1/index.js';
import { sendSuccess } from './utils/sendSuccess.js';

const allowedOrigins = (env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (
          allowedOrigins.includes(origin) ||
          /^http:\/\/localhost:\d+$/.test(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.get('/', (_req, res) =>
    sendSuccess(res, {
      service: 'velmora-api',
      status: 'ok',
      apiBase: '/api/v1',
      health: '/api/v1/health',
    }),
  );

  app.use('/api/v1', v1Router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
