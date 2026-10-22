import { spawnSync } from 'node:child_process';

// Separate processes avoid global timezone changes leaking between tests.
for (const timeZone of ['UTC', 'America/Toronto', 'Europe/Berlin']) {
  console.log(`\nTesting calendar utilities in ${timeZone}`);
  const result = spawnSync(process.execPath, [
    '--experimental-strip-types', '--test', 'tests/calendarDate.test.ts',
  ], { stdio: 'inherit', env: { ...process.env, TZ: timeZone } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
