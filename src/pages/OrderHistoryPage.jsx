import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Check, Package, Clock, Truck, ShieldCheck, LogOut } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { subscribeToCustomerOrders, logoutFromFirebase } from '../services/firebaseService';
import './OrderHistoryPage.css';

const STATUS_LABELS = {
  whatsappSent:  'WhatsApp Sent (Payment Pending)',
  pending:       'Order Placed',
  inProduction:  'In Production',
  qualityCheck:  'Quality Check',
  dispatched:    'Dispatched',
  delivered:     'Delivered',
};

const TRACKING_STEPS = [
  { key: 'pending',      label: 'Order Placed',   desc: 'Received & verified' },
  { key: 'inProduction', label: 'In Production',  desc: 'Handcrafted & stitched' },
  { key: 'qualityCheck', label: 'Quality Check',  desc: 'Finishing & inspection' },
  { key: 'dispatched',   label: 'Dispatched',     desc: 'On its way to you' },
];

const getStepIndex = (status) => {
  if (status === 'delivered') return 3;
  if (status === 'dispatched') return 3;
  if (status === 'qualityCheck') return 2;
  if (status === 'inProduction') return 1;
  return 0;
};
const OrderCard = ({ order }) => {
  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="order-card">
      <div className="order-card__header">
        <div>
          <p className="order-card__id">#DV{order.id}</p>
          <p className="order-card__date">
            {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`order-status-badge status-${order.status}`}>
          {STATUS_LABELS[order.status] || 'Order Process'}
        </span>
      </div>

      <div className="order-card__body">
        <p className="order-card__product">{order.productName || order.items?.[0]?.productName}</p>

        {(() => {
          const summary = order.selectionsSummary || order.items?.[0]?.selectionsSummary;
          const isCustomFit = order.fitType === 'custom';
          const fitText = isCustomFit
            ? 'Made-to-Measure Custom Fit'
            : `Standard Size ${order.size || 'M'}`;

          if (summary && Object.keys(summary).length > 0) {
            return (
              <div className="order-card__details" style={{ marginTop: '4px' }}>
                {Object.entries(summary).map(([k, v]) => (
                  <p key={k} style={{ margin: '2px 0' }}>
                    <strong>{k}:</strong> {v}
                  </p>
                ))}
                <p style={{ margin: '4px 0 0', color: isCustomFit ? 'var(--color-plum)' : 'var(--color-text-dark)' }}>
                  <strong>Fit:</strong> {fitText}
                </p>
              </div>
            );
          }

          return (
            <p className="order-card__details">
              <strong>Fabric:</strong> {order.fabric || 'Pure Cotton Silk'}<br />
              {order.neckline && <><strong>Neckline:</strong> {order.neckline} · </>}
              {order.sleeves && <><strong>Sleeves:</strong> {order.sleeves}<br /></>}
              <strong>Fit:</strong> {fitText}
            </p>
          );
        })()}
        <p className="order-card__price">₹{(order.finalPrice || order.items?.[0]?.finalPrice || 2499).toLocaleString('en-IN')}</p>
      </div>

      {/* Process Tracker Stepper */}
      <div className="order-tracker">
        <div className="order-tracker__header">
          <span className="order-tracker__label">LIVE ORDER PROCESS TRACKER</span>
          <span className="order-tracker__status-text">
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="order-tracker__stepper">
          {TRACKING_STEPS.map((s, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={s.key}
                className={`tracker-step${isCompleted ? ' tracker-step--completed' : ''}${isCurrent ? ' tracker-step--current' : ''}`}
              >
                <div className="tracker-step__icon">
                  {isCompleted ? <Check size={12} /> : idx + 1}
                </div>
                <p className="tracker-step__label">{s.label}</p>
                <p className="tracker-step__desc">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') || 'login';

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('devaki_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('devaki_user_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    const syncUser = () => {
      setUser(JSON.parse(localStorage.getItem('devaki_user') || 'null'));
    };
    syncUser();

    window.addEventListener('storage', syncUser);
    window.addEventListener('devaki_auth_change', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('devaki_auth_change', syncUser);
    };
  }, []);

  // Real-time Firestore Customer Orders Listener
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = subscribeToCustomerOrders(user.email, (liveOrders) => {
      setOrders(liveOrders);
    });

    return () => unsubscribe();
  }, [user?.email]);

  const handleLogin = (u) => {
    setUser(u);
  };

  const handleLogout = async () => {
    await logoutFromFirebase();
    setUser(null);
  };

  if (!user) {
    return (
      <main className="orders-page" style={{ padding: 'var(--sp-12) var(--sp-4)' }}>
        <AuthCard
          onAuthenticated={handleLogin}
          initialMode={modeParam}
          subtitle="Sign in or register to access your account profile and live orders."
        />
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-page__inner">
        <div className="orders-header-row">
          <div>
            <h1 className="orders-page__title">Your Orders</h1>
            <p className="orders-user-welcome">
              Logged in as <strong>{user.name || user.email}</strong>
            </p>
          </div>
          <button className="btn btn-outline" style={{ fontSize: '11px', padding: '6px 12px', gap: '4px' }} onClick={handleLogout}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <Package size={44} color="var(--color-text-light)" />
            <p className="orders-empty__title">No orders placed yet</p>
            <p style={{ color: 'var(--color-text-light)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)' }}>
              Your DEVAKI orders &amp; live process progress will appear here.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/collection')}>
              Browse Collection
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default OrderHistoryPage;
