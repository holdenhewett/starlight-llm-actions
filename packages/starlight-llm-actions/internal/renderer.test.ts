import { describe, expect, it } from 'vitest';
import {
  SIMPLE_MARKDOWN_DEPS,
  findMissingSimpleDeps,
  missingSimpleDepsMessage,
  rendererSpecifier,
} from './renderer.js';

const root = new URL('file:///project/');

describe('rendererSpecifier', () => {
  it('emits nothing for the raw default, so no optional dep is ever imported', () => {
    expect(rendererSpecifier({ mode: 'raw' }, root)).toBeNull();
  });

  it('points the simple preset at the bundled renderer', () => {
    expect(rendererSpecifier({ mode: 'simple' }, root)).toBe(
      'starlight-llm-actions/internal/simple-markdown',
    );
  });

  it('resolves a relative module against the Astro project root', () => {
    expect(
      rendererSpecifier({ mode: 'module', module: './src/render.ts' }, root),
    ).toBe('/project/src/render.ts');
  });

  it('resolves a parent-relative module', () => {
    expect(
      rendererSpecifier({ mode: 'module', module: '../shared/render.ts' }, root),
    ).toBe('/shared/render.ts');
  });

  it('leaves an absolute path alone', () => {
    expect(
      rendererSpecifier({ mode: 'module', module: '/abs/render.ts' }, root),
    ).toBe('/abs/render.ts');
  });

  it('passes bare package specifiers through untouched', () => {
    expect(
      rendererSpecifier({ mode: 'module', module: '@acme/renderer' }, root),
    ).toBe('@acme/renderer');
  });
});

describe('findMissingSimpleDeps', () => {
  it('reports nothing when every dependency resolves', () => {
    expect(findMissingSimpleDeps(() => '/resolved')).toEqual([]);
  });

  it('reports every dependency when none resolve', () => {
    expect(
      findMissingSimpleDeps(() => {
        throw new Error('ERR_MODULE_NOT_FOUND');
      }),
    ).toEqual([...SIMPLE_MARKDOWN_DEPS]);
  });

  it('reports only the dependencies that fail to resolve', () => {
    const missing = findMissingSimpleDeps((specifier) => {
      if (specifier === 'unified' || specifier === 'remark-gfm') {
        throw new Error('ERR_MODULE_NOT_FOUND');
      }
      return '/resolved';
    });
    expect(missing).toEqual(['unified', 'remark-gfm']);
  });

  it('finds the real dependencies, which ship as devDependencies for this test', () => {
    expect(findMissingSimpleDeps((s) => import.meta.resolve(s))).toEqual([]);
  });
});

describe('missingSimpleDepsMessage', () => {
  it('names the missing packages and how to install them', () => {
    const message = missingSimpleDepsMessage(['unified', 'remark-gfm']);
    expect(message).toContain("renderMarkdown: 'simple'");
    expect(message).toContain('Missing: unified, remark-gfm');
    expect(message).toContain('npm install unified remark-gfm');
    expect(message).toContain("renderMarkdown: 'raw'");
  });
});
