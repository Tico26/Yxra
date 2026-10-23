// Runs after `vite build` and `vite build --ssr` (see package.json "build").
// Writes the fixed pages to static HTML so crawlers and Awin see the full
// text, plus sitemap.xml and robots.txt. Pages that show API data (products,
// shops) stay as the empty app shell and render in the browser.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const ssrDir = fileURLToPath(new URL('../dist-ssr/', import.meta.url));
const { render, LEGAL_PAGES, SITE } = await import(pathToFileURL(`${ssrDir}entry-server.js`).href);

const template = await readFile(`${dist}index.html`, 'utf8');
const ROOT = '<div id="root"></div>';
if (!template.includes(ROOT)) throw new Error('dist/index.html has no empty #root');

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const page = (url, { title, description } = {}) => {
  let html = template.replace(ROOT, `<div id="root">${render(url)}</div>`);
  if (title) html = html.replace(/<title>.*?<\/title>/, `<title>${escape(title)} · Yxra</title>`);
  if (description) {
    html = html.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escape(description)}" />`,
    );
  }
  return html;
};

// The empty shell, served by worker.js for products, shops, Log in and Sign up.
await writeFile(`${dist}app.html`, template);
await writeFile(`${dist}index.html`, page('/'));
for (const { path, title, description } of LEGAL_PAGES) {
  await writeFile(`${dist}${path.slice(1)}.html`, page(path, { title, description }));
}
// Any address no route knows renders the not-found page.
await writeFile(`${dist}404.html`, page('/__not-found'));

// Same addresses as the previous site's sitemap.js and robots.js.
const SITEMAP = ['', '/shops', '/how-yxra-makes-money', '/for-retailers', '/privacy', '/cookies', '/terms', '/contact'];
await writeFile(
  `${dist}sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP.map(
    (path) => `<url>\n<loc>${escape(`${SITE.url}${path}`)}</loc>\n</url>`,
  ).join('\n')}\n</urlset>\n`,
);
await writeFile(`${dist}robots.txt`, `User-Agent: *\nDisallow: /go/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

await rm(ssrDir, { recursive: true, force: true });
console.log(`Pre-built /, ${LEGAL_PAGES.map((p) => p.path).join(', ')}, 404, sitemap.xml, robots.txt`);
