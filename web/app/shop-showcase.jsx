"use client";

import { useEffect, useState } from "react";

const EmptySlot = () => (
  <div className="flex flex-col items-center opacity-10">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  </div>
);

// Tico's shop showcase: one shop at a time with five of its items, moving on
// every 5 seconds (paused while the pointer is over it). shops is
// [{ retailer_id, retailer_name, products }].
export default function ShopShowcase({ shops, size }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);

  const triggerTransition = (newIndex) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 150);
  };

  useEffect(() => {
    if (shops.length < 2 || paused) return;
    const interval = setInterval(() => triggerTransition((currentIndex + 1) % shops.length), 5000);
    return () => clearInterval(interval);
  }, [shops, currentIndex, paused]);

  if (!shops.length) return null;

  const currentShop = shops[currentIndex];
  const products = currentShop.products.slice(0, 5);
  const step = (d) => triggerTransition((currentIndex + d + shops.length) % shops.length);

  return (
    <section
      className="bg-[#D9D9D9] py-8 relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`container-custom relative transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <div className="mb-6">
          <a href={`/shops/${currentShop.retailer_id}?size=${size}`} className="bg-white inline-block px-8 py-3 shadow-md border-b-4 border-primary/20">
            <h2 className="text-xl font-didot font-bold tracking-[0.2em] text-black uppercase">
              {currentShop.retailer_name}
            </h2>
          </a>
        </div>

        <div className="relative flex items-center group md:px-12">
          {shops.length > 1 ? (
            <button
              type="button"
              onClick={() => step(-1)}
              className="hidden md:block absolute left-0 z-20 p-2 text-black/30 hover:text-black transition-colors bg-transparent"
              aria-label="Previous shop"
            >
              <svg width="24" height="48" viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 44L4 24L20 4" />
              </svg>
            </button>
          ) : null}

          <div className="flex-1 min-h-[200px] flex items-center justify-center min-w-0">
            <div className="flex gap-4 w-full h-[200px] overflow-x-auto md:overflow-visible snap-x">
              {[...Array(5)].map((_, index) => {
                const product = products[index];
                return (
                  <div key={product ? product.product_id : `empty-${index}`} className="flex-none w-[40%] md:w-auto md:flex-1 snap-start">
                    {product ? (
                      <a href={`/products/${product.product_id}?size=${size}`} className="block w-full h-full">
                        <div className="w-full h-full p-2 overflow-hidden relative group/img flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="h-full w-full object-contain transition-transform duration-1000 group-hover/img:scale-105"
                          />
                        </div>
                      </a>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <EmptySlot />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {shops.length > 1 ? (
            <button
              type="button"
              onClick={() => step(1)}
              className="hidden md:block absolute right-0 z-20 p-2 text-black/30 hover:text-black transition-colors bg-transparent"
              aria-label="Next shop"
            >
              <svg width="24" height="48" viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4L20 24L4 44" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {shops.length > 1 ? (
        <div className="flex justify-center gap-2 mt-8">
          {shops.map((shop, idx) => (
            <button
              type="button"
              key={shop.retailer_id}
              onClick={() => triggerTransition(idx)}
              aria-label={`Show ${shop.retailer_name}`}
              className={`h-2 rounded-full p-0 transition-all duration-300 ${currentIndex === idx ? "bg-black w-8" : "bg-black/20 w-2"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
