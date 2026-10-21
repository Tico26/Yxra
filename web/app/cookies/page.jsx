import { LAST_UPDATED } from "../../lib/site.mjs";

export const metadata = {
  title: "Cookies and storage",
  description: "Yxra sets no cookies and stores nothing on your device.",
};

export default function CookiesPage() {
  return (
    <article className="prose">
      <h1>Cookies and storage</h1>
      <p className="updated">Last updated {LAST_UPDATED}</p>
      <p>
        <strong>Yxra sets no cookies and stores nothing on your device.</strong> Your size stays in
        the page address (for example <code>?size=22</code>), so there is nothing to switch off and no
        cookie banner.
      </p>
      <h2>Our host</h2>
      <p>
        Cloudflare, which hosts Yxra, may set a security cookie (such as <code>__cf_bm</code> or{" "}
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
      <p>
        If we start remembering your size on your device, we will say so here first and give you a
        simple way to switch it off.
      </p>
    </article>
  );
}
