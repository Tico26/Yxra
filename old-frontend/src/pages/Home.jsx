import { useState, useEffect } from 'react';
import FeaturedProducts from '../components/FeaturedProducts';
import BrandsCarousel from '../components/BrandsCarousel';
import ShopShowcase from '../components/ShopShowcase';
import ProductGridShowcase from '../components/ProductGridShowcase';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getProductImage } from '../utils/imageUtils';





const Home = () => {
  const [shops, setShops] = useState([]);
  const [standouts, setStandouts] = useState([]);
  const [logoErrors, setLogoErrors] = useState({});

  const handleLogoError = (productId) => {
    setLogoErrors(prev => ({ ...prev, [productId]: true }));
  };


  useEffect(() => {
    const fetchShops = async () => {
      const data = await api.getShops();
      setShops(data);
    };
    


    const fetchStandouts = async () => {
      try {
        const standoutIds = await api.getStandoutIds();
        const standoutData = await Promise.all(standoutIds.map(async (id) => {
          // Get product for its image and shop_id
          const product = await api.getProductById(id);
          if (!product) return null;

          // Get shop for its description
          const shop = await api.getShopById(product.shop_id);
          
          return {
            productId: id,
            shopId: product.shop_id,
            imageUrl: getProductImage(product), // Real image_url, or the design's placeholder if a product has none
            shopDescription: (shop && shop.shop_description) || 'No description available.',
            shopName: shop ? shop.shop_name : 'Unknown Shop',
            shopLogo: shop ? shop.logo_url : null
          };
        }));

        const validStandouts = standoutData.filter(item => item !== null);
        
        // Also ensure we have the correct image URLs (the previous logic used a specific endpoint)
        const refinedStandouts = await Promise.all(validStandouts.map(async (item) => {
           const imageRes = await api.getProductImage(item.productId);
           return {
             ...item,
             imageUrl: imageRes && imageRes.image && imageRes.image.image_url ? imageRes.image.image_url : item.imageUrl
           };
        }));

        setStandouts(refinedStandouts);
      } catch (error) {
        console.error("Failed to fetch standout data:", error.message);
      }
    };

    fetchShops();
    fetchStandouts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative text-primary py-4 flex items-center justify-center overflow-hidden">
        <div className="w-full flex flex-col items-center justify-center">

            
            {shops.length > 0 ? (
              <div className="w-full overflow-hidden relative group pause-on-hover">
                 {/* Marquee Container */}
                 <div className="animate-marquee flex gap-4 pr-4">
                    {/* Combine shops into a list that ensures at least 12 items, then render it twice for the loop */}
                    {(() => {
                        // 1. Ensure at least 12 items
                        let displayList = [...shops];
                        while (displayList.length > 0 && displayList.length < 12) {
                            displayList = [...displayList, ...shops];
                        }
                        
                        // 2. Render the list twice for seamless 50% translation
                        const fullLoop = [...displayList, ...displayList];

                        return fullLoop.map((shop, index) => {
                           const hasLogo = shop.logo_url && !shop.logo_url.includes('example.com');
                           const letters = ['Y', 'X', 'R', 'A'];
                           const Letter = letters[index % 4];

                           return (
                            <div key={`group-${shop.shop_id}-${index}`} className="flex items-center gap-4">
                                <Link to={`/shops/${shop.shop_id}`} className="px-6 py-3 border border-black/5 bg-white rounded-xl text-base font-medium tracking-wide shadow-sm hover:shadow-md whitespace-nowrap flex items-center justify-center h-16 min-w-[140px] transition-all">
                                  {hasLogo ? (
                                    <img src={shop.logo_url} alt={shop.shop_name} className="h-10 w-auto object-contain brightness-0" />
                                  ) : (
                                    shop.shop_name
                                  )}
                                </Link>
                                <span className="font-didot text-sm text-black font-bold">{Letter}</span>
                            </div>
                           );
                        });
                    })()}
                 </div>
                 {/* Gradient masks for smooth fade edges - updated for light bg */}
                 <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background-body to-transparent z-10 pointer-events-none"></div>
                 <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background-body to-transparent z-10 pointer-events-none"></div>
              </div>
            ) : (
               <p className="text-sm opacity-50 animate-pulse">Loading Partners...</p>
            )}
        </div>
      </section>

      {/* Hero Section Replica */}
      <section className="relative bg-white text-primary min-h-[110vh] flex items-center justify-center px-4 pb-12">
        <div className="container-custom flex flex-col items-center justify-center h-full">
            <div className="flex flex-col items-center mb-12 w-full">
                <span className="text-primary text-[8vh] font-didot font-normal tracking-tighter">Standouts</span>
                <div className="w-[90vw] h-[2px] bg-black mt-4"></div>
            </div>
            
            <div className="flex items-center justify-between gap-8 w-full h-full px-12">
                {standouts.length >= 3 && (
                    <>
                        {/* Left column: 2 stacked images */}
                        <div className="flex flex-col gap-6 h-full justify-center w-[350px]">
                            <Link to={`/shops/${standouts[0].shopId}`} className="relative group overflow-hidden bg-white flex flex-col items-center justify-center h-auto cursor-pointer">
                                <div className="relative w-full h-[336px] p-6 border-2 border-black flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={standouts[0].imageUrl} 
                                        alt="Product 1" 
                                        className="h-full w-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105" 
                                    />
                                    {/* Shop Logo Overlay */}
                                    <div className="absolute top-4 left-4 z-30 w-16 h-16 bg-black/80 backdrop-blur-md rounded-lg p-2 flex items-center justify-center border border-white/10 opacity-0 transform -translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 text-white">
                                        {standouts[0].shopLogo && !standouts[0].shopLogo.includes('example.com') && !logoErrors[standouts[0].productId] ? (
                                            <img 
                                                src={standouts[0].shopLogo} 
                                                alt={standouts[0].shopName} 
                                                className="max-w-full max-h-full object-contain brightness-0 invert" 
                                                onError={() => handleLogoError(standouts[0].productId)}
                                            />
                                        ) : (
                                            <span className="text-white text-[10px] font-didot font-bold text-center leading-tight uppercase tracking-widest px-1">
                                                {standouts[0].shopName}
                                            </span>
                                        )}
                                    </div>
                                    {/* Permanent Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 translate-y-4 transform transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                                        <p className="text-sm font-sans text-white leading-tight">
                                            {standouts[0].shopDescription} - how they cater to plus size
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            <Link to={`/shops/${standouts[1].shopId}`} className="relative group overflow-hidden bg-white flex flex-col items-center justify-center h-auto cursor-pointer">
                                <div className="relative w-full h-[336px] p-6 border-2 border-black flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={standouts[1].imageUrl} 
                                        alt="Product 2" 
                                        className="h-full w-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105" 
                                    />
                                    {/* Shop Logo Overlay */}
                                    <div className="absolute top-4 left-4 z-30 w-16 h-16 bg-black/80 backdrop-blur-md rounded-lg p-2 flex items-center justify-center border border-white/10 opacity-0 transform -translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 text-white">
                                        {standouts[1].shopLogo && !standouts[1].shopLogo.includes('example.com') && !logoErrors[standouts[1].productId] ? (
                                            <img 
                                                src={standouts[1].shopLogo} 
                                                alt={standouts[1].shopName} 
                                                className="max-w-full max-h-full object-contain brightness-0 invert" 
                                                onError={() => handleLogoError(standouts[1].productId)}
                                            />
                                        ) : (
                                            <span className="text-white text-[10px] font-didot font-bold text-center leading-tight uppercase tracking-widest px-1">
                                                {standouts[1].shopName}
                                            </span>
                                        )}
                                    </div>
                                    {/* Permanent Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 translate-y-4 transform transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                                        <p className="text-sm font-sans text-white leading-tight">
                                            {standouts[1].shopDescription} - how they cater to plus size
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        
                        {/* Right column: 1 large image */}
                        <Link to={`/shops/${standouts[2].shopId}`} className="relative group overflow-hidden bg-white flex flex-col items-center justify-center h-auto w-[500px] cursor-pointer">
                            <div className="relative w-full h-[696px] p-8 border-2 border-black flex items-center justify-center overflow-hidden">
                                <img 
                                    src={standouts[2].imageUrl} 
                                    alt="Product 3" 
                                    className="h-full w-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105" 
                                />
                                {/* Shop Logo Overlay */}
                                <div className="absolute top-6 left-6 z-30 w-24 h-24 bg-black/80 backdrop-blur-md rounded-xl p-3 flex items-center justify-center border border-white/10 opacity-0 transform -translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 text-white">
                                    {standouts[2].shopLogo && !standouts[2].shopLogo.includes('example.com') && !logoErrors[standouts[2].productId] ? (
                                        <img 
                                            src={standouts[2].shopLogo} 
                                            alt={standouts[2].shopName} 
                                            className="max-w-full max-h-full object-contain brightness-0 invert" 
                                            onError={() => handleLogoError(standouts[2].productId)}
                                        />
                                    ) : (
                                        <span className="text-white text-[12px] font-didot font-bold text-center leading-tight uppercase tracking-widest px-1">
                                            {standouts[2].shopName}
                                        </span>
                                    )}
                                </div>
                                {/* Permanent Overlay */}
                                <div className="absolute inset-x-0 bottom-0 z-20 p-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 translate-y-4 transform transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                                    <p className="text-base font-sans text-white leading-tight w-3/4">
                                        {standouts[2].shopDescription} - how they cater to plus size
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </>
                )}
            </div>

        </div>
      </section>

      <ShopShowcase />
      <BrandsCarousel />
      <FeaturedProducts />
      <ProductGridShowcase />
      
    </div>
  );
};

export default Home;
