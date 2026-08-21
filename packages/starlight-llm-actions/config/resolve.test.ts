import { describe, expect, it } from 'vitest';
import { resolveConfig } from './resolve.js';
import { StarlightLlmActionsConfigSchema } from './schema.js';

describe('renderMarkdown', () => {
  it('defaults to raw, preserving pre-0.9 behaviour', () => {
    expect(resolveConfig({}).renderMarkdown).toEqual({ mode: 'raw' });
  });

  it('accepts an explicit raw', () => {
    expect(resolveConfig({ renderMarkdown: 'raw' }).renderMarkdown).toEqual({
      mode: 'raw',
    });
  });

  it('accepts the simple preset', () => {
    expect(resolveConfig({ renderMarkdown: 'simple' }).renderMarkdown).toEqual({
      mode: 'simple',
    });
  });

  it('accepts a module escape hatch', () => {
    expect(
      resolveConfig({ renderMarkdown: { module: './render.ts' } })
        .renderMarkdown,
    ).toEqual({ mode: 'module', module: './render.ts' });
  });

  it('rejects an unknown preset', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ renderMarkdown: 'fancy' }),
    ).toThrow();
  });

  it('rejects an empty module specifier', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ renderMarkdown: { module: '' } }),
    ).toThrow();
  });

  it('rejects a function, which could not survive config serialization', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ renderMarkdown: () => '' }),
    ).toThrow();
  });
});

describe('linkAlternate', () => {
  it('is off by default', () => {
    expect(resolveConfig({}).linkAlternate).toBeNull();
  });

  it('is off when set to false', () => {
    expect(resolveConfig({ linkAlternate: false }).linkAlternate).toBeNull();
  });

  it('uses text/markdown and a relative href when set to true', () => {
    expect(resolveConfig({ linkAlternate: true }).linkAlternate).toEqual({
      type: 'text/markdown',
      absolute: false,
    });
  });

  it('accepts an empty object as "on with defaults"', () => {
    expect(resolveConfig({ linkAlternate: {} }).linkAlternate).toEqual({
      type: 'text/markdown',
      absolute: false,
    });
  });

  it('accepts a custom type', () => {
    expect(
      resolveConfig({ linkAlternate: { type: 'text/plain' } }).linkAlternate,
    ).toEqual({ type: 'text/plain', absolute: false });
  });

  it('accepts absolute', () => {
    expect(
      resolveConfig({ linkAlternate: { absolute: true } }).linkAlternate,
    ).toEqual({ type: 'text/markdown', absolute: true });
  });

  it('rejects unknown keys', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ linkAlternate: { rel: 'canonical' } }),
    ).toThrow();
  });
});

describe('llmsTxt', () => {
  it('is off by default', () => {
    expect(resolveConfig({}).llmsTxt).toBeNull();
  });

  it('is off when set to false', () => {
    expect(resolveConfig({ llmsTxt: false }).llmsTxt).toBeNull();
  });

  it('promotes index pages and nothing else when set to true', () => {
    expect(resolveConfig({ llmsTxt: true }).llmsTxt).toEqual({
      promote: ['index*'],
      demote: [],
      exclude: [],
      subsets: [],
    });
  });

  it('accepts an empty object as "on with defaults"', () => {
    expect(resolveConfig({ llmsTxt: {} }).llmsTxt).toEqual(
      resolveConfig({ llmsTxt: true }).llmsTxt,
    );
  });

  it('lets an explicit empty promote list turn the default off', () => {
    expect(resolveConfig({ llmsTxt: { promote: [] } }).llmsTxt?.promote).toEqual([]);
  });

  it('keeps pattern lists in the order they were written', () => {
    expect(
      resolveConfig({
        llmsTxt: {
          promote: ['index*', 'start/**'],
          demote: ['legacy/**'],
          exclude: ['internal/**'],
        },
      }).llmsTxt,
    ).toEqual({
      promote: ['index*', 'start/**'],
      demote: ['legacy/**'],
      exclude: ['internal/**'],
      subsets: [],
    });
  });

  it('slugifies a subset label into a file-name stem', () => {
    expect(
      resolveConfig({
        llmsTxt: { subsets: [{ label: 'REST API v2', paths: ['api/**'] }] },
      }).llmsTxt?.subsets,
    ).toEqual([
      {
        label: 'REST API v2',
        description: null,
        paths: ['api/**'],
        slug: 'rest-api-v2',
      },
    ]);
  });

  it('keeps a subset description', () => {
    expect(
      resolveConfig({
        llmsTxt: {
          subsets: [{ label: 'API', description: 'the REST API', paths: ['api/**'] }],
        },
      }).llmsTxt?.subsets[0]?.description,
    ).toBe('the REST API');
  });

  it('rejects two labels that slugify to the same file', () => {
    expect(() =>
      resolveConfig({
        llmsTxt: {
          subsets: [
            { label: 'REST API', paths: ['api/**'] },
            { label: 'rest api', paths: ['v2/**'] },
          ],
        },
      }),
    ).toThrow(/both resolve to \/llms-rest-api\.txt/);
  });

  it('rejects a label that slugifies to nothing', () => {
    expect(() =>
      resolveConfig({ llmsTxt: { subsets: [{ label: '—', paths: ['api/**'] }] } }),
    ).toThrow(/nothing a file name can use/);
  });

  it('rejects a label that would claim the whole-corpus bundle', () => {
    expect(() =>
      resolveConfig({ llmsTxt: { subsets: [{ label: 'Full', paths: ['api/**'] }] } }),
    ).toThrow(/\/llms-full\.txt/);
  });

  it('requires a subset to name at least one path', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({
        llmsTxt: { subsets: [{ label: 'API', paths: [] }] },
      }),
    ).toThrow();
  });

  it('rejects unknown keys', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ llmsTxt: { minify: true } }),
    ).toThrow();
  });
});

describe('option independence', () => {
  it('leaves linkAlternate off when only renderMarkdown is set', () => {
    const resolved = resolveConfig({ renderMarkdown: 'simple' });
    expect(resolved.renderMarkdown).toEqual({ mode: 'simple' });
    expect(resolved.linkAlternate).toBeNull();
  });

  it('leaves renderMarkdown raw when only linkAlternate is set', () => {
    const resolved = resolveConfig({ linkAlternate: true });
    expect(resolved.renderMarkdown).toEqual({ mode: 'raw' });
    expect(resolved.linkAlternate).not.toBeNull();
  });
});

/**
 * Both rules are enforced on the *resolved* value rather than in the Zod schema,
 * because the schema never sees the default — `markdownUrl` is optional, and a
 * refinement on an absent key does not run.
 */
describe('markdownUrl', () => {
  it('defaults to the per-page .md route', () => {
    expect(resolveConfig({}).markdownUrl).toBe('/{slug}.md');
  });

  it('accepts a site-absolute template', () => {
    expect(resolveConfig({ markdownUrl: '/raw/{slug}.txt' }).markdownUrl).toBe(
      '/raw/{slug}.txt',
    );
  });

  it('rejects a template with no {slug}', () => {
    expect(() => resolveConfig({ markdownUrl: '/raw.md' })).toThrow(/must contain/);
  });

  it('rejects a relative template, which would concatenate onto base', () => {
    // `base` is joined with its trailing slash stripped, so '{slug}.md' under a
    // base of '/docs/' silently yields '/docsguides/example.md'.
    expect(() => resolveConfig({ markdownUrl: '{slug}.md' })).toThrow(
      /must start with "\/"/,
    );
  });

  it('names the offending value in the message', () => {
    expect(() => resolveConfig({ markdownUrl: 'raw/{slug}.md' })).toThrow(
      /Got: "raw\/\{slug\}\.md"/,
    );
  });
});
