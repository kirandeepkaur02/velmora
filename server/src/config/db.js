import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI);

  return mongoose.connection;
}

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  const labels = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    connected: state === 1,
    state: labels[state] ?? 'unknown',
  };
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
