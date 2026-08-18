import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUILTIN_PROVIDERS } from './builtin.js';

/**
 * `BUNDLED_ICONS` lives inside PageActions.astro, so it can only be imported by
 * Astro's compiler — not by Vitest. That is exactly why it silently drifted out
 * of sync with `builtin.ts`: five providers referenced icon files that were
 * never imported, and `getInlineIcon`'s `?? null` rendered them as empty slots
 * with no build error. These tests read the component as text to hold the two
 * sources together.
 */
const componentPath = fileURLToPath(
  new URL('../components/PageActions.astro', import.meta.url),
);
const iconsDir = fileURLToPath(new URL('../icons', import.meta.url));
const component = readFileSync(componentPath, 'utf8');

/** Filenames used as keys of the `BUNDLED_ICONS` record literal. */
const bundledKeys = new Set(
  [...component.matchAll(/^\s*'([^']+\.svg)':/gm)].map((m) => m[1]),
);

/** Filenames pulled in by `import … from '../icons/<file>?raw'`. */
const importedFiles = new Set(
  [...component.matchAll(/from '\.\.\/icons\/([^']+\.svg)\?raw'/g)].map((m) => m[1]),
);

const referencedFiles = [
  ...new Set(Object.values(BUILTIN_PROVIDERS).map((p) => p.iconFile)),
].sort();

describe('provider icons', () => {
  it('parses the component (guards against the regexes silently matching nothing)', () => {
    expect(bundledKeys.size).toBeGreaterThan(0);
    expect(importedFiles.size).toBe(bundledKeys.size);
  });

  it.each(referencedFiles)('%s exists on disk', (file) => {
    expect(existsSync(new URL(file, `file://${iconsDir}/`))).toBe(true);
  });

  it.each(referencedFiles)('%s is bundled by PageActions.astro', (file) => {
    expect(bundledKeys.has(file)).toBe(true);
  });

  it('bundles no icon that no provider references', () => {
    expect([...bundledKeys].sort()).toEqual(referencedFiles);
  });

  it('ships no icon file that is never bundled', () => {
    const onDisk = readdirSync(iconsDir).filter((f) => f.endsWith('.svg')).sort();
    expect(onDisk).toEqual(referencedFiles);
  });
});
