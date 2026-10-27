import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import ProductImage from '../components/ProductImage';
import SaveButton from '../components/SaveButton';
import EmptyState from '../components/EmptyState';
import { UK_SIZES, setSize, useSavedItems, useSize } from '../utils/saved';
import { formatPrice, joinList } from '../utils/format';

const ROW_IMAGE_SIZES = '(min-width: 768px) 160px, 104px';

// Whether she can buy it in her size, and where the Click-out goes: her size
// if it is in stock, or with no size picked, the smallest plus size in stock.
// Bra-only Products have no UK size, so they go to their page instead.
const stockFor = (product, size) => {
  const inStock = product.uk_sizes_in_stock;
  if (size !== null) {
    return inStock.includes(size)
      ? { buyable: true, line: `In stock in ${size}`, goSize: size }
      : { buyable: false, line: 'Sold out in your size' };
  }
  if (product.sizes_in_stock.length === 0) return { buyable: false, line: 'Sold out in every plus size' };
  return {
    buyable: true,
    line: `In stock in ${joinList(product.sizes_in_stock)}`,
    goSize: inStock.length > 0 ? inStock[0] : null,
  };
};

const TickIcon = () => (
  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 flex-none" aria-hidden="true">
    <path d="M2 7.5l3 3 7-7" fill="none" stroke="#1a7f37" strokeWidth="2" />
  </svg>
);

const SavedRow = ({ product, size }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const { buyable, line, goSize } = stockFor(product, size);
  const price = formatPrice(product.price_in_pence);
  return (
    <li className="flex gap-4 border-b border-rule py-5 md:gap-6">
      <Link
        to={`/products/${product.product_id}`}
        tabIndex={-1}
        aria-hidden="true"
        className={`relative w-[104px] flex-none md:w-40 ${buyable ? '' : 'opacity-50'}`}
      >
        {product.image_url && !imageFailed ? (
          <ProductImage src={product.image_url} sizes={ROW_IMAGE_SIZES} onError={() => setImageFailed(true)} />
        ) : (
          <div className="aspect-[3/4] bg-mist" />
        )}
      </Link>
      <div className={`flex min-w-0 flex-1 flex-col ${buyable ? '' : 'text-graphite'}`}>
        <p className="text-small text-graphite">{product.shop_name}</p>
        <h2 className="mt-0.5 text-body font-normal">
          <Link to={`/products/${product.product_id}`} className="text-inherit underline-offset-4 hover:underline">
            {product.product_name}
          </Link>
        </h2>
        {price && <p className="mt-1 text-body font-medium tabular-nums">{price}</p>}
        {buyable ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-small">
            <TickIcon />
            {line}
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-small font-semibold text-ink">{line}</p>
            <p className="mt-0.5 text-micro">We’ll keep it here while the shop still lists it.</p>
          </>
        )}
        <div className="mt-auto flex gap-2 pt-3">
          {buyable &&
            (goSize ? (
              <a href={`/go/${product.product_id}?size=${goSize}`} target="_blank" rel="noopener" className="btn btn-primary min-h-11 flex-1 px-4 md:flex-none">
                Go to shop
              </a>
            ) : (
              <Link to={`/products/${product.product_id}`} className="btn btn-primary min-h-11 flex-1 px-4 md:flex-none">
                See sizes
              </Link>
            ))}
          <SaveButton productId={product.product_id} productName={product.product_name} variant="boxed" className="ml-auto h-11 w-11" />
        </div>
      </div>
    </li>
  );
};

// The Saved page (spec 0004 rules 12 to 15): what she saved, newest first,
// sold out ones kept and marked. Saves live on this device until she signs in.
const Saved = () => {
  const items = useSavedItems();
  const size = useSize();
  const sizeId = useId();
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const idsKey = ids.join(',');
  // Products loaded so far, by id; removing one needs no new request.
  const [byId, setById] = useState({});
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let current = true;
    const missing = idsKey ? idsKey.split(',').map(Number).filter((id) => !(id in byId)) : [];
    if (missing.length === 0) {
      setLoaded(true);
      return undefined;
    }
    api.getProductsByIds(missing).then((products) => {
      if (!current) return;
      if (products === null) {
        setFailed(true);
      } else {
        setById((prev) => {
          const next = { ...prev };
          // Ids that come back with nothing are gone for good: remember that too.
          for (const id of missing) next[id] = null;
          for (const p of products) next[p.product_id] = p;
          return next;
        });
        setFailed(false);
      }
      setLoaded(true);
    });
    return () => {
      current = false;
    };
    // byId is read only to skip what is already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const products = ids.map((id) => byId[id]).filter(Boolean);
  const count = products.length;

  return (
    <div className="container-custom pb-20 pt-8 md:pb-24 md:pt-12">
      <PageHeader title="Saved">
        {count > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
            <p className="text-body text-graphite">
              {count} {count === 1 ? 'piece' : 'pieces'}
            </p>
            <div className="w-full sm:w-56">
              <label htmlFor={sizeId} className="field-label">
                Your size
              </label>
              <select
                id={sizeId}
                value={size ?? ''}
                onChange={(e) => setSize(e.target.value)}
                className="field field-select"
              >
                <option value="">Any plus size</option>
                {UK_SIZES.map((n) => (
                  <option key={n} value={n}>
                    UK {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </PageHeader>

      {failed && (
        <p role="alert" className="mb-6 bg-mist p-4 text-body">
          Your saved pieces couldn’t be loaded just now. Please try again in a moment.
        </p>
      )}

      {!loaded && ids.length > 0 && (
        <p role="status" className="text-body text-graphite">
          Loading your saved pieces
        </p>
      )}

      {loaded && !failed && count === 0 && (
        <EmptyState message="Nothing saved yet. Tap the heart on anything you like." to="/products" action="Browse products" />
      )}

      {count > 0 && (
        <ul className="border-t border-rule md:max-w-[760px]">
          {products.map((product) => (
            <SavedRow key={product.product_id} product={product} size={size} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default Saved;
