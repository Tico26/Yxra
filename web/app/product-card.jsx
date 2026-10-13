import { formatChecked, formatPrice, stockLine } from "../lib/format.mjs";

// One Product in her size. The link goes through the Click-out, which checks
// stock again before she leaves. A plain <a> so nothing is prefetched.
export default function ProductCard({ product, size }) {
  const name = product.colour ? `${product.title}, ${product.colour}` : product.title;
  return (
    <li className="card">
      <a href={`/go/${product.product_id}?size=${size}`} rel="nofollow" className="card-link">
        <div className="card-photo">
          {product.image_url ? (
            // Retailer photos come from many hosts, so a plain img keeps it simple.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={name} loading="lazy" />
          ) : null}
        </div>
        <div className="card-body">
          <p className="card-retailer">{product.retailer_name}</p>
          <h3 className="card-title">{name}</h3>
          <p className="card-price">{formatPrice(product.price_in_pence)}</p>
          <p className="card-stock">
            <span aria-hidden="true">✓</span> {stockLine(size, product.fits)}
          </p>
          <p className="card-checked">{formatChecked(product.last_checked_at)}</p>
        </div>
      </a>
    </li>
  );
}
