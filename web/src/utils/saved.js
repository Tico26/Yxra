import { useMemo, useSyncExternalStore } from 'react';

// A Shopper's Saved items and UK size, kept in this browser (spec 0004 rules
// 9 and 17). Signing in moves them into her account. Storage can be missing
// or blocked (private windows, pre-built pages), so every read and write is
// guarded and the site works without it.
const SAVED_KEY = 'amaras-pick:saved';
const SIZE_KEY = 'amaras-pick:size';
const CHANGED = 'amaras-pick:saved-changed';
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
  window.dispatchEvent(new Event(CHANGED));
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
  return UK_SIZES.includes(size) ? size : null;
};

// Saves the Product, or removes it if it was saved. Returns whether it is now saved.
export const toggleSaved = (id, now = new Date()) => {
  const list = parseSaved(readRaw(SAVED_KEY));
  const saved = list.some((item) => item.id === id);
  const next = saved ? list.filter((item) => item.id !== id) : [{ id, at: now.toISOString() }, ...list];
  writeRaw(SAVED_KEY, JSON.stringify(next));
  if (!saved) window.dispatchEvent(new Event(SAVED_ADDED));
  return !saved;
};

export const setSize = (size) => writeRaw(SIZE_KEY, parseSize(size) === null ? null : String(size));

const subscribe = (onChange) => {
  window.addEventListener(CHANGED, onChange);
  // Another tab saved or removed something.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
};

// Pre-built pages render with nothing saved; the browser fills it in.
const useStored = (key) => useSyncExternalStore(subscribe, () => readRaw(key), () => null);

export const useSavedItems = () => {
  const raw = useStored(SAVED_KEY);
  return useMemo(() => parseSaved(raw), [raw]);
};

export const useIsSaved = (id) => {
  const items = useSavedItems();
  return items.some((item) => item.id === id);
};

export const useSize = () => parseSize(useStored(SIZE_KEY));
