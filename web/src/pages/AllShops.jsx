import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import ProductImage from '../components/ProductImage';

const THUMBS = 4;

// Shops have only a name, so each row shows the name beside a few of the
// shop's real products.
const AllShops = () => {
  const [shops, setShops] = useState([]);
  const [productsByShop, setProductsByShop] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [allShops, allProducts] = await Promise.all([api.getShops(), api.getProducts()]);
      const grouped = {};
      for (const p of allProducts) {
        (grouped[p.shop_id] ||= []).push(p);
      }
      setShops(allShops);
      setProductsByShop(grouped);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <PageHeader
        title="Shops"
        lede="The shops Yxra shows. Each page lists what that shop has in stock in plus sizes."
      />

      {loading ? (
        <div className="space-y-12" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="grid gap-4 md:grid-cols-12">
              <div className="h-9 w-2/3 bg-mist md:col-span-5" />
              <div className="grid grid-cols-4 gap-2 md:col-span-7">
                {Array.from({ length: THUMBS }, (_, j) => (
                  <div key={j} className="aspect-[3/4] bg-mist motion-safe:animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <p className="text-body-l text-graphite">No shops to show right now. Try again in a moment.</p>
      ) : (
        <ul className="space-y-12 md:space-y-14">
          {shops.map((shop) => {
            const thumbs = (productsByShop[shop.shop_id] || []).slice(0, THUMBS);
            return (
              <li key={shop.shop_id}>
                <Link to={`/shops/${shop.shop_id}`} className="group grid gap-4 text-ink no-underline md:grid-cols-12 md:items-center md:gap-6">
                  <h2 className="font-display text-h2 font-normal underline-offset-[6px] decoration-2 group-hover:underline md:col-span-5">
                    {shop.shop_name}
                  </h2>
                  <div className="md:col-span-7">
                    {thumbs.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                        {thumbs.map((p) => (
                          <ProductImage key={p.product_id} src={p.image_url} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-body text-graphite">No pieces to show right now.</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AllShops;
