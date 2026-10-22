import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await api.getProducts();
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background-body py-10">
      <div className="container-custom">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <p className="text-gray-500 mt-2">Browse our complete collection of inclusive fashion.</p>
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product.product_id} product={product} />
                ))}
            </div>
        )}
        
        {!loading && products.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                No products found.
            </div>
        )}
      </div>
    </div>
  );
};

export default AllProducts;
