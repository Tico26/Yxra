import "@fontsource/gfs-didot/400.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/700.css";
import "./globals.css";
import { SITE } from "../lib/site.mjs";
import TraderLine from "./trader-line";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Yxra: plus-size clothes in your size, in stock", template: "%s · Yxra" },
  description:
    "Search plus-size clothes, swimwear and activewear across UK shops, and see only what is in stock in your size.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#FFFFFF" };

// The header's category links show that category's products, under the hero.
const NAV = [
  ["/?category=clothes#products", "Clothes"],
  ["/?category=swimwear#products", "Swimwear"],
  ["/?category=activewear#products", "Activewear"],
  ["/shops", "Shops"],
];

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

// The YX|RA logo from Tico's earlier frontend: Didot letters split by a bar.
function Wordmark({ small = false }) {
  return (
    <a href="/" className={small ? "wordmark small" : "wordmark"} aria-label="Yxra home">
      YX<span className="bar" aria-hidden="true" />RA
    </a>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>
        <header className="site-header">
          <div className="wrap">
            <nav aria-label="Browse">
              {NAV.map(([href, label]) => (
                <a key={label} href={href}>
                  {label}
                </a>
              ))}
            </nav>
            <Wordmark />
            <a href="/#size" className="sizepill">
              Your size
            </a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <Wordmark small />
          <p>
            Free for you. We earn nothing from these links yet; later, shops pay a small commission
            that never changes the order.
          </p>
          <p>
            If Yxra shows it, it was in stock in your size at our last nightly check. Each item
            shows when that was.
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
