import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Package, CheckCircle } from 'lucide-react';
import { getStoredProducts, getStockLabel } from '../data/products';
import { subscribeToProducts } from '../services/firebaseService';
import { useVisitorTracking } from '../hooks/useVisitorTracking';
import BridesmaidTeaserModal from '../components/BridesmaidTeaserModal';
import SareeTransformationModal from '../components/SareeTransformationModal';
import Footer from '../components/Footer';
import './HomePage.css';

const ImagePlaceholder = ({ label }) => (
  <div className="img-placeholder">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <span>{label || 'Your image here'}</span>
  </div>
);

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const stockInfo = getStockLabel(product?.stock);
  const priceNum = Number(product?.basePrice) || 2499;

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/product/${product.id}`)}
    >
      <div className="product-card__image">
        {product?.images?.[0]
          ? <img src={product.images[0]} alt={product.name} />
          : <ImagePlaceholder label="Product photo" />
        }
        <span className={`product-card__stock-badge badge-${stockInfo.level}`}>
          {stockInfo.label}
        </span>
      </div>
      <div className="product-card__info">
        <p className="product-card__fabric">{product?.fabric || 'Pure Silk'}</p>
        <h3 className="product-card__name">{product?.name || 'DEVAKI Piece'}</h3>
        <p className="product-card__price">₹{priceNum.toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
};

const HomePage = () => {
  useVisitorTracking(); // Track unique daily visitor
  const navigate = useNavigate();
  const [products, setProducts] = useState(getStoredProducts());
  const [showBridesmaidModal, setShowBridesmaidModal] = useState(false);
  const [showSareeModal, setShowSareeModal] = useState(false);
  const [allProducts, setAllProducts] = useState(() => getStoredProducts());

  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && Array.isArray(liveProducts)) {
        setAllProducts(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const activeProducts = allProducts.filter(p => p.isActive !== false);

  return (
    <>
      <main className="page-with-sticky-cta">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="home-hero">
        <p className="home-hero__label">New Collection · Limited Edition</p>
        <h1 className="home-hero__title">
          <em>Limited</em> by design.<br />Made to be <em>yours.</em>
        </h1>
        <p className="home-hero__subtitle">
          Every DEVAKI piece begins with a thoughtfully crafted silhouette.
          Buy it as designed — or make it entirely your own.
        </p>
        <div className="home-hero__cta">
          <button
            className="btn btn-gold"
            onClick={() => navigate('/collection')}
          >
            View Collection
          </button>
        </div>
        <div className="home-hero__scroll">
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="14" height="20" rx="7"/>
            <line x1="8" y1="5" x2="8" y2="9"/>
          </svg>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── Collection Grid ───────────────────────────────────── */}
      <section id="collection" className="home-section" style={{ background: 'var(--color-ivory)' }}>
        <div className="home-section__header">
          <p className="home-section__label">Couture Catalog</p>
          <h2 className="home-section__title">The Collection</h2>
          <p className="home-section__desc">
            Each piece is produced in a strictly limited quantity. Once they find their home, they are gone.
          </p>
        </div>

        {activeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-8) var(--sp-4)' }}>
            <p style={{ color: 'var(--color-plum)', fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)' }}>
              No products found
            </p>
          </div>
        ) : (
          <div className="collection-grid">
            {activeProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 'var(--sp-6)' }}>
          <button
            id="more-collection-btn"
            className="btn btn-gold"
            style={{ padding: 'var(--sp-3) var(--sp-6)', fontSize: 'var(--text-sm)', fontWeight: 700 }}
            onClick={() => navigate('/collection')}
          >
            Explore Couture Collection →
          </button>
        </div>
      </section>

      {/* ── Pricing Banner (How It Works) ────────────────────────── */}
      <section className="pricing-banner">
        <div className="home-section__header">
          <p className="home-section__label">How It Works</p>
          <h2 className="home-section__title" style={{ color: 'var(--color-plum)' }}>Bespoke Craftsmanship &amp; Customization</h2>
        </div>
        <div className="pricing-banner__inner">
          <div className="pricing-card pricing-card--standard">
            <p className="pricing-card__label">Buy As Designed</p>
            <p className="pricing-card__title">Add to Cart &amp; Direct Order</p>
            <div className="pricing-card__features">
              {['Standard size XS–XXL selection', 'Signature base silhouette design', 'Ships in 5–7 working days'].map(f => (
                <div key={f} className="pricing-card__feature">
                  <CheckCircle size={14} color="var(--color-gold)" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pricing-card pricing-card--custom">
            <p className="pricing-card__label">Customize Yours</p>
            <p className="pricing-card__title">Interactive Customization</p>
            <div className="pricing-card__features">
              {[
                'Choose your custom neckline style',
                'Choose your sleeve pattern & length',
                'Standard size fit option',
                'Made-to-measure 12 custom fit',
              ].map(f => (
                <div key={f} className="pricing-card__feature">
                  <CheckCircle size={14} color="#0A2146" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="pricing-card pricing-card--saree"
            onClick={() => navigate('/saree-transformation')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/saree-transformation')}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="pricing-card__label" style={{ color: 'var(--color-gold-light)' }}>
                Your Saree → Outfit
              </p>
              <Scissors size={16} color="var(--color-gold)" />
            </div>
            <p className="pricing-card__title" style={{ color: 'var(--color-ivory)' }}>
              Saree Transformation
            </p>
            <div className="pricing-card__features">
              {[
                'Upload photo of your own saree',
                'Choose blouse, kurti or outfit style',
                'Master artisan fabric inspection',
                'Custom fit or standard size',
              ].map(f => (
                <div key={f} className="pricing-card__feature" style={{ color: 'var(--color-gold-light)' }}>
                  <CheckCircle size={14} color="var(--color-gold)" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pricing-card pricing-card--request">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="pricing-card__label" style={{ color: 'var(--color-gold-light)' }}>
                Limited Edition Access
              </p>
              <Sparkles size={16} color="var(--color-gold)" />
            </div>
            <p className="pricing-card__title" style={{ color: 'var(--color-ivory)' }}>
              Request to Purchase
            </p>
            <div className="pricing-card__features">
              {[
                'For sold-out & limited edition pieces',
                'Submit custom price request offer',
                'DEVAKI brand reviews & approves offer',
                'Direct confirmation within 24 hours',
              ].map(f => (
                <div key={f} className="pricing-card__feature" style={{ color: 'var(--color-gold-light)' }}>
                  <CheckCircle size={14} color="var(--color-gold)" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
    <Footer />
    {showBridesmaidModal && (
      <BridesmaidTeaserModal onClose={() => setShowBridesmaidModal(false)} />
    )}
    {showSareeModal && (
      <SareeTransformationModal onClose={() => setShowSareeModal(false)} />
    )}
    </>
  );
};

export default HomePage;
