// src/components/CartDrawer.jsx
import { useState } from 'react';
import { X, ShoppingBag, Tag, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

const CartItem = ({ item, onRemove }) => {
  const isCustom = item.type === 'custom';
  return (
    <div className="cart-item">
      <div className="cart-item__image">
        {item.image
          ? <img src={item.image} alt={item.productName} />
          : <div className="img-placeholder" style={{ height: '100%' }} />
        }
      </div>
      <div className="cart-item__info">
        <p className="cart-item__name">{item.productName}</p>
        {isCustom && <span className="cart-item__badge">Customized</span>}

        {item.fabric && (
          <p className="cart-item__detail"><strong>Fabric:</strong> {item.fabric}</p>
        )}

        {isCustom ? (
          <>
            {(() => {
              const summary = item.selectionsSummary;
              const isCustomFit = item.fitType === 'custom';
              const fitText = isCustomFit
                ? 'Made-to-Measure Custom Fit'
                : `Standard Size ${item.size || 'M'}`;

              if (summary && Object.keys(summary).length > 0) {
                return (
                  <>
                    {Object.entries(summary).map(([k, v]) => (
                      <p key={k} className="cart-item__detail">
                        <strong>{k}:</strong> {v}
                      </p>
                    ))}
                    <p className="cart-item__detail">
                      <strong>Fit:</strong> {fitText}
                    </p>
                  </>
                );
              }

              return (
                <>
                  {item.neckline && <p className="cart-item__detail"><strong>Neckline:</strong> {item.neckline}</p>}
                  {item.sleeves && <p className="cart-item__detail"><strong>Sleeves:</strong> {item.sleeves}</p>}
                  <p className="cart-item__detail"><strong>Fit:</strong> {fitText}</p>
                </>
              );
            })()}
            {item.measurements && item.fitType === 'custom' && (
              <p className="cart-item__detail" style={{ fontSize: '10px', color: 'var(--color-gold-dim)', marginTop: '2px' }}>
                Bust: {item.measurements.bust}" · Waist: {item.measurements.waist}" · Shoulder: {item.measurements.shoulder}"
              </p>
            )}
          </>
        ) : (
          item.size && <p className="cart-item__detail"><strong>Size:</strong> {item.size}</p>
        )}

        <p className="cart-item__price">₹{item.finalPrice.toLocaleString('en-IN')}</p>
        <div className="cart-item__actions">
          <button className="cart-item__remove-btn" onClick={() => onRemove(item.cartId)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const CartDrawer = () => {
  const {
    isCartOpen, setIsCartOpen, cartItems, cartTotal, removeFromCart,
    appliedCoupon, applyCoupon, removeCoupon, discountAmount, finalTotal
  } = useCart();
  const navigate = useNavigate();
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponNotice, setCouponNotice] = useState(null);

  if (!isCartOpen) return null;

  const handleApplyCouponForm = (e) => {
    e.preventDefault();
    const result = applyCoupon(couponCodeInput);
    setCouponNotice(result);
    if (result.success) setCouponCodeInput('');
  };

  return (
    <>
      <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        {/* Header */}
        <div className="cart-drawer__header">
          <div>
            <p className="cart-drawer__title">Your Cart</p>
            {cartItems.length > 0 && (
              <p className="cart-drawer__count">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</p>
            )}
          </div>
          <button className="cart-drawer__close" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        {cartItems.length === 0 ? (
          <div className="cart-drawer__empty">
            <div className="cart-drawer__empty-icon">
              <ShoppingBag size={48} color="var(--color-text-light)" />
            </div>
            <p className="cart-drawer__empty-title">Your cart is empty</p>
            <p className="cart-drawer__empty-desc">Find a DEVAKI piece you love and add it here.</p>
            <button
              className="btn btn-outline"
              onClick={() => { setIsCartOpen(false); navigate('/'); }}
            >
              Browse Collection
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {cartItems.map(item => (
                <CartItem key={item.cartId} item={item} onRemove={removeFromCart} />
              ))}
            </div>

            <div className="cart-drawer__footer">
              {/* Interactive Coupon Box */}
              <div className="cart-drawer__coupon-box">
                {appliedCoupon ? (
                  <div className="cart-drawer__coupon-applied">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} color="#4CAF78" />
                      <span style={{ fontWeight: 700, color: '#4CAF78', fontSize: '12px' }}>
                        {appliedCoupon.code} Applied ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} OFF`})
                      </span>
                    </div>
                    <button className="cart-drawer__coupon-remove" onClick={removeCoupon} aria-label="Remove coupon">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCouponForm} className="cart-drawer__coupon-form">
                    <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                      <input
                        type="text"
                        placeholder="Coupon (Try: FIRSTORDER)"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="cart-drawer__coupon-input"
                      />
                      <button type="submit" className="cart-drawer__coupon-btn">
                        Apply
                      </button>
                    </div>
                  </form>
                )}
                {couponNotice && (
                  <p style={{ fontSize: '11px', marginTop: '4px', color: couponNotice.success ? '#4CAF78' : '#C84848', fontWeight: 600 }}>
                    {couponNotice.message}
                  </p>
                )}
              </div>

              <div className="cart-drawer__subtotal" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="cart-drawer__subtotal" style={{ color: '#4CAF78', fontSize: '13px' }}>
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="cart-drawer__subtotal" style={{ color: '#4CAF78', fontSize: '12px' }}>
                <span>Shipping Charges</span>
                <span>FREE</span>
              </div>

              <div className="cart-drawer__subtotal" style={{ borderTop: '1px solid var(--color-ivory-dim)', paddingTop: '8px', marginTop: '4px' }}>
                <span>Total</span>
                <span className="cart-drawer__subtotal-amount">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                id="checkout-btn"
                className="btn btn-gold"
                style={{ width: '100%', padding: 'var(--sp-4)', fontSize: 'var(--text-base)' }}
                onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
              >
                Proceed to Checkout — ₹{finalTotal.toLocaleString('en-IN')}
              </button>
              <p className="cart-drawer__note">
                First-come, first-served · Pieces are secured upon successful payment.
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
