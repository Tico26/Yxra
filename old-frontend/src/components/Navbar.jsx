import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

// Header layout follows the live site: links left, YX|RA centred, boxed Login right.
// The outer <nav> keeps a fixed height so the page never jumps; only the inner
// card animates between the tall (top of page) and compact (scrolled) states.
const SHRINK_AT = 24; // px scrolled before the header shrinks
const GROW_AT = 8; // px from the top before it grows back (hysteresis)

const MENU_ID = 'site-menu';

const linkClass = ({ isActive }) =>
  `font-medium no-underline transition-colors duration-150 hover:underline ${isActive ? 'text-primary' : 'text-text-main hover:text-primary'}`;

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

  return (
    <nav className="sticky top-0 z-[1000] h-[88px] pointer-events-none">
      <div
        ref={cardRef}
        className={`pointer-events-auto relative bg-background-card border-b border-border transition-[height] duration-300 ease-out motion-reduce:transition-none ${isShrunk ? 'h-[64px]' : 'h-[88px]'}`}
      >
        <div className="max-w-[1200px] mx-auto px-4 h-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left: menu button on phones, text links from sm (640px) up */}
          <div className="flex items-center justify-self-start">
            <button
              ref={buttonRef}
              type="button"
              className="sm:hidden -ml-2 flex h-10 w-10 items-center justify-center text-primary"
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

          {/* Centre: YX|RA wordmark */}
          <Link
            to="/"
            aria-label="YXRA home"
            className={`inline-flex items-center text-[52px] leading-none font-didot font-normal text-primary tracking-[-0.04em] no-underline origin-center transition-[scale] duration-300 ease-out motion-reduce:transition-none ${isShrunk ? 'scale-70' : 'scale-100'}`}
          >
            YX<span aria-hidden="true" className="inline-block w-[3px] h-[1.15em] mx-3 bg-current translate-y-[0.08em]"></span>RA
          </Link>

          {/* Right: boxed Login (moves into the menu on phones) */}
          <NavLink
            to="/login"
            className="hidden sm:inline-block justify-self-end border border-primary px-4 py-2 font-medium text-primary no-underline whitespace-nowrap"
          >
            Login
          </NavLink>
        </div>

        {/* Phone drop-down panel */}
        <div
          id={MENU_ID}
          hidden={!menuOpen}
          className="sm:hidden absolute left-0 right-0 top-full bg-background-card border-b border-border"
        >
          <div className="max-w-[1200px] mx-auto px-4 py-2 flex flex-col">
            {[...MAIN_LINKS, ['/login', 'Login']].map(([to, label]) => (
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
