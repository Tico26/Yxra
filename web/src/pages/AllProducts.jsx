import { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import ProductBrowser from '../components/ProductBrowser';
import { ProductGridSkeleton } from '../components/ProductGrid';
import EmptyState from '../components/EmptyState';

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
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <PageHeader
        title="Products"
        lede="Everything here is in stock in UK 18 and up, or bra band 38 and up."
      />
      {loading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <ProductBrowser products={products} headingAs="h2" />
      ) : (
        <EmptyState message="No products to show right now. Try again in a moment." />
      )}
    </div>
  );
};

export default AllProducts;
