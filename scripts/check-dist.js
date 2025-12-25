import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found');
  process.exit(2);
}
const content = fs.readFileSync(indexPath, 'utf8');
if (/\.tsx/.test(content)) {
  console.error('Error: dist/index.html contains .tsx references');
  const lines = content.split('\n');
  lines.forEach((l, i) => { if (l.includes('.tsx')) console.error(`${i+1}: ${l}`); });
  process.exit(1);
}
console.log('OK: no .tsx references in dist/index.html');
