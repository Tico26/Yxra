import { CATEGORIES, SIZES, parseCategory, parseSize } from "../lib/format.mjs";
import { listRetailers, searchProducts } from "../lib/api.mjs";
import ProductCard from "./product-card";

export const dynamic = "force-dynamic";

const categoryWord = (category) =>
  category ? CATEGORIES.find((c) => c.value === category).label.toLowerCase() : "items";

// The shop-name ticker from Tico's earlier frontend. The names repeat so the
// lane is wide enough to loop; only the first copy is read out.
function ShopTicker({ names }) {
  if (!names.length) return null;
  const copies = Math.max(2, Math.ceil(12 / names.length) * 2);
  const lane = Array.from({ length: copies }, () => names).flat();
  return (
    <div className="ticker">
      <span className="ticker-lead">Shops we search</span>
      <p className="sr-only">{names.join(", ")}</p>
      <div className="ticker-lane" aria-hidden="true">
        {lane.map((name, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-name">{name}</span>
            <span className="ticker-sep">{"YXRA"[i % 4]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, children }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <div className="rule" />
      {children ? <p>{children}</p> : null}
    </div>
  );
}

function Results({ size, category, products }) {
  if (products === null) {
    return <p className="notice">Search is not working right now. Please try again in a minute.</p>;
  }
  if (!products.length) {
    return (
      <p className="notice">
        Nothing in a {size} right now{category ? ` in ${categoryWord(category)}` : ""}. We check
        every night, so come back tomorrow.
      </p>
    );
  }
  return (
    <>
      <SectionTitle title={`In a ${size}`}>
        {products.length} {products.length === 1 ? "item" : categoryWord(category)} in stock in a{" "}
        {size} at last night&apos;s check
      </SectionTitle>
      <ul className="grid">
        {products.map((p) => (
          <ProductCard key={p.product_id} product={p} size={size} />
        ))}
      </ul>
    </>
  );
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const size = parseSize(params.size);
  const category = parseCategory(params.category);

  const [retailers, products] = await Promise.all([
    listRetailers().catch(() => []),
    size ? searchProducts({ size, category }).catch(() => null) : undefined,
  ]);

  return (
    <>
      <ShopTicker names={retailers.map((r) => r.retailer_name)} />
      <section className="hero">
        <div className="hero-text">
          <h1>Plus-size shops in one search. Only what&apos;s in your size.</h1>
          <p>Free. Search UK plus-size shops at once, then buy from the shop itself.</p>
          <p className="muted">
            No ads. Shops can&apos;t pay to rank higher.{" "}
            <a href="/shops">See which shops we search</a>.
          </p>
        </div>
        <form className="picker" action="/" method="get" id="size">
          <h2>Pick your UK size</h2>
          <label className="picker-category">
            <span>Looking for</span>
            <select name="category" defaultValue={category}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sizes" role="group" aria-label="UK size">
            {SIZES.map((s) => (
              <button
                key={s}
                type="submit"
                name="size"
                value={s}
                className={s === size ? "on" : undefined}
                aria-pressed={s === size}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="muted small">Tap your size to see what&apos;s in stock.</p>
        </form>
      </section>
      {size ? <Results size={size} category={category} products={products} /> : null}
    </>
  );
}
