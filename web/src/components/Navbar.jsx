import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Wordmark from './Wordmark';
import { HeartIcon } from './SaveButton';
import { useSavedItems } from '../utils/saved';

// Header layout follows the live site: links left, AMARA'S|PICK centred, boxed Login right.
// The outer <nav> keeps a fixed height so the page never jumps; only the inner
// card animates between the tall (top of page) and compact (scrolled) states.
const SHRINK_AT = 24; // px scrolled before the header shrinks
const GROW_AT = 8; // px from the top before it grows back (hysteresis)

const MENU_ID = 'site-menu';

// The current page's link carries a 2px underline; others underline on hover.
const linkClass = ({ isActive }) =>
  `font-medium text-ink decoration-2 underline-offset-[6px] hover:underline ${isActive ? 'underline' : ''}`;

const MAIN_LINKS = [
  ['/', 'Home'],
  ['/shops', 'Shops'],
  ['/products', 'Products'],
];

const Navbar = () => {
  const [isShrunk, setIsShrunk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);

  // Close the menu whenever the route changes.
  const { pathname } = useLocation();
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setIsShrunk((prev) => (prev ? y > GROW_AT : y > SHRINK_AT));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const savedCount = useSavedItems().length;

  return (
    <nav className="sticky top-0 z-[1000] h-[88px] pointer-events-none">
      <div
        ref={cardRef}
        className={`pointer-events-auto relative bg-paper border-b border-rule transition-[height] duration-300 ease-out motion-reduce:transition-none ${isShrunk ? 'h-[64px]' : 'h-[88px]'}`}
      >
        <div className="container-custom h-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left: menu button on phones, text links from sm (640px) up */}
          <div className="flex items-center justify-self-start">
            <button
              ref={buttonRef}
              type="button"
              className="sm:hidden -ml-2 flex h-11 w-11 items-center justify-center text-ink"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls={MENU_ID}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
            <div className="hidden sm:flex flex-wrap gap-x-[22px] gap-y-[6px]">
              {MAIN_LINKS.map(([to, label]) => (
                <NavLink key={to} to={to} className={linkClass}>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Centre: AMARA'S|PICK wordmark */}
          <Link
            to="/"
            aria-label="Amara&apos;s Pick home"
            className={`inline-flex items-center text-[22px] sm:text-[30px] lg:text-[36px] text-ink no-underline origin-center transition-[scale] duration-300 ease-out motion-reduce:transition-none ${isShrunk ? 'scale-70' : 'scale-100'}`}
          >
            <Wordmark />
          </Link>

          {/* Right: Saved, with how many, then boxed Login (moves into the menu on phones) */}
          <div className="flex items-center justify-self-end gap-2 sm:gap-4">
            <NavLink
              to="/saved"
              aria-label={savedCount ? `Saved, ${savedCount} ${savedCount === 1 ? 'item' : 'items'}` : 'Saved'}
              className="relative -mr-2 flex h-11 w-11 items-center justify-center text-ink sm:mr-0"
            >
              {({ isActive }) => (
                <>
                  <HeartIcon filled={isActive} />
                  {savedCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold leading-none text-paper tabular-nums"
                    >
                      {savedCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
            <NavLink
              to="/login"
              className="hidden sm:inline-block border border-ink px-4 py-2 font-medium text-ink no-underline whitespace-nowrap transition-colors duration-150 hover:bg-mist motion-reduce:transition-none"
            >
              Log in (soon)
            </NavLink>
          </div>
        </div>

        {/* Phone drop-down panel */}
        <div
          id={MENU_ID}
          hidden={!menuOpen}
          className="sm:hidden absolute left-0 right-0 top-full bg-paper border-b border-rule"
        >
          <div className="container-custom py-2 flex flex-col">
            {[...MAIN_LINKS, ['/login', 'Log in (coming soon)']].map(([to, label]) => (
              <NavLink key={to} to={to} className={(s) => `${linkClass(s)} py-3`} onClick={closeMenu}>
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
