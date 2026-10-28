import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { deleteMyAccount, setNewsEmails, signOut, useAuth } from '../services/auth';
import { UK_SIZES, setSize, useSavedItems, useSize } from '../utils/saved';

const pieces = (n) => `${n} Saved ${n === 1 ? 'piece' : 'pieces'}`;

const DeleteConfirm = ({ onCancel, onDeleted }) => {
  const count = useSavedItems().length;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section aria-labelledby="delete-heading" className="mt-8">
      <h2 id="delete-heading" className="font-display text-h2 font-normal">
        Delete your account?
      </h2>
      <p className="mt-3 text-body-l">
        This removes your email, {count > 0 ? `your ${pieces(count)}` : 'your Saved pieces'}, your size and your email
        choices for good. It can&apos;t be undone.
      </p>
      <p className="mt-3 text-body text-graphite">You can still search and shop without an account.</p>
      {error && (
        <p role="alert" className="mt-4 text-body text-ink">
          We couldn&apos;t delete your account just now. Please try again.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          disabled={deleting}
          className="btn btn-primary w-full"
          onClick={async () => {
            setDeleting(true);
            setError(false);
            try {
              await deleteMyAccount();
              onDeleted();
            } catch {
              setError(true);
              setDeleting(false);
            }
          }}
        >
          {deleting ? 'Deleting…' : 'Yes, delete my account'}
        </button>
        <button type="button" className="btn btn-secondary w-full" onClick={onCancel}>
          Keep my account
        </button>
      </div>
    </section>
  );
};

// Spec 0004 rules 6, 15, 18 and 19: her size, the news emails box, signing
// out on this device, and deleting the account.
const Account = () => {
  const { status, user, profile } = useAuth();
  const size = useSize();
  const [news, setNews] = useState(null);
  const [newsError, setNewsError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const navigate = useNavigate();

  if (deleted) {
    return (
      <div className="container-custom pb-20 pt-12 md:pb-28 md:pt-20">
        <div className="mx-auto max-w-[400px]">
          <h1 className="font-display text-display-l font-normal">Account deleted</h1>
          <p role="status" className="mt-3 text-body-l text-graphite">
            Your account and everything in it are gone. You can still search and shop as before.
          </p>
          <Link to="/" className="btn btn-primary mt-8 w-full">
            Back to browsing
          </Link>
        </div>
      </div>
    );
  }
  if (status === 'loading') {
    return (
      <div className="container-custom pb-20 pt-12">
        <p role="status" className="sr-only">
          Loading your account
        </p>
      </div>
    );
  }
  if (status !== 'signed-in') return <Navigate to="/login?next=/account" replace />;

  const newsOn = news ?? Boolean(profile?.news_emails);

  return (
    <div className="container-custom pb-20 pt-12 md:pb-28 md:pt-20">
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="font-display text-display-l font-normal">Your account</h1>
        <p className="mt-3 text-body text-graphite">Signed in as {user.email}</p>

        {confirming ? (
          <DeleteConfirm onCancel={() => setConfirming(false)} onDeleted={() => setDeleted(true)} />
        ) : (
          <>
            <section className="mt-8" aria-labelledby="size-heading">
              <h2 id="size-heading" className="text-body-l font-semibold">
                Your size
              </h2>
              <p className="mb-3 mt-1 text-small text-graphite">
                Every phone and computer you sign in on starts with this size.
              </p>
              <div role="radiogroup" aria-labelledby="size-heading" className="grid grid-cols-4 gap-2">
                {UK_SIZES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={size === n}
                    onClick={() => setSize(size === n ? '' : n)}
                    className={`min-h-12 border font-medium tabular-nums ${size === n ? 'border-ink bg-ink text-paper' : 'border-stone bg-paper text-ink hover:border-ink'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8 border-t border-rule pt-6" aria-labelledby="emails-heading">
              <h2 id="emails-heading" className="mb-3 text-body-l font-semibold">
                Emails
              </h2>
              <label className="flex items-start gap-3 text-body text-ink">
                <input
                  type="checkbox"
                  checked={newsOn}
                  onChange={async (e) => {
                    const wanted = e.target.checked;
                    setNews(wanted);
                    setNewsError(false);
                    try {
                      await setNewsEmails(wanted);
                    } catch {
                      setNews(!wanted);
                      setNewsError(true);
                    }
                  }}
                  className="mt-0.5 h-5 w-5 flex-none accent-ink"
                />
                Send me new finds and offers. Sign-in links always arrive, whatever you choose here.
              </label>
              {newsError && (
                <p role="alert" className="mt-2 text-small text-ink">
                  That didn&apos;t save. Please try again.
                </p>
              )}
            </section>

            <section className="mt-8 flex flex-col gap-2 border-t border-rule pt-6">
              <button type="button" className="btn btn-secondary w-full" onClick={async () => {
                  await signOut();
                  navigate('/');
                }}>
                Sign out
              </button>
              <p className="text-center text-small text-graphite">Signs you out on this device only.</p>
              <button
                type="button"
                className="mt-5 min-h-11 self-center text-body text-ink underline underline-offset-4 hover:no-underline"
                onClick={() => setConfirming(true)}
              >
                Delete my account
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Account;
