import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { pageOverrideSchema } from 'starlight-llm-actions/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        llmActions: pageOverrideSchema.optional(),
      }),
    }),
  }),
  // Playground only: a second collection with its own schema, served from a
  // route whose paths do not parallel the entry ids — the entry `0-12-0` is
  // published at `/changelog/entry/0-12-0/`. That mismatch is what
  // `collections[].path` exists to close, so pinning it here is worth the
  // fixture.
  //
  // Note there is no `draft` field here. The Markdown routes filter on
  // `!entry.data.draft`, which passes every entry of a schema that has no such
  // field rather than throwing.
  changelog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      area: z.string(),
      changeType: z.enum(['feature', 'fix']),
    }),
  }),
};
