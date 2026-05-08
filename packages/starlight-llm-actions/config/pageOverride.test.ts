import { describe, expect, it } from 'vitest';
import {
  PageOverrideSchema,
  mergePageOverride,
  type PageOverrideObject,
} from './pageOverride.js';
import { parseConfig, resolveConfig } from './resolve.js';
import { StarlightLlmActionsConfigSchema } from './schema.js';
import type { StarlightLlmActionsConfig } from './schema.js';

/**
 * End-to-end helper: parses a global config, layers a page override on top,
 * runs `resolveConfig`, and returns the per-page resolved config.
 */
function resolvePage(
  globalConfig: StarlightLlmActionsConfig,
  pageOverride: PageOverrideObject,
) {
  const parsedGlobal = parseConfig(globalConfig);
  const merged = mergePageOverride(parsedGlobal, pageOverride);
  return resolveConfig(merged);
}

function findProvider(resolved: ReturnType<typeof resolvePage>, id: string) {
  if (resolved.actions.openIn === false) return undefined;
  return resolved.actions.openIn.providers.find((p) => p.id === id);
}

describe('PageOverrideSchema', () => {
  it('accepts false for full opt-out', () => {
    expect(PageOverrideSchema.parse(false)).toBe(false);
  });

  it('accepts true for explicit inherit', () => {
    expect(PageOverrideSchema.parse(true)).toBe(true);
  });

  it('accepts an empty object', () => {
    expect(PageOverrideSchema.parse({})).toEqual({});
  });

  it('accepts the documented overridable fields', () => {
    const input = {
      prompt: 'page prompt',
      triggerLabel: 'Open page',
      actions: { copyMarkdown: false },
      printNotice: false as const,
    };
    expect(PageOverrideSchema.parse(input)).toEqual(input);
  });

  it('rejects build-time-only fields like markdownUrl', () => {
    expect(() =>
      PageOverrideSchema.parse({ markdownUrl: '/{slug}.txt' }),
    ).toThrow();
  });

  it('rejects build-time-only fields like injectRoute', () => {
    expect(() => PageOverrideSchema.parse({ injectRoute: false })).toThrow();
  });

  it('rejects pageOptOut (the frontmatter key itself)', () => {
    expect(() =>
      PageOverrideSchema.parse({ pageOptOut: 'somethingElse' }),
    ).toThrow();
  });

  it('rejects unknown top-level keys', () => {
    expect(() => PageOverrideSchema.parse({ noSuchField: 1 })).toThrow();
  });
});

describe('mergePageOverride — top-level fields', () => {
  it('page prompt overrides global prompt', () => {
    const resolved = resolvePage(
      { prompt: 'GLOBAL' },
      { prompt: 'PAGE' },
    );
    expect(resolved.prompt).toBe('PAGE');
  });

  it('page triggerLabel overrides global', () => {
    const resolved = resolvePage(
      { triggerLabel: 'Global label' },
      { triggerLabel: 'Page label' },
    );
    expect(resolved.triggerLabel).toBe('Page label');
  });

  it('omitted fields inherit from global', () => {
    const resolved = resolvePage(
      { prompt: 'GLOBAL', triggerLabel: 'Global label' },
      {},
    );
    expect(resolved.prompt).toBe('GLOBAL');
    expect(resolved.triggerLabel).toBe('Global label');
  });
});

describe('mergePageOverride — prompt precedence (four layers)', () => {
  it('layer 4: providers inherit global prompt by default', () => {
    const resolved = resolvePage({ prompt: 'GLOBAL' }, {});
    const chatgpt = findProvider(resolved, 'chatgpt');
    expect(chatgpt?.prompt).toBe('GLOBAL');
  });

  it('layer 3: per-provider global prompt beats global', () => {
    const resolved = resolvePage(
      {
        prompt: 'GLOBAL',
        actions: {
          openIn: { providers: { chatgpt: { prompt: 'GLOBAL_CHATGPT' } } },
        },
      },
      {},
    );
    const chatgpt = findProvider(resolved, 'chatgpt');
    const claude = findProvider(resolved, 'claude');
    expect(chatgpt?.prompt).toBe('GLOBAL_CHATGPT');
    expect(claude?.prompt).toBe('GLOBAL');
  });

  it('layer 2: page top-level prompt beats global on inherited providers', () => {
    const resolved = resolvePage(
      { prompt: 'GLOBAL' },
      { prompt: 'PAGE' },
    );
    const chatgpt = findProvider(resolved, 'chatgpt');
    const claude = findProvider(resolved, 'claude');
    expect(chatgpt?.prompt).toBe('PAGE');
    expect(claude?.prompt).toBe('PAGE');
  });

  it('layer 2 vs 3: page top-level does NOT override per-provider global', () => {
    const resolved = resolvePage(
      {
        prompt: 'GLOBAL',
        actions: {
          openIn: { providers: { chatgpt: { prompt: 'GLOBAL_CHATGPT' } } },
        },
      },
      { prompt: 'PAGE' },
    );
    const chatgpt = findProvider(resolved, 'chatgpt');
    const claude = findProvider(resolved, 'claude');
    // Per-provider global override wins over page top-level prompt
    expect(chatgpt?.prompt).toBe('GLOBAL_CHATGPT');
    expect(claude?.prompt).toBe('PAGE');
  });

  it('layer 1: page+provider beats everything', () => {
    const resolved = resolvePage(
      {
        prompt: 'GLOBAL',
        actions: {
          openIn: { providers: { chatgpt: { prompt: 'GLOBAL_CHATGPT' } } },
        },
      },
      {
        prompt: 'PAGE',
        actions: {
          openIn: {
            providers: {
              chatgpt: { prompt: 'PAGE_CHATGPT' },
              claude: { prompt: 'PAGE_CLAUDE' },
            },
          },
        },
      },
    );
    const chatgpt = findProvider(resolved, 'chatgpt');
    const claude = findProvider(resolved, 'claude');
    const gemini = findProvider(resolved, 'gemini');
    expect(chatgpt?.prompt).toBe('PAGE_CHATGPT');
    expect(claude?.prompt).toBe('PAGE_CLAUDE');
    expect(gemini?.prompt).toBe('PAGE'); // unmentioned → page top-level
  });
});

describe('mergePageOverride — provider partial overlay', () => {
  it('enables a default-off provider on a single page', () => {
    // cursor is off by default; page enables it
    const resolved = resolvePage(
      {},
      { actions: { openIn: { providers: { cursor: true } } } },
    );
    expect(findProvider(resolved, 'cursor')).toBeDefined();
  });

  it('disables a globally-enabled provider on a single page', () => {
    const resolved = resolvePage(
      {},
      { actions: { openIn: { providers: { chatgpt: false } } } },
    );
    expect(findProvider(resolved, 'chatgpt')).toBeUndefined();
  });

  it('does not affect providers the page does not mention', () => {
    const resolved = resolvePage(
      {},
      { actions: { openIn: { providers: { chatgpt: false } } } },
    );
    // claude was on by default and stays on
    expect(findProvider(resolved, 'claude')).toBeDefined();
  });

  it('preserves global per-provider override when page sets `<id>: true`', () => {
    const resolved = resolvePage(
      {
        actions: {
          openIn: { providers: { chatgpt: { url: 'https://custom/{prompt}' } } },
        },
      },
      { actions: { openIn: { providers: { chatgpt: true } } } },
    );
    const chatgpt = findProvider(resolved, 'chatgpt');
    expect(chatgpt?.urlTemplate).toBe('https://custom/{prompt}');
  });

  it('deep-merges per-provider object: page fields win, global fields persist', () => {
    const resolved = resolvePage(
      {
        actions: {
          openIn: { providers: { chatgpt: { url: 'https://custom/{prompt}' } } },
        },
      },
      {
        actions: {
          openIn: { providers: { chatgpt: { prompt: 'page chatgpt prompt' } } },
        },
      },
    );
    const chatgpt = findProvider(resolved, 'chatgpt');
    expect(chatgpt?.urlTemplate).toBe('https://custom/{prompt}');
    expect(chatgpt?.prompt).toBe('page chatgpt prompt');
  });
});

describe('mergePageOverride — actions toggles', () => {
  it('page can disable copyMarkdown', () => {
    const resolved = resolvePage(
      {},
      { actions: { copyMarkdown: false } },
    );
    expect(resolved.actions.copyMarkdown).toBe(false);
  });

  it('page can re-enable a globally-disabled action', () => {
    const resolved = resolvePage(
      { actions: { copyMarkdown: false } },
      { actions: { copyMarkdown: true } },
    );
    expect(resolved.actions.copyMarkdown).toBe(true);
  });

  it('page can disable openIn entirely', () => {
    const resolved = resolvePage(
      {},
      { actions: { openIn: false } },
    );
    expect(resolved.actions.openIn).toBe(false);
  });

  it('page openIn:true preserves global openIn object', () => {
    const resolved = resolvePage(
      { actions: { openIn: { label: 'Global label' } } },
      { actions: { openIn: true } },
    );
    expect(resolved.actions.openIn).not.toBe(false);
    if (resolved.actions.openIn !== false) {
      expect(resolved.actions.openIn.label).toBe('Global label');
    }
  });
});

describe('mergePageOverride — printNotice', () => {
  it('page false disables a globally-enabled print notice', () => {
    const resolved = resolvePage(
      { printNotice: true },
      { printNotice: false },
    );
    expect(resolved.printNotice).toBeNull();
  });

  it('page true enables when global was off', () => {
    const resolved = resolvePage({}, { printNotice: true });
    expect(resolved.printNotice).not.toBeNull();
  });

  it('page object overlays onto global object', () => {
    const resolved = resolvePage(
      {
        printNotice: {
          warning: { title: 'Global title' },
          branding: { siteName: 'Global Site' },
        },
      },
      { printNotice: { warning: { title: 'Page title' } } },
    );
    expect(resolved.printNotice?.warning?.title).toBe('Page title');
    expect(resolved.printNotice?.branding?.siteName).toBe('Global Site');
  });
});

describe('mergePageOverride — empty / no-op cases', () => {
  it('empty page override returns equivalent of plain global resolve', () => {
    const global: StarlightLlmActionsConfig = {
      prompt: 'X',
      actions: { copyMarkdown: false },
    };
    const direct = resolveConfig(global);
    const merged = resolvePage(global, {});
    expect(merged).toEqual(direct);
  });
});

describe('preOpenDelay option', () => {
  it('defaults to 300 when omitted', () => {
    expect(resolveConfig({}).preOpenDelay).toBe(300);
  });

  it('returns 0 when set to 0', () => {
    expect(resolveConfig({ preOpenDelay: 0 }).preOpenDelay).toBe(0);
  });

  it('rejects negative preOpenDelay', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ preOpenDelay: -1 }),
    ).toThrow();
  });

  it('rejects non-integer preOpenDelay', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ preOpenDelay: 1.5 }),
    ).toThrow();
  });

  it('PageOverrideSchema rejects preOpenDelay (build-time only)', () => {
    expect(() =>
      PageOverrideSchema.parse({ preOpenDelay: 100 }),
    ).toThrow();
  });
});

describe('closeOnAction option', () => {
  it('defaults to true when omitted', () => {
    expect(resolveConfig({}).closeOnAction).toBe(true);
  });

  it('returns false when set to false', () => {
    expect(resolveConfig({ closeOnAction: false }).closeOnAction).toBe(false);
  });

  it('rejects non-boolean closeOnAction', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ closeOnAction: 'yes' }),
    ).toThrow();
  });

  it('PageOverrideSchema rejects closeOnAction (build-time only)', () => {
    expect(() =>
      PageOverrideSchema.parse({ closeOnAction: false }),
    ).toThrow();
  });
});

describe('toastDuration option', () => {
  it('defaults to 3000 when omitted', () => {
    expect(resolveConfig({}).toastDuration).toBe(3000);
  });

  it('returns the provided value when set', () => {
    expect(resolveConfig({ toastDuration: 5000 }).toastDuration).toBe(5000);
  });

  it('rejects non-integer toastDuration', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ toastDuration: 1.5 }),
    ).toThrow();
  });

  it('rejects zero toastDuration', () => {
    expect(() =>
      StarlightLlmActionsConfigSchema.parse({ toastDuration: 0 }),
    ).toThrow();
  });

  it('PageOverrideSchema rejects toastDuration (build-time only)', () => {
    expect(() =>
      PageOverrideSchema.parse({ toastDuration: 3000 }),
    ).toThrow();
  });
});
