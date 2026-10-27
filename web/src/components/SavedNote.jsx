import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SAVED_ADDED } from '../utils/saved';

const DISMISSED_KEY = 'amaras-pick:saved-note-dismissed';

// Off until sign-in opens (#74): until then a save simply stays on this device.
export const SIGN_IN_OPEN = false;

const wasDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

// After a signed-out save (spec 0004 rule 9): the save is on this device, and
// signing in keeps it everywhere. "Not now" hides it until the browser closes.
const SavedNote = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onAdded = () => {
      if (SIGN_IN_OPEN && !wasDismissed()) setOpen(true);
    };
    window.addEventListener(SAVED_ADDED, onAdded);
    return () => window.removeEventListener(SAVED_ADDED, onAdded);
  }, []);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Hidden for this page only.
    }
    setOpen(false);
  };

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[1100] px-3 sm:bottom-6">
      {open && (
        <div className="on-ink pointer-events-auto mx-auto flex max-w-[560px] flex-col gap-3 bg-ink p-4 text-paper sm:flex-row sm:items-center sm:gap-5">
          <p className="flex-1 text-body">
            <span className="font-semibold">Saved on this device.</span> Sign in to keep your saves on any device.
          </p>
          <div className="flex gap-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 flex-1 items-center justify-center bg-paper px-5 font-medium text-ink no-underline hover:bg-mist sm:flex-none"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 border border-paper px-4 text-paper hover:bg-graphite"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedNote;
