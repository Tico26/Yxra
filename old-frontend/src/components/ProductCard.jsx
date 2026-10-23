import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import SizeTag from './SizeTag';
import { formatPrice } from '../utils/format';

// Photo with its size tag, then shop, title and price. A product whose photo
// fails to load is hidden, like products with no photo at all.
const ProductCard = ({ product, headingAs: Heading = 'h3', showShop = true, eager = false }) => {
  const [imageFailed, setImageFailed] = useState(false);
  if (!product.image_url || imageFailed) return null;
  const price = formatPrice(product.price_in_pence);

  return (
    <Link to={`/products/${product.product_id}`} className="group block text-ink no-underline">
      <ProductImage src={product.image_url} eager={eager} onError={() => setImageFailed(true)}>
        <SizeTag sizes={product.sizes_in_stock} className="absolute bottom-3 left-0" />
      </ProductImage>
      {showShop && <p className="mt-3 text-small text-graphite">{product.shop_name}</p>}
      <Heading className={`${showShop ? 'mt-0.5' : 'mt-3'} line-clamp-2 text-body font-normal underline-offset-4 group-hover:underline`}>
        {product.product_name}
      </Heading>
      {price && <p className="mt-1 text-body font-medium tabular-nums">{price}</p>}
    </Link>
  );
};

export default ProductCard;
