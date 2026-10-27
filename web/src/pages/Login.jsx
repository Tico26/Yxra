import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { SIGN_IN_OPEN, sendSignInLink, signInWithGoogle, useAuth } from '../services/auth';

// The address sign-in links come from (Supabase Auth SMTP, set up by
// scripts/setup-accounts.sh).
export const SENDER = 'no-reply@amaraspick.com';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

const NewsBox = ({ checked, onChange }) => (
  <label className="flex items-start gap-3 text-body text-ink">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-5 w-5 flex-none accent-ink"
    />
    Send me new finds and offers by email. You can stop them any time.
  </label>
);

// The email form, also used on the broken-link page for a fresh link.
export const EmailForm = ({ next, newsEmails = false, button = 'Email me a sign-in link', onSent, children }) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await sendSignInLink({ email: email.trim(), next, newsEmails });
      onSent(email.trim());
    } catch (err) {
      setError(
        err?.status === 429
          ? 'Too many links asked for in a short time. Please wait a minute and try again.'
          : 'We couldn’t send the link. Check the address and try again.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit} noValidate={false}>
      <div>
        <label htmlFor="email-address" className="field-label">
          Email address
        </label>
        <input
          id="email-address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={error ? 'email-error' : undefined}
          className="field"
        />
        {error && (
          <p id="email-error" role="alert" className="mt-2 text-small text-ink">
            {error}
          </p>
        )}
      </div>
      <button type="submit" disabled={sending} className="btn btn-primary w-full">
        {sending ? 'Sending…' : button}
      </button>
      {children}
    </form>
  );
};

export const CheckEmail = ({ email, onResend, onChangeEmail }) => {
  const [resent, setResent] = useState(null);
  return (
    <AuthLayout
      title="Check your email"
      footer={
        <Link to="/" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          Back to browsing
        </Link>
      }
    >
      <p className="text-body-l" role="status">
        We&apos;ve sent a sign-in link to <span className="font-semibold">{email}</span>. Open it to sign in. It
        works once, for one hour.
      </p>
      <p className="mt-4 text-body text-graphite">
        Nothing there after a minute? Look in your spam or promotions folder. It comes from {SENDER}.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={async () => {
            setResent(null);
            try {
              await onResend();
              setResent('We’ve sent another link.');
            } catch {
              setResent('We couldn’t send another link yet. Please wait a minute and try again.');
            }
          }}
        >
          Send the link again
        </button>
        <button type="button" className="min-h-11 text-ink underline underline-offset-4 hover:no-underline" onClick={onChangeEmail}>
          Use a different email
        </button>
        {resent && (
          <p role="status" className="text-small text-graphite">
            {resent}
          </p>
        )}
      </div>
    </AuthLayout>
  );
};

// Spec 0004 rules 1 to 4: Google, or an emailed link that also makes the
// account. No passwords.
const Login = () => {
  const [params] = useSearchParams();
  const next = params.get('next') || '/saved';
  const { status } = useAuth();
  const [newsEmails, setNewsEmails] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [googleError, setGoogleError] = useState(false);

  if (status === 'signed-in') return <Navigate to="/account" replace />;

  if (!SIGN_IN_OPEN) {
    return (
      <AuthLayout title="Log in" note="Coming soon. You don't need an account to use Amara's Pick." footer={null}>
        <Link to="/" className="btn btn-primary w-full">
          Back to browsing
        </Link>
      </AuthLayout>
    );
  }

  if (sentTo) {
    return (
      <CheckEmail
        email={sentTo}
        onResend={() => sendSignInLink({ email: sentTo, next, newsEmails })}
        onChangeEmail={() => setSentTo(null)}
      />
    );
  }

  return (
    <AuthLayout
      title="Log in"
      note="Keep the pieces you save, and your size, on any phone or computer. No password needed."
      footer={
        <>
          New here? The same link makes your account. You don&apos;t need one to search or shop. See our{' '}
          <Link to="/privacy" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
            Privacy notice
          </Link>
          .
        </>
      }
    >
      <button
        type="button"
        className="btn btn-secondary flex w-full items-center justify-center gap-3"
        onClick={async () => {
          setGoogleError(false);
          try {
            await signInWithGoogle({ next, newsEmails });
          } catch {
            setGoogleError(true);
          }
        }}
      >
        <GoogleIcon />
        Continue with Google
      </button>
      {googleError && (
        <p role="alert" className="mt-2 text-small text-ink">
          Google sign-in didn&apos;t start. Please try again, or use your email.
        </p>
      )}
      <div className="my-6 flex items-center gap-3 text-small text-graphite">
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
        or use your email
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      </div>
      <EmailForm next={next} newsEmails={newsEmails} onSent={setSentTo}>
        <NewsBox checked={newsEmails} onChange={setNewsEmails} />
      </EmailForm>
    </AuthLayout>
  );
};

export default Login;
