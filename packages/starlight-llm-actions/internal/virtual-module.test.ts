import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../config/resolve.js';
import type { StarlightLlmActionsConfig } from '../config/schema.js';
import { virtualConfigPlugin } from './virtual-module.js';

const MODULE_ID = 'virtual:starlight-llm-actions/config';

/** Every character JSON.stringify leaves raw but JavaScript source cannot. */
const HOSTILE = '</script>\u2028\u2029';

function moduleSource(
  rendererSpecifier: string | null,
  parsed: StarlightLlmActionsConfig = {},
): string {
  const plugin = virtualConfigPlugin(
    resolveConfig(parsed),
    parsed,
    rendererSpecifier,
  );
  const resolvedId = (plugin.resolveId as (id: string) => string | null)(
    MODULE_ID,
  );
  const loaded = (
    plugin.load as (id: string) => { code: string; moduleType: string } | null
  )(resolvedId!);
  return loaded!.code;
}

describe('virtualConfigPlugin', () => {
  it('exports a null renderer for the raw default', () => {
    const code = moduleSource(null);
    expect(code).toContain('export const renderer = null;');
    expect(code).not.toContain('import(');
  });

  it('emits the specifier as a string literal so Vite can analyse the import', () => {
    const code = moduleSource('starlight-llm-actions/internal/simple-markdown');
    expect(code).toContain(
      'export const renderer = () => import("starlight-llm-actions/internal/simple-markdown");',
    );
  });

  it('escapes the specifier rather than interpolating it raw', () => {
    const code = moduleSource('/project/it\'s "odd".ts');
    expect(code).toContain(
      'import("/project/it\'s \\"odd\\".ts")',
    );
  });

  it('escapes characters JSON.stringify leaves dangerous in JavaScript source', () => {
    const code = moduleSource('/project/</script>\u2028\u2029.ts');
    expect(code).toContain(
      'import("/project/\\u003C/script\\u003E\\u2028\\u2029.ts")',
    );
    expect(code).not.toMatch(/[\u2028\u2029]/);
  });

  it('escapes the same characters inside the serialised config', () => {
    const code = moduleSource(null, { triggerLabel: HOSTILE });
    expect(code).not.toMatch(/[\u2028\u2029]/);
    expect(code).not.toContain('</script');
    expect(code).toContain('\\u003C/script\\u003E\\u2028\\u2029');
  });

  it('round-trips the escaped config back to the original values', () => {
    const code = moduleSource(null, { triggerLabel: HOSTILE });
    const resolved = /^export default (.*);$/m.exec(code)?.[1];
    const parsed = /^export const parsed = (.*);$/m.exec(code)?.[1];
    expect(JSON.parse(resolved!).triggerLabel).toBe(HOSTILE);
    expect(JSON.parse(parsed!).triggerLabel).toBe(HOSTILE);
  });

  it('still exports the resolved config and the parsed user config', () => {
    const code = moduleSource(null);
    expect(code).toContain('export default {');
    expect(code).toContain('export const parsed =');
  });
});
