// src/components/SareeTransformationModal.jsx
import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Upload, Phone, MapPin, MessageSquare, Shirt } from 'lucide-react';
import { MOCK_PRODUCTS, getStoredProducts } from '../data/products';
import { saveOrderToFirebase, subscribeToProducts } from '../services/firebaseService';
import CustomizationWizard from './CustomizationWizard';
import './SareeTransformationModal.css';

const SareeTransformationModal = ({ initialProduct = null, onClose }) => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [step, setStep] = useState(initialProduct ? 'wizard' : 'select_product');
  const [wizardSpecs, setWizardSpecs] = useState(null);

  // Contact Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    const unsub = subscribeToProducts((liveProds) => {
      if (liveProds && liveProds.length > 0) {
        const activeOnly = liveProds.filter(p => p.isActive !== false);
        setProducts(activeOnly.length > 0 ? activeOnly : MOCK_PRODUCTS);
      }
    });
    return () => unsub();
  }, []);

  // When wizard finishes
  const handleWizardSubmit = (specs) => {
    setWizardSpecs(specs);
    setStep('contact_form');
  };

  // Submit request to Firebase & Local Storage
  const handleSubmitRequest = async (e) => {
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

    // Save to Firebase & localstorage
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
    setStep('success');
  };

  return (
    <div className="saree-modal-overlay">
      {step === 'wizard' && selectedProduct ? (
        <CustomizationWizard
          product={selectedProduct}
          isSareeTransformation={true}
          onRequestSubmit={handleWizardSubmit}
          onClose={onClose}
        />
      ) : (
        <div className="saree-modal-card">
          <div className="saree-modal-card__header">
            <div className="saree-modal-card__title-box">
              <Sparkles size={20} color="var(--color-gold)" />
              <div>
                <h3 className="saree-modal-card__title">Transform Your Memorable Saree</h3>
                <p className="saree-modal-card__subtitle">Convert your cherished saree into a bespoke designer outfit</p>
              </div>
            </div>
            <button className="saree-modal-card__close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="saree-modal-card__body">

            {/* ── PHASE 1: SELECT OUTFIT PRODUCT SILHOUETTE ── */}
            {step === 'select_product' && (
              <div className="saree-step-select">
                <p className="saree-step-instruction">
                  Step 1: Choose the DEVAKI outfit style you want to recreate from your saree:
                </p>

                <div className="saree-products-grid">
                  {products.map(p => (
                    <div
                      key={p.id}
                      className="saree-product-card"
                      onClick={() => {
                        setSelectedProduct(p);
                        setStep('wizard');
                      }}
                    >
                      <div className="saree-product-card__img-box">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'} alt={p.name} />
                        <span className="saree-product-card__badge">Select Style</span>
                      </div>
                      <div className="saree-product-card__info">
                        <h4 className="saree-product-card__name">{p.name}</h4>
                        <p className="saree-product-card__fabric">{p.fabric}</p>
                        <button className="btn btn-gold saree-product-card__btn">
                          Customize Saree into this Style <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PHASE 3: CONTACT FORM & CONFIRMATION OF REQUEST ── */}
            {step === 'contact_form' && (
              <form onSubmit={handleSubmitRequest} className="saree-contact-form">
                <div className="saree-summary-box">
                  <h4 className="saree-summary-box__title">Selected Specs &amp; Saree Photo</h4>
                  <div className="saree-summary-box__content">
                    {wizardSpecs?.sareeImage && (
                      <img src={wizardSpecs.sareeImage} alt="Uploaded Saree" className="saree-summary-box__img" />
                    )}
                    <div className="saree-summary-box__details">
                      <p><strong>Outfit Style:</strong> {selectedProduct?.name}</p>
                      <p><strong>Necklines:</strong> {wizardSpecs?.neckline} / {wizardSpecs?.backNeck}</p>
                      <p><strong>Sleeves:</strong> {wizardSpecs?.sleeves}</p>
                      <p><strong>Fit:</strong> {wizardSpecs?.fitType === 'standard' ? `Standard Size ${wizardSpecs?.size}` : 'Custom 12-Point Measurements'}</p>
                    </div>
                  </div>
                </div>

                <h4 className="saree-form-title">Enter Contact Details for Fabric Review</h4>
                <p className="saree-form-subtitle">Our master tailors will check your saree photo &amp; contact you on WhatsApp with confirmation &amp; payment details.</p>

                <div className="saree-form-group">
                  <label><Phone size={14} /> Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="saree-form-grid">
                  <div className="saree-form-group">
                    <label><Phone size={14} /> Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number..."
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="saree-form-group">
                    <label><MessageSquare size={14} /> WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit WhatsApp number"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="saree-form-group">
                  <label><MapPin size={14} /> Delivery City &amp; Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad - 500081"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>

                <div className="saree-form-group">
                  <label>Additional Customization Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Any specific instructions for saree border placement, zari usage, etc..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div className="saree-form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setStep('wizard')}>
                    ← Back to Wizard
                  </button>
                  <button type="submit" className="btn btn-gold saree-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Saree Transformation →'}
                  </button>
                </div>
              </form>
            )}

            {/* ── PHASE 4: SUCCESS CONFIRMATION ── */}
            {step === 'success' && submittedOrder && (
              <div className="saree-success-box">
                <div className="saree-success-icon">
                  <CheckCircle2 size={54} color="#27AE60" />
                </div>
                <h3 className="saree-success-title">Saree Transformation Request Submitted!</h3>
                <p className="saree-success-order-id">Request ID: <strong>#DV{submittedOrder.id}</strong></p>

                <p className="saree-success-msg">
                  Thank you, <strong>{submittedOrder.customer.name}</strong>! Our DEVAKI master artisan is reviewing your uploaded saree photo to inspect fabric layout &amp; border placement for your chosen <strong>{submittedOrder.productName}</strong> design.
                </p>

                <div className="saree-success-info-card">
                  <h4>What Happens Next?</h4>
                  <ul>
                    <li>1. Master Artisan checks your saree photo for outfit suitability.</li>
                    <li>2. We will contact you on WhatsApp (<strong>{submittedOrder.customer.whatsapp || submittedOrder.customer.phone}</strong>) within 2–4 hours.</li>
                    <li>3. We will share tailoring feasibility details &amp; payment link to confirm your order.</li>
                  </ul>
                </div>

                <div className="saree-success-actions">
                  <a
                    href={`https://wa.me/918555074387?text=${encodeURIComponent(`Hi DEVAKI Studio, I just submitted a Saree Transformation request (#DV${submittedOrder.id}) for ${submittedOrder.productName}. Please check my uploaded saree photo!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold saree-wa-btn"
                  >
                    <MessageSquare size={16} /> Chat on WhatsApp Now for Instant Confirmation
                  </a>
                  <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '10px' }}>
                    Done &amp; Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default SareeTransformationModal;
