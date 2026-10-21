import { SITE } from "../lib/site.mjs";

export default function robots() {
  return { rules: { userAgent: "*", disallow: "/go/" }, sitemap: `${SITE.url}/sitemap.xml` };
}
