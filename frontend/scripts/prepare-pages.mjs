import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Pages has no SPA rewrite server. Give every current route a real entry file
// so refreshes/direct visits return 200 and keep BrowserRouter clean URLs.
const output = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', output), 'utf8');
for (const route of ['tasks', 'goals', 'settings']) {
  const directory = new URL(`${route}/`, output);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Prepared direct-route entries for GitHub Pages.');
