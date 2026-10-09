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
  const smtpPort = Number(readEnv('SMTP_PORT', '587'));
  const shippingFlatRate = Number(readEnv('SHIPPING_FLAT_RATE', '9'));
  const freeShippingThreshold = Number(readEnv('FREE_SHIPPING_THRESHOLD', '75'));
  const taxRate = Number(readEnv('TAX_RATE', '0'));
  const currency = readEnv('CURRENCY', 'USD').toUpperCase();

  if (!Number.isInteger(port) || port < 1) {
    throw new Error('PORT must be a valid integer.');
  }

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required.');
  }
  if (nodeEnv === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
  }

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new Error('SMTP_PORT must be a valid port number.');
  }
  if (
    !Number.isFinite(shippingFlatRate) ||
    shippingFlatRate < 0 ||
    !Number.isFinite(freeShippingThreshold) ||
    freeShippingThreshold < 0
  ) {
    throw new Error('Shipping rates and thresholds must be valid non-negative amounts.');
  }
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new Error('TAX_RATE must be a decimal between 0 and 1.');
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('CURRENCY must be a three-letter ISO currency code.');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    MONGODB_URI: mongodbUri,
    CLIENT_ORIGIN: clientOrigin,
    JWT_SECRET: jwtSecret,
    SMTP_HOST: readEnv('SMTP_HOST', ''),
    SMTP_PORT: smtpPort,
    SMTP_USER: readEnv('SMTP_USER', ''),
    SMTP_PASSWORD: readEnv('SMTP_PASSWORD', ''),
    SMTP_FROM: readEnv('SMTP_FROM', ''),
    SMTP_SECURE: readEnv('SMTP_SECURE', 'false') === 'true',
    STRIPE_SECRET_KEY: readEnv('STRIPE_SECRET_KEY', ''),
    STRIPE_WEBHOOK_SECRET: readEnv('STRIPE_WEBHOOK_SECRET', ''),
    CLOUDINARY_CLOUD_NAME: readEnv('CLOUDINARY_CLOUD_NAME', ''),
    CLOUDINARY_API_KEY: readEnv('CLOUDINARY_API_KEY', ''),
    CLOUDINARY_API_SECRET: readEnv('CLOUDINARY_API_SECRET', ''),
    SHIPPING_FLAT_RATE: shippingFlatRate,
    FREE_SHIPPING_THRESHOLD: freeShippingThreshold,
    TAX_RATE: taxRate,
    CURRENCY: currency,
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
