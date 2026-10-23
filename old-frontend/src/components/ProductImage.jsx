// A product photo in a 3:4 mist frame. Children (the size tag) overlay it.
const ProductImage = ({ src, alt = '', onError, eager = false, className = '', children }) => (
  <div className={`relative aspect-[3/4] overflow-hidden bg-mist ${className}`}>
    <img
      src={src}
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
