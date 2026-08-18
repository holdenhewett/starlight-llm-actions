import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, '..');
const dist = path.join(pkg, 'dist');

await mkdir(dist, { recursive: true });

const dirs = ['components', 'overrides', 'icons'];
for (const dir of dirs) {
  await cp(path.join(pkg, dir), path.join(dist, dir), { recursive: true });
}

// Shipped as raw TypeScript because they import `astro:content`, which only
// resolves inside a running Astro build. Astro compiles them in the consumer's
// project, the same way it compiles `.astro` files from node_modules.
const rawSources = [
  ['route.ts'],
  ['internal', 'simple-markdown.ts'],
  ['internal', 'virtual.d.ts'],
];
for (const segments of rawSources) {
  await cp(path.join(pkg, ...segments), path.join(dist, ...segments));
}
