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
        <p className="product-card__price">₹{priceNum.toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
};

const SareeTransformationPage = () => {
  useVisitorTracking();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productsList, setProductsList] = useState(() => getStoredProducts());
  const [viewingOutfit, setViewingOutfit] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
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
    setShowWizard(false);
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
      productName: viewingOutfit?.name || 'Custom Outfit from Saree',
      productId: viewingOutfit?.id || 'custom-saree',
      image: wizardSpecs?.sareeImage || viewingOutfit?.images?.[0] || null,
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

    // Automatic WhatsApp redirect with order details
    const waMessage = encodeURIComponent(
      `Greetings DEVAKI Brand Management! 🌸\n` +
      `I would like to submit a Saree Transformation Request (#DV${orderId}).\n\n` +
      `• Customer Name: ${customerName.trim()}\n` +
      `• Phone / WhatsApp: ${whatsapp.trim() || phone.trim()}\n` +
      `• Delivery Location: ${city.trim()}\n` +
      `• Chosen Outfit Style: ${viewingOutfit?.name || 'Custom Outfit'}\n` +
      `• Necklines: ${wizardSpecs?.neckline || 'Custom'} / ${wizardSpecs?.backNeck || 'Custom'}\n` +
      `• Sleeves: ${wizardSpecs?.sleeves || 'Custom'}\n` +
      `• Fit: ${wizardSpecs?.fitType === 'standard' ? `Standard Size ${wizardSpecs?.size}` : 'Custom Measurements'}\n` +
      (notes.trim() ? `• Notes: ${notes.trim()}\n` : '') +
      `\nPlease inspect my uploaded saree photo & confirm tailoring details!`
    );
    const waUrl = `https://wa.me/918555074387?text=${waMessage}`;
    window.open(waUrl, '_blank');

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

      {/* ── Category Navigation Menu Bar (when browsing grid) ── */}
      {!viewingOutfit && !showContactForm && !submittedOrder && (
        <div className="collection-category-bar">
          <button
            className={`collection-cat-tab${selectedCategory === 'all' ? ' collection-cat-tab--active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Outfits <span className="cat-count">({activeProducts.length})</span>
          </button>
        </div>
      )}

      {/* ── Products Grid (when no outfit is selected) ── */}
      {!viewingOutfit && !showContactForm && !submittedOrder && (
        activeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-12) var(--sp-4)' }}>
            <p style={{ color: 'var(--color-plum)', fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)' }}>
              No products found
            </p>
          </div>
        ) : (
          <div className="collection-grid">
            {activeProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => {
                  setViewingOutfit(product);
                  setActiveImage(0);
                  setShowWizard(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )
      )}

      {/* ── Dedicated Saree Transformation Outfit Detail View (with 3 Thumbnails) ── */}
      {viewingOutfit && !showWizard && !showContactForm && !submittedOrder && (
        <div className="saree-detail-view" style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--sp-4) var(--sp-4) var(--sp-12)' }}>
          <button
            type="button"
            className="saree-back-link"
            onClick={() => setViewingOutfit(null)}
            style={{ marginBottom: 'var(--sp-5)', background: 'none', border: 'none', color: 'var(--color-plum)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '14px' }}
          >
            ← Back to Saree Transformation Outfits
          </button>

          <div className="saree-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 'var(--sp-6)', alignItems: 'start' }}>
            {/* Gallery: Main Image View + 3 Thumbnails */}
            <div className="saree-detail-gallery" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="saree-detail-main-img" style={{ width: '100%', aspectRatio: '3/4', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#0A2146', border: '1px solid rgba(197, 169, 107, 0.3)', boxShadow: 'var(--shadow-md)' }}>
                {viewingOutfit.images?.[activeImage] ? (
                  <img src={viewingOutfit.images[activeImage]} alt={viewingOutfit.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImagePlaceholder label={viewingOutfit.name} />
                )}
              </div>

              {/* 3 Outfit Thumbnail Selectors */}
              {(() => {
                const imgs = (viewingOutfit.images && viewingOutfit.images.length > 0)
                  ? viewingOutfit.images
                  : [viewingOutfit.image].filter(Boolean);
                const thumbs = imgs.length >= 3 ? imgs.slice(0, 3) : [imgs[0], imgs[0], imgs[0]].filter(Boolean);

                if (thumbs.length === 0) return null;

                return (
                  <div className="saree-detail-thumbs" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {thumbs.map((tImg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(idx % imgs.length)}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: activeImage === (idx % imgs.length) ? '2px solid var(--color-gold)' : '1px solid rgba(10,33,70,0.2)',
                          padding: 0,
                          cursor: 'pointer',
                          opacity: activeImage === (idx % imgs.length) ? 1 : 0.7,
                          transition: 'all 0.2s ease',
                          boxShadow: activeImage === (idx % imgs.length) ? '0 0 8px rgba(197,169,107,0.5)' : 'none'
                        }}
                      >
                        <img src={tImg} alt={`${viewingOutfit.name} thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Saree Transformation Info & Customize Action */}
            <div className="saree-detail-info" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', background: '#FFFDF9', padding: 'var(--sp-6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gold-dim)', boxShadow: 'var(--shadow-card)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-gold)', background: 'rgba(197, 169, 107, 0.12)', padding: '4px 10px', borderRadius: '4px', width: 'fit-content', border: '1px solid rgba(197,169,107,0.3)' }}>
                ✨ Saree Transformation Outfit Style
              </span>

              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-plum)', margin: 0 }}>
                {viewingOutfit.name}
              </h1>

              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Fabric Source: <strong>Your Saree (Customer Uploaded)</strong>
              </p>

              <div style={{ background: 'rgba(10, 33, 70, 0.04)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(10, 33, 70, 0.1)' }}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '0.05em', margin: 0 }}>
                  Transformation Tailoring Fee
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-plum)', margin: '4px 0 0', fontWeight: 700 }}>
                  ₹{Number(viewingOutfit.sareeTransformationPrice || (Number(viewingOutfit.basePrice || 2499) + 350)).toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  Includes complete custom stitching, high-grade lining &amp; made-to-measure fit.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Sparkles size={16} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--color-plum)', margin: 0 }}>
                    <strong>Saree Requirement:</strong> 1 Old / Heirloom Saree (Silk, Kanjeevaram, Cotton, Chiffon, or Designer)
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--color-plum)', margin: 0 }}>
                    <strong>Tailoring Options:</strong> Choose custom Neckline, Back Neck, Sleeve style &amp; Fit in 4 simple steps
                  </p>
                </div>
              </div>

              {/* Bottom Customize Saree Action Button */}
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => setShowWizard(true)}
                style={{ width: '100%', padding: '14px 20px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'var(--sp-2)' }}
              >
                <Sparkles size={18} /> Customize My Saree into this Style →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Customization Wizard Overlay when user clicks "Customize My Saree into this Style" ── */}
      {viewingOutfit && showWizard && !showContactForm && !submittedOrder && (
        <CustomizationWizard
          product={viewingOutfit}
          isSareeTransformation={true}
          onRequestSubmit={handleWizardSubmit}
          onClose={() => setShowWizard(false)}
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

