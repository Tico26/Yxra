import { LAST_UPDATED, SITE } from "../../lib/site.mjs";
import TraderLine from "../trader-line";

export const metadata = {
  title: "Privacy",
  description: "What Yxra collects, why, who handles it, and your rights.",
};

export default function PrivacyPage() {
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;
  return (
    <article className="prose">
      <h1>Privacy</h1>
      <p className="updated">Last updated {LAST_UPDATED}</p>
      <p>
        Yxra helps you find plus-size clothes in stock in your size at UK shops. You don&apos;t need an
        account, and we don&apos;t ask for your name or email to use it.
      </p>
      <h2>Who is responsible</h2>
      <TraderLine />
      <p>We are the controller of the personal data described here.</p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>When you visit.</strong> Cloudflare, which hosts Yxra, receives your IP address,
          browser details and the page you asked for, so it can send you the page and protect the site
          from attacks. Our reason: our legitimate interest in running a working, secure site.
        </li>
        <li>
          <strong>Visit counts.</strong> Cloudflare Web Analytics counts page views for us without
          cookies and without identifying you. We only see totals. Our reason: our legitimate interest
          in knowing how the site is used so we can improve it.
        </li>
        <li>
          <strong>When you choose an item.</strong> We record which item and UK size you clicked
          through to a shop, and when. Nothing in that record identifies you.
        </li>
        <li>
          <strong>When you email us.</strong> We keep your email address and message so we can reply,
          and delete them 12 months after we last hear from you. Our reason: our legitimate interest
          in answering you.
        </li>
      </ul>
      <p>We don&apos;t sell your data, show you ads based on it, or make automated decisions about you.</p>

      <h2>When you go to a shop</h2>
      <p>
        Once you click through, you are on the shop&apos;s own site, and its privacy policy applies.
        When a shop pays us commission in future, the affiliate network (such as Awin) may also
        record that the visit came from Yxra, under its own privacy policy.
      </p>

      <h2>Who handles it for us</h2>
      <ul>
        <li>Cloudflare, Inc.: hosting, visit counts and forwarding email sent to us.</li>
        <li>Supabase, Inc.: our database, which holds the click records above.</li>
        <li>Google LLC: the mailbox our email arrives in.</li>
      </ul>
      <p>
        Some of these process data in the USA. Where data leaves the UK, it is protected by the UK
        Extension to the EU-US Data Privacy Framework or by the UK&apos;s International Data Transfer
        Addendum.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us for a copy of your data, to correct or delete it, to restrict how we use it,
        or to move it, and you can object to how we use it. Email {mail}. We reply within one month.
      </p>

      <h2>Complaints</h2>
      <p>
        If you are unhappy with how we handle your data, email {mail} with &ldquo;Data protection
        complaint&rdquo; in the subject. We acknowledge every complaint within 30 days, look into it,
        and tell you the outcome. You can also complain to the Information Commissioner&apos;s Office
        at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</a> or on 0303
        123 1113.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page before we collect anything new, for example before we open an email
        list. See also <a href="/cookies">Cookies and storage</a>.
      </p>
    </article>
  );
}
