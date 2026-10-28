import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

// The pre-built pages, as Cloudflare serves them: build once, then read dist/.
before(() => {
  execSync('npm run build', { stdio: 'ignore' });
});

const built = (file) => readFileSync(new URL(`./dist/${file}`, import.meta.url), 'utf8');
// The visible words of a page, with tags and entity apostrophes flattened.
const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ');

test('/about is pre-built with its title and headline', () => {
  const html = built('about.html');
  assert.match(html, /<title>About us · Amara's Pick<\/title>/);
  assert.match(text(html), /About us Your size, actually in stock\./);
});

test('/about tells the shopper why the site exists and who Amara is', () => {
  const words = text(built('about.html'));
  assert.ok(
    words.includes(
      "Shopping plus size often means checking shop after shop, finding something you love, then seeing your size has sold out. Amara's Pick checks UK shops every night and shows you only clothes, swimwear and activewear that are in stock in UK 18 and up.",
    ),
  );
  assert.ok(
    words.includes(
      'Amara is our guide. She searches the shops for you, so you can spend your time choosing instead of hunting.',
    ),
  );
});

test('/about ends by asking for shops, linking to Contact', () => {
  const html = built('about.html');
  assert.match(text(html), /Know a shop we should search\? Tell us/);
  assert.match(html, /<a[^>]*href="\/contact"[^>]*>Tell us<\/a>/);
});
