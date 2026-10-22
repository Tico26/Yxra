import { formatChecked, formatPrice, stockLine } from "../lib/format.mjs";
import { goHref, isSearching, stockSizes } from "../lib/search.mjs";

const SHOWN = 4;

// With no size chosen: "In stock in 18, 20, 22 +3 more", each size its own
// Click-out link, so the shop opens in the size she taps. A shop label we
// cannot send as a size ("XXL") is shown but not linked.
function SizesInStock({ sizes, name }) {
  if (!sizes.length) return null;
  const more = sizes.length - SHOWN;
  return (
    <p className="card-stock card-sizes">
      <span aria-hidden="true">✓</span> In stock in{" "}
      {sizes.slice(0, SHOWN).map((s, i) => (
        <span key={`${i}-${s.label}`}>
          {i ? ", " : null}
          {s.href ? (
            <a href={s.href} rel="nofollow" aria-label={`${name} in ${s.label}`}>
              {s.label}
            </a>
          ) : (
            s.label
          )}
        </span>
      ))}
      {more > 0 ? (
        <span className="card-more" title={sizes.slice(SHOWN).map((s) => s.label).join(", ")}>
          {" "}+{more} more
        </span>
      ) : null}
    </p>
  );
}

// One Product: in her UK size, or, when she has not chosen a size, with the
// plus sizes it is in stock in. The link
// goes through the Click-out, which records it and sends her to the shop. A
// plain <a> so nothing is prefetched.
export default function ProductCard({ product, search }) {
  const name = product.colour ? `${product.title}, ${product.colour}` : product.title;
  const sized = isSearching(search);
  const sizes = sized ? [] : stockSizes(product);
  // The Click-out needs a size; with none chosen the card opens the first
  // plus size in stock, and each listed size links in that size.
  const href = goHref(search, product) ?? product.product_url;
  return (
    <li className="card">
      <a href={href} rel="nofollow" className="card-link">
        <div className="card-photo">
          {product.image_url ? (
            // Retailer photos come from many hosts, so a plain img keeps it simple.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={name} loading="lazy" />
          ) : null}
          <span className="shop-badge">{product.retailer_name}</span>
        </div>
        <div className="card-body">
          <h3 className="card-title">{name}</h3>
          <p className="card-price">{formatPrice(product.price_in_pence)}</p>
          {sized ? (
            <p className="card-stock">
              <span aria-hidden="true">✓</span> {stockLine(search.size, product.fits)}
            </p>
          ) : null}
        </div>
      </a>
      <div className="card-foot">
        {sized ? null : <SizesInStock sizes={sizes} name={name} />}
        <p className="card-checked">{formatChecked(product.last_checked_at)}</p>
      </div>
    </li>
  );
}
