import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

const ShopProducts = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProducts, allShops] = await Promise.all([
          api.getProducts(),
          api.getShops()
        ]);

        const shopId = parseInt(id);
        const shopProducts = allProducts.filter(p => p.shop_id === shopId);
        setProducts(shopProducts);

        const foundShop = allShops.find(s => s.shop_id === shopId);
        setShop(foundShop);
      } catch (error) {
        console.error("Failed to load shop products:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-body py-10">
      <div className="container-custom">
        <div className="mb-10 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {shop ? shop.shop_name : 'Shop Details'}
            </h1>
            {shop && <p className="text-gray-500">{shop.shop_description || "Viewing all products from this boutique."}</p>}
        </div>

        {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product.product_id} product={product} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-sm border border-border">
                <p className="text-lg">No products found for this shop.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ShopProducts;
