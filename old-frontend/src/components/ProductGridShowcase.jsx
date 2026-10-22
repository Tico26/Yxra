import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const ProductGridShowcase = () => {
    const [displayItems, setDisplayItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShowcaseData = async () => {
            try {
                const [shops, products] = await Promise.all([
                    api.getShops(),
                    api.getProducts()
                ]);

                // We want 10 items. Preferably from different shops.
                // Group products by shop
                const shopProductsMap = products.reduce((acc, p) => {
                    if (!acc[p.shop_id]) acc[p.shop_id] = [];
                    acc[p.shop_id].push(p);
                    return acc;
                }, {});

                const shopsList = shops.slice(0, 10);
                const items = [];

                for (let i = 0; i < 10; i++) {
                    if (i < shopsList.length) {
                        const shop = shopsList[i];
                        const shopProducts = shopProductsMap[shop.shop_id] || [];
                        const product = shopProducts[0]; // Take the first product of this shop

                        if (product) {
                            items.push({
                                type: 'product',
                                product: product,
                                shop: shop
                            });
                        } else {
                            items.push({ type: 'empty' });
                        }
                    } else {
                        items.push({ type: 'empty' });
                    }
                }

                setDisplayItems(items);
            } catch (error) {
                console.error("Failed to load grid showcase data:", error.message);
                // Fill with 10 empty boxes as fallback
                setDisplayItems(Array(10).fill({ type: 'empty' }));
            } finally {
                setLoading(false);
            }
        };

        fetchShowcaseData();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-[#CCCCCC]">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-white/20 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-[#CCCCCC]">
            <div className="container-custom">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {displayItems.map((item, index) => (
                        <div key={index} className="aspect-[3/4] relative group overflow-hidden bg-white/10 border border-black/5">
                            {item.type === 'product' ? (
                                <Link to={`/products/${item.product.product_id}`} className="block w-full h-full">
                                    <img 
                                        src={item.product.image_url} 
                                        alt={item.product.product_name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute bottom-4 left-4 z-10">
                                        <div className="bg-black px-4 py-2 flex items-center justify-center min-h-[40px] shadow-lg">
                                            {item.shop.logo_url && !item.shop.logo_url.includes('example.com') ? (
                                                <img 
                                                    src={item.shop.logo_url} 
                                                    alt={item.shop.shop_name} 
                                                    className="h-6 w-auto object-contain brightness-0 invert" 
                                                />
                                            ) : (
                                                <span className="text-white text-xs font-didot font-bold tracking-widest uppercase truncate max-w-[120px]">
                                                    {item.shop.shop_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="12" y1="8" x2="12" y2="16"/>
                                        <line x1="8" y1="12" x2="16" y2="12"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductGridShowcase;
