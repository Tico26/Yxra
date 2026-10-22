import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Check if at the very top (scrollY < 10)
      setIsAtTop(window.scrollY < 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-[1000] h-[13.5vh] transition-all duration-700 ease-in-out ${isAtTop ? 'bg-background-card border-b border-border opacity-100' : 'bg-transparent border-transparent opacity-0 pointer-events-none'}`}>
      <div className="container-custom flex justify-end items-center relative h-full">
        {/* Links - Right Side */}
        <div className="flex gap-6 items-center">
          <NavLink to="/" className={({isActive}) => `font-medium transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-main hover:text-primary'}`}>
            Home
          </NavLink>
          <NavLink to="/shops" className={({isActive}) => `font-medium transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-main hover:text-primary'}`}>
            Shops
          </NavLink>
          <NavLink to="/products" className={({isActive}) => `font-medium transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-main hover:text-primary'}`}>
            Products
          </NavLink>
          <NavLink to="/login" className={({isActive}) => `font-medium transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-main hover:text-primary'}`}>
            Login
          </NavLink>
        </div>

        {/* Logo - Absolute Center */}
        <Link to="/" className="flex items-center text-[8.1vh] leading-none font-didot font-normal text-primary tracking-tighter absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          YX<div className="h-[10.8vh] w-[3px] bg-primary mx-3 transform translate-y-2"></div>RA
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
