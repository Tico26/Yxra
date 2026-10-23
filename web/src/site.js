// Who runs Yxra and how to reach them, shown in the footer and the legal
// pages. Set at build time by .github/workflows/deploy.yml from repository
// variables, so changing the domain or address needs no code change. Only
// these four YXRA_* names reach the browser (envPrefix in vite.config.js).
const env = import.meta.env;

export const SITE = {
  url: (env.YXRA_SITE_URL || 'https://yxra.co.uk').replace(/\/$/, ''),
  email: env.YXRA_CONTACT_EMAIL || 'hello@yxra.co.uk',
  // E-Commerce Regulations 2002 reg 6: the trader's name and geographic address.
  traderName: env.YXRA_TRADER_NAME || '',
  traderAddress: env.YXRA_TRADER_ADDRESS || '',
};

export const LAST_UPDATED = '21 October 2026';
