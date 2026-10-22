// Fallback images for missing API data

const PLACEHOLDER_PRODUCTS = [
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529139574466-a302c27e3844?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
];

const PLACEHOLDER_SHOP_LOGOS = [
  'https://ui-avatars.com/api/?name=Shop&background=random',
];

export const getProductImage = (product) => {
  // If api had images: if (product.image_url) return product.image_url;
  // Deterministic random based on ID so it stays same for same product
  const index = (product.product_id || 0) % PLACEHOLDER_PRODUCTS.length;
  return PLACEHOLDER_PRODUCTS[index];
};

export const getShopLogo = (shop) => {
  if (shop.logo_url && !shop.logo_url.includes('example.com')) {
    return shop.logo_url;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shop_name)}&background=5D3FD3&color=fff`; 
};
