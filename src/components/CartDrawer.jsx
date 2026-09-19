// src/components/CartDrawer.jsx
import { X, ShoppingBag } from 'lucide-react';
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
  const { isCartOpen, setIsCartOpen, cartItems, cartTotal, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

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
              <div className="cart-drawer__subtotal">
                <span>Total</span>
                <span className="cart-drawer__subtotal-amount">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <button
                id="checkout-btn"
                className="btn btn-gold"
                style={{ width: '100%', padding: 'var(--sp-4)', fontSize: 'var(--text-base)' }}
                onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
              >
                Proceed to Checkout
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
