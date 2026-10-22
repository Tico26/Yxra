import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getShopLogo } from '../utils/imageUtils';

const AllShops = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadShops = async () => {
            const data = await api.getShops();
            setShops(data);
            setLoading(false);
        };
        loadShops();
    }, []);

    return (
        <div className="min-h-screen bg-background-body py-10">
            <div className="container-custom">
                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Partner Boutiques</h1>
                    <p className="text-gray-500">Discover independent shops curating the best in inclusive fashion.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {shops.map(shop => (
                             <div key={shop.shop_id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex items-start gap-4 border border-gray-100">
                                <img 
                                    src={getShopLogo(shop)} 
                                    alt={shop.shop_name} 
                                    className="w-16 h-16 rounded-full object-cover border border-gray-100 shadow-sm"
                                />
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">{shop.shop_name}</h2>
                                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{shop.shop_description || "A curated boutique for inclusive styles."}</p>
                                    <div className="flex items-center text-xs text-gray-400 font-medium">
                                        <span className="flex items-center gap-1">📍 {shop.location || "Online"}</span>
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllShops;
