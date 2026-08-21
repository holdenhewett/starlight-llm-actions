import picomatch from 'picomatch';

/**
 * Slug of the whole-corpus bundle, `/llms-full.txt`.
 *
 * Shared with config resolution because every bundle — the full corpus and each
 * named subset — is served by one dynamic route, so a subset that slugified to
 * `full` would be a duplicate path rather than an override.
 */
export const FULL_BUNDLE_SLUG = 'full';

/**
 * The fields the index generator needs off a docs entry. Described structurally
 * rather than as `CollectionEntry<'docs'>` for the same reason `DocsEntryLike`
 * is: that type only exists after `astro sync` runs in the consumer's project.
 */
export interface IndexEntry {
  /**
   * The page's site path, e.g. `guides/example` — no leading slash, no
   * extension.
   *
   * Every glob in `promote`, `demote`, `exclude`, and a subset's `paths` is
   * matched against this. It is the entry id for a collection Starlight routes
   * itself, and the id run through that collection's `path` template otherwise,
   * so a site writes one pattern dialect over the URLs it actually publishes.
   */
  path: string;
}

/**
 * Starlight's own site metadata, flattened for the index header.
 *
 * `llms.txt` opens with the site's name and summary, and Starlight already has
 * both — asking a site to restate them in this plugin's config would be a third
 * place to keep the same two strings in sync.
 */
export interface SiteMeta {
  title: string;
  description: string | null;
  /** BCP-47 tag used to break ordering ties. */
  defaultLang: string;
}

/** The subset of Starlight's user config that `siteMeta` reads. */
export interface StarlightMetaSource {
  title: string | Record<string, string>;
  description?: string | undefined;
  defaultLocale?: string | undefined;
  locales?: Record<string, { lang?: string | undefined } | undefined> | undefined;
}

/**
 * Flatten Starlight's site metadata.
 *
 * `title` is either a string or a per-language record, so a multi-language site
 * needs its default language resolved before either the header or the ordering
 * collator can be built.
 *
 * The language resolution mirrors Starlight's own: the `locales` entry named by
 * `defaultLocale`, falling back to the `root` entry. Note that `defaultLocale`
 * names a *key in `locales`*, not a language tag — they coincide often enough to
 * be worth stating.
 *
 * When that entry omits `lang`, Starlight falls back to the key itself
 * (`lang = locale.lang || key`, in its `locales` transform), so
 * `locales: { fr: { label: 'Français' } }` runs in French rather than English.
 * The `root` key is the one exception: its schema requires `lang`. A site with
 * no `locales` at all gets Starlight's built-in `'en'`.
 *
 * The `Object.values` fallback covers a title record with no entry for the
 * resolved language. Starlight rejects that config outright; this returns
 * something printable rather than an empty `# ` heading, because a wrong site
 * title in one generated file is not worth failing a build over.
 */
export function siteMeta(config: StarlightMetaSource): SiteMeta {
  const key = config.defaultLocale || 'root';
  const defaultLang =
    config.locales?.[key]?.lang || (key === 'root' ? 'en' : key);

  const title =
    typeof config.title === 'string'
      ? config.title
      : (config.title[defaultLang] ?? Object.values(config.title)[0] ?? '');

  return { title, description: config.description ?? null, defaultLang };
}

/** One `- [label](url): description` line in `llms.txt`. */
export interface IndexLink {
  label: string;
  url: string;
  description?: string | null | undefined;
}

/**
 * Compile a pattern list into a predicate, once.
 *
 * `picomatch.isMatch` recompiles its patterns on every call, and every one of
 * these lists is tested against every page — a 1000-page site with a handful of
 * globs would rebuild the same regexes tens of thousands of times.
 *
 * An empty list matches nothing, which is what makes an omitted `exclude`
 * exclude nothing.
 */
function compile(patterns: readonly string[]): (path: string) => boolean {
  if (patterns.length === 0) return () => false;
  return picomatch([...patterns]);
}

/** Drop the entries `exclude` matches. */
export function applyExclude<T extends IndexEntry>(
  entries: readonly T[],
  exclude: readonly string[],
): T[] {
  const excluded = compile(exclude);
  return entries.filter((entry) => !excluded(entry.path));
}

/** Keep only the entries one of `paths` matches. Used to build a subset. */
export function applyInclude<T extends IndexEntry>(
  entries: readonly T[],
  paths: readonly string[],
): T[] {
  const included = compile(paths);
  return entries.filter((entry) => included(entry.path));
}

/**
 * Build the ordering function for a `promote`/`demote` pair.
 *
 * The returned function reports which band an entry falls in: negative is
 * promoted, `0` is neither, positive is demoted. Earlier patterns win within
 * each array, so `promote[0]` outranks `promote[1]`.
 *
 * `demote` is checked first because a page matching both is demoted — a page you
 * explicitly pushed to the end was named more deliberately than one swept up by
 * a broad `promote` glob. `starlight-llms-txt` resolves the same conflict the
 * same way.
 *
 * That package reaches this ordering by prefixing ids with a computed number of
 * underscores and sorting the resulting strings. This is the same ordering
 * stated directly, which is the difference between a test that pins behaviour
 * and one that pins an encoding.
 */
export function createOrder(
  promote: readonly string[],
  demote: readonly string[],
): (path: string) => number {
  const promoteMatchers = promote.map((pattern) => picomatch(pattern));
  const demoteMatchers = demote.map((pattern) => picomatch(pattern));

  return (path) => {
    const demoted = demoteMatchers.findIndex((isMatch) => isMatch(path));
    if (demoted > -1) return demoted + 1;

    const promoted = promoteMatchers.findIndex((isMatch) => isMatch(path));
    if (promoted > -1) return promoted - promoteMatchers.length;

    return 0;
  };
}

/**
 * Order entries for every index: promoted bands first, then everything else,
 * then demoted bands. Ties break on site path through `collator`, so the output
 * does not depend on the order the content loader happened to read files in.
 *
 * Each entry's band is computed once up front rather than inside the comparator,
 * which would recompute it on every comparison.
 */
export function sortEntries<T extends IndexEntry>(
  entries: readonly T[],
  promote: readonly string[],
  demote: readonly string[],
  collator: Intl.Collator,
): T[] {
  const order = createOrder(promote, demote);
  return entries
    .map((entry) => ({ entry, tier: order(entry.path) }))
    .sort(
      (a, b) =>
        a.tier - b.tier || collator.compare(a.entry.path, b.entry.path),
    )
    .map(({ entry }) => entry);
}

/**
 * Absolute URL for a site path, honouring Astro's `base`.
 *
 * `llms.txt` links have to be absolute: an agent that fetched the file over HTTP
 * has a base to resolve relative links against, but one handed the file as a
 * blob does not — and that second case is what the format exists to serve.
 */
export function absoluteUrl(
  pathname: string,
  base: string,
  site: URL | string,
): string {
  return new URL(base.replace(/\/$/, '') + pathname, site).href;
}

/**
 * Collapse a frontmatter string onto one line.
 *
 * Every entry in `llms.txt` is one list item, but a `description` written as a
 * YAML literal block keeps its newlines. Emitted as-is, the continuation lines
 * sit outside the `- ` marker and read as loose prose between entries.
 */
function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Escape the brackets in a link label.
 *
 * CommonMark allows *balanced* brackets inside link text, so a title like
 * `[Deprecated] API` already survives intact. An unbalanced one does not: a
 * stray `]` drops the link entirely, and a stray `[` swallows the text before
 * it. Escaping both is cheaper than deciding which titles are balanced.
 *
 * The backslash is in the class because it is the escape character: escaping
 * only the brackets turns `a \] b` into `a \\] b`, which CommonMark reads as an
 * escaped backslash followed by a *live* `]` — the bracket this function exists
 * to neutralise, back again one character later.
 */
function escapeLabel(label: string): string {
  return oneLine(label).replace(/[\\[\]]/g, '\\$&');
}

function linkLine({ label, url, description }: IndexLink): string {
  const summary = description ? oneLine(description) : '';
  return `- [${escapeLabel(label)}](${url})` + (summary ? `: ${summary}` : '');
}

export interface LlmsTxtDocument {
  title: string;
  description: string | null;
  /** Bundle links — the full corpus, then one per named subset. */
  sets: IndexLink[];
  /** One link per page, already ordered and filtered. */
  pages: IndexLink[];
}

/**
 * Render `/llms.txt`: the site's front door for agents.
 *
 * Carries both halves deliberately. `Documentation Sets` gives an agent one URL
 * for the whole corpus, which is what `starlight-llms-txt` publishes and what
 * existing consumers look for. `Documentation` lists every page against its own
 * Markdown route, which is only worth listing because this plugin publishes
 * those routes — it lets an agent fetch the three pages it needs instead of a
 * megabyte it mostly discards.
 */
export function renderLlmsTxt({
  title,
  description,
  sets,
  pages,
}: LlmsTxtDocument): string {
  const sections = [`# ${title}`];
  if (description) sections.push(`> ${description}`);

  if (sets.length > 0) {
    sections.push('## Documentation Sets', sets.map(linkLine).join('\n'));
  }
  if (pages.length > 0) {
    sections.push('## Documentation', pages.map(linkLine).join('\n'));
  }

  return sections.join('\n\n') + '\n';
}

/**
 * Render a bundle — `/llms-full.txt` or one subset — from page documents that
 * are already Markdown.
 *
 * The `<SYSTEM>` preamble names what the file is, so a model handed the bare
 * text knows whether it holds the whole corpus or one slice of it. It is the
 * convention `starlight-llms-txt` established, kept so that a site diffing the
 * two outputs during a cutover sees content differences rather than framing
 * ones.
 */
export function renderBundle(
  systemNote: string,
  documents: readonly string[],
): string {
  return [`<SYSTEM>${systemNote}</SYSTEM>`, ...documents].join('\n\n') + '\n';
}
