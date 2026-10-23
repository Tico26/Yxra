import ProductCard from './ProductCard';

export const GRID_CLASSES =
  'grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 [&>li:empty]:hidden';

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className={GRID_CLASSES} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <div key={i}>
        <div className="aspect-[3/4] bg-mist motion-safe:animate-pulse" />
        <div className="mt-3 h-3 w-1/3 bg-mist" />
        <div className="mt-2 h-4 w-4/5 bg-mist" />
        <div className="mt-2 h-4 w-1/4 bg-mist" />
      </div>
    ))}
  </div>
);

const ProductGrid = ({ products, headingAs, showShop = true }) => (
  <ul className={GRID_CLASSES}>
    {products.map((product, i) => (
      <li key={product.product_id}>
        <ProductCard product={product} headingAs={headingAs} showShop={showShop} eager={i < 4} />
      </li>
    ))}
  </ul>
);

export default ProductGrid;
