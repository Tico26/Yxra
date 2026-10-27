import { Link } from 'react-router-dom';

// The memorable element: every shop name set as one run of large type, split
// by the bar from the AMARA'S|PICK logo. The bars are decoration; the list is a list.
const Bar = () => (
  <span
    aria-hidden="true"
    className="mx-[0.28em] inline-block h-[0.78em] w-[3px] translate-y-[0.06em] bg-ink align-baseline"
  ></span>
);

const ShopIndex = ({ shops, shopsWithProducts }) => {
  if (shops.length === 0) return null;

  return (
    <section aria-labelledby="shop-index-heading" className="container-custom py-16 md:py-24">
      <h2 id="shop-index-heading" className="font-display text-h2 font-normal">
        The shops
      </h2>
      <p className="mt-3 max-w-[60ch] text-body-l text-graphite">
        Pick a shop to see what it has in stock in plus sizes.
      </p>
      <ul className="mt-10 font-display text-display-xl leading-[1.18] md:mt-12">
        {shops.map((shop, i) => {
          const words = shop.shop_name.split(' ');
          const lastWord = words.pop();
          const isLast = i === shops.length - 1;
          const hasProducts = shopsWithProducts.has(shop.shop_id);
          return (
            <li key={shop.shop_id} className="inline">
              <Link
                to={`/shops/${shop.shop_id}`}
                className={`decoration-2 underline-offset-[0.12em] hover:underline ${hasProducts ? 'text-ink' : 'text-graphite'}`}
              >
                {words.length > 0 && `${words.join(' ')} `}
                {/* The bar stays on the same line as the name it follows. */}
                <span className="whitespace-nowrap">
                  {lastWord}
                  {!isLast && <Bar />}
                </span>
              </Link>{' '}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ShopIndex;
