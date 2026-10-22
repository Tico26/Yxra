import { parseSize } from "../lib/format.mjs";
import { listRetailers, searchProducts } from "../lib/api.mjs";
import ShopTicker from "./shop-ticker";
import SectionTitle from "./section-title";
import SizePicker from "./size-picker";
import ShopShowcase from "./shop-showcase";

export const dynamic = "force-dynamic";

// One of the three big "New in" tiles from Tico's Standouts block: the photo
// in a black frame, the shop's name and a note on hover.
function Feature({ product, size, tall = false }) {
  return (
    <a
      href={`/products/${product.product_id}?size=${size}`}
      className="relative group overflow-hidden bg-white flex flex-col items-center justify-center h-auto cursor-pointer"
    >
      <div
        className={`relative w-full ${tall ? "h-[480px] md:h-[696px] p-8" : "h-[336px] p-6"} border-2 border-black flex items-center justify-center overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.title}
          className="h-full w-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
        />
        <div
          className={`absolute ${tall ? "top-6 left-6 w-24 h-24 rounded-xl p-3" : "top-4 left-4 w-16 h-16 rounded-lg p-2"} z-30 bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/10 md:opacity-0 md:-translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0`}
        >
          <span className={`text-white ${tall ? "text-[12px]" : "text-[10px]"} font-didot font-bold text-center leading-tight uppercase tracking-widest px-1`}>
            {product.retailer_name}
          </span>
        </div>
        <div
          className={`absolute inset-x-0 bottom-0 z-20 ${tall ? "p-8" : "p-4"} bg-gradient-to-t from-black/95 via-black/60 to-transparent md:opacity-0 md:translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0`}
        >
          <p className={`${tall ? "text-base" : "text-sm"} font-sans text-white leading-tight`}>
            {product.title}
            {product.colour ? `, ${product.colour}` : ""}
          </p>
          <p className="text-xs text-[#8FE3C8] font-semibold mt-1">✓ In stock in {size}</p>
        </div>
      </div>
    </a>
  );
}

// Tico's black grid section: one item from each shop, with the shop's badge.
function ProductGridShowcase({ items, size }) {
  const slots = [...items.slice(0, 10), ...Array(Math.max(0, 10 - items.length)).fill(null)];
  return (
    <section className="py-16 bg-[#CCCCCC]">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {slots.map((product, index) => (
            <div key={product ? product.product_id : `empty-${index}`} className="aspect-[3/4] relative group overflow-hidden bg-white/10 border border-black/5">
              {product ? (
                <a href={`/products/${product.product_id}?size=${size}`} className="block w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 left-4 z-10">
                    <div className="bg-black px-4 py-2 flex items-center justify-center min-h-[40px] shadow-lg">
                      <span className="text-white text-xs font-didot font-bold tracking-widest uppercase truncate max-w-[120px]">
                        {product.retailer_name}
                      </span>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <a href={`/products?size=${size}`} className="bg-black text-white px-12 py-4 font-didot text-lg hover:bg-gray-800 transition-all">
            See everything in a {size}
          </a>
        </div>
      </div>
    </section>
  );
}

// Takes count items, one shop at a time in turn, so no shop fills a block on
// its own.
const spread = (products, count) => {
  const byShop = new Map();
  for (const p of products) byShop.set(p.retailer_id, [...(byShop.get(p.retailer_id) || []), p]);
  const queues = [...byShop.values()];
  const out = [];
  for (let i = 0; out.length < count && queues.some((q) => q.length > i); i += 1) {
    for (const q of queues) if (q[i] && out.length < count) out.push(q[i]);
  }
  return out;
};

export default async function Home({ searchParams }) {
  const size = parseSize((await searchParams).size);

  const [retailers, products] = await Promise.all([
    listRetailers().catch(() => []),
    size ? searchProducts({ size }).catch(() => null) : undefined,
  ]);
  const withPhotos = (products || []).filter((p) => p.image_url);

  const newIn = spread(withPhotos, 3);
  const shops = retailers
    .map((r) => ({ ...r, products: withPhotos.filter((p) => p.retailer_id === r.retailer_id) }))
    .filter((s) => s.products.length);
  const grid = spread(withPhotos.filter((p) => !newIn.includes(p)), 10);

  return (
    <div className="flex flex-col">
      <ShopTicker retailers={retailers} size={size} />

      {!size ? (
        <>
          <section className="bg-white py-16">
            <div className="container-custom text-center max-w-[800px]">
              <h1 className="font-didot text-[44px] md:text-[64px] leading-[1.05] text-primary tracking-tight">
                Plus-size shops in one search. Only what&apos;s in your size.
              </h1>
              <p className="mt-6 text-lg">
                Free. Search UK plus-size shops at once, then buy from the shop itself.
              </p>
              <p className="mt-2 text-text-muted">
                No ads. Shops can&apos;t pay to rank higher.{" "}
                <a href="/shops" className="underline">
                  See which shops we search
                </a>
                .
              </p>
            </div>
          </section>
          <SizePicker size={size} />
        </>
      ) : products === null ? (
        <p className="notice container-custom">Search is not working right now. Please try again in a minute.</p>
      ) : !withPhotos.length ? (
        <>
          <p className="notice container-custom">
            Nothing in a {size} right now. We check every night, so come back tomorrow.
          </p>
          <SizePicker size={size} title="Another size?" />
        </>
      ) : (
        <>
          <h1 className="sr-only">Plus-size clothes in stock in a {size}</h1>
          <section className="relative bg-white text-primary flex items-center justify-center px-4 py-16">
            <div className="container-custom flex flex-col items-center justify-center h-full">
              <SectionTitle note={`The newest in stock in a ${size}`}>New in</SectionTitle>
              {newIn.length >= 3 ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full md:px-12">
                  <div className="flex flex-col gap-6 h-full justify-center w-full md:w-[350px]">
                    <Feature product={newIn[0]} size={size} />
                    <Feature product={newIn[1]} size={size} />
                  </div>
                  <div className="w-full md:w-[500px]">
                    <Feature product={newIn[2]} size={size} tall />
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 w-full max-w-[500px]">
                  {newIn.map((p) => (
                    <Feature key={p.product_id} product={p} size={size} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <ShopShowcase shops={shops} size={size} />
          {grid.length ? <ProductGridShowcase items={grid} size={size} /> : null}
          <SizePicker size={size} title="Change size" />
        </>
      )}
    </div>
  );
}
