import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";
import { SITE } from "../lib/site.mjs";
import TraderLine from "./trader-line";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Yxra: plus-size clothes in your size, in stock", template: "%s · Yxra" },
  description:
    "Search plus-size clothes, swimwear and activewear across UK shops, and see only what is in stock in your size.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#2E1A3B" };

// Spec 0002 rule 26: every page links to these.
const FOOTER_LINKS = [
  ["/shops", "Shops we search"],
  ["/how-yxra-makes-money", "How Yxra makes money"],
  ["/for-retailers", "For Retailers"],
  ["/privacy", "Privacy"],
  ["/cookies", "Cookies and storage"],
  ["/terms", "Terms"],
  ["/contact", "Contact"],
];

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>
        <header className="site-header">
          <a href="/" className="wordmark">
            Yxra
          </a>
          <span className="tagline">Your size, in stock.</span>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Free for you. We earn nothing from these links yet; later, shops pay a small commission
            that never changes the order.
          </p>
          <p>
            If Yxra shows it, it was in stock in your size when we last checked, and we check again
            when you click.
          </p>
          <nav aria-label="About Yxra">
            <ul className="footer-links">
              {FOOTER_LINKS.map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <TraderLine />
        </footer>
      </body>
    </html>
  );
}
