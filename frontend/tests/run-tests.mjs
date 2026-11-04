import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const testFiles = readdirSync(new URL('.', import.meta.url))
  .filter(name => name.endsWith('.test.ts')).map(name => `tests/${name}`);

// Separate processes avoid global timezone changes leaking between tests.
for (const timeZone of ['UTC', 'America/Toronto', 'Europe/Berlin']) {
  console.log(`\nTesting calendar utilities in ${timeZone}`);
  const result = spawnSync(process.execPath, [
    '--experimental-strip-types', '--test', ...testFiles,
  ], { stdio: 'inherit', env: { ...process.env, TZ: timeZone } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
