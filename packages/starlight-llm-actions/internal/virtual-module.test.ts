import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../config/resolve.js';
import { virtualConfigPlugin } from './virtual-module.js';

const MODULE_ID = 'virtual:starlight-llm-actions/config';

function moduleSource(rendererSpecifier: string | null): string {
  const plugin = virtualConfigPlugin(
    resolveConfig({}),
    {},
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

  it('still exports the resolved config and the parsed user config', () => {
    const code = moduleSource(null);
    expect(code).toContain('export default {');
    expect(code).toContain('export const parsed =');
  });
});
