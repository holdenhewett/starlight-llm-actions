/**
 * Stand-in for `astro:content`, aliased in by `vitest.config.ts`.
 *
 * The corpus is fixed rather than settable per test. Every route under test
 * wants the same thing from it — a few ids to filter and order — and a mutable
 * module-level fixture would let one test's setup leak into the next.
 *
 * `reference/*` exists because the stub config excludes it and names it in a
 * subset; `reference/wip` is a draft because the routes pass a filter to
 * `getCollection`, and a stub that ignored that argument would make a route
 * that stopped honouring `draft` still look correct.
 */
export interface StubDoc {
  id: string;
  body: string;
  data: {
    title: string;
    description?: string | undefined;
    draft?: boolean | undefined;
  };
}

export const DOCS: readonly StubDoc[] = [
  { id: 'index', body: 'Welcome.', data: { title: 'Home' } },
  {
    id: 'guides/one',
    body: 'A guide.',
    data: { title: 'One', description: 'How to one.' },
  },
  { id: 'reference/big', body: 'Every option.', data: { title: 'Reference' } },
  { id: 'reference/wip', body: 'Unfinished.', data: { title: 'WIP', draft: true } },
];

export function getCollection(
  _collection: string,
  filter?: (doc: StubDoc) => boolean,
): Promise<StubDoc[]> {
  return Promise.resolve(filter ? DOCS.filter(filter) : [...DOCS]);
}
