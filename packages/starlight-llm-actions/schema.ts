/**
 * Public Zod schema fragment users plug into their Starlight content
 * collection schema to validate per-page overrides at build time.
 *
 * @example
 * // docs/src/content.config.ts
 * import { defineCollection, z } from 'astro:content';
 * import { docsSchema } from '@astrojs/starlight/schema';
 * import { pageOverrideSchema } from 'starlight-llm-actions/schema';
 *
 * export const collections = {
 *   docs: defineCollection({
 *     schema: docsSchema({
 *       extend: z.object({
 *         llmActions: pageOverrideSchema.optional(),
 *       }),
 *     }),
 *   }),
 * };
 */
export {
  PageOverrideSchema as pageOverrideSchema,
  type PageOverride,
} from './config/pageOverride.js';
