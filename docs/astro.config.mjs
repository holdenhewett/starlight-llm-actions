// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmActions from 'starlight-llm-actions';

export default defineConfig({
  integrations: [
    starlight({
      title: 'starlight-llm-actions',
      description: 'Playground for the starlight-llm-actions plugin.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/hhewett/starlight-llm-actions',
        },
      ],
      plugins: [
        starlightLlmActions({
          actions: {
            // Re-enable PDF in the playground so the dropdown button is testable.
            printPdf: true,
          },
          printNotice: {
            branding: {
              logo: { src: '/favicon.svg', alt: 'Logo' },
              siteName: 'Playground DOCS',
            },
            warning: {
              // Override one default to verify customisation flows through.
              message: [
                'This is a point-in-time export and may be outdated.',
                'Internal use only — do not redistribute.',
              ],
            },
          },
        }),
      ],
      sidebar: [
        { label: 'Welcome', slug: '' },
        { label: 'Opt-out example', slug: 'opt-out' },
      ],
    }),
  ],
});
