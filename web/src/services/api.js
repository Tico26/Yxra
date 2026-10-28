// Reads Amara's Pick's API (proxied to http://localhost:9090 by the Vite dev server)
// and hands pages data in the shape the design already expects.
const BASE_URL = '/api';

// Plus size line, as Amara's Pick draws it: UK 18 or above, or bra band 38 or above.
const SMALLEST_PLUS_UK_SIZE = 18;
const SMALLEST_PLUS_BRA_BAND = 38;
const CUPS = ["AA", "A", "B", "C", "D", "DD", "E", "F", "FF", "G", "GG", "H", "HH", "J", "JJ", "K", "KK"];

const getJson = async (path) => {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
};

// Amara's Pick has no shop description, logo or location; it does have the shop's website.
export const mapRetailer = (retailer) => ({
  shop_id: retailer.retailer_id,
  shop_name: retailer.retailer_name,
  site_url: retailer.site_url || null,
  shop_description: null,
  logo_url: null,
  location: null,
});

const isPlusInStock = (s) =>
  s.size_status === 'translated' &&
  s.in_stock &&
  ((s.uk_sizes || []).some((n) => n >= SMALLEST_PLUS_UK_SIZE) ||
    (s.bra_band != null && s.bra_band >= SMALLEST_PLUS_BRA_BAND));

const cupIndex = (cup) => (CUPS.includes(cup) ? CUPS.indexOf(cup) : CUPS.length);

const compareArrays = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
};

// The in-stock plus Size labels of a product, in the order Amara's Pick lists
// in_stock_sizes: UK sizes ascending, then bands, then cups.
export const plusInStockLabels = (sizes = []) =>
  sizes
    .filter(isPlusInStock)
    .sort((a, b) => {
      const aUk = a.uk_sizes || [];
      const bUk = b.uk_sizes || [];
      if ((aUk.length === 0) !== (bUk.length === 0)) return aUk.length === 0 ? 1 : -1;
      return (
        compareArrays(aUk, bUk) ||
        (a.bra_band ?? Infinity) - (b.bra_band ?? Infinity) ||
        cupIndex(a.bra_cup) - cupIndex(b.bra_cup) ||
        (a.size_label < b.size_label ? -1 : a.size_label > b.size_label ? 1 : 0)
      );
    })
    .map((s) => s.size_label);

// The smallest in-stock plus size, for recording a Click-out: the smallest
// UK size of 18 or more, or for a bra-only product the smallest band of 38
// or more with its cup. Null if there is none.
export const smallestPlusSize = (sizes = []) => {
  const inStock = sizes.filter(isPlusInStock);
  const ukSizes = inStock
    .flatMap((s) => s.uk_sizes || [])
    .filter((n) => n >= SMALLEST_PLUS_UK_SIZE);
  if (ukSizes.length > 0) return { uk_size: Math.min(...ukSizes) };
  const bras = inStock
    .filter((s) => s.bra_band != null && s.bra_band >= SMALLEST_PLUS_BRA_BAND)
    .sort((a, b) => a.bra_band - b.bra_band || cupIndex(a.bra_cup) - cupIndex(b.bra_cup));
  if (bras.length === 0) return null;
  const { bra_band, bra_cup } = bras[0];
  return bra_cup ? { bra_band, bra_cup } : { bra_band };
};

// A product from GET /api/products (the list has no description).
export const mapListProduct = (product) => ({
  product_id: product.product_id,
  shop_id: product.retailer_id,
  shop_name: product.retailer_name,
  product_name: product.title,
  product_description: null,
  price_in_pence: product.price_in_pence,
  size: (product.in_stock_sizes || []).join(', '),
  sizes_in_stock: product.in_stock_sizes || [],
  category: product.category || null,
  colour: product.colour,
  product_url: product.product_url,
  image_url: product.image_url,
});

// A product from GET /api/products/:id.
export const mapDetailProduct = (product) => ({
  product_id: product.product_id,
  shop_id: product.retailer_id,
  shop_name: product.retailer_name,
  product_name: product.title,
  product_description: product.description,
  price_in_pence: product.price_in_pence,
  size: plusInStockLabels(product.sizes).join(', '),
  sizes_in_stock: plusInStockLabels(product.sizes),
  category: product.category || null,
  colour: product.colour,
  product_url: product.product_url,
  image_url: product.image_url,
  sizes: product.sizes,
});

// A product from GET /api/products?ids= (a Saved page): sold out ones too,
// with in_stock_uk_sizes to tell whether her size is in stock.
export const mapSavedProduct = (product) => ({
  product_id: product.product_id,
  shop_id: product.retailer_id,
  shop_name: product.retailer_name,
  product_name: product.title,
  price_in_pence: product.price_in_pence,
  sizes_in_stock: product.in_stock_sizes || [],
  uk_sizes_in_stock: product.in_stock_uk_sizes || [],
  image_url: product.image_url,
});

// Products without a photo are not shown anywhere on the site.
const listedProducts = (data) => (data.products || []).filter((p) => p.image_url).map(mapListProduct);

const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Up to `count` random products, each from a different shop.
export const pickStandoutIds = (products, count = 3) => {
  const byShop = products.reduce((acc, p) => {
    if (!acc[p.shop_id]) acc[p.shop_id] = [];
    acc[p.shop_id].push(p);
    return acc;
  }, {});
  return shuffle(Object.keys(byShop))
    .slice(0, count)
    .map((shopId) => {
      const shopProducts = byShop[shopId];
      return shopProducts[Math.floor(Math.random() * shopProducts.length)].product_id;
    });
};

export const api = {
  async getShops() {
    try {
      const data = await getJson('/retailers');
      return (data.retailers || []).map(mapRetailer);
    } catch (error) {
      console.error("Error fetching shops:", error.message);
      return [];
    }
  },

  async getShopById(id) {
    try {
      const shops = await this.getShops();
      return shops.find((s) => s.shop_id === Number(id)) || null;
    } catch (error) {
      console.error(`Error fetching shop ${id}:`, error.message);
      return null;
    }
  },

  async getProducts() {
    try {
      return listedProducts(await getJson('/products'));
    } catch (error) {
      console.error("Error fetching products:", error.message);
      return [];
    }
  },

  // One shop's products, for its page.
  async getShopProducts(shopId) {
    try {
      return listedProducts(await getJson(`/products?retailer_id=${shopId}`));
    } catch (error) {
      console.error(`Error fetching products of shop ${shopId}:`, error.message);
      return [];
    }
  },

  async getProductById(id) {
    try {
      const data = await getJson(`/products/${id}`);
      return data.product ? mapDetailProduct(data.product) : null;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error.message);
      return null;
    }
  },

  // The Products on a Saved page, in the order given. Null if they could not
  // be loaded, so the page can say so rather than show nothing saved.
  async getProductsByIds(ids) {
    if (ids.length === 0) return [];
    try {
      const data = await getJson(`/products?ids=${ids.join(',')}`);
      return (data.products || []).map(mapSavedProduct);
    } catch (error) {
      console.error('Error fetching saved products:', error.message);
      return null;
    }
  },

  // Amara's Pick keeps one image per product, its image_url.
  async getProductImages(id) {
    try {
      const product = await this.getProductById(id);
      return product && product.image_url ? [{ image_url: product.image_url }] : [];
    } catch (error) {
      console.error(`Error fetching images for product ${id}:`, error.message);
      return [];
    }
  },

  async getProductImage(id) {
    try {
      const product = await this.getProductById(id);
      return product && product.image_url ? { image: { image_url: product.image_url } } : null;
    } catch (error) {
      console.error(`Error fetching image for product ${id}:`, error.message);
      return null;
    }
  },

  // Standouts: 3 random in-stock plus-size products, each from a different shop.
  async getStandoutIds() {
    const products = await this.getProducts();
    return pickStandoutIds(products, 3);
  },

  // Record a Click-out for the product's smallest in-stock plus size, then
  // open the URL Amara's Pick replies with (or the product URL if it gives none).
  // The tab is opened straight away, inside the click, so pop-up blockers
  // allow it, and pointed at the shop once Amara's Pick replies.
  async clickOut(product) {
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    let url = product.product_url;
    const size = smallestPlusSize(product.sizes);
    if (size) {
      try {
        const response = await fetch(`${BASE_URL}/click-outs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.product_id, ...size }),
        });
        const data = await response.json();
        if (response.ok && data && data.url) url = data.url;
      } catch (error) {
        console.error(`Error recording click-out for product ${product.product_id}:`, error.message);
      }
    } else {
      console.error(`No in-stock plus size to record for product ${product.product_id}`);
    }
    if (tab) tab.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
    return url;
  }
};
