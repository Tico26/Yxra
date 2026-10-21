import { listRetailers } from "../../lib/api.mjs";
import { NOT_YET } from "../../lib/site.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shops we search",
  description: "The UK plus-size shops Yxra searches, and the big names that are not on Yxra yet.",
};

const host = (url) => new URL(url).hostname.replace(/^www\./, "");

// How much of the market Yxra covers (CMA comparison-tool principles): named
// in full, never "every shop".
export default async function ShopsPage() {
  let retailers = null;
  try {
    retailers = await listRetailers();
  } catch {
    retailers = null;
  }
  return (
    <article className="prose">
      <h1>Shops we search</h1>
      <p>
        Yxra searches the shops below. We read each shop&apos;s own product pages every night and
        only show what is in stock in your UK size. We check again the moment you click.
      </p>
      {retailers === null ? (
        <p className="notice">The list isn&apos;t loading right now. Please try again in a minute.</p>
      ) : retailers.length ? (
        <ul className="shop-list">
          {retailers.map((r) => (
            <li key={r.retailer_id}>
              <strong>{r.retailer_name}</strong> ({host(r.site_url)})
            </li>
          ))}
        </ul>
      ) : (
        <p className="notice">We are adding our first shops. Please come back soon.</p>
      )}
      <h2>Not on Yxra yet</h2>
      <p>
        Some big plus-size names aren&apos;t on Yxra yet, including {NOT_YET.join(", ")}. We hope to
        add them once they agree to share their product data with us.
      </p>
      <h2>Run a shop?</h2>
      <p>
        See <a href="/for-retailers">For Retailers</a> to join, or to ask us to remove your shop.
      </p>
    </article>
  );
}
