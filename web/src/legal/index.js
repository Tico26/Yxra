import Privacy from './Privacy';
import Terms from './Terms';
import Cookies from './Cookies';
import Contact from './Contact';
import HowYxraMakesMoney from './HowYxraMakesMoney';
import ForRetailers from './ForRetailers';

// The fixed pages carried over from the previous site, at the same addresses,
// with the same tab titles and descriptions. scripts/prerender.mjs writes
// each one to static HTML at build time.
export const LEGAL_PAGES = [
  {
    path: '/privacy',
    Page: Privacy,
    title: 'Privacy',
    description: 'What Yxra collects, why, who handles it, and your rights.',
  },
  { path: '/terms', Page: Terms, title: 'Terms', description: 'The terms for using Yxra.' },
  {
    path: '/cookies',
    Page: Cookies,
    title: 'Cookies and storage',
    description: 'Yxra sets no cookies and stores nothing on your device.',
  },
  { path: '/contact', Page: Contact, title: 'Contact', description: 'How to reach Yxra.' },
  {
    path: '/how-yxra-makes-money',
    Page: HowYxraMakesMoney,
    title: 'How Yxra makes money',
    description: 'Yxra is free. How it will earn money, and how results are ordered.',
  },
  {
    path: '/for-retailers',
    Page: ForRetailers,
    title: 'For Retailers',
    description: 'How Yxra reads your products, how to join, and how to opt out.',
  },
];
