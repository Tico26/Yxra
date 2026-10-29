import { useId, useMemo, useState } from 'react';
import CategoryFilter from './CategoryFilter';
import PriceFilter from './PriceFilter';
import ProductGrid, { ProductGridSkeleton } from './ProductGrid';
import EmptyState from './EmptyState';
import { filtersPresent, matchesFilter } from '../utils/filters';

const PAGE_SIZE = 48;

// formatPrice shows nothing for a missing or zero price, so neither counts as a price here.
const hasPrice = (p) => Number(p.price_in_pence) > 0;

const SORTS = {
  mixed: null,
  'price-asc': 1,
  'price-desc': -1,
};

// A filterable, sortable product grid that shows 48 at a time. On its own it
// filters the products it is given. The products page instead passes the
// filter (filter, onFilterChange) and every filter to offer (filters), and
// loads each filter's products from the API itself (spec 0005).
const ProductBrowser = ({
  products,
  headingAs = 'h2',
  showShop = true,
  defaultSortLabel = 'Shops mixed',
  filters: offered,
  filter: chosen,
  onFilterChange,
  loading = false,
}) => {
  const sortId = useId();
  const [ownFilter, setOwnFilter] = useState('all');
  const category = chosen ?? ownFilter;
  const [priceRange, setPriceRange] = useState(null); // null: the full range
  const [sort, setSort] = useState('mixed');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => offered ?? filtersPresent(products), [offered, products]);

  // Slider bounds in whole pounds, from the products loaded on this page.
  const bounds = useMemo(() => {
    const prices = products.filter(hasPrice).map((p) => p.price_in_pence);
    if (prices.length < 2) return null;
    const min = Math.floor(Math.min(...prices) / 100);
    const max = Math.ceil(Math.max(...prices) / 100);
    return min < max ? { min, max } : null;
  }, [products]);

  const range = bounds
    ? [
        Math.max(bounds.min, Math.min(priceRange?.[0] ?? bounds.min, bounds.max)),
        Math.min(bounds.max, Math.max(priceRange?.[1] ?? bounds.max, bounds.min)),
      ]
    : null;
  const priceActive = range !== null && (range[0] > bounds.min || range[1] < bounds.max);
  const lo = range?.[0];
  const hi = range?.[1];

  const filtered = useMemo(() => {
    let list = products.filter((p) => matchesFilter(p, category));
    if (priceActive) {
      list = list.filter((p) => hasPrice(p) && p.price_in_pence >= lo * 100 && p.price_in_pence <= hi * 100);
    }
    const direction = SORTS[sort];
    if (direction) {
      // Products without a price go last in either direction.
      list = [...list].sort((a, b) => {
        if (!hasPrice(a) || !hasPrice(b)) return hasPrice(b) - hasPrice(a);
        return (a.price_in_pence - b.price_in_pence) * direction;
      });
    }
    return list;
  }, [products, category, priceActive, lo, hi, sort]);

  const chooseCategory = (next) => {
    if (onFilterChange) onFilterChange(next);
    else setOwnFilter(next);
    setPriceRange(null);
    setVisible(PAGE_SIZE);
  };

  const choosePrice = (next) => {
    setPriceRange(next);
    setVisible(PAGE_SIZE);
  };

  const chooseSort = (next) => {
    setSort(next);
    setVisible(PAGE_SIZE);
  };

  const hasCategories = categories.length > 1 || category !== 'all';

  return (
    <div>
      {hasCategories && (
        <div className="mb-6">
          <CategoryFilter categories={categories} value={category} onChange={chooseCategory} />
        </div>
      )}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        {bounds && (
          <div className="w-full sm:max-w-sm">
            <PriceFilter min={bounds.min} max={bounds.max} value={range} onChange={choosePrice} />
          </div>
        )}
        <div className="w-full sm:ml-auto sm:w-60">
          <label htmlFor={sortId} className="field-label">Sort</label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => chooseSort(e.target.value)}
            className="field field-select"
          >
            <option value="mixed">{defaultSortLabel}</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </div>
      </div>
      {loading ? (
        <>
          <ProductGridSkeleton />
          <p className="sr-only" role="status">Loading products</p>
        </>
      ) : filtered.length > 0 ? (
        <ProductGrid products={filtered.slice(0, visible)} headingAs={headingAs} showShop={showShop} />
      ) : (
        <EmptyState
          message={
            products.length === 0
              ? 'Nothing here right now. Try another filter.'
              : hasCategories
                ? 'Nothing in this price range. Widen the range or pick another filter.'
                : 'Nothing in this price range. Widen the range.'
          }
        />
      )}
      {!loading && filtered.length > visible && (
        <div className="mt-12 flex justify-center">
          <button type="button" className="btn btn-secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Show more products
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductBrowser;
