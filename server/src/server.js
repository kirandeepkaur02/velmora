import './config/loadDotenv.js';

async function start() {
  if (process.env.USE_IN_MEMORY_DB === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('velmora');
    console.log('Using in-memory MongoDB for local development');
  }

  const { env } = await import('./config/env.js');
  const { connectDatabase } = await import('./config/db.js');
  const { createApp } = await import('./app.js');

  await connectDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Velmora API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Velmora API');
  console.error(error.message);
  process.exit(1);
});
