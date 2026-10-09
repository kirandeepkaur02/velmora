import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { v1Router } from './routes/v1/index.js';
import { handleStripeWebhook } from './controllers/paymentController.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { sendSuccess } from './utils/sendSuccess.js';
import { ApiError } from './utils/ApiError.js';
import { apiRateLimit } from './middleware/rateLimiters.js';


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

        if (allowedOrigins.includes(origin) || (!env.isProduction && /^http:\/\/localhost:\d+$/.test(origin))) {
          callback(null, true);
          return;
        }

        callback(new ApiError({
          statusCode: 403,
          code: 'ORIGIN_NOT_ALLOWED',
          message: 'This origin is not allowed.',
        }));
      },
      credentials: true,
    }),
  );
  app.post(
    '/api/v1/payments/stripe/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(handleStripeWebhook),
  );
  app.use('/api/v1', apiRateLimit);
  app.use(express.json({
    limit: '1mb',
    reviver(key, value) {
      if (key.startsWith('$') || key.includes('.')) {
        throw new SyntaxError('Unsafe JSON object key.');
      }
      return value;
    },
  }));
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
