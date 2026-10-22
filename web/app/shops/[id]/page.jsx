import { notFound } from "next/navigation";
import { parseSize } from "../../../lib/format.mjs";
import { listRetailers, searchProducts } from "../../../lib/api.mjs";
import ProductCard from "../../product-card";
import SizePicker from "../../size-picker";

export const dynamic = "force-dynamic";

// Tico's shop page: one shop's items in her size.
export default async function ShopPage({ params, searchParams }) {
  const { id } = await params;
  const size = parseSize((await searchParams).size);
  const retailers = await listRetailers().catch(() => []);
  const shop = retailers.find((r) => String(r.retailer_id) === id);
  if (!shop) notFound();

  const products = size
    ? await searchProducts({ size })
        .then((all) => all.filter((p) => p.retailer_id === shop.retailer_id))
        .catch(() => null)
    : undefined;

  return (
    <div className="min-h-screen bg-background-body py-10">
      <div className="container-custom">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-didot text-gray-900 mb-2">{shop.retailer_name}</h1>
          <p className="text-gray-500">
            {size ? `In stock in a ${size} at last night's check. ` : ""}
            <a href={shop.site_url} rel="nofollow noopener" target="_blank" className="underline">
              Visit {shop.retailer_name}
            </a>
          </p>
        </div>

        {!size ? (
          <SizePicker action={`/shops/${shop.retailer_id}`} title="Your size" />
        ) : products === null ? (
          <p className="notice">Search is not working right now. Please try again in a minute.</p>
        ) : products.length ? (
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.product_id} product={p} size={size} />
            ))}
          </ul>
        ) : (
          <div className="text-center py-20 text-gray-500 bg-white shadow-sm border border-border">
            <p className="text-lg">Nothing from {shop.retailer_name} in a {size} right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
