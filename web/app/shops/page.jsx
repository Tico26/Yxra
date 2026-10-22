import { listRetailers } from "../../lib/api.mjs";
import { NOT_YET } from "../../lib/site.mjs";
import { parseSize } from "../../lib/format.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shops we search",
  description: "The UK plus-size shops Yxra searches, and the big names that are not on Yxra yet.",
};

const host = (url) => new URL(url).hostname.replace(/^www\./, "");

// Tico's All Shops page. Also says how much of the market Yxra covers
// (CMA comparison-tool principles): named in full, never "every shop".
export default async function ShopsPage({ searchParams }) {
  const size = parseSize((await searchParams).size);
  const retailers = await listRetailers().catch(() => null);

  return (
    <div className="min-h-screen bg-background-body py-10">
      <div className="container-custom">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-didot text-gray-900 mb-4">Shops we search</h1>
          <p className="text-gray-500">
            We read each shop&apos;s own product pages every night and only show what was in stock
            in your UK size at that check. Each item shows when it was last checked.
          </p>
        </div>

        {retailers === null ? (
          <p className="notice">The list isn&apos;t loading right now. Please try again in a minute.</p>
        ) : retailers.length ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {retailers.map((r) => (
              <li key={r.retailer_id}>
                <a
                  href={`/shops/${r.retailer_id}${size ? `?size=${size}` : ""}`}
                  className="bg-white shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-4 border border-gray-100 h-full"
                >
                  <span className="w-16 h-16 shrink-0 rounded-full bg-black text-white font-didot text-2xl flex items-center justify-center">
                    {r.retailer_name.slice(0, 1)}
                  </span>
                  <span>
                    <span className="block text-xl font-didot text-gray-900 mb-1">{r.retailer_name}</span>
                    <span className="block text-sm text-gray-400">{host(r.site_url)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="notice">We are adding our first shops. Please come back soon.</p>
        )}

        <div className="max-w-2xl mx-auto mt-16 space-y-6 text-gray-600">
          <div>
            <h2 className="text-2xl font-didot text-gray-900 mb-2">Not on Yxra yet</h2>
            <p>
              Some big plus-size names aren&apos;t on Yxra yet, including {NOT_YET.join(", ")}. We
              hope to add them once they agree to share their product data with us.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-didot text-gray-900 mb-2">Run a shop?</h2>
            <p>
              See{" "}
              <a href="/for-retailers" className="underline">
                For Retailers
              </a>{" "}
              to join, or to ask us to remove your shop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
