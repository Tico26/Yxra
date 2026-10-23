import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import SizeTag from './SizeTag';

// Staggered tops for the three photos on wider screens.
const OFFSETS = ['md:mt-0', 'md:mt-12', 'md:mt-24'];

const HomeHero = ({ picks, loading }) => (
  <section aria-labelledby="hero-heading" className="container-custom pb-16 pt-10 md:pb-24 md:pt-16">
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
      <div className="lg:col-span-5">
        <h1 id="hero-heading" className="font-display text-display-xl font-normal [text-wrap:balance]">
          Plus sizes, in stock.
        </h1>
        <p className="mt-5 max-w-[40ch] text-body-l text-graphite">
          Every piece on Yxra is in stock in UK 18 and up, or bra band 38 and up, at independent and chain shops in the UK.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/products" className="btn btn-primary">
            Browse products
          </Link>
          <Link to="/shops" className="btn btn-secondary">
            See the shops
          </Link>
        </div>
      </div>

      <div className="lg:col-span-7">
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {loading
            ? OFFSETS.map((offset) => (
                <li key={offset} className={`w-[70%] shrink-0 snap-start md:w-auto ${offset}`} aria-hidden="true">
                  <div className="aspect-[3/4] bg-mist motion-safe:animate-pulse" />
                </li>
              ))
            : picks.map((product, i) => (
                <li
                  key={product.product_id}
                  className={`hero-fade w-[70%] shrink-0 snap-start md:w-auto ${OFFSETS[i]}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <Link to={`/products/${product.product_id}`} className="group block text-ink no-underline">
                    <ProductImage src={product.image_url} eager>
                      <SizeTag sizes={product.sizes_in_stock} className="absolute bottom-3 left-0" />
                    </ProductImage>
                    <p className="mt-3 text-small text-graphite">{product.shop_name}</p>
                    <p className="mt-0.5 line-clamp-1 text-small underline-offset-4 group-hover:underline">
                      {product.product_name}
                    </p>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </div>
  </section>
);

export default HomeHero;
