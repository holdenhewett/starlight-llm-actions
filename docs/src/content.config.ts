import { defineCollection, z } from 'astro:content';
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
};
