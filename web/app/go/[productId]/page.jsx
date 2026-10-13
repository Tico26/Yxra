import { redirect, notFound } from "next/navigation";
import { clickOut } from "../../../lib/api.mjs";
import { parseSize } from "../../../lib/format.mjs";
import ProductCard from "../../product-card";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// The Click-out: the API checks the Product in her size right now. In stock,
// she goes straight to the Retailer; just sold out, she stays and sees
// similar Products instead.
export default async function GoPage({ params, searchParams }) {
  const { productId } = await params;
  const size = parseSize((await searchParams).size);
  if (!size || !/^\d+$/.test(productId)) notFound();

  let result;
  try {
    result = await clickOut({ productId: Number(productId), size });
  } catch {
    result = null;
  }
  if (!result) notFound();
  if (result.outcome === "sent") redirect(result.url);

  return (
    <section className="sold-out">
      <h1>{result.message}</h1>
      <p>
        It sold out at the shop since our last check, so we haven&apos;t sent you there.{" "}
        {result.similar.length
          ? `Here ${result.similar.length === 1 ? "is something similar" : "are similar things"} still in stock in a ${size}.`
          : `We have nothing similar in stock in a ${size} right now.`}
      </p>
      {result.similar.length ? (
        <ul className="grid">
          {result.similar.map((p) => (
            <ProductCard key={p.product_id} product={p} size={size} />
          ))}
        </ul>
      ) : null}
      <p>
        <a href={`/?size=${size}`}>Back to everything in a {size}</a>
      </p>
    </section>
  );
}
