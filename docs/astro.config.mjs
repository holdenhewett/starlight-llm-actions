// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmActions from 'starlight-llm-actions';

export default defineConfig({
  site: 'https://holdenhewett.github.io',
  base: '/starlight-llm-actions/',
  integrations: [
    starlight({
      title: 'starlight-llm-actions',
      description: 'Playground for the starlight-llm-actions plugin.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/holdenhewett/starlight-llm-actions',
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
        {
          label: 'Getting started',
          items: [
            { label: 'Install', slug: 'getting-started/install' },
            { label: 'Concepts', slug: 'getting-started/concepts' },
          ],
        },
        {
          label: 'Actions',
          items: [
            { label: 'Copy as Markdown', slug: 'actions/copy' },
            { label: 'View as Markdown', slug: 'actions/view' },
            { label: 'Download as PDF', slug: 'actions/print-pdf' },
            { label: 'Open in…', slug: 'actions/open-in' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Reference', slug: 'configuration/reference' },
            { label: 'Providers', slug: 'configuration/providers' },
            { label: 'Print/PDF snapshot notice', slug: 'configuration/print-notice' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Per-page opt-out', slug: 'guides/per-page-opt-out' },
          ],
        },
        { label: 'Opt-out example', slug: 'opt-out' },
      ],
    }),
  ],
});
