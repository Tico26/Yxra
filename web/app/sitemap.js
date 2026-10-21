import { SITE } from "../lib/site.mjs";

const PAGES = ["", "/shops", "/how-yxra-makes-money", "/for-retailers", "/privacy", "/cookies", "/terms", "/contact"];

export default function sitemap() {
  return PAGES.map((path) => ({ url: `${SITE.url}${path}` }));
}
