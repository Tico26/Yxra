// Who runs Amara's Pick and how to reach them, shown in the footer and the legal
// pages. Set at build time by .github/workflows/deploy.yml from repository
// variables, so changing the domain or address needs no code change. Only
// these four AMARAS_PICK_* names reach the browser (envPrefix in vite.config.js).
const env = import.meta.env;

export const SITE = {
  url: (env.AMARAS_PICK_SITE_URL || 'https://amaraspick.com').replace(/\/$/, ''),
  email: env.AMARAS_PICK_CONTACT_EMAIL || 'hello@amaraspick.com',
  // E-Commerce Regulations 2002 reg 6: the trader's name and geographic address.
  traderName: env.AMARAS_PICK_TRADER_NAME || '',
  traderAddress: env.AMARAS_PICK_TRADER_ADDRESS || '',
};

export const LAST_UPDATED = '21 October 2026';
