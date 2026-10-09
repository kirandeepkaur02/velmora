import './loadDotenv.js';

function readEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

export function loadEnv() {
  const nodeEnv = readEnv('NODE_ENV', 'development');
  const port = Number(readEnv('PORT', '5000'));
  const mongodbUri = readEnv('MONGODB_URI');
  const clientOrigin = readEnv('CLIENT_ORIGIN', 'http://localhost:5173');
  const jwtSecret = readEnv('JWT_SECRET', 'velmora-dev-secret-change-me');

  if (!Number.isInteger(port) || port < 1) {
    throw new Error('PORT must be a valid integer.');
  }

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required.');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    MONGODB_URI: mongodbUri,
    CLIENT_ORIGIN: clientOrigin,
    JWT_SECRET: jwtSecret,
    isProduction: nodeEnv === 'production',
  };
}

export const env = new Proxy(
  {},
  {
    get(_target, prop) {
      return loadEnv()[prop];
    },
    has(_target, prop) {
      return prop in loadEnv();
    },
    ownKeys() {
      return Reflect.ownKeys(loadEnv());
    },
    getOwnPropertyDescriptor(_target, prop) {
      const value = loadEnv()[prop];
      return {
        configurable: true,
        enumerable: true,
        writable: false,
        value,
      };
    },
  },
);
