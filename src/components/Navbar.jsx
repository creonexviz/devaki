// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, UserPlus, LogIn, LogOut, Sparkles, Home, Layers, Phone, Truck, Search, Scissors, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import BridesmaidTeaserModal from './BridesmaidTeaserModal';
import SareeTransformationModal from './SareeTransformationModal';
import logoImg from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBridesmaidModal, setShowBridesmaidModal] = useState(false);
  const [showSareeModal, setShowSareeModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check logged-in user session with dynamic updates
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('devaki_user') || 'null'));

  // Sync user state on route change or storage/auth events
  useEffect(() => {
    setIsMenuOpen(false);
    const syncUser = () => setUser(JSON.parse(localStorage.getItem('devaki_user') || 'null'));
    syncUser();

    window.addEventListener('storage', syncUser);
    window.addEventListener('devaki_auth_change', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('devaki_auth_change', syncUser);
    };
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    localStorage.removeItem('devaki_user');
    window.dispatchEvent(new Event('devaki_auth_change'));
    setUser(null);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner">
          {/* Brand */}
          <Link to="/" className="navbar__brand">
            <img src={logoImg} alt="DEVAKI Logo" className="navbar__logo-icon" />
            <div className="navbar__brand-text">
              <span className="navbar__logo">DEVAKI</span>
              <span className="navbar__tagline">by creonex</span>
            </div>
          </Link>

          {/* Category Navigation Menu Bar (Desktop) */}
          <div className="navbar__categories">
            <button
              className={`navbar__cat-btn${location.pathname === '/' ? ' navbar__cat-btn--active' : ''}`}
              onClick={() => navigate('/')}
            >
              Home
            </button>
            <button
              className={`navbar__cat-btn${location.pathname === '/collection' ? ' navbar__cat-btn--active' : ''}`}
              onClick={() => navigate('/collection')}
            >
              The Collection
            </button>
            <button
              className={`navbar__cat-btn${location.pathname === '/saree-transformation' ? ' navbar__cat-btn--active' : ''}`}
              onClick={() => navigate('/saree-transformation')}
              style={{ background: location.pathname === '/saree-transformation' ? 'var(--color-gold)' : 'rgba(197,169,107,0.15)', borderColor: 'var(--color-gold)', color: location.pathname === '/saree-transformation' ? '#061628' : 'var(--color-plum)' }}
            >
              <Scissors size={13} color={location.pathname === '/saree-transformation' ? '#061628' : 'var(--color-gold)'} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              <span>Saree Transformation</span>
              <span className="navbar__bm-badge" style={{ background: 'var(--color-gold)', color: '#061628' }}>Your Saree → Outfit</span>
            </button>
            <button
              className="navbar__cat-btn navbar__cat-btn--bm"
              onClick={() => setShowBridesmaidModal(true)}
            >
              <span>Bridesmaid</span>
              <span className="navbar__bm-badge">Coming Soon</span>
            </button>
            <button
              className={`navbar__cat-btn${location.pathname === '/track-order' ? ' navbar__cat-btn--active' : ''}`}
              onClick={() => navigate('/track-order')}
            >
              <Truck size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Track Order
            </button>
            <a
              href="https://wa.me/918555074387"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar__cat-btn"
              style={{ color: '#0A2146', fontWeight: 700 }}
            >
              <Phone size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }} /> Call / WhatsApp
            </a>

            {/* FUTURE AUTH LINKS (Commented for simplified direct WhatsApp ordering):
            {user ? (
              <>
                <button
                  className={`navbar__cat-btn${location.pathname === '/orders' ? ' navbar__cat-btn--active' : ''}`}
                  onClick={() => navigate('/orders')}
                >
                  <User size={13} style={{ display: 'inline', marginRight: '3px' }} />
                  Account ({user.name || user.email.split('@')[0]})
                </button>
                <button
                  className="navbar__cat-btn navbar__cat-btn--logout"
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <LogOut size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  className={`navbar__cat-btn${location.pathname === '/orders' && !location.search.includes('mode=register') ? ' navbar__cat-btn--active' : ''}`}
                  onClick={() => navigate('/orders?mode=login')}
                >
                  <LogIn size={13} style={{ display: 'inline', marginRight: '3px' }} />
                  Sign In
                </button>
                <button
                  className={`navbar__cat-btn${location.pathname === '/orders' && location.search.includes('mode=register') ? ' navbar__cat-btn--active' : ''}`}
                  onClick={() => navigate('/orders?mode=register')}
                >
                  <UserPlus size={13} style={{ display: 'inline', marginRight: '3px' }} />
                  Sign Up / Register
                </button>
              </>
            )}
            */}
          </div>

          {/* Navbar Actions: Cart Icon + Menu Icon */}
          <div className="navbar__actions">
            {/* FUTURE USER ICON:
            <button
              className={`navbar__icon-btn${location.pathname === '/orders' ? ' navbar__icon-btn--active' : ''}`}
              onClick={() => navigate(user ? '/orders' : '/orders?mode=login')}
              aria-label="Account"
            >
              <User size={20} />
            </button>
            */}

            {/* Cart Icon in Navbar */}
            <button
              className="navbar__icon-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Cart (${cartCount} items)`}
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="navbar__cart-badge">{cartCount}</span>
              )}
            </button>

            {/* Menu Toggle Icon */}
            <button
              className={`navbar__menu-toggle${isMenuOpen ? ' navbar__menu-toggle--active' : ''}`}
              onClick={() => setIsMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Top-to-Middle Overlay Menu Panel */}
      {isMenuOpen && (
        <>
          <div className="menu-overlay-backdrop" onClick={() => setIsMenuOpen(false)} />
          <div className="menu-top-panel">
            <div className="menu-top-panel__inner">
              <div className="menu-top-panel__header">
                <span>DEVAKI BY CREONEX NAVIGATION</span>
              </div>
              <div className="menu-top-panel__links">
                <button
                  className={`menu-panel-item${location.pathname === '/' ? ' active' : ''}`}
                  onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                >
                  <div className="menu-panel-item__left">
                    <Home size={18} />
                    <span>Home</span>
                  </div>
                </button>

                <button
                  className={`menu-panel-item${location.pathname === '/collection' ? ' active' : ''}`}
                  onClick={() => { navigate('/collection'); setIsMenuOpen(false); }}
                >
                  <div className="menu-panel-item__left">
                    <Layers size={18} />
                    <span>The Collection</span>
                  </div>
                </button>

                <button
                  className={`menu-panel-item${location.pathname === '/saree-transformation' ? ' active' : ''}`}
                  onClick={() => { navigate('/saree-transformation'); setIsMenuOpen(false); }}
                >
                  <div className="menu-panel-item__left">
                    <Scissors size={18} />
                    <span>Saree Transformation</span>
                  </div>
                  <span className="menu-panel-badge" style={{ background: 'var(--color-gold)', color: '#061628' }}>Your Saree → Outfit</span>
                </button>

                <button
                  className="menu-panel-item menu-panel-item--bm"
                  onClick={() => { setShowBridesmaidModal(true); setIsMenuOpen(false); }}
                >
                  <div className="menu-panel-item__left">
                    <Crown size={18} color="var(--color-gold)" />
                    <span>Bridesmaid Couture</span>
                  </div>
                  <span className="menu-panel-badge">Coming Soon</span>
                </button>

                <button
                  className={`menu-panel-item${location.pathname === '/track-order' ? ' active' : ''}`}
                  onClick={() => { navigate('/track-order'); setIsMenuOpen(false); }}
                >
                  <div className="menu-panel-item__left">
                    <Truck size={18} />
                    <span>Track Order</span>
                  </div>
                </button>

                {/* FUTURE AUTH ITEMS IN MOBILE MENU:
                {user ? (
                  <>
                    <button
                      className={`menu-panel-item menu-panel-item--auth${location.pathname === '/orders' ? ' active' : ''}`}
                      onClick={() => { navigate('/orders'); setIsMenuOpen(false); }}
                    >
                      <User size={18} />
                      <span>My Account ({user.name || user.email})</span>
                    </button>
                    <button
                      className="menu-panel-item menu-panel-item--auth"
                      style={{ color: '#FFB8B8' }}
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`menu-panel-item menu-panel-item--auth${location.pathname === '/orders' && !location.search.includes('mode=register') ? ' active' : ''}`}
                      onClick={() => { navigate('/orders?mode=login'); setIsMenuOpen(false); }}
                    >
                      <LogIn size={18} />
                      <span>Sign In</span>
                    </button>
                    <button
                      className={`menu-panel-item menu-panel-item--auth${location.pathname === '/orders' && location.search.includes('mode=register') ? ' active' : ''}`}
                      onClick={() => { navigate('/orders?mode=register'); setIsMenuOpen(false); }}
                    >
                      <UserPlus size={18} />
                      <span>Sign Up / Register</span>
                    </button>
                  </>
                )}
                */}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="page-offset" />

      {/* Bridesmaid Teaser Modal */}
      {showBridesmaidModal && (
        <BridesmaidTeaserModal onClose={() => setShowBridesmaidModal(false)} />
      )}
      {/* Saree Transformation Modal */}
      {showSareeModal && (
        <SareeTransformationModal onClose={() => setShowSareeModal(false)} />
      )}
    </>
  );
};

export default Navbar;
