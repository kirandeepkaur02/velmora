import { getDatabaseStatus } from '../config/db.js';
import { sendSuccess } from '../utils/sendSuccess.js';
import { ApiError } from '../utils/ApiError.js';

export function getHealth(_req, res) {
  const database = getDatabaseStatus();

  if (!database.connected) {
    throw new ApiError({
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database is not connected',
      details: { database },
    });
  }

  return sendSuccess(res, {
    service: 'velmora-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database,
  });
}
