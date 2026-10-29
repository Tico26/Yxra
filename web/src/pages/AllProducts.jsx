import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import ProductBrowser from '../components/ProductBrowser';
import { ProductGridSkeleton } from '../components/ProductGrid';
import EmptyState from '../components/EmptyState';
import { PRODUCT_FILTERS, apiQueryFor, filterFromSearch, searchFor } from '../utils/filters';

const EVERY_FILTER = PRODUCT_FILTERS.map((f) => f.key);

// Each filter loads its own list from the API, so every type gets up to 500
// Products, and the address says which filter is picked (spec 0005).
const AllProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const filter = filterFromSearch(location.search);
  const [loaded, setLoaded] = useState(null); // { filter, products }

  useEffect(() => {
    let current = true;
    api.getProducts(apiQueryFor(filter)).then((products) => {
      if (current) setLoaded({ filter, products });
    });
    return () => {
      current = false;
    };
  }, [filter]);

  const chooseFilter = (next) => navigate({ pathname: '/products', search: searchFor(next) });
  const loading = !loaded || loaded.filter !== filter;

  return (
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <PageHeader
        title="Products"
        lede="Everything here is in stock in UK 18 and up, or bra band 38 and up."
      />
      {!loaded ? (
        <ProductGridSkeleton />
      ) : loaded.products.length > 0 || filter !== 'all' ? (
        <ProductBrowser
          products={loading ? [] : loaded.products}
          headingAs="h2"
          filters={EVERY_FILTER}
          filter={filter}
          onFilterChange={chooseFilter}
          loading={loading}
        />
      ) : (
        <EmptyState message="No products to show right now. Try again in a moment." />
      )}
    </div>
  );
};

export default AllProducts;
