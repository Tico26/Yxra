import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getShopLogo } from '../utils/imageUtils';
import { Link } from 'react-router-dom';

const BrandsCarousel = () => {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      const allShops = await api.getShops();
      setShops(allShops);
    };
    fetchShops();
  }, []);

  return null;
};

export default BrandsCarousel;
