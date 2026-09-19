// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import HomePage from './pages/HomePage';
import CollectionPage from './pages/CollectionPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import TrackOrderPage from './pages/TrackOrderPage';
import SareeTransformationPage from './pages/SareeTransformationPage';
import AdminPanel from './pages/AdminPanel';

// Scroll to top helper component — handles forward, backward (history back), and direct navigation
const ScrollToTop = () => {
  const { pathname, search, key } = useLocation();

  useEffect(() => {
    // Disable browser default scroll restoration (which forces old scroll offset on BACK button)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    resetScroll();

    // Ensure top scroll even if async rendering or layout paint completes a frame later
    const timer = setTimeout(resetScroll, 0);
    const rAF = requestAnimationFrame(resetScroll);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rAF);
    };
  }, [pathname, search, key]);

  return null;
};

// Admin panel routes do NOT render the customer Navbar
const AdminRoute = ({ children }) => children;

const CustomerLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <CartDrawer />
  </>
);

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <CartProvider>
      <Routes>
        {/* ── Customer Routes ─────────────────────────────── */}
        <Route path="/" element={<CustomerLayout><HomePage /></CustomerLayout>} />
        <Route path="/collection" element={<CustomerLayout><CollectionPage /></CustomerLayout>} />
        <Route path="/product/:id" element={<CustomerLayout><ProductPage /></CustomerLayout>} />
        <Route path="/checkout" element={<CustomerLayout><CheckoutPage /></CustomerLayout>} />
        <Route path="/track-order" element={<CustomerLayout><TrackOrderPage /></CustomerLayout>} />
        <Route path="/saree-transformation" element={<CustomerLayout><SareeTransformationPage /></CustomerLayout>} />
        <Route path="/memorable-saree" element={<CustomerLayout><SareeTransformationPage /></CustomerLayout>} />
        <Route path="/orders" element={<CustomerLayout><OrderHistoryPage /></CustomerLayout>} />

        {/* ── Admin Route (hidden URL) ─────────────────────── */}
        <Route path="/devaki-studio-admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

        {/* ── 404 Fallback ──────────────────────────────────── */}
        <Route path="*" element={
          <CustomerLayout>
            <div style={{
              minHeight: '80svh', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-4)',
              fontFamily: 'var(--font-heading)', color: 'var(--color-plum)',
              textAlign: 'center', padding: 'var(--sp-8)'
            }}>
              <h1 style={{ fontSize: 'var(--text-3xl)' }}>Page Not Found</h1>
              <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', fontSize: 'var(--text-md)' }}>
                This page has found its home elsewhere.
              </p>
              <a href="/" className="btn btn-primary">Back to Collection</a>
            </div>
          </CustomerLayout>
        } />
      </Routes>
    </CartProvider>
  </BrowserRouter>
);

export default App;
