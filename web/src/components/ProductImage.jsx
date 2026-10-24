import { responsiveImage } from '../utils/image';

// How wide a product-grid card is: 2 columns, 3 from md, 4 from lg. Page
// content stops at 1,200px (container-custom), so from there a card is 270px
// however wide the window is.
const GRID_SIZES = '(min-width: 1200px) 270px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

// A product photo in a 3:4 mist frame. Children (the size tag) overlay it.
// `sizes` tells the browser how wide the frame is, so it fetches a sharp copy
// of the right size rather than the shop's full-size original.
const ProductImage = ({ src, alt = '', onError, eager = false, sizes = GRID_SIZES, className = '', children }) => (
  <div className={`relative aspect-[3/4] overflow-hidden bg-mist ${className}`}>
    <img
      {...responsiveImage(src)}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={onError}
      className="h-full w-full object-cover object-top"
    />
    {children}
  </div>
);

export default ProductImage;
