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
