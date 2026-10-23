import { useState, useEffect, useMemo } from 'react';
import { api, pickStandoutIds } from '../services/api';
import HomeHero from '../components/HomeHero';
import ShopIndex from '../components/ShopIndex';
import ShopPicks from '../components/ShopPicks';

const HERO_COUNT = 3;
const PICKS_COUNT = 8;

const Home = () => {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [heroIds, setHeroIds] = useState([]);
  const [pickIds, setPickIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [allShops, allProducts] = await Promise.all([api.getShops(), api.getProducts()]);
      // Hero: three products from three different shops. Picks: up to eight
      // more, one per shop, without repeating the hero's.
      const hero = pickStandoutIds(allProducts, HERO_COUNT);
      const rest = allProducts.filter((p) => !hero.includes(p.product_id));
      setShops(allShops);
      setProducts(allProducts);
      setHeroIds(hero);
      setPickIds(pickStandoutIds(rest, PICKS_COUNT));
      setLoading(false);
    };
    load();
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.product_id, p])), [products]);
  const shopsWithProducts = useMemo(() => new Set(products.map((p) => p.shop_id)), [products]);
  const heroPicks = heroIds.map((id) => byId.get(id)).filter(Boolean);
  const shopPicks = pickIds.map((id) => byId.get(id)).filter(Boolean);

  return (
    <>
      <HomeHero picks={heroPicks} loading={loading} />
      <ShopIndex shops={shops} shopsWithProducts={shopsWithProducts} />
      <ShopPicks picks={shopPicks} loading={loading} />
    </>
  );
};

export default Home;
