import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { GET } from './llms-bundle.js';

/**
 * The bundle route, run against the stub corpus in `test/stubs/`.
 *
 * The docs playground covers the same behaviour end to end on real output, but
 * only for configs that build. The zero-match error is reachable only from a
 * config that *fails* the build, so it has no home there — a playground with a
 * deliberately broken subset could never be built by the suite that reads its
 * output.
 */

/**
 * The bundle route reads `props` and passes `context` on to the renderer, which
 * the stub config disables. Nothing else here is touched.
 */
const context = (paths: string[] | null, label: string | null) =>
  ({
    props: { paths, label },
    params: { bundle: label ?? 'full' },
    url: new URL('https://example.com/llms-full.txt'),
  }) as unknown as APIContext;

const bundle = async (paths: string[] | null, label: string | null) => {
  const response = await GET(context(paths, label));
  return response.text();
};

describe('GET /llms-{bundle}.txt', () => {
  it('fails the build when a subset matches nothing, naming it and its paths', async () => {
    await expect(bundle(['guides/one.md'], 'Typo')).rejects.toThrow(
      /The 'Typo' subset matched no pages\. Its paths \(guides\/one\.md\)/,
    );
  });

  it('serves a subset the corpus-wide exclude dropped, minus drafts', async () => {
    const text = await bundle(['reference/**'], 'Reference');

    expect(text).toContain(
      '<SYSTEM>This is the Reference section of the Test Docs documentation, as Markdown.</SYSTEM>',
    );
    expect(text).toContain('# Reference');
    expect(text).not.toContain('# WIP');
  });

  it('keeps an excluded page out of the full bundle', async () => {
    const text = await bundle(null, null);

    expect(text).toContain(
      '<SYSTEM>This is the complete Test Docs documentation, as Markdown.</SYSTEM>',
    );
    expect(text).toContain('# Home');
    expect(text).toContain('# One');
    expect(text).not.toContain('# Reference');
  });
});
