import { formatChecked, formatPrice, stockLine } from "../lib/format.mjs";

// Tico's product card, on real Products in her size. The card opens the
// Product page; buying happens at the shop.
export default function ProductCard({ product, size }) {
  const name = product.colour ? `${product.title}, ${product.colour}` : product.title;
  return (
    <li className="h-full">
      <a href={`/products/${product.product_id}?size=${size}`} className="group block h-full">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-100">
          <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
            {product.image_url ? (
              // Retailer photos come from many hosts, so a plain img keeps it simple.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : null}
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs font-bold rounded uppercase">
              {product.fits || size}
            </div>
            <div className="absolute bottom-3 left-3 bg-black px-3 py-1.5">
              <span className="text-white text-[11px] font-didot font-bold tracking-widest uppercase">
                {product.retailer_name}
              </span>
            </div>
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
              {name}
            </h3>
            <p className="text-sm font-semibold text-stock">
              <span aria-hidden="true">✓</span> {stockLine(size, product.fits)}
            </p>
            <p className="text-xs text-gray-500">{formatChecked(product.last_checked_at)}</p>
            <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center gap-2">
              <span className="font-bold text-gray-900">{formatPrice(product.price_in_pence)}</span>
              {product.colour ? (
                <span className="text-xs text-secondary font-medium px-2 py-1 bg-secondary/10 rounded-full truncate">
                  {product.colour}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}
