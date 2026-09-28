// src/pages/SareeTransformationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Phone, MessageSquare, MapPin, ChevronDown, ChevronLeft } from 'lucide-react';
import { MOCK_PRODUCTS, getStockLabel, getStoredProducts } from '../data/products';
import { subscribeToProducts, saveOrderToFirebase } from '../services/firebaseService';
import { useVisitorTracking } from '../hooks/useVisitorTracking';
import CustomizationWizard from '../components/CustomizationWizard';
import StickyMobileCTA from '../components/StickyMobileCTA';
import './CollectionPage.css';
import './ProductPage.css';
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
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

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setActiveImage(0);
    setShowWizard(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

    // Automatic WhatsApp redirect with order details
    const waMessage = encodeURIComponent(
      `Greetings DEVAKI Brand Management! 🌸\n` +
      `I would like to submit a Saree Transformation Request (#DV${orderId}).\n\n` +
      `• Customer Name: ${customerName.trim()}\n` +
      `• Phone / WhatsApp: ${whatsapp.trim() || phone.trim()}\n` +
      `• Delivery Location: ${city.trim()}\n` +
      `• Chosen Outfit Style: ${selectedProduct?.name || 'Custom Outfit'}\n` +
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

  const currentPrice = selectedProduct
    ? (Number(selectedProduct?.sareeTransformationPrice) || (selectedProduct?.basePrice ? Number(selectedProduct.basePrice) + 350 : 2849))
    : 2849;

  const galleryImages = selectedProduct
    ? ((selectedProduct.images && selectedProduct.images.length >= 3)
        ? selectedProduct.images.slice(0, 3)
        : [selectedProduct.images?.[0] || null, selectedProduct.images?.[1] || null, selectedProduct.images?.[2] || null])
    : [];

  return (
    <>
      <main className="collection-page page-with-sticky-cta">
      {/* ── Collection Header Style ── */}
      <header className="collection-page__header">
        <h1 className="collection-page__title">Saree Transformation</h1>
      </header>

      {/* ── Category Navigation Menu Bar (when browsing outfits grid) ── */}
      {!selectedProduct && !showContactForm && !submittedOrder && (
        <div className="collection-category-bar">
          <button
            className={`collection-cat-tab${selectedCategory === 'all' ? ' collection-cat-tab--active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Outfits <span className="cat-count">({activeProducts.length})</span>
          </button>
        </div>
      )}

      {/* ── Products Grid (when browsing items) ── */}
      {!selectedProduct && !showContactForm && !submittedOrder && (
        activeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-12) var(--sp-4)' }}>
            <p style={{ color: 'var(--color-plum)', fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)' }}>
              No products found
            </p>
          </div>
        ) : (
          <div className="collection-grid">
            {activeProducts.map(product => (
              <ProductCard key={product.id} product={product} onSelect={() => handleSelectProduct(product)} />
            ))}
          </div>
        )
      )}

      {/* ── Dedicated Outfit Detail View (Matching Collection Product Detail Layout) ── */}
      {selectedProduct && !showWizard && !showContactForm && !submittedOrder && (
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', width: '100%' }}>
          {/* Back Navigation Button */}
          <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setSelectedProduct(null)}
              style={{ gap: 'var(--sp-1)', padding: 'var(--sp-2) 0', color: 'var(--color-plum)', fontWeight: 600 }}
            >
              <ChevronLeft size={16} /> All Saree Transformation Outfits
            </button>
          </div>

          <div className="product-page__layout" style={{ margin: 0 }}>
            {/* ── Gallery ── */}
            <div className="product-gallery">
              <div className="product-gallery__main">
                {galleryImages[activeImage]
                  ? <img src={galleryImages[activeImage]} alt={`${selectedProduct.name} view ${activeImage + 1}`} />
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

            {/* ── Info Panel ── */}
            <div className="product-info">
              <p className="product-info__fabric">{selectedProduct.fabric || 'Pure Silk'}</p>
              <h1 className="product-info__name">{selectedProduct.name}</h1>
              <p className="product-info__tagline">
                {selectedProduct.tagline || `Convert your memorable saree into this custom handcrafted ${selectedProduct.name} outfit.`}
              </p>

              <div className="product-info__price">
                ₹{currentPrice.toLocaleString('en-IN')}
                <span className="product-info__price-label" style={{ color: 'var(--color-gold)', borderColor: 'var(--color-gold)', background: 'rgba(197,169,107,0.1)' }}>
                  ✨ Saree Transformation
                </span>
              </div>

              <div>
                <span className="product-info__stock" style={{ background: 'rgba(197, 169, 107, 0.15)', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                  ✨ Custom Handcrafted from Your Saree
                </span>
              </div>

              <div className="divider purchase-options-divider" />

              {/* Clean Action Button */}
              <div style={{ margin: 'var(--sp-4) 0' }}>
                <button
                  id="btn-transform-saree-start"
                  className="btn btn-gold"
                  style={{ width: '100%', padding: '14px var(--sp-4)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}
                  onClick={() => setShowWizard(true)}
                >
                  <Sparkles size={16} /> Transform My Saree into this Style →
                </button>
              </div>

              <div className="divider purchase-options-divider" />

              {/* Accordions */}
              <div>
                <Accordion title="Outfit &amp; Transformation Specs">
                  <p>Our master tailors inspect your saree's zari border, pallu, and body fabric to craft this <strong>{selectedProduct.name}</strong> silhouette. You can specify neckline cuts, sleeve lengths, and fit preferences in the 4-step customization process.</p>
                </Accordion>
                <Accordion title="How Saree Transformation Works">
                  <ol style={{ paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                    <li><strong>Step 1:</strong> Select this {selectedProduct.name} outfit style.</li>
                    <li><strong>Step 2:</strong> Upload a photo of your saree (front body &amp; zari border).</li>
                    <li><strong>Step 3:</strong> Select preferred neckline, sleeves &amp; fit size.</li>
                    <li><strong>Step 4:</strong> Submit your request &amp; DEVAKI schedules insured doorstep pickup of your saree.</li>
                  </ol>
                </Accordion>
                <Accordion title="Fabric &amp; Saree Guidelines">
                  <p>Standard 5.5m sarees (Silk, Cotton Silk, Chiffon, Georgette, Kanjeevaram) are ideal. Zari borders are artfully placed along the neckline, sleeves, and hemline.</p>
                </Accordion>
                <Accordion title="Doorstep Pickup &amp; Insured Shipping">
                  <p>We provide free insured courier pickup of your saree from your home address across India, and deliver your tailored outfit within 10–14 working days.</p>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Customization Wizard Overlay when user clicks 'Transform My Saree into this Style' ── */}
      {selectedProduct && showWizard && !showContactForm && !submittedOrder && (
        <CustomizationWizard
          product={selectedProduct}
          isSareeTransformation={true}
          onRequestSubmit={handleWizardSubmit}
          onClose={() => setShowWizard(false)}
        />
      )}

      {/* ── Request Contact Form View ── */}
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

      {/* ── Success Message ── */}
      {submittedOrder && (
        <div className="saree-success-page">
          <CheckCircle2 size={56} color="#27AE60" className="saree-success-icon" />
          <h2 className="saree-success-title">Saree Transformation Request Submitted!</h2>
          <p className="saree-success-id">Request Reference ID: <strong>#DV{submittedOrder.id}</strong></p>
          <p className="saree-success-desc">
            Thank you, <strong>{submittedOrder.customer?.name}</strong>! Our master artisan has received your uploaded saree photo and specifications. We will message you on WhatsApp (<strong>{submittedOrder.customer?.phone}</strong>) shortly with confirmation &amp; payment link.
          </p>

          <div className="saree-success-actions">
            <button className="btn btn-gold" onClick={() => { setSubmittedOrder(null); setShowContactForm(false); setSelectedProduct(null); setShowWizard(false); }}>
              Transform Another Saree
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/collection')}>
              Browse Storefront
            </button>
          </div>
        </div>
      )}
      </main>

      {/* ── Sticky Mobile CTA for Saree Transformation Outfit Detail View ── */}
      {selectedProduct && !showWizard && !showContactForm && !submittedOrder && (
        <StickyMobileCTA
          price={`₹${currentPrice.toLocaleString('en-IN')}`}
          sublabel="Saree Transformation"
          label="TRANSFORM MY SAREE"
          onAction={() => setShowWizard(true)}
        />
      )}
    </>
  );
};

export default SareeTransformationPage;
