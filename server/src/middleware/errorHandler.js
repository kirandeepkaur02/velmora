import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err, _req, res, _next) {
  const isApiError = err instanceof ApiError;
  const isMalformedJson = err.type === 'entity.parse.failed';
  const isOversizedBody = err.type === 'entity.too.large';
  const statusCode = isApiError
    ? err.statusCode
    : isMalformedJson
      ? 400
      : isOversizedBody
        ? 413
        : 500;
  const code = isApiError
    ? err.code
    : isMalformedJson
      ? 'INVALID_JSON'
      : isOversizedBody
        ? 'PAYLOAD_TOO_LARGE'
        : 'INTERNAL_ERROR';
  const message = isApiError
    ? err.message
    : isMalformedJson
      ? 'The JSON request body is invalid.'
      : isOversizedBody
        ? 'The request body exceeds the 1 MB limit.'
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
