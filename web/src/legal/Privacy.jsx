import { Link } from 'react-router-dom';
import { LAST_UPDATED, SITE } from '../site';
import LegalPage from '../components/LegalPage';
import TraderLine from '../components/TraderLine';

const Privacy = () => {
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;
  return (
    <LegalPage title="Privacy" updated={LAST_UPDATED}>
      <p>
        Amara&apos;s Pick helps you find plus-size clothes in stock in your size at UK shops. You don&apos;t need an
        account to search or shop. If you make one, to keep your Saved pieces and size on any device,
        it holds only what is listed below.
      </p>
      <h2>Who is responsible</h2>
      <TraderLine />
      <p>We are the controller of the personal data described here.</p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>When you visit.</strong> Cloudflare, which hosts Amara&apos;s Pick, receives your IP address,
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
          <strong>If you make an account.</strong> Your email address, the pieces you save and when, your
          UK size, and whether you ticked &ldquo;Send me new finds and offers&rdquo; (and when). If you
          continue with Google, Google tells us your email address and name; we don&apos;t keep your name.
          Our reason: you asked for an account, so we need these to provide it. We keep them until you
          delete your account on the Your account page, which removes them straight away.
        </li>
        <li>
          <strong>News emails.</strong> Only if you tick the box, which starts unticked. You can stop
          them any time on the Your account page. Our reason: your consent.
        </li>
        <li>
          <strong>Newsletter.</strong> If you sign up in the newsletter box, your email address and when you
          confirmed it. We email you a link first, and you join only if you click it. Every newsletter has an
          unsubscribe link; once you use it, we keep your address only so you are never emailed again. If you ticked the news emails box on
          your account, your account&apos;s email address is on the list too. Our reason: your consent.
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
        record that the visit came from Amara&apos;s Pick, under its own privacy policy.
      </p>

      <h2>Who handles it for us</h2>
      <ul>
        <li>Cloudflare, Inc.: hosting, visit counts and forwarding email sent to us.</li>
        <li>Supabase, Inc.: our database and sign-in, which hold the click records and accounts above.</li>
        <li>Resend, Inc.: sending sign-in links and the newsletter, and keeping its mailing list.</li>
        <li>Google LLC: the mailbox our email arrives in, and Continue with Google if you choose it.</li>
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
        We will update this page before we collect anything new. See also <Link to="/cookies">Cookies and storage</Link>.
      </p>
    </LegalPage>
  );
};

export default Privacy;
