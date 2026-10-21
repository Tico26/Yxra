import { notFound } from "next/navigation";
import { formatChecked, formatPrice, parseSize } from "../../../lib/format.mjs";
import { getProduct } from "../../../lib/api.mjs";

export const dynamic = "force-dynamic";

// Tico's product page. No basket: the button goes to the shop through the
// Click-out, in her size.
export default async function ProductPage({ params, searchParams }) {
  const { id } = await params;
  const size = parseSize((await searchParams).size);
  if (!/^\d+$/.test(id)) notFound();
  const product = await getProduct(Number(id)).catch(() => null);
  if (!product) notFound();

  const name = product.colour ? `${product.title}, ${product.colour}` : product.title;
  const translated = product.sizes.filter((s) => s.size_status === "translated");
  const inStock = translated.filter((s) => s.in_stock);
  const herSize = size ? inStock.find((s) => s.uk_sizes.includes(size)) : null;
  const ukSizes = [...new Set(inStock.flatMap((s) => s.uk_sizes))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={name} className="w-full h-full object-cover" />
            ) : null}
          </div>

          <div>
            <div className="mb-2">
              <a
                href={`/shops/${product.retailer_id}${size ? `?size=${size}` : ""}`}
                className="text-sm font-bold text-primary tracking-wider uppercase font-didot"
              >
                {product.retailer_name}
              </a>
            </div>
            <h1 className="text-4xl font-didot text-gray-900 mb-4">{name}</h1>
            <p className="text-2xl font-semibold text-gray-900 mb-6">{formatPrice(product.price_in_pence)}</p>

            <div className="border-t border-b border-gray-100 py-6 mb-8 space-y-4">
              <div className="flex items-start gap-4">
                <span className="font-semibold text-gray-900 w-24 shrink-0">In stock:</span>
                <div className="flex flex-wrap gap-2">
                  {ukSizes.length ? (
                    ukSizes.map((s) => (
                      <a
                        key={s}
                        href={`/products/${product.product_id}?size=${s}`}
                        className={`px-4 py-2 border font-bold ${
                          s === size ? "border-primary bg-primary text-white" : "border-border text-primary hover:border-primary"
                        }`}
                      >
                        {s}
                      </a>
                    ))
                  ) : (
                    <span className="text-gray-600">Sold out in plus sizes at the last check</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900 w-24 shrink-0">Checked:</span>
                <span className="text-gray-600">{formatChecked(product.last_checked_at)}</span>
              </div>
            </div>

            {herSize ? (
              <>
                <p className="text-stock font-semibold mb-4">
                  <span aria-hidden="true">✓</span> In stock in {size}
                  {herSize.uk_sizes.length > 1 ? ` (label ${herSize.size_label})` : ""}
                </p>
                <a href={`/go/${product.product_id}?size=${size}`} rel="nofollow" className="btn btn-primary w-full py-4 text-lg">
                  Buy at {product.retailer_name}
                </a>
              </>
            ) : (
              <p className="text-gray-600">
                {size ? `Not in stock in a ${size} at the last check. ` : ""}Pick one of the sizes above
                to buy it at {product.retailer_name}.
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              You buy from {product.retailer_name}. Their price, delivery and returns apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
