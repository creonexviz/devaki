// src/pages/TrackOrderPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Phone, Package, Check, Clock, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { subscribeToAllOrders } from '../services/firebaseService';
import './TrackOrderPage.css';

const STATUS_CONFIG = {
  whatsappSent: {
    label: 'WhatsApp Sent (Payment Pending)',
    desc: 'Order request received via WhatsApp. Please complete manual payment (UPI/Bank) to confirm.',
    badgeBg: 'rgba(230, 126, 34, 0.15)',
    badgeColor: '#E67E22',
    border: '1px solid rgba(230, 126, 34, 0.3)',
    stepIdx: 0,
  },
  pending: {
    label: 'Order Placed (Payment Verified)',
    desc: 'Payment received & verified. Order queued for tailoring.',
    badgeBg: 'rgba(76, 175, 120, 0.15)',
    badgeColor: '#4CAF78',
    border: '1px solid rgba(76, 175, 120, 0.3)',
    stepIdx: 0,
  },
  inProduction: {
    label: 'In Production (Master Stitching)',
    desc: 'Your garment is currently being cut, woven & stitched by master artisans.',
    badgeBg: 'rgba(74, 144, 226, 0.15)',
    badgeColor: '#4A90E2',
    border: '1px solid rgba(74, 144, 226, 0.3)',
    stepIdx: 1,
  },
  qualityCheck: {
    label: 'Quality Check & Finishing',
    desc: 'Undergoing final thread inspection & quality approval.',
    badgeBg: 'rgba(155, 81, 224, 0.15)',
    badgeColor: '#9B51E0',
    border: '1px solid rgba(155, 81, 224, 0.3)',
    stepIdx: 2,
  },
  dispatched: {
    label: 'Dispatched / Out for Delivery',
    desc: 'Packed in signature DEVAKI gift docket and dispatched to your shipping address.',
    badgeBg: 'rgba(39, 174, 96, 0.15)',
    badgeColor: '#27AE60',
    border: '1px solid rgba(39, 174, 96, 0.3)',
    stepIdx: 3,
  },
  delivered: {
    label: 'Delivered',
    desc: 'Order successfully delivered.',
    badgeBg: 'rgba(76, 175, 120, 0.2)',
    badgeColor: '#4CAF78',
    border: '1px solid rgba(76, 175, 120, 0.4)',
    stepIdx: 3,
  }
};

const TRACKING_STEPS = [
  { key: 'pending',      label: 'Order Placed',   desc: 'Payment verified' },
  { key: 'inProduction', label: 'In Production',  desc: 'Handcrafted & stitched' },
  { key: 'qualityCheck', label: 'Quality Check',  desc: 'Finishing & inspection' },
  { key: 'dispatched',   label: 'Dispatched',     desc: 'En route to customer' },
];

const normalizePhone = (str) => {
  if (!str) return '';
  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(digits.length - 10);
  }
  return digits;
};

const TrackOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('phone') || searchParams.get('id') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery.trim()));
  const [allOrders, setAllOrders] = useState(() => {
    const saved = localStorage.getItem('devaki_orders') || localStorage.getItem('devaki_user_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Subscribe to live Firestore orders
  useEffect(() => {
    const unsubscribe = subscribeToAllOrders((liveOrders) => {
      if (Array.isArray(liveOrders)) {
        setAllOrders(liveOrders);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
      setSearchParams({ phone: searchQuery.trim() });
    }
  };

  // Filter matching orders by Phone Number or Order ID
  const rawTarget = searchQuery.trim().toLowerCase();
  const targetPhone = normalizePhone(rawTarget);

  const matchedOrders = allOrders
    .filter(order => {
      if (!searchQuery.trim()) return false;
      const idMatch = order.id?.toLowerCase().includes(rawTarget.replace('dv', ''));
      const customerPhone = normalizePhone(order.customer?.phone || order.phone || '');
      const phoneMatch = targetPhone.length >= 4 && customerPhone.includes(targetPhone);
      const emailMatch = order.customer?.email?.toLowerCase().includes(rawTarget);
      return idMatch || phoneMatch || emailMatch;
    })
    // ALWAYS SORT LATEST ORDER FIRST!
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <div className="track-page">
      <div className="track-container">
        {/* Header Hero Banner */}
        <div className="track-hero">
          <span className="track-hero__badge">LIVE WORKFLOW TRACKER</span>
          <h1 className="track-hero__title">Track Your DEVAKI Order</h1>
          <p className="track-hero__sub">
            Enter your registered mobile phone number or Order ID below to view your live stitching status, tailoring specifications &amp; dispatch updates.
          </p>

          {/* Search Box Form */}
          <form className="track-search-form" onSubmit={handleSearchSubmit}>
            <div className="track-search-input-wrap">
              <Phone size={18} className="track-search-icon" />
              <input
                type="text"
                className="track-search-input"
                placeholder="Enter 10-digit Mobile Number or Order ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-gold track-search-btn">
              <Search size={16} /> Track Order
            </button>
          </form>
        </div>

        {/* Results Area */}
        {hasSearched && (
          <div className="track-results-area">
            {matchedOrders.length === 0 ? (
              <div className="track-card track-card--empty">
                <AlertCircle size={42} color="var(--color-gold)" style={{ marginBottom: '12px' }} />
                <h3>No Orders Found</h3>
                <p>
                  We couldn't find any orders matching <strong>"{searchQuery}"</strong>.
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(250,247,242,0.6)', marginTop: '8px' }}>
                  If you just placed an order via WhatsApp, please allow a few minutes for our studio team to verify your payment docket and sync your order.
                </p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <a href="https://wa.me/918555074387" target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    <Phone size={14} /> Contact Studio Concierge
                  </a>
                  <button onClick={() => setSearchQuery('')} className="btn btn-outline" style={{ fontSize: '12px', padding: '8px 16px', color: '#FFF' }}>
                    Clear Search
                  </button>
                </div>
              </div>
            ) : (
              <div className="track-orders-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 className="track-results-title">
                    Found {matchedOrders.length} {matchedOrders.length === 1 ? 'Order' : 'Orders'} (Sorted Latest First)
                  </h2>
                  <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 600 }}>
                    Live Studio Sync Active
                  </span>
                </div>

                {matchedOrders.map((order, index) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.whatsappSent;
                  const stepIndex = statusInfo.stepIdx;

                  return (
                    <div key={order.id} className="track-card">
                      {/* Order Header */}
                      <div className="track-card__header">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="track-card__id">#DV{order.id}</span>
                            {index === 0 && (
                              <span className="track-card__latest-tag">
                                LATEST ORDER
                              </span>
                            )}
                          </div>
                          <p className="track-card__date">
                            Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="track-card__status-wrap">
                          <span
                            className="track-status-badge"
                            style={{
                              background: statusInfo.badgeBg,
                              color: statusInfo.badgeColor,
                              border: statusInfo.border
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Status Explanation Banner */}
                      <div className="track-status-banner" style={{ borderLeft: `3px solid ${statusInfo.badgeColor}` }}>
                        <p className="track-status-banner__text">
                          <strong>Status Update:</strong> {statusInfo.desc}
                        </p>
                        {order.status === 'whatsappSent' && (
                          <div style={{ marginTop: '8px' }}>
                            <a
                              href={`https://wa.me/918555074387?text=${encodeURIComponent(`Hello DEVAKI Studio! I would like to confirm my order #DV${order.id} for ${order.productName || 'Custom Couture'}. Please send UPI payment details.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-gold"
                              style={{ fontSize: '11px', padding: '5px 12px', gap: '4px' }}
                            >
                              <Phone size={12} /> Confirm Payment on WhatsApp
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Order Body Details */}
                      <div className="track-card__body">
                        <div className="track-spec-col">
                          <p className="track-spec-label">Garment &amp; Primary Fabric</p>
                          <p className="track-spec-title">{order.productName || order.items?.[0]?.productName || 'DEVAKI Custom Garment'}</p>
                          <p className="track-spec-sub">Fabric: <strong>{order.fabric || order.items?.[0]?.fabric || 'Pure Cotton Silk'}</strong></p>
                          <p className="track-spec-price">Total Amount: <strong>₹{(order.finalPrice || order.items?.[0]?.finalPrice || 2499).toLocaleString('en-IN')}</strong></p>
                        </div>

                        <div className="track-spec-col">
                          <p className="track-spec-label">Custom Design Selections</p>
                          {(() => {
                            const summary = order.selectionsSummary || order.items?.[0]?.selectionsSummary;
                            const isCustomFit = order.fitType === 'custom';
                            const fitText = isCustomFit ? 'Made-to-Measure Custom Fit' : `Standard Size ${order.size || 'M'}`;

                            if (summary && Object.keys(summary).length > 0) {
                              return (
                                <div className="track-selections-list">
                                  {Object.entries(summary).map(([k, v]) => (
                                    <p key={k}>• {k}: <strong>{v}</strong></p>
                                  ))}
                                  <p style={{ color: 'var(--color-gold)', marginTop: '4px' }}>• Fit: <strong>{fitText}</strong></p>
                                </div>
                              );
                            }

                            return (
                              <div className="track-selections-list">
                                {order.neckline && <p>• Neckline: <strong>{order.neckline}</strong></p>}
                                {order.sleeves && <p>• Sleeves: <strong>{order.sleeves}</strong></p>}
                                <p style={{ color: 'var(--color-gold)' }}>• Fit: <strong>{fitText}</strong></p>
                              </div>
                            );
                          })()}
                        </div>

                        {order.measurements && order.fitType === 'custom' && (
                          <div className="track-spec-col track-measurements-box">
                            <p className="track-spec-label" style={{ color: 'var(--color-gold)' }}>Tailoring Measurements (Inches)</p>
                            <div className="track-measurements-grid">
                              <span>Bust: <strong>{order.measurements.bust}"</strong></span>
                              <span>Waist: <strong>{order.measurements.waist}"</strong></span>
                              <span>Shoulder: <strong>{order.measurements.shoulder}"</strong></span>
                              <span>Armhole: <strong>{order.measurements.armhole}"</strong></span>
                              <span>Sleeve: <strong>{order.measurements.sleeveLength}"</strong></span>
                              <span>Length: <strong>{order.measurements.blouseLength}"</strong></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Stepper Process Tracker */}
                      <div className="track-stepper-wrap">
                        <p className="track-stepper-title">LIVE WORKFLOW PROGRESS TRACKER</p>
                        <div className="track-stepper">
                          {TRACKING_STEPS.map((s, idx) => {
                            const isCompleted = order.status !== 'whatsappSent' && idx <= stepIndex;
                            const isCurrent = order.status !== 'whatsappSent' && idx === stepIndex;

                            return (
                              <div
                                key={s.key}
                                className={`track-step${isCompleted ? ' track-step--completed' : ''}${isCurrent ? ' track-step--current' : ''}`}
                              >
                                <div className="track-step__icon">
                                  {isCompleted ? <Check size={13} /> : idx + 1}
                                </div>
                                <p className="track-step__label">{s.label}</p>
                                <p className="track-step__desc">{s.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
