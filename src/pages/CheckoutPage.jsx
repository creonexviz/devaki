import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageSquare, Tag, CheckCircle2, X, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { saveOrderToFirebase } from '../services/firebaseService';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const {
    cartItems, cartTotal, clearCart,
    appliedCoupon, applyCoupon, removeCoupon, discountAmount, finalTotal
  } = useCart();
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
  const [couponInput, setCouponInput] = useState('');
  const [couponNotice, setCouponNotice] = useState(null);

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
      msg += `• Item Price: ₹${Number(item.finalPrice || item.basePrice).toLocaleString('en-IN')}\n\n`;
    });

    msg += `*PRICE & PAYMENT SUMMARY:*\n`;
    msg += `• Subtotal: ₹${Number(order.subtotal || order.cartTotal).toLocaleString('en-IN')}\n`;
    if (order.couponCode) {
      msg += `• Coupon Applied (${order.couponCode}): -₹${Number(order.discountAmount).toLocaleString('en-IN')}\n`;
    }
    msg += `• Shipping Charges: FREE (All India)\n`;
    msg += `*TOTAL AMOUNT PAYABLE: ₹${Number(order.finalPrice).toLocaleString('en-IN')}*\n\n`;
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
      cartTotal: cartTotal,
      subtotal: cartTotal,
      couponCode: appliedCoupon?.code || null,
      discountAmount: discountAmount || 0,
      finalPrice: finalTotal,
      status: 'whatsappSent',
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

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    setCouponNotice(res);
    if (res.success) setCouponInput('');
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
          DEVAKI team will contact you shortly. Please complete payment to confirm your order.
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
              <MessageSquare size={16} style={{ flexShrink: 0 }} /> PLACE ORDER ON WHATSAPP — ₹{finalTotal.toLocaleString('en-IN')}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="order-summary__header">Order Summary</div>
          <div className="order-summary__items">
            {cartItems.map(item => {
              const itemImg = item.image || item.images?.[0] || null;
              return (
                <div key={item.cartId} className="order-summary__item">
                  <div className="order-summary__item-img">
                    {itemImg ? (
                      <img src={itemImg} alt={item.productName} />
                    ) : (
                      <div className="order-summary__item-img-placeholder" />
                    )}
                  </div>
                  <div className="order-summary__item-details">
                    <span className="order-summary__item-name">{item.productName}</span>
                    {item.fabric && (
                      <span className="order-summary__item-meta" style={{ color: 'var(--color-gold-dim)' }}>
                        Fabric: {item.fabric}
                      </span>
                    )}
                    {item.type === 'custom' ? (
                      <span className="order-summary__item-meta">
                        {item.neckline} · {item.sleeves} · {item.fitType === 'custom' ? 'Made-to-Measure Custom Fit' : `Size ${item.size}`}
                      </span>
                    ) : (
                      item.size && <span className="order-summary__item-meta">Size: {item.size}</span>
                    )}
                  </div>
                  <span className="order-summary__item-price">₹{item.finalPrice.toLocaleString('en-IN')}</span>
                </div>
              );
            })}
          </div>

          {/* Interactive Coupon Box on Checkout */}
          <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderTop: '1px solid var(--color-ivory-dim)', background: 'var(--color-ivory-warm)' }}>
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#4CAF78" />
                  <span style={{ fontWeight: 700, color: '#4CAF78', fontSize: '12px' }}>
                    Coupon {appliedCoupon.code} Applied ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} OFF`})
                  </span>
                </div>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. FIRSTORDER)"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-ivory-dim)', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, outline: 'none' }}
                />
                <button type="submit" className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                  Apply
                </button>
              </form>
            )}
            {couponNotice && (
              <p style={{ fontSize: '11px', marginTop: '4px', color: couponNotice.success ? '#4CAF78' : '#C84848', fontWeight: 600 }}>
                {couponNotice.message}
              </p>
            )}
          </div>

          {/* Detailed Totals Breakdown */}
          <div style={{ padding: 'var(--sp-3) var(--sp-4)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4CAF78', fontWeight: 600 }}>
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4CAF78', fontWeight: 600 }}>
              <span>Shipping Charges</span>
              <span>FREE</span>
            </div>
          </div>

          <div className="order-summary__total">
            <span>Total Payable</span>
            <span className="order-summary__total-price">₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
