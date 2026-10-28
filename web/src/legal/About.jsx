import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProductImage from '../components/ProductImage';

// Four photos from four different shops, each linking to its product. Kept
// as the right-hand frame until the 3D "shops coming together" piece is
// built. Renders as an empty mist frame until the products arrive.
const PhotoCollage = () => {
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.getProducts().then((products) => {
      const seenShops = new Set();
      const chosen = [];
      for (const product of products) {
        if (seenShops.has(product.shop_name)) continue;
        seenShops.add(product.shop_name);
        chosen.push(product);
        if (chosen.length === 4) break;
      }
      if (!cancelled) setPicks(chosen);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid aspect-[4/5] max-w-full grid-cols-2 gap-2 bg-mist" aria-label="Clothes from the shops we search">
      {picks.map((product) => (
        <Link key={product.product_id} to={`/products/${product.product_id}`} className="block">
          <ProductImage
            src={product.image_url}
            alt={`${product.product_name} from ${product.shop_name}`}
            sizes="(min-width: 1200px) 290px, (min-width: 768px) 25vw, 50vw"
            className="h-full"
          />
        </Link>
      ))}
    </div>
  );
};

const About = () => {
  useEffect(() => {
    const before = document.title;
    document.title = "About us · Amara's Pick";
    return () => {
      document.title = before;
    };
  }, []);

  return (
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12">
        <article className="min-w-0">
          <p className="mb-3 text-micro uppercase tracking-[0.1em] text-graphite">About us</p>
          <h1 className="font-display text-display-l font-normal [text-wrap:balance]">
            Your size, actually in stock.
          </h1>
          <p className="mt-6 max-w-[60ch] text-body-l">
            Shopping plus size often means checking shop after shop, finding something you love, then seeing
            your size has sold out. Amara&apos;s Pick checks UK shops every night and shows you only clothes,
            swimwear and activewear that are in stock in UK 18 and up.
          </p>
          <blockquote className="mt-8 border-l-2 border-ink pl-5">
            <p className="font-display text-size-l leading-snug">
              Amara is our guide. She searches the shops for you, so you can spend your time choosing instead
              of hunting.
            </p>
          </blockquote>
          <p className="mt-8 text-graphite">
            Know a shop we should search?{' '}
            <Link to="/contact" className="link font-medium">
              Tell us
            </Link>
          </p>
        </article>
        <PhotoCollage />
      </div>
    </div>
  );
};

export default About;
