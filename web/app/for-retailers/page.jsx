import { SITE } from "../../lib/site.mjs";

export const metadata = {
  title: "For Retailers",
  description: "How Yxra reads your products, how to join, and how to opt out.",
};

export default function ForRetailersPage() {
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;
  return (
    <article className="prose">
      <h1>For Retailers</h1>
      <p>
        Yxra is a free search for plus-size women in the UK. A shopper picks her UK size once and
        sees clothes, swimwear and activewear that are in stock in that size, across many shops. When
        she chooses one, we send her to your own product page to buy. We sell nothing ourselves.
      </p>
      <h2>How we read your products</h2>
      <ul>
        <li>
          We read your public product data (your Shopify product files, or the product details on
          your pages), once a night.
        </li>
        <li>
          Our requests say who we are (user agent <code>Yxra/1.0</code> with our contact address),
          follow your robots.txt, and wait at least 5 seconds between requests to your site.
        </li>
        <li>
          We show the product name, colour, price, sizes in stock and your main photo, which loads
          from your own site. Everything else is on your page.
        </li>
        <li>We never show star ratings or reviews, and we only list plus-size ranges (UK 18 and up).</li>
      </ul>
      <h2>Join or change how you appear</h2>
      <p>
        Want your shop on Yxra, or want us to use your product feed or affiliate link (for example
        on Awin)? Email {mail}. Commission never changes where your items rank.
      </p>
      <h2>Opt out</h2>
      <p>
        If you don&apos;t want your shop on Yxra, email {mail} from your shop&apos;s domain. We remove
        your products from search within two working days and stop reading your site.
      </p>
    </article>
  );
}
