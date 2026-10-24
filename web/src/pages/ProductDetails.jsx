import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Breadcrumb } from '../components/PageHeader';
import ProductImage from '../components/ProductImage';
import SizeTag from '../components/SizeTag';
import EmptyState from '../components/EmptyState';
import { displayColour, formatPrice, possessive } from '../utils/format';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setImageFailed(false);
      const data = await api.getProductById(id);
      setProduct(data);
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container-custom pb-20 pt-8 md:pt-12">
        <div className="grid gap-8 md:grid-cols-12 lg:gap-12" aria-hidden="true">
          <div className="aspect-[3/4] bg-mist motion-safe:animate-pulse md:col-span-6 lg:col-span-7" />
          <div className="space-y-4 md:col-span-6 lg:col-span-5">
            <div className="h-4 w-1/3 bg-mist" />
            <div className="h-10 w-full bg-mist" />
            <div className="h-6 w-1/4 bg-mist" />
          </div>
        </div>
        <p className="sr-only" role="status">Loading the product</p>
      </div>
    );
  }

  // Products without a photo are not shown on Yxra.
  if (!product || !product.image_url || imageFailed) {
    return (
      <div className="container-custom pb-20 pt-10 md:pt-16">
        <EmptyState message="This product can’t be found." to="/products" action="Browse products" />
      </div>
    );
  }

  const price = formatPrice(product.price_in_pence);
  const colour = displayColour(product.colour);
  const shopName = product.shop_name;

  return (
    <div className="container-custom pb-20 pt-8 md:pb-24 md:pt-12">
      <Breadcrumb
        trail={[
          ['/products', 'Products'],
          [`/shops/${product.shop_id}`, shopName],
        ]}
      />
      <div className="grid gap-8 md:grid-cols-12 lg:gap-12">
        <div className="md:col-span-6 lg:col-span-7">
          <div className="md:sticky md:top-24">
            <ProductImage
              src={product.image_url}
              alt={product.product_name}
              eager
              sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
              onError={() => setImageFailed(true)}
            />
          </div>
        </div>

        <div className="md:col-span-6 lg:col-span-5">
          <p className="text-small text-graphite">
            <Link to={`/shops/${product.shop_id}`} className="text-graphite underline underline-offset-4 hover:text-ink">
              {shopName}
            </Link>
          </p>
          <h1 className="mt-2 font-display text-h2 font-normal [text-wrap:balance]">{product.product_name}</h1>
          {price && <p className="mt-4 text-body-l font-medium tabular-nums">{price}</p>}

          {product.sizes_in_stock?.length > 0 && (
            <section className="mt-8" aria-labelledby="sizes-heading">
              <h2 id="sizes-heading" className="mb-3 text-small font-semibold">
                In stock in
              </h2>
              <SizeTag sizes={product.sizes_in_stock} variant="full" />
              <p className="mt-3 text-small text-graphite">Sizes as {shopName} lists them.</p>
            </section>
          )}

          {colour && (
            <p className="mt-6 text-body">
              <span className="font-semibold">Colour:</span> {colour}
            </p>
          )}

          {product.product_url && (
            <div className="mt-8">
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  api.clickOut(product);
                }}
                className="btn btn-primary w-full"
              >
                Buy at {shopName}
              </a>
              <p className="mt-3 text-small text-graphite">Opens {possessive(shopName)} website in a new tab.</p>
            </div>
          )}

          {product.product_description && (
            <section className="mt-10" aria-labelledby="description-heading">
              <h2 id="description-heading" className="mb-3 text-small font-semibold">
                Description from {shopName}
              </h2>
              <p className="max-w-[65ch] whitespace-pre-line text-body text-graphite">{product.product_description}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
