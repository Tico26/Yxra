import { CATEGORIES, parseCategory, parseSize } from "../../lib/format.mjs";
import { searchProducts } from "../../lib/api.mjs";
import ProductCard from "../product-card";
import SizePicker from "../size-picker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

const categoryWord = (category) =>
  category ? CATEGORIES.find((c) => c.value === category).label.toLowerCase() : "items";

// Tico's All Products page: everything in stock in her size, with the
// category tabs from the launch categories.
export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const size = parseSize(params.size);
  const category = parseCategory(params.category);
  if (!size) return <SizePicker action="/products" title="Your size" />;

  const products = await searchProducts({ size, category }).catch(() => null);

  return (
    <div className="min-h-screen bg-background-body py-10">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-didot text-gray-900">All products in a {size}</h1>
          <p className="text-gray-500 mt-2">
            In stock in a {size} at last night&apos;s check.{" "}
            <a href="/products#size" className="underline">
              Change size
            </a>
          </p>
          <nav aria-label="Category" className="flex flex-wrap gap-2 mt-6">
            {CATEGORIES.map((c) => (
              <a
                key={c.value}
                href={`/products?size=${size}${c.value ? `&category=${c.value}` : ""}`}
                className={`px-4 py-2 border text-sm font-medium ${
                  c.value === category ? "bg-black text-white border-black" : "bg-white border-border hover:border-black"
                }`}
              >
                {c.label}
              </a>
            ))}
          </nav>
        </div>

        {products === null ? (
          <p className="notice">Search is not working right now. Please try again in a minute.</p>
        ) : products.length ? (
          <>
            <p className="text-gray-500 mb-4">
              {products.length} {products.length === 1 ? "item" : categoryWord(category)}
            </p>
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.product_id} product={p} size={size} />
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Nothing in a {size} right now{category ? ` in ${categoryWord(category)}` : ""}. We check
            every night, so come back tomorrow.
          </div>
        )}
      </div>
    </div>
  );
}
