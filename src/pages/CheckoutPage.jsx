import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';
// import AuthCard from '../components/AuthCard'; // Commented out for future reference
import { saveOrderToFirebase } from '../services/firebaseService';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    state: ''
  });
  const [placedOrder, setPlacedOrder] = useState(null);

  // Pre-fill saved customer info if available in local state
  useEffect(() => {
    const saved = localStorage.getItem('devaki_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u) {
          setForm(f => ({ ...f, name: f.name || u.name || '', phone: f.phone || u.phone || '' }));
        }
      } catch (e) {}
    }
  }, []);

  const formatWhatsAppMessage = (order) => {
    let msg = `*DEVAKI — NEW ORDER #${order.id}*\n\n`;
    msg += `*CUSTOMER DETAILS:*\n`;
    msg += `• Name: ${order.customer.name}\n`;
    msg += `• Phone: ${order.customer.phone}\n`;
    msg += `• Address: ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}, ${order.customer.state}\n\n`;

    msg += `*GARMENT SPECIFICATIONS & ITEMS:*\n`;
    order.items.forEach((item, idx) => {
      msg += `*${idx + 1}. ${item.productName}*\n`;
      msg += `• Fabric: ${item.fabric || 'Pure Silk'}\n`;
      if (item.type === 'custom') {
        msg += `• Fit Type: ${item.fitType === 'custom' ? 'Made-to-Measure Custom Fit (+₹250)' : `Standard Size ${item.size}`}\n`;
        if (item.neckline) msg += `• Front Neck: ${item.neckline}\n`;
        if (item.backNeck) msg += `• Back Neck: ${item.backNeck}\n`;
        if (item.sleeves) msg += `• Sleeves: ${item.sleeves}\n`;

        if (item.measurements && item.fitType === 'custom') {
          msg += `• *Tailoring Measurements (Inches):*\n`;
          Object.entries(item.measurements).forEach(([k, v]) => {
            if (v) {
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              msg += `   - ${label}: ${v}"\n`;
            }
          });
        }
      } else {
        if (item.size) msg += `• Size: ${item.size}\n`;
      }
      msg += `• Price: ₹${Number(item.finalPrice || item.basePrice).toLocaleString('en-IN')}\n\n`;
    });

    msg += `*TOTAL AMOUNT: ₹${Number(order.finalPrice).toLocaleString('en-IN')}*\n\n`;
    msg += `Please confirm my order and send payment details. Thank you!`;

    return encodeURIComponent(msg);
  };

  const handlePlaceWhatsApp = async (e) => {
    e.preventDefault();

    const firstItem = cartItems[0] || {};
    const orderId = `${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      productName: firstItem.productName || 'DEVAKI Couture Piece',
      fabric: firstItem.fabric || 'Pure Silk',
      type: firstItem.type || 'standard',
      size: firstItem.size || 'M',
      neckline: firstItem.neckline || null,
      backNeck: firstItem.backNeck || null,
      sleeves: firstItem.sleeves || null,
      fitType: firstItem.fitType || 'standard',
      measurements: firstItem.measurements || null,
      selectionsSummary: firstItem.selectionsSummary || null,
      finalPrice: cartTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
      customer: {
        name: form.name,
        phone: form.phone,
        email: `${form.phone}@customer.devaki`,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        state: form.state,
      },
      items: cartItems,
    };

    // 1. Save to DB for Admin Studio
    await saveOrderToFirebase(newOrder);

    // 2. Build WhatsApp URL for 8555074387
    const waUrl = `https://wa.me/918555074387?text=${formatWhatsAppMessage(newOrder)}`;

    // 3. Clear cart and set confirmation state
    clearCart();
    setPlacedOrder({ ...newOrder, waUrl });

    // 4. Redirect to WhatsApp chat
    window.open(waUrl, '_blank');
  };

  if (cartItems.length === 0 && !placedOrder) return (
    <div className="checkout-page">
      <div style={{ textAlign: 'center', padding: 'var(--sp-16) 0' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-plum)' }}>
          Your cart is empty
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/collection')} style={{ marginTop: 'var(--sp-5)' }}>
          Back to Collection
        </button>
      </div>
    </div>
  );

  if (placedOrder) return (
    <div className="checkout-page">
      <div style={{ textAlign: 'center', padding: 'var(--sp-12) var(--sp-4)', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={36} color="white" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-plum)' }}>
          Order Sent to WhatsApp!
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.5 }}>
          DEVAKI team will contact you. Please do payment to confirm your order.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '340px', marginTop: 'var(--sp-4)' }}>
          <a
            href={placedOrder.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-place-order"
            style={{ textDecoration: 'none' }}
          >
            <MessageSquare size={16} /> Open WhatsApp Chat Again
          </a>
          <button className="btn btn-outline" onClick={() => navigate('/collection')}>
            Back to Collection
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="checkout-page">
      <div className="checkout-layout">
        <h1 className="checkout-page__title">Checkout</h1>

        {/* Simple & Direct Delivery Address Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* COMMENTED AUTH GATE FOR FUTURE REFERENCE:
          {!user ? (
            <AuthCard onAuthenticated={(u) => setUser(u)} />
          ) : (
          */}
          <form onSubmit={handlePlaceWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            <div className="checkout-section">
              <p className="checkout-section__title">Delivery Address &amp; Contact</p>
              <div className="form-row form-row--2">
                <div className="form-field">
                  <label className="form-label" htmlFor="co-name">Full Name</label>
                  <input id="co-name" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="co-phone">WhatsApp Phone Number</label>
                  <input id="co-phone" className="form-input" required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 8555074387" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="co-address">Delivery Address</label>
                <input id="co-address" className="form-input" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="House / flat / street" />
              </div>
              <div className="form-row form-row--2">
                <div className="form-field">
                  <label className="form-label" htmlFor="co-city">City</label>
                  <input id="co-city" className="form-input" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="co-pincode">PIN Code</label>
                  <input id="co-pincode" className="form-input" required value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="600001" maxLength={6} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="co-state">State</label>
                <input id="co-state" className="form-input" required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Telangana" />
              </div>
            </div>

            <div className="checkout-section">
              <p className="checkout-section__title">WhatsApp Instant Order</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Clicking the button below opens WhatsApp to send your complete order summary directly to DEVAKI team at <strong>8555074387</strong>.
              </p>
            </div>

            <button
              id="place-order-whatsapp-btn"
              type="submit"
              className="btn-whatsapp-place-order"
            >
              <MessageSquare size={16} style={{ flexShrink: 0 }} /> PLACE ORDER ON WHATSAPP — ₹{cartTotal.toLocaleString('en-IN')}
            </button>
          </form>
          {/* )} */}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="order-summary__header">Order Summary</div>
          <div className="order-summary__items">
            {cartItems.map(item => (
              <div key={item.cartId} className="order-summary__item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="order-summary__item-name" style={{ fontWeight: 600 }}>{item.productName}</span>
                  {item.fabric && (
                    <span style={{ fontSize: '11px', color: 'var(--color-gold-dim)' }}>Fabric: {item.fabric}</span>
                  )}
                  {item.type === 'custom' ? (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {item.neckline} · {item.sleeves} · {item.fitType === 'custom' ? 'Made-to-Measure Custom Fit' : `Size ${item.size}`}
                    </span>
                  ) : (
                    item.size && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Size: {item.size}</span>
                  )}
                </div>
                <span className="order-summary__item-price">₹{item.finalPrice.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="order-summary__total">
            <span>Total</span>
            <span className="order-summary__total-price">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
