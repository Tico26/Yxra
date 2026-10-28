import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { CheckEmail, EmailForm } from './Login';
import { sendSignInLink, takeNext, useAuth } from '../services/auth';

// Where the emailed link and Google send her back (spec 0004 rules 2 and 4).
// Supabase reads the sign-in from the address; a link that was used already
// or is over an hour old comes back with an error instead (rule 5).
const AuthCallback = () => {
  const { status } = useAuth();
  const [failed] = useState(() => /(^|[#&?])error(_code)?=/.test(window.location.hash + window.location.search));
  const [sentTo, setSentTo] = useState(null);

  if (status === 'signed-in') return <Navigate to={takeNext()} replace />;

  if (sentTo) {
    return <CheckEmail email={sentTo} onResend={() => sendSignInLink({ email: sentTo })} onChangeEmail={() => setSentTo(null)} />;
  }

  if (!failed && status === 'loading') {
    return (
      <AuthLayout title="Signing you in" footer={null}>
        <p role="status" className="text-body-l text-graphite">
          One moment…
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="That link no longer works"
      note="Each sign-in link works once, for one hour. We can send you a fresh one now."
      footer={
        <Link to="/" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          Back to browsing
        </Link>
      }
    >
      <EmailForm button="Send a new link" onSent={setSentTo} />
    </AuthLayout>
  );
};

export default AuthCallback;
