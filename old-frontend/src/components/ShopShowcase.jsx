import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getProductImage, getShopLogo } from '../utils/imageUtils';

const ShopShowcase = () => {
    const [shops, setShops] = useState([]);
    const [shopProducts, setShopProducts] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [logoErrors, setLogoErrors] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleLogoError = (productId) => {
        setLogoErrors(prev => ({ ...prev, [productId]: true }));
    };

    const triggerTransition = (newIndex) => {
        setIsTransitioning(true);
        // Fade out quickly, swap content, then fade back in
        setTimeout(() => {
            setCurrentIndex(newIndex);
            setIsTransitioning(false);
        }, 150);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allShops, allProducts] = await Promise.all([
                    api.getShops(),
                    api.getProducts()
                ]);

                // Group products by shop_id
                const grouped = allProducts.reduce((acc, product) => {
                    if (!acc[product.shop_id]) acc[product.shop_id] = [];
                    acc[product.shop_id].push(product);
                    return acc;
                }, {});

                setShops(allShops);
                setShopProducts(grouped);
            } catch (error) {
                console.error("Failed to load showcase data:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (shops.length === 0) return;
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % shops.length;
            triggerTransition(nextIndex);
        }, 5000); // 5 second cycle
        return () => clearInterval(interval);
    }, [shops, currentIndex]);

    const handlePrev = () => {
        const nextIndex = (currentIndex - 1 + shops.length) % shops.length;
        triggerTransition(nextIndex);
    };

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % shops.length;
        triggerTransition(nextIndex);
    };

    if (loading || shops.length === 0) return null;

    const currentShop = shops[currentIndex];
    const products = (shopProducts[currentShop.shop_id] || []).slice(0, 5);

    return (
        <section className="bg-[#D9D9D9] py-8 relative overflow-hidden">
            <div className={`container-custom relative transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {/* Logo Box */}
                <div className="mb-6">
                    <div className="bg-white inline-block px-8 py-3 shadow-md border-b-4 border-primary/20">
                        {currentShop.logo_url && !currentShop.logo_url.includes('example.com') && !logoErrors[currentShop.shop_id] ? (
                            <img 
                                src={getShopLogo(currentShop)} 
                                alt={currentShop.shop_name} 
                                className="h-6 w-auto object-contain brightness-0" 
                                onError={() => handleLogoError(currentShop.shop_id)}
                            />
                        ) : (
                            <h2 className="text-xl font-didot font-bold tracking-[0.2em] text-black uppercase">
                                {currentShop.shop_name}
                            </h2>
                        )}
                    </div>
                </div>

                {/* Products Row */}
                <div className="relative flex items-center group">
                    {/* Navigation Arrows */}
                    <button 
                        onClick={handlePrev}
                        className="absolute -left-12 z-20 p-2 text-black/30 hover:text-black transition-colors"
                        aria-label="Previous Shop"
                    >
                        <svg width="24" height="48" viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 44L4 24L20 4" />
                        </svg>
                    </button>

                    <div className="flex-1 min-h-[200px] flex items-center justify-center">
                        {products.length > 0 ? (
                            <div className="flex gap-4 w-full h-[200px]">
                                {[...Array(5)].map((_, index) => {
                                    const product = products[index];
                                    const slotContent = (
                                        <div className="w-full h-full p-2 overflow-hidden relative group/img flex items-center justify-center">
                                            {product ? (
                                                <>
                                                    <img 
                                                        src={getProductImage(product)} 
                                                        alt={product.product_name} 
                                                        className="h-full w-full object-contain transition-transform duration-1000 group-hover/img:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center opacity-10">
                                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="12" y1="8" x2="12" y2="16"/>
                                                        <line x1="8" y1="12" x2="16" y2="12"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    );

                                    return (
                                        <div 
                                            key={product ? product.product_id : `empty-${index}`} 
                                            className="flex-1 transition-all duration-1000 ease-in-out transform"
                                        >
                                            {product ? (
                                                <Link to={`/products/${product.product_id}`} className="block w-full h-full">
                                                    {slotContent}
                                                </Link>
                                            ) : (
                                                slotContent
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center w-full py-12 border-2 border-dashed border-black/10 rounded-xl">
                                <p className="text-2xl font-didot text-black/40 italic tracking-[0.25em] uppercase">
                                    products coming soon
                                </p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleNext}
                        className="absolute -right-12 z-20 p-2 text-black/30 hover:text-black transition-colors"
                        aria-label="Next Shop"
                    >
                        <svg width="24" height="48" viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4L20 24L4 44" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-8">
                {shops.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => triggerTransition(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'bg-black w-8' : 'bg-black/20'}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default ShopShowcase;
