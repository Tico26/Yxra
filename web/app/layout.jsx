import "@fontsource/gfs-didot/400.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "./globals.css";
import { Suspense } from "react";
import { SITE } from "../lib/site.mjs";
import Navbar from "./navbar";
import SiteFooter from "./site-footer";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Yxra: plus-size clothes in your size, in stock", template: "%s · Yxra" },
  description:
    "Search plus-size clothes, swimwear and activewear across UK shops, and see only what is in stock in your size.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#FFFFFF" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>
        <div className="flex flex-col min-h-screen">
          <Suspense>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
