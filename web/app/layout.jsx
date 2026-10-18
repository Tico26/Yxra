import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";

export const metadata = {
  title: "Yxra: your dress, in your size, in stock",
  description:
    "Search plus-size clothes, swimwear and activewear across UK shops, and see only what is in stock in your size.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#2E1A3B" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>
        <header className="site-header">
          <a href="/" className="wordmark">
            Yxra
          </a>
          <span className="tagline">Your dress, in your size, in stock.</span>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Yxra is free. When you buy from a shop we link to, the shop pays us a small commission.
            That never changes the order of your results.
          </p>
          <p>
            If Yxra shows it, it was in stock in your size when we checked, and we check again when
            you click.
          </p>
        </footer>
      </body>
    </html>
  );
}
