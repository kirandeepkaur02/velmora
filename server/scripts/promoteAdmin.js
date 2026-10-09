import '../src/config/loadDotenv.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/userModel.js';

const email = String(process.argv[2] ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:promote -- user@example.com');
  process.exit(1);
}

try {
  await mongoose.connect(env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: 'admin', disabledAt: null } },
    { returnDocument: 'after' },
  );
  if (!user) {
    throw new Error(`No registered user found for ${email}. Register the account before promoting it.`);
  }
  console.log(`Administrator access granted to ${user.email}.`);
} catch (error) {
  console.error('Admin promotion failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
