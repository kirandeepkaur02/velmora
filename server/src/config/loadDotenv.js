import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const projectRoot = path.resolve(serverDir, '..');

let loaded = false;

export function loadDotenv() {
  if (loaded) {
    return;
  }

  dotenv.config({ path: path.join(projectRoot, '.env') });
  dotenv.config({ path: path.join(serverDir, '.env'), override: true });
  loaded = true;
}

loadDotenv();
