// src/pages/SareeTransformationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Phone, MessageSquare, MapPin } from 'lucide-react';
import { MOCK_PRODUCTS, getStockLabel, getStoredProducts } from '../data/products';
import { subscribeToProducts, saveOrderToFirebase } from '../services/firebaseService';
import { useVisitorTracking } from '../hooks/useVisitorTracking';
import CustomizationWizard from '../components/CustomizationWizard';
import './CollectionPage.css';
import './SareeTransformationPage.css';

const ImagePlaceholder = ({ label }) => (
  <div className="img-placeholder">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <span>{label || 'Outfit Photo'}</span>
  </div>
);

const ProductCard = ({ product, onSelect }) => {
  const priceNum = Number(product?.sareeTransformationPrice) || (product?.basePrice ? Number(product.basePrice) + 350 : 2849);

  return (
    <div
      className="product-card"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
    >
      <div className="product-card__image">
        {product?.images?.[0]
          ? <img src={product.images[0]} alt={product.name} />
          : <ImagePlaceholder label={product.name} />
        }
        <span className="product-card__stock-badge" style={{ background: 'var(--color-plum)', color: 'var(--color-gold)', borderColor: 'var(--color-gold)' }}>
          Customize Saree
        </span>
      </div>
      <div className="product-card__info">
        <p className="product-card__fabric">{product?.fabric || 'Pure Silk'}</p>
        <h3 className="product-card__name">{product?.name || 'DEVAKI Piece'}</h3>
        <p className="product-card__price">From ₹{priceNum.toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
};

const SareeTransformationPage = () => {
  useVisitorTracking();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productsList, setProductsList] = useState(() => getStoredProducts());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wizardSpecs, setWizardSpecs] = useState(null);

  // Contact Form State for selected wizard specs
  const [showContactForm, setShowContactForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && Array.isArray(liveProducts)) {
        setProductsList(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const activeProducts = productsList.filter(p => p.isActive !== false);

  const handleWizardSubmit = (specs) => {
    setWizardSpecs(specs);
    setShowContactForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalOrderSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !city.trim()) return;

    setIsSubmitting(true);
    const orderId = Math.floor(1000 + Math.random() * 9000).toString();

    const requestOrderPayload = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'whatsappSent',
      isSareeTransformation: true,
      productName: selectedProduct?.name || 'Custom Outfit from Saree',
      productId: selectedProduct?.id || 'custom-saree',
      image: wizardSpecs?.sareeImage || selectedProduct?.images?.[0] || null,
      sareeImage: wizardSpecs?.sareeImage || null,
      sareeImage2: wizardSpecs?.sareeImage2 || null,
      sareeImages: wizardSpecs?.sareeImages || [wizardSpecs?.sareeImage].filter(Boolean),
      fabric: 'Memorable Saree (Customer Uploaded)',
      neckline: wizardSpecs?.neckline || 'Custom',
      backNeck: wizardSpecs?.backNeck || 'Custom',
      sleeves: wizardSpecs?.sleeves || 'Custom',
      fitType: wizardSpecs?.fitType || 'standard',
      size: wizardSpecs?.size || 'M',
      measurements: wizardSpecs?.measurements || null,
      selectionsSummary: wizardSpecs?.selectionsSummary || {},
      notes: notes.trim(),
      customer: {
        name: customerName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        city: city.trim()
      }
    };

    await saveOrderToFirebase(requestOrderPayload);

    setIsSubmitting(false);
    setSubmittedOrder(requestOrderPayload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="collection-page page-with-sticky-cta">
      {/* ── Collection Header Style ── */}
      <header className="collection-page__header">
        <h1 className="collection-page__title">Saree Transformation</h1>
      </header>

      {/* ── Category Navigation Menu Bar (when browsing items) ── */}
      {!showContactForm && !submittedOrder && (
        <div className="collection-category-bar">
          <button
            className={`collection-cat-tab${selectedCategory === 'all' ? ' collection-cat-tab--active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Outfits <span className="cat-count">({activeProducts.length})</span>
          </button>
        </div>
      )}

      {/* ── Products Grid (when not filling form) ── */}
      {!showContactForm && !submittedOrder && (
        activeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-12) var(--sp-4)' }}>
            <p style={{ color: 'var(--color-plum)', fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)' }}>
              No products found
            </p>
          </div>
        ) : (
          <div className="collection-grid">
            {activeProducts.map(product => (
              <ProductCard key={product.id} product={product} onSelect={() => setSelectedProduct(product)} />
            ))}
          </div>
        )
      )}

      {/* ── Customization Wizard Overlay when product selected ── */}
      {selectedProduct && !showContactForm && !submittedOrder && (
        <CustomizationWizard
          product={selectedProduct}
          isSareeTransformation={true}
          onRequestSubmit={handleWizardSubmit}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* ── Full Mobile Responsive Request Page View ── */}
      {showContactForm && !submittedOrder && (
        <div className="saree-request-page">
          <button type="button" className="saree-back-link" onClick={() => setShowContactForm(false)}>
            ← Back to Outfit Customization
          </button>

          <form className="saree-request-form" onSubmit={handleFinalOrderSubmit}>
            {selectedProduct && (
              <div className="saree-summary-bar">
                <img src={wizardSpecs?.sareeImage || selectedProduct.images?.[0]} alt={selectedProduct.name} className="saree-summary-bar__img" />
                <div className="saree-summary-bar__info">
                  <p className="saree-summary-bar__name">{selectedProduct.name}</p>
                  <p className="saree-summary-bar__details">
                    Fabric: Pure Silk · Fit: {wizardSpecs?.fitType === 'custom' ? 'Custom Fit' : `Size ${wizardSpecs?.size || 'M'}`}
                  </p>
                </div>
              </div>
            )}

            <div className="saree-form-group">
              <label htmlFor="c-name"><Phone size={14} /> Full Name *</label>
              <input
                id="c-name"
                type="text"
                required
                placeholder="Enter your full name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            <div className="saree-form-grid">
              <div className="saree-form-group">
                <label htmlFor="c-phone"><Phone size={14} /> Mobile Phone Number *</label>
                <input
                  id="c-phone"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="saree-form-group">
                <label htmlFor="c-wa"><MessageSquare size={14} /> WhatsApp Number *</label>
                <input
                  id="c-wa"
                  type="tel"
                  required
                  placeholder="10-digit WhatsApp number"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
              </div>
            </div>

            <div className="saree-form-group">
              <label htmlFor="c-city"><MapPin size={14} /> Delivery City &amp; Pincode *</label>
              <input
                id="c-city"
                type="text"
                required
                placeholder="e.g. Hyderabad - 500081"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>

            <div className="saree-form-group">
              <label htmlFor="c-notes">Additional Customization Notes (Optional)</label>
              <textarea
                id="c-notes"
                rows={3}
                placeholder="Special instructions for border placement, zari usage, blouse pattern..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="saree-form-actions">
              <button type="button" className="btn btn-outline saree-btn-back" onClick={() => setShowContactForm(false)}>
                ← Back
              </button>
              <button type="submit" className="btn btn-gold saree-btn-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Saree Transformation →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Full Mobile Responsive Success Page View ── */}
      {submittedOrder && (
        <div className="saree-success-page">
          <CheckCircle2 size={56} color="#27AE60" className="saree-success-icon" />
          <h2 className="saree-success-title">Saree Transformation Request Submitted!</h2>
          <p className="saree-success-id">Request Reference ID: <strong>#DV{submittedOrder.id}</strong></p>
          <p className="saree-success-desc">
            Thank you, <strong>{submittedOrder.customer?.name}</strong>! Our master artisan has received your uploaded saree photo and specifications. We will message you on WhatsApp (<strong>{submittedOrder.customer?.phone}</strong>) shortly with confirmation &amp; payment link.
          </p>

          <div className="saree-success-actions">
            <button className="btn btn-gold" onClick={() => { setSubmittedOrder(null); setShowContactForm(false); setSelectedProduct(null); }}>
              Transform Another Saree
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/collection')}>
              Browse Storefront
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default SareeTransformationPage;

