import Privacy from './Privacy';
import Terms from './Terms';
import Cookies from './Cookies';
import Contact from './Contact';
import HowAmarasPickMakesMoney from './HowAmarasPickMakesMoney';
import ForRetailers from './ForRetailers';

// The fixed pages carried over from the previous site, at the same addresses,
// with the same tab titles and descriptions. scripts/prerender.mjs writes
// each one to static HTML at build time.
export const LEGAL_PAGES = [
  {
    path: '/privacy',
    Page: Privacy,
    title: 'Privacy',
    description: 'What Amara\'s Pick collects, why, who handles it, and your rights.',
  },
  { path: '/terms', Page: Terms, title: 'Terms', description: 'The terms for using Amara\'s Pick.' },
  {
    path: '/cookies',
    Page: Cookies,
    title: 'Cookies and storage',
    description: 'Amara\'s Pick sets no cookies of its own, and what it keeps on your device.',
  },
  { path: '/contact', Page: Contact, title: 'Contact', description: 'How to reach Amara\'s Pick.' },
  {
    path: '/how-amaras-pick-makes-money',
    Page: HowAmarasPickMakesMoney,
    title: 'How Amara\'s Pick makes money',
    description: 'Amara\'s Pick is free. How it will earn money, and how results are ordered.',
  },
  {
    path: '/for-retailers',
    Page: ForRetailers,
    title: 'For Retailers',
    description: 'How Amara\'s Pick reads your products, how to join, and how to opt out.',
  },
];
