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

test('the sitemap lists /about', () => {
  assert.match(built('sitemap.xml'), /<loc>[^<]*\/about<\/loc>/);
});

test('every pre-built page links to /about in the footer', () => {
  const pages = readdirSync(new URL('./dist/', import.meta.url)).filter((f) => f.endsWith('.html') && f !== 'app.html');
  assert.ok(pages.length > 5);
  for (const file of pages) {
    const footer = built(file).split('<footer')[1] || '';
    assert.match(footer, /<a[^>]*href="\/about"[^>]*>About us<\/a>/, file);
  }
});

// The newsletter band, above every footer.
const band = (file) => built(file).split('aria-labelledby="newsletter-heading"')[1]?.split('</section>')[0] || '';

test('the newsletter band is open on every pre-built page but the confirmed one', () => {
  const pages = readdirSync(new URL('./dist/', import.meta.url)).filter(
    (f) => f.endsWith('.html') && !['app.html', 'newsletter/confirmed.html'].includes(f),
  );
  for (const file of pages) {
    const html = band(file);
    assert.match(text(html), /Get the Amara's Pick newsletter/, file);
    assert.match(html, /<input[^>]*id="newsletter-email"[^>]*>/, file);
    assert.doesNotMatch(html.match(/<input[^>]*id="newsletter-email"[^>]*>/)[0], /disabled/, file);
    assert.match(html, /<button[^>]*type="submit"[^>]*>Sign up<\/button>/, file);
    assert.doesNotMatch(text(html), /Coming soon|Nothing is sent yet/, file);
  }
});

test('the band says what she gets, that she confirms by email, and links to Privacy', () => {
  const html = band('index.html');
  assert.match(
    text(html),
    /New finds in your size and the best offers, by email\. We'll send you a link to confirm, and you can unsubscribe any time\./,
  );
  assert.match(html, /<a[^>]*href="\/privacy"[^>]*>/);
});

test('the band has a field people cannot see, to catch bots', () => {
  const html = band('index.html');
  const trap = html.match(/<input[^>]*name="website"[^>]*>/);
  assert.ok(trap, 'hidden field is there');
  assert.match(trap[0], /tabindex="-1"/);
  assert.match(trap[0], /autoComplete="off"|autocomplete="off"/);
});

test('/newsletter/confirmed is pre-built, thanks her, and has no sign-up band', () => {
  const html = built('newsletter/confirmed.html');
  assert.match(html, /<title>You're on the list · Amara's Pick<\/title>/);
  assert.match(text(html), /You're on the list/);
  assert.match(text(html), /Your email is confirmed\. The next Amara's Pick newsletter will come to your inbox\./);
  assert.match(html, /<a[^>]*href="\/products"[^>]*>/);
  assert.equal(band('newsletter/confirmed.html'), '');
});

test('Privacy names Brevo as the newsletter sender and explains the sign-up', () => {
  const words = text(built('privacy.html'));
  assert.match(words, /Sendinblue SAS \(Brevo\): sending the newsletter/);
  assert.match(
    words,
    /Newsletter\. If you sign up in the newsletter box, your email address and when you confirmed it\./,
  );
});
