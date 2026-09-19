// src/pages/ProductPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { getStoredProducts, getStockLabel } from '../data/products';
import { subscribeToProducts } from '../services/firebaseService';
import DirectAddToCartModal from '../components/DirectAddToCartModal';
import CustomizationWizard from '../components/CustomizationWizard';
import RequestToPurchaseModal from '../components/RequestToPurchaseModal';
import SareeTransformationModal from '../components/SareeTransformationModal';
import StickyMobileCTA from '../components/StickyMobileCTA';
import './ProductPage.css';

const ImagePlaceholder = () => (
  <div className="img-placeholder">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  </div>
);

const Accordion = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="product-accordion">
      <button
        className={`product-accordion__trigger${open ? ' product-accordion__trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <ChevronDown size={16} />
      </button>
      {open && <div className="product-accordion__content">{children}</div>}
    </div>
  );
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState(() => getStoredProducts());

  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && Array.isArray(liveProducts)) {
        setAllProducts(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const product = allProducts.find(p => p.id === id);

  const [activeImage, setActiveImage] = useState(0);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSareeModal, setShowSareeModal] = useState(false);
  const [requestMode, setRequestMode] = useState('purchase');
  const [customSpecs, setCustomSpecs] = useState(null);

  if (!product) return (
    <div style={{ padding: 'var(--sp-16)', textAlign: 'center' }}>
      <h2>Product not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/collection')} style={{ marginTop: 'var(--sp-5)' }}>Back to Collection</button>
    </div>
  );

  const stockInfo = getStockLabel(product.stock);
  const isSoldOut = product.stock.available === 0;

  const handleCustomRequestFromWizard = (specs) => {
    setShowCustomize(false);
    setCustomSpecs(specs);
    setRequestMode('customize');
    setShowRequestModal(true);
  };

  const galleryImages = (product.images && product.images.length >= 3)
    ? product.images.slice(0, 3)
    : [product.images?.[0] || null, product.images?.[1] || null, product.images?.[2] || null];

  return (
    <>
      <main className="product-page page-with-sticky-cta">
        {/* Back */}
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: 'var(--sp-3) var(--sp-4) 0' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/collection')} style={{ gap: 'var(--sp-1)', padding: 'var(--sp-2) 0' }}>
            <ChevronLeft size={16} /> Collection
          </button>
        </div>

        <div className="product-page__layout">

          {/* ── Gallery ──────────────────────────────────────── */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {galleryImages[activeImage]
                ? <img src={galleryImages[activeImage]} alt={`${product.name} view ${activeImage + 1}`} />
                : <ImagePlaceholder label={`Main Photo — View ${activeImage + 1}`} />
              }
            </div>
            <div className="product-gallery__thumbs">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  className={`product-gallery__thumb${activeImage === i ? ' product-gallery__thumb--active' : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  {img ? <img src={img} alt="" /> : <ImagePlaceholder label={`View ${i + 1}`} />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Info Panel ───────────────────────────────────── */}
          <div className="product-info">
            <p className="product-info__fabric">{product.fabric}</p>
            <h1 className="product-info__name">{product.name}</h1>
            <p className="product-info__tagline">{product.tagline}</p>

            <div className="product-info__price">
              ₹{product.basePrice.toLocaleString('en-IN')}
              <span className="product-info__price-label">Standard Purchase</span>
            </div>

            <div>
              <span className={`product-info__stock badge-${stockInfo.level}`}>
                {stockInfo.label}
              </span>
            </div>

            <div className="divider purchase-options-divider" />

            {/* Purchase Options */}
            <div className="purchase-options">
              {isSoldOut ? (
                <>
                  <div className="purchase-sold-out-card" onClick={() => { setRequestMode('purchase'); setShowRequestModal(true); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="request-card__type">Request to Purchase</span>
                      <span className="request-card__tag">24-Hr Decision</span>
                    </div>
                    <p className="request-card__price">Your price to buy: ₹{product.basePrice.toLocaleString('en-IN')}</p>
                    <p className="request-card__desc">
                      Name your price for this piece as shown.
                    </p>
                    <button className="btn btn-gold" style={{ width: '100%', marginTop: 'var(--sp-2)' }}>
                      <Send size={15} /> Request to Purchase
                    </button>
                  </div>

                  <div className="purchase-sold-out-card" style={{ borderColor: 'rgba(197, 169, 107, 0.6)', background: 'linear-gradient(135deg, rgba(10, 33, 70, 0.9), rgba(6, 22, 40, 0.95))' }} onClick={() => setShowCustomize(true)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="request-card__type" style={{ color: 'var(--color-gold)' }}>Request to Customize</span>
                      <span className="request-card__tag">Interactive 4-Steps</span>
                    </div>
                    <p className="request-card__price">Your price to buy: From ₹{(product.basePrice + 150).toLocaleString('en-IN')}</p>
                    <p className="request-card__desc">
                      Select custom Neckline, Sleeves, Fabric &amp; Fit in 4 steps, then name your price.
                    </p>
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: 'var(--sp-2)', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}>
                      Request to Customize
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="purchase-card purchase-card--standard" onClick={() => setShowAddToCart(true)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setShowAddToCart(true)}>
                    <p className="purchase-card__type">Add to Cart</p>
                    <p className="purchase-card__price">₹{product.basePrice.toLocaleString('en-IN')}</p>
                    <p className="purchase-card__desc">Buy the design as shown. Select your standard size.</p>
                  </div>
                  <div className="purchase-card purchase-card--custom" onClick={() => setShowCustomize(true)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setShowCustomize(true)}>
                    <p className="purchase-card__type">Customize Yours</p>
                    <p className="purchase-card__price">From ₹{(product.customStandardPrice || 2649).toLocaleString('en-IN')}</p>
                    <p className="purchase-card__desc">Select fabric, neckline &amp; sleeves in interactive steps.</p>
                    <p className="purchase-card__note">Custom measurements available at ₹{(product.customMeasurementPrice || 2749).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="purchase-card purchase-card--saree" onClick={() => setShowSareeModal(true)} style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(197,169,107,0.15), rgba(10,33,70,0.85))', border: '1px solid var(--color-gold)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', cursor: 'pointer' }}>
                    <p className="purchase-card__type" style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Sparkles size={14} /> Transform Your Saree
                    </p>
                    <p className="purchase-card__desc" style={{ color: 'var(--color-ivory)', fontSize: 'var(--text-xs)', margin: '4px 0' }}>
                      Upload your saree photo to convert it into this <strong>{product.name}</strong> style!
                    </p>
                    <button className="btn btn-gold" style={{ width: '100%', marginTop: 'var(--sp-2)', fontSize: '11px', padding: '6px 12px' }}>
                      Customize My Saree into this Style →
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="divider purchase-options-divider" />

            {/* Accordions */}
            <div>
              <Accordion title="Product Description">
                <p>{product.description}</p>
              </Accordion>
              <Accordion title="Fabric &amp; Care">
                <p>{product.fabricCare}</p>
              </Accordion>
              <Accordion title="Size Guide">
                <p>Use standard sizes XS–XXL for off-the-shelf fit. For a made-to-measure experience, select custom measurements during the "Customize Yours" flow.</p>
              </Accordion>
              <Accordion title="Shipping &amp; Returns">
                <p>{product.shippingInfo}</p>
                <p style={{ marginTop: 'var(--sp-2)' }}>Custom orders are non-returnable. Standard orders can be exchanged for size within 7 days of delivery.</p>
              </Accordion>
            </div>
          </div>

        </div>
      </main>

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA
        price={`₹${product.basePrice.toLocaleString('en-IN')}`}
        sublabel={isSoldOut ? "Standard price" : "Standard size"}
        label={isSoldOut ? "Request Purchase" : "Add to Cart"}
        onAction={() => {
          if (isSoldOut) {
            setRequestMode('purchase');
            setShowRequestModal(true);
          } else {
            setShowAddToCart(false);
            setShowAddToCart(true);
          }
        }}
        onSecondary={() => {
          setShowCustomize(true);
        }}
        secondaryLabel={isSoldOut ? "Request Customize" : "Customize Yours"}
      />

      {/* Modals */}
      {showAddToCart && (
        <DirectAddToCartModal product={product} onClose={() => setShowAddToCart(false)} />
      )}
      {showCustomize && (
        <CustomizationWizard
          product={product}
          onRequestSubmit={isSoldOut ? handleCustomRequestFromWizard : null}
          onClose={() => setShowCustomize(false)}
        />
      )}
      {showRequestModal && (
        <RequestToPurchaseModal
          product={product}
          initialMode={requestMode}
          initialCustomSpecs={customSpecs}
          onClose={() => setShowRequestModal(false)}
        />
      )}
      {showSareeModal && (
        <SareeTransformationModal
          initialProduct={product}
          onClose={() => setShowSareeModal(false)}
        />
      )}
    </>
  );
};

export default ProductPage;
