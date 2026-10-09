import assert from 'node:assert/strict';
import http from 'node:http';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';

let createApp;
let connectDatabase;
let disconnectDatabase;
let mongod;
let server;
let port;

const request = async (path, options = {}) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    body,
  };
};

beforeEach(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.MONGODB_URI = '';
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('velmora');

  ({ createApp } = await import('../src/app.js'));
  ({ connectDatabase, disconnectDatabase } = await import('../src/config/db.js'));
  await connectDatabase();

  server = http.createServer(createApp());
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  port = address.port;
});

afterEach(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  if (disconnectDatabase) {
    await disconnectDatabase();
  }

  if (mongod) {
    await mongod.stop();
  }
});

describe('Phase 3 authentication', () => {
  test('API root returns service information', async () => {
    const result = await request('/');

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.service, 'velmora-api');
    assert.equal(result.body.data.apiBase, '/api/v1');
  });

  test('register creates a user and returns a JWT', async () => {
    const result = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'ava@example.com',
        password: 'Velmora123!',
      }),
    });

    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.user.email, 'ava@example.com');
    assert.ok(result.body.data.token);
  });

  test('login returns a token for valid credentials', async () => {
    await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ava Jordan',
        email: 'ava@example.com',
        password: 'Velmora123!',
      }),
    });

    const result = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ava@example.com',
        password: 'Velmora123!',
      }),
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.data.token);
  });

  test('protected profile route rejects missing token', async () => {
    const result = await request('/api/v1/auth/me');

    assert.equal(result.status, 401);
    assert.equal(result.body.success, false);
  });
});
