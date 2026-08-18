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
