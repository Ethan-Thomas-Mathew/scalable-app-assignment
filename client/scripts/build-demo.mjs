// Builds the static GitHub Pages demo into /docs (served from the repo's main branch, /docs folder).
import { spawnSync } from 'node:child_process';
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const client = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = resolve(client, '..', 'docs');

const build = spawnSync('npx', ['next', 'build'], {
  cwd: client,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_DEMO: 'true' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync(docs, { recursive: true, force: true });
cpSync(resolve(client, 'out'), docs, { recursive: true });
writeFileSync(resolve(docs, '.nojekyll'), ''); // GitHub Pages must not run Jekyll on the _next folder
console.log('Demo written to', docs);
