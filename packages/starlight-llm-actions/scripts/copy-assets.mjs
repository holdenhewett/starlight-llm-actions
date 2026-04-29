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

await cp(
  path.join(pkg, 'internal', 'virtual.d.ts'),
  path.join(dist, 'internal', 'virtual.d.ts'),
);

await cp(path.join(pkg, 'route.ts'), path.join(dist, 'route.ts'));
