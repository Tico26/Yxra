import { useSyncExternalStore } from 'react';

// A Shopper's Saved items and UK size (spec 0004). Signed out, they are kept
// in this browser (rules 9 and 17); signed in, in her account, so they follow
// her to any device (rules 11 and 16). Storage can be missing or blocked
// (private windows, pre-built pages), so every read and write is guarded and
// the site works without it.
const SAVED_KEY = 'amaras-pick:saved';
const SIZE_KEY = 'amaras-pick:size';
export const SAVED_ADDED = 'amaras-pick:saved-added';

export const UK_SIZES = [18, 20, 22, 24, 26, 28, 30, 32];

const readRaw = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeRaw = (key, value) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Not kept, but this page still shows the change.
  }
};

// [{ id, at }], each Product once, newest saved first.
export const parseSaved = (raw) => {
  let list;
  try {
    list = JSON.parse(raw || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list
    .filter((item) => item && Number.isInteger(item.id) && item.id > 0 && typeof item.at === 'string')
    .filter((item) => !seen.has(item.id) && seen.add(item.id))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
};

export const parseSize = (raw) => {
  const size = Number(raw);
  return raw !== null && raw !== '' && UK_SIZES.includes(size) ? size : null;
};

// What this device holds, for moving into an account at sign-in.
export const deviceSaved = () => parseSaved(readRaw(SAVED_KEY));
export const deviceSize = () => parseSize(readRaw(SIZE_KEY));
export const clearDevice = () => {
  writeRaw(SAVED_KEY, null);
  writeRaw(SIZE_KEY, null);
};

// The account, while she is signed in: { items, size, save, unsave, setSize }.
// save/unsave/setSize write to her account and reject if that fails.
let account = null;
const EMPTY = { items: [], size: null };
let snapshot = EMPTY;
const listeners = new Set();

const refresh = () => {
  snapshot = account
    ? { items: account.items, size: account.size }
    : { items: deviceSaved(), size: deviceSize() };
  listeners.forEach((fn) => fn());
};

export const setAccount = (next) => {
  account = next;
  refresh();
};

// Changes the account's copy now and puts it back if the write fails.
const change = async (patch, write) => {
  const before = { items: account.items, size: account.size };
  Object.assign(account, patch(before));
  refresh();
  try {
    await write();
  } catch (error) {
    console.error('Could not save to your account:', error.message);
    Object.assign(account, before);
    refresh();
  }
};

// Saves the Product, or removes it if it was saved. Returns whether it is now saved.
export const toggleSaved = (id, now = new Date()) => {
  const saved = snapshot.items.some((item) => item.id === id);
  if (account) {
    const at = now.toISOString();
    change(
      ({ items }) => ({
        items: saved ? items.filter((item) => item.id !== id) : [{ id, at }, ...items],
      }),
      () => (saved ? account.unsave(id) : account.save(id, at)),
    );
  } else {
    const list = deviceSaved();
    const next = saved ? list.filter((item) => item.id !== id) : [{ id, at: now.toISOString() }, ...list];
    writeRaw(SAVED_KEY, JSON.stringify(next));
    refresh();
  }
  if (!saved) window.dispatchEvent(new Event(SAVED_ADDED));
  return !saved;
};

export const setSize = (value) => {
  const size = parseSize(value === '' ? null : String(value));
  if (account) {
    change(() => ({ size }), () => account.setSize(size));
  } else {
    writeRaw(SIZE_KEY, size === null ? null : String(size));
    refresh();
  }
};

const subscribe = (onChange) => {
  listeners.add(onChange);
  // Another tab saved or removed something on this device.
  const onStorage = (e) => {
    if (!account && (e.key === SAVED_KEY || e.key === SIZE_KEY || e.key === null)) refresh();
  };
  window.addEventListener('storage', onStorage);
  if (listeners.size === 1 && snapshot === EMPTY) refresh();
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
};

// Pre-built pages render with nothing saved; the browser fills it in.
const useSnapshot = () => useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);

export const useSavedItems = () => useSnapshot().items;

export const useIsSaved = (id) => useSavedItems().some((item) => item.id === id);

export const useSize = () => useSnapshot().size;
