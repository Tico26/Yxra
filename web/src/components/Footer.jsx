import { Link } from 'react-router-dom';
import Wordmark from './Wordmark';
import TraderLine from './TraderLine';

const SITE_LINKS = [
  ['/', 'Home'],
  ['/shops', 'Shops'],
  ['/products', 'Products'],
  ['/login', 'Log in (coming soon)'],
];

// Company and Policy are the pages every page must reach (spec 0002 rule 26),
// as on the previous site's footer.
const COMPANY_LINKS = [
  ['/how-amaras-pick-makes-money', "How Amara's Pick makes money"],
  ['/for-retailers', 'Work with us'],
  ['/contact', 'Contact'],
];

const POLICY_LINKS = [
  ['/shops', 'Shops we search'],
  ['/privacy', 'Privacy'],
  ['/cookies', 'Cookies and storage'],
  ['/terms', 'Terms'],
];

const SOCIALS = [
  { href: 'https://instagram.com', label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { href: 'https://twitter.com', label: 'Twitter', path: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
  { href: 'https://facebook.com', label: 'Facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { href: 'https://tiktok.com', label: 'TikTok', path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z' },
];

const LinkList = ({ title, links }) => (
  <nav aria-label={title}>
    <h2 className="mb-3 text-small font-semibold text-ink">{title}</h2>
    <ul className="space-y-2">
      {links.map(([to, label]) => (
        <li key={to}>
          <Link to={to} className="text-small text-graphite underline-offset-4 hover:text-ink hover:underline">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

const Footer = () => (
  <footer className="bg-paper">
    <div className="container-custom grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-12 md:py-16">
      <div className="col-span-2 md:col-span-3">
        <Link to="/" aria-label="Amara&apos;s Pick home" className="inline-block text-[28px] text-ink no-underline">
          <Wordmark />
        </Link>
        <p className="mt-4 max-w-[32ch] text-small text-graphite">
          Plus-size clothes in stock in UK 18 and up, or bra band 38 and up, at UK shops.
        </p>
      </div>
      <div className="md:col-span-2">
        <LinkList title="Browse" links={SITE_LINKS} />
      </div>
      <div className="md:col-span-2">
        <LinkList title="Company" links={COMPANY_LINKS} />
      </div>
      <div className="md:col-span-2">
        <LinkList title="Policy" links={POLICY_LINKS} />
      </div>
      <div className="col-span-2 md:col-span-3">
        <h2 className="mb-3 text-small font-semibold text-ink">Socials</h2>
        <ul className="flex gap-2">
          {SOCIALS.map(({ href, label, path }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center border border-ink text-ink transition-colors duration-150 hover:bg-ink hover:text-paper motion-reduce:transition-none"
              >
                <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-2 space-y-2 border-t border-rule pt-8 text-small text-graphite md:col-span-12">
        <p>
          Free for you. We earn nothing from these links yet; later, shops pay a small commission
          that never changes the order.
        </p>
        <p>
          If Amara&apos;s Pick shows it, it was in stock in your size at our last nightly check. Each item
          shows when that was.
        </p>
        <TraderLine />
      </div>
    </div>
  </footer>
);

export default Footer;
