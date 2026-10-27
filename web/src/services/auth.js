import { createContext, useContext } from 'react';
import { api } from './api';
import { clearDevice, deviceSaved, deviceSize, setAccount } from '../utils/saved';

// Shopper accounts (spec 0004): Supabase Auth in the browser, with an emailed
// link or Google. Saved items and her size live in the shoppers schema, which
// row-level security keeps to her own rows. The address and key are public by
// design; they come from repository variables at build time
// (.github/workflows/deploy.yml). Without them, sign-in stays switched off.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const SIGN_IN_OPEN = Boolean(SUPABASE_URL && KEY);

// Where she goes after the link or Google, and whether she ticked the news
// emails box, kept while she is away at her email or at Google.
const NEXT_KEY = 'amaras-pick:after-sign-in';
const NEWS_KEY = 'amaras-pick:news-emails';

const remember = (key, value) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Without storage she lands on Saved and the box counts as unticked.
  }
};
const recall = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

// Only addresses on this site, never another site's.
const safeNext = (path) => (typeof path === 'string' && /^\/(?!\/)/.test(path) ? path : '/saved');

// The client loads on first use, so pages that never need it stay small.
let clientPromise = null;
export const getClient = () => {
  if (!SIGN_IN_OPEN) return Promise.resolve(null);
  clientPromise ||= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, KEY, { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true } }),
  );
  return clientPromise;
};

const shoppers = (client) => client.schema('shoppers');

const check = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const callbackUrl = () => `${window.location.origin}/auth`;

const beforeLeaving = ({ next, newsEmails }) => {
  remember(NEXT_KEY, safeNext(next));
  remember(NEWS_KEY, newsEmails ? 'yes' : null);
};

// Rule 2: an emailed link that signs her in once. The first one makes the
// account (rule 3).
export const sendSignInLink = async ({ email, next, newsEmails }) => {
  const client = await getClient();
  beforeLeaving({ next, newsEmails });
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
  });
  if (error) throw error;
};

export const signInWithGoogle = async ({ next, newsEmails }) => {
  const client = await getClient();
  beforeLeaving({ next, newsEmails });
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl() },
  });
  if (error) throw error;
};

export const takeNext = () => {
  const next = safeNext(recall(NEXT_KEY));
  remember(NEXT_KEY, null);
  return next;
};

// Rule 6: this device only.
export const signOut = async () => {
  const client = await getClient();
  await client.auth.signOut({ scope: 'local' });
};

// Rule 19.
export const deleteMyAccount = async () => {
  const client = await getClient();
  check(await shoppers(client).rpc('delete_my_account'));
  await client.auth.signOut({ scope: 'local' });
};

export const setNewsEmails = async (wanted) => {
  const client = await getClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return check(
    await shoppers(client)
      .from('profiles')
      .update({ news_emails: wanted, news_emails_at: wanted ? new Date().toISOString() : null })
      .eq('shopper_id', user.id)
      .select('news_emails, news_emails_at')
      .single(),
  );
};

// Signing in on a device that has saves (rules 10 and 17): they join her
// account without duplicates, her size moves in if the account has none,
// and the device's own copies are cleared. Saves of Products that are gone
// are dropped rather than failing the rest.
const moveDeviceIn = async (client, userId, profile) => {
  const items = deviceSaved();
  if (items.length > 0) {
    const live = await api.getProductsByIds(items.map((item) => item.id));
    if (live === null) return; // Try again next time; nothing is lost.
    const ids = new Set(live.map((p) => p.product_id));
    const rows = items
      .filter((item) => ids.has(item.id))
      .map((item) => ({ shopper_id: userId, product_id: item.id, saved_at: item.at }));
    if (rows.length > 0) {
      check(
        await shoppers(client)
          .from('saved_items')
          .upsert(rows, { onConflict: 'shopper_id,product_id', ignoreDuplicates: true }),
      );
    }
  }
  const size = deviceSize();
  if (size !== null && profile.uk_size === null) {
    check(await shoppers(client).from('profiles').update({ uk_size: size }).eq('shopper_id', userId));
    profile.uk_size = size;
  }
  clearDevice();
};

// Loads her account into the Saved store: the profile (made on first sign-in,
// with the news emails box as she left it), then the device's saves, then
// everything she has saved.
export const attach = async (client, user) => {
  const db = shoppers(client);
  check(await db.from('profiles').upsert({ shopper_id: user.id }, { onConflict: 'shopper_id', ignoreDuplicates: true }));
  if (recall(NEWS_KEY) === 'yes') {
    check(
      await db
        .from('profiles')
        .update({ news_emails: true, news_emails_at: new Date().toISOString() })
        .eq('shopper_id', user.id),
    );
    remember(NEWS_KEY, null);
  }
  const profile = check(
    await db.from('profiles').select('uk_size, news_emails').eq('shopper_id', user.id).single(),
  );
  await moveDeviceIn(client, user.id, profile);
  const saved = check(
    await db.from('saved_items').select('product_id, saved_at').order('saved_at', { ascending: false }),
  );
  setAccount({
    items: saved.map((row) => ({ id: row.product_id, at: row.saved_at })),
    size: profile.uk_size,
    save: async (id, at) =>
      check(await db.from('saved_items').upsert({ shopper_id: user.id, product_id: id, saved_at: at }, { onConflict: 'shopper_id,product_id', ignoreDuplicates: true })),
    unsave: async (id) => check(await db.from('saved_items').delete().eq('shopper_id', user.id).eq('product_id', id)),
    setSize: async (size) => check(await db.from('profiles').update({ uk_size: size }).eq('shopper_id', user.id)),
  });
  return profile;
};

// Who is signed in on this device: status is loading, signed-out or signed-in.
// Filled in by components/AuthProvider.jsx.
export const AuthContext = createContext({ status: 'signed-out', user: null, profile: null });

export const useAuth = () => useContext(AuthContext);
