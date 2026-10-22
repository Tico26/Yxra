import { Link } from 'react-router-dom';
import { getProductImage } from '../utils/imageUtils';

const ProductCard = ({ product }) => {
  return (
    <Link to={`/products/${product.product_id}`} className="group block h-full">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-100">
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
            <img 
              src={getProductImage(product)} 
              alt={product.product_name} 
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {product.size && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs font-bold rounded uppercase">
                    {product.size}
                </div>
            )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{product.product_name}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.product_description}</p>
          <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center">
             <span className="font-bold text-gray-900">
                {product.price_in_pence ? `£${(product.price_in_pence / 100).toFixed(2)}` : 'Contact for Price'}
            </span>
             <span className="text-xs text-secondary font-medium px-2 py-1 bg-secondary/10 rounded-full">
                {product.colour}
             </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
