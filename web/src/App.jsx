import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import Home from './pages/Home';
import AllShops from './pages/AllShops';
import AllProducts from './pages/AllProducts';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ShopProducts from './pages/ShopProducts';
import NotFound from './legal/NotFound';
import { LEGAL_PAGES } from './legal';

// Start each new page at the top.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// The router is supplied by main.jsx (in the browser) or by
// src/entry-server.jsx (when pages are pre-built to HTML).
function App() {
  return (
    <>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1100] focus:bg-paper focus:px-4 focus:py-3 focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shops" element={<AllShops />} />
            <Route path="/shops/:id" element={<ShopProducts />} />
            <Route path="/products" element={<AllProducts />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {LEGAL_PAGES.map((page) => (
              <Route key={page.path} path={page.path} element={<page.Page />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Newsletter />
        <Footer />
      </div>
    </>
  );
}

export default App;
