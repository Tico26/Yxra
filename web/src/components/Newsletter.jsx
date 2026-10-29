import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

// Sign-up band shown above the footer on every page. Brevo emails her a link
// to confirm, and she joins the list once she clicks it (double opt-in).
const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    const answer = await api.joinNewsletter({ email: email.trim(), website });
    setResult(answer);
    setSending(false);
    if (answer.ok) setEmail('');
  };

  return (
    <section aria-labelledby="newsletter-heading" className="bg-mist">
      <div className="container-custom grid gap-6 py-12 md:grid-cols-12 md:items-end md:py-14">
        <h2 id="newsletter-heading" className="font-display text-h2 md:col-span-5">
          Get the Amara&apos;s Pick newsletter
        </h2>
        <div className="md:col-span-7">
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="newsletter-email" className="field-label">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby="newsletter-about"
                className="field"
              />
            </div>
            {/* Only bots fill this in; people never see it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="newsletter-website">Leave this empty</label>
              <input
                id="newsletter-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <button type="submit" disabled={sending} className="btn btn-primary w-full sm:w-auto">
              {sending ? 'Signing up…' : 'Sign up'}
            </button>
          </form>
          <p id="newsletter-about" className="mt-2 text-small text-graphite">
            New finds in your size and the best offers, by email. We&apos;ll send you a link to confirm, and
            you can unsubscribe any time.{' '}
            <Link to="/privacy" className="text-ink underline underline-offset-4 hover:no-underline">
              Privacy
            </Link>
          </p>
          <p role="status" className="mt-2 text-small font-medium text-ink">
            {result?.message}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
