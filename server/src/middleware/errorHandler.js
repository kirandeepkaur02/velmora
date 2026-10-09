import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err, _req, res, _next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const code = isApiError ? err.code : 'INTERNAL_ERROR';
  const message = isApiError
    ? err.message
    : env.isProduction
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (isApiError && err.details) {
    payload.error.details = err.details;
  }

  if (!env.isProduction && !isApiError) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
