import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { getProductImage } from '../utils/imageUtils';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProduct = async () => {
            const data = await api.getProductById(id);
            setProduct(data);
            setLoading(false);
        };
        loadProduct();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex flex-col justify-center items-center text-gray-500">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <Link to="/products" className="btn btn-primary">Back to Products</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white py-12">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Image Gallery Mock */}
                    <div className="space-y-4">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shadom-sm">
                            <img 
                                src={getProductImage(product)} 
                                alt={product.product_name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div>
                        <div className="mb-2">
                            <span className="text-sm font-bold text-primary tracking-wider uppercase">
                                {product.colour} Collection
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.product_name}</h1>
                        <p className="text-2xl font-semibold text-gray-900 mb-6">
                            {product.price_in_pence ? `£${(product.price_in_pence / 100).toFixed(2)}` : 'Price on request'}
                        </p>

                        <div className="prose prose-lg text-gray-600 mb-8">
                            <p>{product.product_description}</p>
                        </div>

                        <div className="border-t border-b border-gray-100 py-6 mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="font-semibold text-gray-900 w-20">Size:</span>
                                <span className="px-4 py-2 border border-primary text-primary font-bold rounded-lg bg-primary/5">
                                    {product.size}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-semibold text-gray-900 w-20">Location:</span> 
                                <span className="text-gray-600">Available Online</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 btn btn-primary py-4 text-lg">
                                Add to Cart
                            </button>
                            {product.product_url && (
                                <a href={product.product_url} target="_blank" rel="noreferrer" className="flex-1 btn btn-outline py-4 text-lg text-center">
                                    View on Store Info
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
