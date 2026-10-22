import { CATEGORIES, SIZES } from "../lib/format.mjs";
import {
  filterHref,
  filterSummary,
  inSize,
  isFiltered,
  isSearching,
  readSearch,
  resultsWord,
} from "../lib/search.mjs";
import { listRetailers, searchProducts } from "../lib/api.mjs";
import FilterDetails from "./filter-details";
import ProductCard from "./product-card";

export const dynamic = "force-dynamic";

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

const categoryLabel = (value) => (value ? CATEGORIES.find((c) => c.value === value)?.label : null);

// Up to three product photos for the hero, from different shops. None until
// the products load, and then the hero is type only.
const heroPhotos = (products) => {
  const seen = new Set();
  const photos = [];
  for (const p of products || []) {
    if (!p.image_url || seen.has(p.retailer_name)) continue;
    seen.add(p.retailer_name);
    photos.push(p);
    if (photos.length === 3) break;
  }
  return photos;
};

// The first thing she sees: what Yxra is, and the way in to the products.
function Hero({ photos }) {
  return (
    <section className={photos.length === 3 ? "hero has-photos" : "hero"}>
      <div className="hero-text">
        <p className="eyebrow">Yxra · UK plus sizes, 18 and up</p>
        <h1>Plus-size shops in one search. Only what&apos;s in stock.</h1>
        <p className="hero-lede">
          Yxra checks UK plus-size shops every night for clothes, swimwear and activewear,
          and shows you only what is in stock in your size. Then you buy from the shop
          itself.
        </p>
        <div className="hero-actions">
          <a href="#products" className="cta">
            See what&apos;s in stock
          </a>
          <a href="/shops" className="cta-quiet">
            Shops we search
          </a>
        </div>
        <p className="muted small">Free. No ads. Shops can&apos;t pay to rank higher.</p>
      </div>
      {photos.length === 3 ? (
        <div className="hero-photos" aria-hidden="true">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.product_id} src={p.image_url} alt="" loading="lazy" />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Results({ search, products }) {
  const sized = isSearching(search);
  if (products === null) {
    // Until the API can list products without a size, ask for one.
    return sized ? (
      <p className="notice">Search is not working right now. Please try again in a minute.</p>
    ) : (
      <p className="notice">
        Choose your size in the filter to see what&apos;s in stock.
      </p>
    );
  }
  if (!products.length) {
    let nothing;
    if (!sized) nothing = `Nothing in stock${search.category ? ` in ${search.category}` : ""} right now.`;
    else nothing = `Nothing in ${inSize(search)} right now${search.category ? ` in ${search.category}` : ""}.`;
    return <p className="notice">{nothing} We check every night, so come back tomorrow.</p>;
  }
  const word = resultsWord(search, products.length);
  return (
    <>
      {sized ? (
        <SectionTitle title={`In ${inSize(search)}`}>
          {products.length} {word} in stock in {inSize(search)} at last night&apos;s check
        </SectionTitle>
      ) : (
        <SectionTitle title={categoryLabel(search.category) || "In stock now"}>
          {products.length} {word} in stock in plus sizes at last night&apos;s check
        </SectionTitle>
      )}
      <ul className="grid">
        {products.map((p) => (
          <ProductCard key={p.product_id} product={p} search={search} />
        ))}
      </ul>
    </>
  );
}

function UkSizes({ search }) {
  return (
    <form action="/#products" method="get" className="filter-form">
      {search.category ? <input type="hidden" name="category" value={search.category} /> : null}
      <div className="sizes" role="group" aria-label="UK size">
        {SIZES.map((s) => (
          <button
            key={s}
            type="submit"
            name="size"
            value={s}
            className={s === search.size ? "on" : undefined}
            aria-pressed={s === search.size}
          >
            {s}
          </button>
        ))}
      </div>
      {search.size ? (
        <a href={filterHref(search, { size: null })} className="filter-reset">
          Any size
        </a>
      ) : (
        <p className="muted small">Showing every plus size. Tap yours to narrow it.</p>
      )}
    </form>
  );
}

// Category, then UK size. Every choice is a plain link or form in the
// address, so links, Back and no-JavaScript all work.
function FilterPanel({ search }) {
  return (
    <FilterDetails summary={filterSummary(search)}>
      <div className="filter-group">
        <h3>Category</h3>
        <ul className="filter-cats">
          {CATEGORIES.map((c) => {
            const on = c.value === search.category;
            return (
              <li key={c.value || "all"}>
                <a
                  href={filterHref(search, { category: c.value })}
                  className={on ? "on" : undefined}
                  aria-current={on ? "true" : undefined}
                >
                  {c.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="filter-group" id="size">
        <h3>UK size</h3>
        <UkSizes search={search} />
      </div>
      {isFiltered(search) ? (
        <a href="/#products" className="filter-clear">
          Clear all filters
        </a>
      ) : null}
    </FilterDetails>
  );
}

export default async function Home({ searchParams }) {
  const search = readSearch(await searchParams);

  const [retailers, products] = await Promise.all([
    listRetailers().catch(() => []),
    searchProducts(search).catch(() => null),
  ]);

  return (
    <>
      <ShopTicker names={retailers.map((r) => r.retailer_name)} />
      <Hero photos={heroPhotos(products)} />
      <section className="shop" id="products" aria-label="Products">
        <aside className="filter" id="filter" aria-label="Filter">
          <FilterPanel search={search} />
        </aside>
        <div className="results">
          <Results search={search} products={products} />
        </div>
      </section>
    </>
  );
}
