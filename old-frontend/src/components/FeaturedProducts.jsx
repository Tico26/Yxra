import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getProductImage } from '../utils/imageUtils';
import { Link } from 'react-router-dom';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const allProducts = await api.getProducts();
      // "Standout" logic: Pick random 4 products or first 4
      setProducts(allProducts.slice(0, 4));
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return null;
};

export default FeaturedProducts;
