import { LAST_UPDATED } from '../site';
import LegalPage from '../components/LegalPage';

const Cookies = () => (
  <LegalPage title="Cookies and storage" updated={LAST_UPDATED}>
    <p>
      <strong>Amara&apos;s Pick sets no cookies of its own and uses no tracking.</strong> It keeps a few
      things in your browser&apos;s storage only when you ask it to, so there is no cookie banner.
    </p>
    <h2>What we keep on your device</h2>
    <ul>
      <li>
        <strong>Your Saved pieces and size</strong>, when you tap a heart or pick a size without signing
        in. Once you sign in they move into your account and leave this device.
      </li>
      <li>
        <strong>Your sign-in</strong>, so you stay signed in on this device until you sign out. While
        you are away at your email or at Google, we also remember which page to bring you back to and
        whether you ticked the news emails box.
      </li>
      <li>
        <strong>That you closed the &ldquo;Saved on this device&rdquo; note</strong>, until you close your
        browser.
      </li>
    </ul>
    <p>
      Each of these is needed for something you asked for, and none is shared with anyone. To remove
      them, sign out, or clear this site&apos;s data in your browser settings.
    </p>
    <h2>Our host</h2>
    <p>
      Cloudflare, which hosts Amara&apos;s Pick, may set a security cookie (such as <code>__cf_bm</code> or{' '}
      <code>cf_clearance</code>) if it needs to check that a visitor is a person and not a bot. That
      cookie is strictly necessary to keep the site safe and is not used to track you. Our visit
      counts use Cloudflare Web Analytics, which sets no cookies.
    </p>
    <h2>Shops</h2>
    <p>
      When you click through to a shop, the shop and, in future, an affiliate network such as Awin
      may set their own cookies on their own sites. Their cookie policies apply there.
    </p>
    <h2>If this changes</h2>
    <p>If we ever want to keep anything else on your device, we will say so here first.</p>
  </LegalPage>
);

export default Cookies;
