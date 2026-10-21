import { CATEGORIES, SIZES, parseCategory, parseSize } from "../lib/format.mjs";
import { searchProducts } from "../lib/api.mjs";
import ProductCard from "./product-card";

export const dynamic = "force-dynamic";

const categoryWord = (category) =>
  category ? CATEGORIES.find((c) => c.value === category).label.toLowerCase() : "items";

async function Results({ size, category }) {
  let products;
  try {
    products = await searchProducts({ size, category });
  } catch {
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
      <p className="count">
        {products.length} {products.length === 1 ? "item" : categoryWord(category)} in stock in a{" "}
        {size}
      </p>
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

  return (
    <>
      <form className="search" action="/" method="get">
        <h1>Plus-size shops in one search. Only what&apos;s in your size.</h1>
        <p className="intro">
          Free. Search UK plus-size shops at once, then buy from the shop itself.
        </p>
        <p className="intro-small">
          No ads. Shops can&apos;t pay to rank higher. <a href="/shops">See which shops we search</a>.
        </p>
        <div className="search-row">
          <label>
            <span>Your UK size</span>
            <select name="size" defaultValue={size || ""} required>
              <option value="" disabled>
                Pick a size
              </option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Looking for</span>
            <select name="category" defaultValue={category}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Show what&apos;s in stock</button>
        </div>
      </form>
      {size ? <Results size={size} category={category} /> : null}
    </>
  );
}
