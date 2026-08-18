import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from './markdown-pipeline.js';

describe('htmlToMarkdown', () => {
  it('converts ordinary rendered content', async () => {
    const md = await htmlToMarkdown(
      '<h2>Install</h2><p>Run <strong>npm install</strong>.</p>',
    );
    expect(md).toBe('## Install\n\nRun **npm install**.');
  });

  it('drops the "Section titled …" anchor Starlight appends to headings', async () => {
    const md = await htmlToMarkdown(
      '<h2 id="setup">Setup</h2>' +
        '<a class="sl-anchor-link" href="#setup">' +
        '<span class="sr-only">Section titled “Setup”</span></a>' +
        '<p>Body.</p>',
    );
    expect(md).toBe('## Setup\n\nBody.');
  });

  it('recovers the code language from Expressive Code', async () => {
    const md = await htmlToMarkdown(
      '<figure class="expressive-code">' +
        '<figcaption><span class="sr-only">Terminal window</span></figcaption>' +
        '<pre data-language="sh"><code>npm install</code></pre>' +
        '</figure>',
    );
    expect(md).toContain('```sh');
    expect(md).toContain('npm install');
    expect(md).not.toContain('Terminal window');
  });

  it('pairs each tab label with its panel', async () => {
    const md = await htmlToMarkdown(
      '<starlight-tabs>' +
        '<div role="tab">npm</div><div role="tab">pnpm</div>' +
        '<section role="tabpanel"><p>npm install pkg</p></section>' +
        '<section role="tabpanel"><p>pnpm add pkg</p></section>' +
        '</starlight-tabs>',
    );
    expect(md).toBe(
      '* npm\n\n  npm install pkg\n\n* pnpm\n\n  pnpm add pkg',
    );
  });

  it('keeps an aside set apart, with its title marked as one', async () => {
    const md = await htmlToMarkdown(
      '<aside aria-label="Watch out" class="starlight-aside starlight-aside--caution">' +
        '<p class="starlight-aside__title" aria-hidden="true">' +
        '<svg class="starlight-aside__icon"><path d="M12 16a1 1 0 1 0 0 2Z"/></svg>' +
        'Watch out</p>' +
        '<div class="starlight-aside__content"><p>This can bite.</p></div>' +
        '</aside>',
    );
    expect(md).toBe('> **Watch out**\n>\n> This can bite.');
  });

  it('drops FileTree screen-reader labels', async () => {
    const md = await htmlToMarkdown(
      '<starlight-file-tree><ul><li>' +
        '<span class="sr-only">Directory</span>src' +
        '</li></ul></starlight-file-tree>',
    );
    expect(md).not.toContain('Directory');
    expect(md).toContain('src');
  });

  it('drops HTML comments', async () => {
    const md = await htmlToMarkdown('<!-- hidden --><p>Visible.</p>');
    expect(md).toBe('Visible.');
  });

  it('unwraps unknown custom elements rather than dropping their content', async () => {
    const md = await htmlToMarkdown(
      '<my-widget><p>Still here.</p></my-widget>',
    );
    expect(md).toBe('Still here.');
  });

  it('honours the data-mdast="ignore" opt-out', async () => {
    const md = await htmlToMarkdown(
      '<div data-mdast="ignore"><p>Chrome.</p></div><p>Content.</p>',
    );
    expect(md).toBe('Content.');
  });

  it('emits GFM tables', async () => {
    const md = await htmlToMarkdown(
      '<table><thead><tr><th>Option</th></tr></thead>' +
        '<tbody><tr><td>base</td></tr></tbody></table>',
    );
    expect(md).toContain('| Option |');
    expect(md).toContain('| base   |');
  });
});
