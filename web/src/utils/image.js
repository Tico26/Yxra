// Shops' photos are stored at full size (often 2,500px and several MB), far
// bigger than any frame they fill. Shopify's image CDN resizes on request, so
// we offer the browser a ladder of widths and let it pick the sharpest one for
// the frame and the screen's pixel density. Shopify never enlarges past the
// original, so quality is never lost.
const WIDTHS = [360, 540, 720, 1080, 1440, 2048];

const isShopifyImage = (url) =>
  url.hostname === 'cdn.shopify.com' || url.pathname.startsWith('/cdn/shop/');

const withWidth = (url, width) => {
  const sized = new URL(url);
  sized.searchParams.set('width', String(width));
  return sized.toString();
};

// { src, srcSet } for an <img>. Photos not served by Shopify come back as they are.
export const responsiveImage = (src) => {
  let url;
  try {
    url = new URL(src);
  } catch {
    return { src };
  }
  if (!isShopifyImage(url)) return { src };
  return {
    src: withWidth(url, 1080),
    srcSet: WIDTHS.map((w) => `${withWidth(url, w)} ${w}w`).join(', '),
  };
};
