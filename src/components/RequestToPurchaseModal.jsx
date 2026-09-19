import { useState } from 'react';
import { X, Send, Clock, CheckCircle2, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { FABRIC_OPTIONS, NECKLINE_OPTIONS, SLEEVE_OPTIONS, STANDARD_SIZES } from '../data/products';
import { savePurchaseRequestToFirebase } from '../services/firebaseService';
import './RequestToPurchaseModal.css';

const RequestToPurchaseModal = ({ product, initialMode = 'purchase', initialCustomSpecs = null, onClose }) => {
  const [requestType, setRequestType] = useState(initialMode); // 'purchase' | 'customize'
  const [offeredPrice, setOfferedPrice] = useState('');

  // Calculate pricing based on mode
  const getPricing = () => {
    const basePrice = product?.basePrice || 2499;
    if (requestType === 'purchase') {
      const minQuote = basePrice + 500;
      return { fitBasePrice: basePrice, minQuotePrice: minQuote, displayPrice: basePrice };
    } else {
      if (initialCustomSpecs?.fitBasePrice) {
        const fitBase = initialCustomSpecs.fitBasePrice;
        const minQuote = initialCustomSpecs.minQuotePrice || (fitBase + 500);
        return { fitBasePrice: fitBase, minQuotePrice: minQuote, displayPrice: fitBase };
      }
      const customBase = basePrice + 150; // standard custom fee fit
      const minQuote = customBase + 500;
      return { fitBasePrice: customBase, minQuotePrice: minQuote, displayPrice: customBase };
    }
  };

  const { fitBasePrice, minQuotePrice, displayPrice } = getPricing();

  // Dynamic fabric list from product definition and custom steps
  const fabricStep = product?.customizationSteps?.find(
    s => s.name?.toLowerCase().includes('fabric')
  );
  let availableFabricNames = [];
  if (fabricStep && fabricStep.options && fabricStep.options.length > 0) {
    availableFabricNames = fabricStep.options.map(o => o.name || o.label);
  } else if (product?.fabric?.trim()) {
    availableFabricNames = [product.fabric.trim()];
  } else {
    availableFabricNames = FABRIC_OPTIONS.map(f => f.label);
  }

  // Customization choices
  const [selectedFabric, setSelectedFabric] = useState(initialCustomSpecs?.fabric || availableFabricNames[0]);
  const [selectedNeckline, setSelectedNeckline] = useState(initialCustomSpecs?.neckline || NECKLINE_OPTIONS[0].label);
  const [selectedSleeves, setSelectedSleeves] = useState(initialCustomSpecs?.sleeves || SLEEVE_OPTIONS[0].label);
  const [selectedSize, setSelectedSize] = useState(initialCustomSpecs?.size || 'M');

  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState(initialCustomSpecs?.customFitNotes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePriceChange = (e) => {
    const val = e.target.value;
    setOfferedPrice(val);
    if (val && Number(val) < minQuotePrice) {
      setErrorMsg('Sorry, we are not open for this price quote. Please try another price quote.');
    } else {
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredPrice || Number(offeredPrice) < minQuotePrice) {
      setErrorMsg('Sorry, we are not open for this price quote. Please try another price quote.');
      return;
    }
    if (!customerName || !whatsapp) return;

    const newRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      requestType, // 'purchase' | 'customize'
      productId: product.id,
      productName: product.name,
      originalPrice: product.basePrice,
      fitBasePrice,
      minQuotePrice,
      offeredPrice: Number(offeredPrice),
      fabric: requestType === 'customize' ? selectedFabric : product.fabric,
      neckline: requestType === 'customize' ? selectedNeckline : 'Original Design',
      sleeves: requestType === 'customize' ? selectedSleeves : 'Original Design',
      size: requestType === 'customize' ? selectedSize : 'Original Fit',
      customerName,
      whatsapp,
      email,
      note,
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      submittedAt: new Date().toISOString(),
    };

    await savePurchaseRequestToFirebase(newRequest);
    setIsSubmitted(true);
  };

  return (
    <div className="request-modal-overlay" onClick={onClose}>
      <div className="request-modal-content" onClick={e => e.stopPropagation()}>
        <div className="request-modal-header">
          <div>
            <h2 className="request-modal-title">
              {requestType === 'customize' ? 'Request to Customize' : 'Request to Purchase'}
            </h2>
            <p className="request-modal-subtitle">
              {requestType === 'customize'
                ? 'Specify custom specs & name your price'
                : 'Name your price for this piece'}
            </p>
          </div>
          <button className="request-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {isSubmitted ? (
          <div className="request-modal-success">
            <CheckCircle2 size={48} color="var(--color-gold)" />
            <h3 className="request-success-title">
              {requestType === 'customize' ? 'Custom Request Submitted!' : 'Offer Submitted Successfully!'}
            </h3>
            <p className="request-success-desc">
              Your {requestType === 'customize' ? 'custom design request & price quote' : 'price offer'} of <strong>₹{Number(offeredPrice).toLocaleString('en-IN')}</strong> for <em>{product.name}</em> has been sent directly to DEVAKI brand management.
            </p>
            <div className="request-time-notice">
              <Clock size={16} color="var(--color-gold)" />
              <span>We will review your offer and respond within <strong>24 hours</strong> via WhatsApp / Email with an approval or rejection.</span>
            </div>
            <button className="btn btn-gold" onClick={onClose} style={{ width: '100%', marginTop: 'var(--sp-4)' }}>
              Done
            </button>
          </div>
        ) : (
          <form className="request-modal-form" onSubmit={handleSubmit}>
            {/* Mode Switcher */}
            <div className="request-type-toggle">
              <button
                type="button"
                className={`request-toggle-btn${requestType === 'purchase' ? ' request-toggle-btn--active' : ''}`}
                onClick={() => setRequestType('purchase')}
              >
                Request to Purchase
              </button>
              <button
                type="button"
                className={`request-toggle-btn${requestType === 'customize' ? ' request-toggle-btn--active' : ''}`}
                onClick={() => setRequestType('customize')}
              >
                <Sliders size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Request to Customize
              </button>
            </div>

            {/* Product Summary */}
            <div className="request-product-summary">
              <div className="request-product-info">
                <p className="request-product-name">{product.name}</p>
                <p className="request-product-fabric">
                  {requestType === 'customize' ? `${selectedFabric} · ${selectedNeckline} · ${selectedSleeves}` : product.fabric}
                </p>
              </div>
              <div className="request-product-price">
                <span className="request-price-label">Your price to buy</span>
                <span className="request-price-val">₹{displayPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Customization Options when mode === 'customize' */}
            {requestType === 'customize' && (
              <div className="request-custom-section">
                <p className="request-input-label" style={{ marginBottom: 'var(--sp-2)', color: 'var(--color-gold)' }}>
                  Custom Specifications
                </p>
                <div className="request-custom-grid">
                  <div className="request-input-group">
                    <label className="request-input-label">Fabric</label>
                    <select
                      className="request-input request-select"
                      value={selectedFabric}
                      onChange={e => setSelectedFabric(e.target.value)}
                    >
                      {availableFabricNames.map((fName, idx) => (
                        <option key={idx} value={fName}>{fName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="request-input-group">
                    <label className="request-input-label">Neckline</label>
                    <select
                      className="request-input request-select"
                      value={selectedNeckline}
                      onChange={e => setSelectedNeckline(e.target.value)}
                    >
                      {NECKLINE_OPTIONS.map(n => (
                        <option key={n.id} value={n.label}>{n.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="request-input-group">
                    <label className="request-input-label">Sleeves</label>
                    <select
                      className="request-input request-select"
                      value={selectedSleeves}
                      onChange={e => setSelectedSleeves(e.target.value)}
                    >
                      {SLEEVE_OPTIONS.map(s => (
                        <option key={s.id} value={s.label}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="request-input-group">
                    <label className="request-input-label">Preferred Size</label>
                    <select
                      className="request-input request-select"
                      value={selectedSize}
                      onChange={e => setSelectedSize(e.target.value)}
                    >
                      {STANDARD_SIZES.map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Offer Input */}
            <div className="request-input-group">
              <label htmlFor="offeredPrice" className="request-input-label">
                Name Your Price (₹) <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <div className="request-price-input-wrapper">
                <span className="request-currency-symbol">₹</span>
                <input
                  id="offeredPrice"
                  type="number"
                  step="50"
                  required
                  placeholder={`e.g. ${displayPrice.toLocaleString('en-IN')}`}
                  className={`request-input request-input--price${errorMsg ? ' request-input--error' : ''}`}
                  value={offeredPrice}
                  onChange={handlePriceChange}
                />
              </div>
              {errorMsg ? (
                <p className="request-error-msg">{errorMsg}</p>
              ) : (
                <p className="request-input-hint" style={{ color: 'var(--color-gold)', marginTop: '4px', fontWeight: '500' }}>
                  <Sparkles size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Higher price offers have a higher chance of brand approval.
                </p>
              )}
            </div>

            {/* Contact Details */}
            <div className="request-input-group">
              <label htmlFor="customerName" className="request-input-label">
                Your Name <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="customerName"
                type="text"
                required
                placeholder="Full Name"
                className="request-input"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            <div className="request-input-row">
              <div className="request-input-group">
                <label htmlFor="whatsapp" className="request-input-label">
                  WhatsApp Number <span style={{ color: 'var(--color-gold)' }}>*</span>
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="request-input"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
              </div>
              <div className="request-input-group">
                <label htmlFor="reqEmail" className="request-input-label">
                  Email Address
                </label>
                <input
                  id="reqEmail"
                  type="email"
                  placeholder="name@gmail.com"
                  className="request-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="request-input-group">
              <label htmlFor="note" className="request-input-label">
                Optional Note / Custom Instructions
              </label>
              <textarea
                id="note"
                rows="2"
                placeholder="Add any specific fit preference or note for the brand..."
                className="request-input"
                style={{ resize: 'none' }}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* Response policy notice */}
            <div className="request-policy-notice">
              <AlertCircle size={15} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p>
                <strong>24-Hour Brand Decision Policy:</strong> If DEVAKI accepts your {requestType === 'customize' ? 'customization request' : 'price offer'}, we will contact you on WhatsApp within 24 hours to confirm. Otherwise, a rejection notification is sent within 24 hours.
              </p>
            </div>

            <button type="submit" className="btn btn-gold request-submit-btn">
              <Send size={16} /> Submit {requestType === 'customize' ? 'Customization Request' : 'Purchase Offer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestToPurchaseModal;
