import { useEffect, useState } from 'react';
import { AuthContext, SIGN_IN_OPEN, attach, getClient } from '../services/auth';
import { setAccount } from '../utils/saved';

// Follows Supabase's sign-in on this device and loads her account into the
// Saved store whenever someone signs in (services/auth.js).
const AuthProvider = ({ children }) => {
  const [state, setState] = useState({ status: SIGN_IN_OPEN ? 'loading' : 'signed-out', user: null, profile: null });

  useEffect(() => {
    if (!SIGN_IN_OPEN) return undefined;
    let current = true;
    let subscription = null;
    let attachedFor = null;

    const settle = async (session) => {
      const user = session?.user ?? null;
      if (!user) {
        attachedFor = null;
        setAccount(null);
        if (current) setState({ status: 'signed-out', user: null, profile: null });
        return;
      }
      if (attachedFor === user.id) return;
      attachedFor = user.id;
      try {
        const profile = await attach(await getClient(), user);
        if (current) setState({ status: 'signed-in', user, profile });
      } catch (error) {
        console.error('Could not load your account:', error.message);
        attachedFor = null;
        if (current) setState({ status: 'signed-in', user, profile: null });
      }
    };

    getClient().then((client) => {
      if (!current) return;
      ({
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        // Supabase asks for no awaiting inside this callback.
        setTimeout(() => settle(session), 0);
      }));
    });
    return () => {
      current = false;
      subscription?.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
