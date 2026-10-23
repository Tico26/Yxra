import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import ProductBrowser from '../components/ProductBrowser';
import { ProductGridSkeleton } from '../components/ProductGrid';
import EmptyState from '../components/EmptyState';
import { possessive } from '../utils/format';

const ShopProducts = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProducts, allShops] = await Promise.all([api.getProducts(), api.getShops()]);
        const shopId = parseInt(id);
        setProducts(allProducts.filter((p) => p.shop_id === shopId));
        setShop(allShops.find((s) => s.shop_id === shopId) || null);
      } catch (error) {
        console.error('Failed to load shop products:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container-custom pb-20 pt-10 md:pt-16">
        <div className="mb-10 h-14 w-2/3 max-w-md bg-mist" aria-hidden="true" />
        <ProductGridSkeleton />
        <p className="sr-only" role="status">Loading the shop</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container-custom pb-20 pt-10 md:pt-16">
        <EmptyState message="This shop can’t be found." to="/shops" action="See the shops" />
      </div>
    );
  }

  return (
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <PageHeader
        title={shop.shop_name}
        lede={`What ${shop.shop_name} has in stock in plus sizes.`}
        trail={[['/shops', 'Shops'], [null, shop.shop_name]]}
      >
        {shop.site_url && (
          <p className="mt-4">
            <a href={shop.site_url} target="_blank" rel="noopener noreferrer" className="text-body font-medium text-ink underline underline-offset-4 hover:no-underline">
              Visit {possessive(shop.shop_name)} website
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        )}
      </PageHeader>
      {products.length > 0 ? (
        <ProductBrowser products={products} headingAs="h2" showShop={false} />
      ) : (
        <EmptyState
          message={`Nothing from ${shop.shop_name} to show right now.`}
          to="/products"
          action="Browse all products"
        />
      )}
    </div>
  );
};

export default ShopProducts;
