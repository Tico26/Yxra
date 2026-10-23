import { Link } from 'react-router-dom';
import ProductGrid, { ProductGridSkeleton } from './ProductGrid';

// Up to eight products, each from a different shop, picked at random.
const ShopPicks = ({ picks, loading }) => {
  if (!loading && picks.length === 0) return null;

  return (
    <section aria-labelledby="picks-heading" className="container-custom pb-20 md:pb-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-10">
        <div>
          <h2 id="picks-heading" className="font-display text-h2 font-normal">
            From around the shops
          </h2>
          <p className="mt-3 text-body-l text-graphite">Picked at random on each visit.</p>
        </div>
        <Link to="/products" className="text-body font-medium text-ink underline underline-offset-4 hover:no-underline">
          Browse all products
        </Link>
      </div>
      {loading ? <ProductGridSkeleton /> : <ProductGrid products={picks} headingAs="h3" />}
    </section>
  );
};

export default ShopPicks;
