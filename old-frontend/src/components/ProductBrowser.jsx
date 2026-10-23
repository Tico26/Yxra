import { useMemo, useState } from 'react';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import { CATEGORY_LABELS } from '../utils/format';

const PAGE_SIZE = 48;
const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

// A filterable product grid that shows 48 at a time.
const ProductBrowser = ({ products, headingAs = 'h2', showShop = true }) => {
  const [category, setCategory] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean));
    return [
      ...CATEGORY_ORDER.filter((c) => present.has(c)),
      ...[...present].filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
    ];
  }, [products]);

  const filtered = useMemo(
    () => (category === 'all' ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  const chooseCategory = (next) => {
    setCategory(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-8">
          <CategoryFilter categories={categories} value={category} onChange={chooseCategory} />
        </div>
      )}
      <ProductGrid products={filtered.slice(0, visible)} headingAs={headingAs} showShop={showShop} />
      {filtered.length > visible && (
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
