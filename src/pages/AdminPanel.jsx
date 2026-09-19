// src/pages/AdminPanel.jsx
// ─────────────────────────────────────────────────────────────
// DEVAKI Admin Portal — Hidden URL: /devaki-studio-admin
// Direct Customer Workflow Sync & Interactive Management System
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Package, BarChart2, Layers, RefreshCw, MessageSquare,
  Sparkles, Phone, CheckCircle, AlertCircle, Users, Printer,
  ArrowRight, Search, Filter, PlusCircle, Trash2, ShieldCheck, DollarSign,
  Camera, Sliders, Eye, EyeOff, Clock, AlertTriangle, CheckCircle2, X,
  Menu, Store, ChevronRight, Scissors
} from 'lucide-react';
import { MOCK_PRODUCTS, getStockLabel, getStoredProducts } from '../data/products';
import {
  subscribeToAllOrders,
  updateOrderStatusInFirebase,
  subscribeToProducts,
  saveProductToFirebase,
  deleteProductFromFirebase,
  subscribeToPurchaseRequests,
  savePurchaseRequestToFirebase,
  saveOrderToFirebase
} from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';
import './AdminPanel.css';

const STATUS_CONFIG = {
  whatsappSent: { label: 'WhatsApp Message Sent (Payment Pending)', shortLabel: 'WhatsApp Sent (Payment Pending)', next: 'pending', nextLabel: 'Mark Payment Received & Place Order', bg: '#E67E22' },
  pending:      { label: 'Order Placed', shortLabel: 'Order Placed', next: 'inProduction', nextLabel: 'Start Stitching (In Production)', bg: '#27AE60' },
  inProduction: { label: 'In Production', shortLabel: 'In Production', next: 'qualityCheck', nextLabel: 'Send to Quality Check', bg: '#4A90E2' },
  qualityCheck: { label: 'Quality Check', shortLabel: 'Quality Check', next: 'dispatched',   nextLabel: 'Dispatch Order', bg: '#9B51E0' },
  dispatched:   { label: 'Dispatched', shortLabel: 'Dispatched', next: 'delivered',    nextLabel: 'Mark Delivered', bg: '#27AE60' },
  delivered:    { label: 'Delivered', shortLabel: 'Delivered', next: null,           nextLabel: 'Completed', bg: '#4CAF78' }
};

// ── TOAST NOTIFICATION CARD BOX ──────────────────────────────
const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`admin-toast admin-toast--${toast.type || 'success'}`}>
      <div className="admin-toast__icon">
        {toast.type === 'error' ? <AlertTriangle size={18} /> : toast.type === 'info' ? <Sparkles size={18} /> : <CheckCircle2 size={18} />}
      </div>
      <div className="admin-toast__content">
        <p className="admin-toast__title">{toast.title || 'Studio Notice'}</p>
        <p className="admin-toast__msg">{toast.message}</p>
      </div>
      <button className="admin-toast__close" onClick={onClose} aria-label="Close notification">
        <X size={14} />
      </button>
    </div>
  );
};

// ── CONFIRMATION MODAL CARD BOX ──────────────────────────────
const ConfirmationModal = ({ modalConfig, onClose }) => {
  if (!modalConfig) return null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-card__header">
          <AlertCircle size={22} color="var(--color-gold)" />
          <h3>{modalConfig.title || 'Confirm Action'}</h3>
        </div>
        <p className="admin-modal-card__desc">{modalConfig.message}</p>
        <div className="admin-modal-card__actions">
          <button className="btn btn-outline" onClick={onClose} style={{ fontSize: '12px', padding: '6px 14px' }}>
            Cancel
          </button>
          <button
            className="btn btn-gold"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={() => {
              modalConfig.onConfirm();
              onClose();
            }}
          >
            {modalConfig.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SIDE SLIDING DRAWER MENU COMPONENT ───────────────────────
const AdminSideDrawer = ({ isOpen, onClose, activeTab, onSelectTab }) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'collectionOrders',
      title: 'Collection Orders',
      desc: 'Track & process storefront garment orders',
      icon: <Package size={18} color="var(--color-gold)" />,
    },
    {
      id: 'sareeOrders',
      title: 'Saree Transformation Orders',
      desc: 'Track custom saree transformation requests',
      icon: <Scissors size={18} color="var(--color-gold)" />,
    },
    {
      id: 'purchaseRequests',
      title: 'Purchase & Price Requests',
      desc: 'Review custom price offers & request submissions',
      icon: <DollarSign size={18} color="var(--color-gold)" />,
    },
    {
      id: 'products',
      title: 'Add & Edit Garment',
      desc: 'Manage products & customization options',
      icon: <PlusCircle size={18} color="var(--color-gold)" />,
    },
    {
      id: 'stock',
      title: 'Catalog & Stock',
      desc: 'Inventory control & store visibility',
      icon: <Layers size={18} color="var(--color-gold)" />,
    },
  ];

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onClose} />
      <aside className="admin-drawer-panel">
        <div className="admin-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="admin-nav__brand">DEVAKI</span>
            <span className="admin-nav__badge">Studio Admin</span>
          </div>
          <button className="admin-drawer-close" onClick={onClose} aria-label="Close Menu">
            <X size={18} />
          </button>
        </div>

        <div className="admin-drawer-body">
          <p className="admin-drawer-section-label">STUDIO NAVIGATION</p>
          <div className="admin-drawer-items">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`admin-drawer-item${activeTab === item.id ? ' admin-drawer-item--active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
              >
                <div className="admin-drawer-item__icon">{item.icon}</div>
                <div className="admin-drawer-item__content">
                  <p className="admin-drawer-item__title">{item.title}</p>
                  <p className="admin-drawer-item__desc">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="admin-drawer-item__arrow" />
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(197,169,107,0.15)' }}>
            <Link to="/" className="admin-drawer-store-btn" onClick={onClose}>
              <Store size={16} />
              <span>View Customer Storefront</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

const formatOrderDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch (e) {
    return dateStr;
  }
};

// ── 1. ORDERS TAB (LIVE WORKFLOW CONTROLLER) ────────────────
const OrdersTab = ({ triggerToast, askConfirm, filterCategory = 'collection' }) => {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('devaki_orders') || localStorage.getItem('devaki_user_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Live Firestore Orders Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAllOrders((liveOrders) => {
      if (liveOrders && Array.isArray(liveOrders)) {
        setOrders(liveOrders);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, newStatus) => {
    await updateOrderStatusInFirebase(id, newStatus);
  };

  const advanceStatus = (id, currentStatus) => {
    const nextStatus = STATUS_CONFIG[currentStatus]?.next;
    if (nextStatus) {
      updateStatus(id, nextStatus);
    }
  };

  const handlePrintSpecTicket = (order) => {
    const summary = order.selectionsSummary || order.items?.[0]?.selectionsSummary;
    const fitLabel = order.fitType === 'custom'
      ? 'Made-to-Measure Custom Fit'
      : `Standard Size ${order.size || 'M'}`;

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Spec Ticket - Order #DV${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #111; line-height: 1.5; }
            .header { border-bottom: 2px solid #C5A96B; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .brand { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0A2146; }
            .ticket-title { font-size: 14px; text-transform: uppercase; color: #C5A96B; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .box { background: #FDFBF7; border: 1px solid #E5D5B5; padding: 12px; border-radius: 4px; }
            .label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
            .val { font-size: 15px; font-weight: bold; color: #061628; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #C5A96B; padding: 10px; text-align: left; font-size: 14px; }
            th { background: #0A2146; color: #FFF3D1; text-transform: uppercase; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #DDD; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">DEVAKI COUTURE</div>
              <div class="ticket-title">Master Stitching Specification Ticket</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: bold;">Order #DV${order.id}</div>
              <div style="font-size: 12px;">Date: ${order.createdAt}</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="label">Customer Information</div>
              <div class="val">${order.customer?.name || 'Customer'}</div>
              <div>Phone: ${order.customer?.phone || 'N/A'}</div>
              <div>Email: ${order.customer?.email || 'N/A'}</div>
              <div>City: ${order.customer?.city || 'N/A'}</div>
            </div>
            <div class="box">
              <div class="label">Garment Specification</div>
              <div class="val">${order.productName || order.items?.[0]?.productName || 'Custom Couture Blouse'}</div>
              <div>Fabric: <strong>${order.fabric || order.items?.[0]?.fabric || 'Pure Silk'}</strong></div>
              <div>Fit Type: <strong>${fitLabel}</strong></div>
            </div>
          </div>

          <div class="box" style="margin-bottom: 24px;">
            <div class="label">Design Details &amp; Steps</div>
            ${summary ? Object.entries(summary).map(([k, v]) => `<div>• ${k}: <strong>${v}</strong></div>`).join('') : `
              <div>• Neckline: <strong>${order.neckline || 'Custom'}</strong></div>
              <div>• Sleeves: <strong>${order.sleeves || 'Custom'}</strong></div>
            `}
          </div>

          ${(order.sareeImage || order.sareeImage2) ? `
            <div class="box" style="margin-bottom: 24px; border-color: #C5A96B;">
              <div class="label" style="color: #C5A96B; font-weight: bold;">CUSTOMER UPLOADED MEMORABLE SAREE PHOTOS</div>
              <div style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap;">
                ${order.sareeImage ? `<img src="${order.sareeImage}" style="max-width: 200px; max-height: 200px; border-radius: 4px; border: 1px solid #C5A96B;" alt="Uploaded Saree Photo 1" />` : ''}
                ${order.sareeImage2 ? `<img src="${order.sareeImage2}" style="max-width: 200px; max-height: 200px; border-radius: 4px; border: 1px solid #C5A96B;" alt="Uploaded Saree Photo 2" />` : ''}
              </div>
            </div>
          ` : ''}

          ${order.measurements && order.fitType === 'custom' ? `
            <div class="label" style="font-size: 14px; margin-bottom: 8px;">Tailoring Measurements (12 Fields - Inches)</div>
            <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px;">
              ${Object.entries(order.measurements).map(([k, v]) => `
                <div class="box">
                  <div class="label" style="font-size: 10px;">${k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                  <div class="val" style="font-size: 14px;">${v ? `${v}"` : '—'}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            DEVAKI Studio Couture · Master Artisan Craftsmanship Spec · Confidential Internal Docket
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const deleteOrder = (id) => {
    askConfirm(
      'Remove Order',
      `Are you sure you want to remove customer order #${id}? This action cannot be undone.`,
      () => {
        saveOrders(orders.filter(o => o.id !== id));
        triggerToast(`Order #${id} removed from workflow`, 'info', 'Order Removed');
      }
    );
  };

  const categoryOrders = orders.filter(o => {
    if (filterCategory === 'saree') {
      return Boolean(o.isSareeTransformation || o.sareeImage);
    }
    return !o.isSareeTransformation && !o.sareeImage;
  });

  const filteredOrders = categoryOrders.filter(o => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      o.id.toLowerCase().includes(searchLower) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(searchLower)) ||
      (o.productName && o.productName.toLowerCase().includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h2 className="admin-section-title" style={{ marginBottom: '0' }}>
          {filterCategory === 'saree' ? 'Saree Transformation Orders & Workflow' : 'Collection Orders & Workflow'}
        </h2>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-card" style={{ marginBottom: 'var(--sp-6)', padding: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'whatsappSent', 'pending', 'inProduction', 'qualityCheck', 'dispatched', 'delivered'].map(st => (
              <button
                key={st}
                className={`admin-tab${filterStatus === st ? ' admin-tab--active' : ''}`}
                onClick={() => setFilterStatus(st)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                {st === 'all' ? 'All Orders' : (st === 'whatsappSent' ? 'WhatsApp Sent' : STATUS_CONFIG[st]?.label)} ({st === 'all' ? categoryOrders.length : categoryOrders.filter(o => o.status === st).length})
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(197,169,107,0.2)' }}>
            <Search size={14} color="var(--color-gold)" />
            <input
              type="text"
              placeholder="Search order or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', fontSize: '12px', width: '160px' }}
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <Package size={36} color="var(--color-gold-dim)" style={{ marginBottom: '8px' }} />
          <p style={{ color: 'var(--color-text-light)' }}>No orders match the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {filteredOrders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.whatsappSent;
            const nextAction = config.next;

            return (
              <div key={order.id} className="admin-order-card">
                <div className="admin-order-card__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="admin-order-card__id">#DV{order.id}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(250,247,242,0.5)', fontFamily: 'monospace' }}>{formatOrderDate(order.createdAt)}</span>
                    <span style={{ fontSize: '11px', color: '#FFF', fontWeight: 600 }}>{order.customer?.name || 'Customer'}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(197,169,107,0.12)', padding: '2px 5px', borderRadius: '4px', color: 'var(--color-gold-light)', border: '1px solid rgba(197,169,107,0.25)' }}>
                      {order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}
                    </span>
                    {(order.isSareeTransformation || order.sareeImage) && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(197,169,107,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-gold)', border: '1px solid var(--color-gold)' }}>
                        ✨ SAREE TRANSFORMATION
                      </span>
                    )}
                  </div>
                  <span className={`order-status-badge status-${order.status}`} style={{ background: config.bg, color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                    {config.shortLabel || config.label}
                  </span>
                </div>

                <div className="admin-order-card__body">
                  <div className="admin-spec-group">
                    <p className="admin-spec-label">Item &amp; Fabric</p>
                    <p className="admin-spec-value" style={{ fontWeight: 700 }}>{order.productName || order.items?.[0]?.productName}</p>
                    <p className="admin-spec-value" style={{ color: 'var(--color-gold-light)', fontSize: 'var(--text-xs)' }}>
                      Fabric: {order.fabric || order.items?.[0]?.fabric || 'Pure Silk'}
                    </p>
                    <p className="admin-spec-value" style={{ color: 'rgba(250,247,242,0.8)', fontSize: 'var(--text-xs)' }}>
                      Price: <strong>₹{(order.finalPrice || order.items?.[0]?.finalPrice || 2499).toLocaleString('en-IN')}</strong>
                    </p>
                  </div>

                  <div className="admin-spec-group">
                    <p className="admin-spec-label">Fit &amp; Design Specs</p>
                    {(() => {
                      const summary = order.selectionsSummary || order.items?.[0]?.selectionsSummary;
                      const isCustomFit = order.fitType === 'custom';
                      const fitLabel = isCustomFit
                        ? 'Made-to-Measure Custom Fit'
                        : `Standard Size ${order.size || 'M'}`;

                      if (summary && Object.keys(summary).length > 0) {
                        return (
                          <>
                            {Object.entries(summary).map(([stepKey, optVal]) => (
                              <p key={stepKey} className="admin-spec-value">
                                {stepKey}: <strong>{optVal}</strong>
                              </p>
                            ))}
                            <p className="admin-spec-value" style={{ color: isCustomFit ? 'var(--color-gold)' : 'var(--color-gold-light)', marginTop: '4px' }}>
                              Fit: <strong>{fitLabel}</strong>
                            </p>
                          </>
                        );
                      }

                      return (
                        <>
                          {order.neckline && <p className="admin-spec-value">Neckline: <strong>{order.neckline}</strong></p>}
                          {order.sleeves && <p className="admin-spec-value">Sleeves: <strong>{order.sleeves}</strong></p>}
                          <p className="admin-spec-value" style={{ color: isCustomFit ? 'var(--color-gold)' : 'var(--color-gold-light)' }}>
                            Fit: <strong>{fitLabel}</strong>
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  {order.measurements && order.fitType === 'custom' && (
                    <div className="admin-spec-group" style={{ background: 'rgba(197,169,107,0.05)', padding: '8px', borderRadius: '4px', border: '1px dashed rgba(197,169,107,0.2)' }}>
                      <p className="admin-spec-label" style={{ color: 'var(--color-gold)' }}>Tailoring Measurements</p>
                      <p className="admin-spec-value" style={{ fontSize: '11px' }}>Bust: <strong>{order.measurements.bust}"</strong> · Waist: <strong>{order.measurements.waist}"</strong></p>
                      <p className="admin-spec-value" style={{ fontSize: '11px' }}>Shoulder: <strong>{order.measurements.shoulder}"</strong> · Armhole: <strong>{order.measurements.armhole}"</strong></p>
                      <p className="admin-spec-value" style={{ fontSize: '11px' }}>Sleeve: <strong>{order.measurements.sleeveLength}"</strong> · Length: <strong>{order.measurements.blouseLength}"</strong></p>
                    </div>
                  )}

                  <div className="admin-spec-group">
                    <p className="admin-spec-label">Customer Contact</p>
                    <p className="admin-spec-value">{order.customer?.name}</p>
                    <p className="admin-spec-value" style={{ fontSize: '11px', color: 'var(--color-gold)' }}>{order.customer?.phone}</p>
                    <p className="admin-spec-value" style={{ fontSize: '11px', color: 'rgba(250,247,242,0.6)' }}>{order.customer?.city || order.customer?.email}</p>
                  </div>

                  {(order.sareeImage || order.sareeImage2) && (
                    <div style={{ gridColumn: '1 / -1', background: 'rgba(197,169,107,0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(197,169,107,0.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase', margin: 0 }}>
                        Customer Saree Photos Uploaded ({(order.sareeImage && order.sareeImage2) ? '2 Photos' : '1 Photo'})
                      </p>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {order.sareeImage && (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={order.sareeImage}
                              alt="Full Saree View"
                              style={{ width: '70px', height: '70px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-gold)', cursor: 'pointer' }}
                              onClick={() => setPreviewImage(order.sareeImage)}
                            />
                            <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#FFF', fontSize: '8px', padding: '1px 3px', borderRadius: '2px' }}>Photo 1</span>
                          </div>
                        )}
                        {order.sareeImage2 && (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={order.sareeImage2}
                              alt="Border / Pallu Detail"
                              style={{ width: '70px', height: '70px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-gold)', cursor: 'pointer' }}
                              onClick={() => setPreviewImage(order.sareeImage2)}
                            />
                            <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#FFF', fontSize: '8px', padding: '1px 3px', borderRadius: '2px' }}>Photo 2</span>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <p style={{ fontSize: '11px', color: 'var(--color-ivory)', margin: 0 }}>Check fabric layout &amp; border placement for <strong>{order.productName}</strong>.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Workflow Stepper Action Bar */}
                <div className="admin-order-card__actions">
                  <div className="admin-order-card__action-group">
                    <span style={{ fontSize: '11px', color: 'rgba(250,247,242,0.6)', fontWeight: 600 }}>Change Status:</span>
                    <select
                      className="status-select"
                      value={order.status || 'whatsappSent'}
                      onChange={e => updateStatus(order.id, e.target.value)}
                    >
                      <option value="whatsappSent">WhatsApp Message Sent (Payment Pending)</option>
                      <option value="pending">Order Placed (Payment Received)</option>
                      <option value="inProduction">In Production</option>
                      <option value="qualityCheck">Quality Check</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  <div className="admin-order-card__action-group">
                    <a
                      href={`https://wa.me/91${order.customer?.phone || order.customer?.whatsapp || ''}?text=${encodeURIComponent(
                        `Hello ${order.customer?.name || 'Valued Customer'}, we received your Saree Transformation request (#DV${order.id}) for ${order.productName}! Our master artisan checked your uploaded saree photo and confirmed it is customizable for this outfit design. Here are the payment details to confirm your order:`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-gold"
                      style={{ fontSize: '11px', padding: '6px 12px', gap: '4px', background: '#25D366', color: '#FFF', borderColor: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <MessageSquare size={13} /> WhatsApp Payment Details
                    </a>

                    <button
                      className="btn btn-outline"
                      onClick={() => handlePrintSpecTicket(order)}
                      style={{ fontSize: '11px', padding: '6px 12px', gap: '4px', color: 'var(--color-gold)', borderColor: 'rgba(197,169,107,0.3)' }}
                    >
                      <Printer size={12} /> Spec Ticket
                    </button>

                    {nextAction && (
                      <button
                        className="btn btn-gold"
                        onClick={() => advanceStatus(order.id, order.status)}
                        style={{ fontSize: '11px', padding: '6px 14px', gap: '6px' }}
                      >
                        {config.nextLabel} <ArrowRight size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => deleteOrder(order.id)}
                      style={{ background: 'transparent', border: 'none', color: '#E87A7A', cursor: 'pointer', padding: '4px' }}
                      title="Delete Order"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal for Admin */}
      {previewImage && (
        <div className="admin-modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '600px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-card__header">
              <h3>Uploaded Customer Saree Photo</h3>
              <button style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer' }} onClick={() => setPreviewImage(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <img src={previewImage} alt="Full Saree" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '6px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 2. PURCHASE REQUESTS & PRICE QUOTES TAB ──────────────────
const PurchaseRequestsTab = ({ triggerToast }) => {
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('devaki_purchase_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Live Firestore Purchase Requests Subscription
  useEffect(() => {
    const unsubscribe = subscribeToPurchaseRequests((liveRequests) => {
      if (liveRequests && Array.isArray(liveRequests)) {
        setRequests(liveRequests);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, newStatus, whatsapp, productName, offeredPrice) => {
    let target = requests.find(r => r.id === id);
    if (!target || !target.productName) {
      const saved = JSON.parse(localStorage.getItem('devaki_purchase_requests') || '[]');
      const foundSaved = saved.find(r => r.id === id);
      if (foundSaved) target = { ...foundSaved, ...target };
    }

    const updatedObj = {
      ...(target || {}),
      id,
      productName: target?.productName || productName || 'The Aarna Kurta',
      originalPrice: Number(target?.originalPrice || 2499),
      offeredPrice: Number(target?.offeredPrice || offeredPrice || 3100),
      customerName: target?.customerName || 'Beemer Sowmya',
      whatsapp: target?.whatsapp || whatsapp || '8977424608',
      status: newStatus
    };
    
    const updatedList = requests.map(r => r.id === id ? updatedObj : r);
    setRequests(updatedList);
    localStorage.setItem('devaki_purchase_requests', JSON.stringify(updatedList));

    try {
      await savePurchaseRequestToFirebase(updatedObj);
    } catch (e) {}

    if (triggerToast) {
      triggerToast(`Request ${id} status updated`, 'info');
    }

    if (newStatus === 'approved') {
      const targetPhone = updatedObj.whatsapp;
      const targetProduct = updatedObj.productName;
      const targetPrice = updatedObj.offeredPrice;
      const msg = encodeURIComponent(`Hello! Greetings from DEVAKI Brand Management. We are pleased to accept your purchase offer of ₹${targetPrice?.toLocaleString('en-IN')} for ${targetProduct}! Please reply to confirm your custom order.`);
      window.open(`https://wa.me/${targetPhone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    }
  };

  return (
    <div>
      <h2 className="admin-section-title" style={{ marginBottom: 'var(--sp-5)' }}>Custom Offer Quotes &amp; Purchase Requests</h2>

      {requests.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p style={{ color: 'rgba(250,247,242,0.6)' }}>No purchase quotes received yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {(() => {
            // Deduplicate and merge requests by ID to ensure NO fields are lost
            const uniqueRequestsMap = new Map();
            requests.forEach(r => {
              if (r && r.id) {
                const existing = uniqueRequestsMap.get(r.id);
                if (!existing) {
                  uniqueRequestsMap.set(r.id, r);
                } else {
                  uniqueRequestsMap.set(r.id, {
                    ...existing,
                    ...r,
                    productName: r.productName || existing.productName,
                    originalPrice: r.originalPrice ?? existing.originalPrice,
                    offeredPrice: r.offeredPrice ?? existing.offeredPrice,
                    customerName: r.customerName || existing.customerName,
                    whatsapp: r.whatsapp || existing.whatsapp,
                    requestType: r.requestType || existing.requestType,
                    fabric: r.fabric || existing.fabric,
                    neckline: r.neckline || existing.neckline,
                    sleeves: r.sleeves || existing.sleeves,
                    size: r.size || existing.size,
                    note: r.note || existing.note
                  });
                }
              }
            });
            const uniqueRequests = Array.from(uniqueRequestsMap.values());

            return uniqueRequests.map((req, idx) => {
              const productName = req.productName || 'The Aarna Kurta';
              const originalPrice = Number(req.originalPrice || req.fitBasePrice || 2499);
              const offeredPrice = Number(req.offeredPrice || (originalPrice + 601));
              const customerName = req.customerName || 'Beemer Sowmya';
              const whatsapp = req.whatsapp || '8977424608';

              const minThreshold = originalPrice + 500;
              const meetsThreshold = offeredPrice >= minThreshold;

              return (
                <div key={req.id || `req_${idx}`} className="admin-card">
                  {/* Header Row */}
                  <div className="admin-request-card__header">
                    <div className="admin-request-card__badges">
                      <span className="admin-request-card__id">{req.id}</span>
                      <span className="admin-request-card__type">
                        {req.requestType === 'customize' ? 'REQUEST TO CUSTOMIZE' : 'REQUEST TO PURCHASE'}
                      </span>
                      <span className={`admin-order-badge admin-order-badge--${req.status}`}>
                        {req.status === 'pending' ? (
                          <><Clock size={11} /> 24h Review Pending</>
                        ) : req.status === 'approved' ? (
                          <><CheckCircle2 size={11} /> Offer Accepted</>
                        ) : (
                          <><X size={11} /> Offer Declined</>
                        )}
                      </span>
                    </div>
                    <h3 className="admin-request-card__title">{productName}</h3>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'rgba(250,247,242,0.55)', fontWeight: 600 }}>Base Price</p>
                      <p style={{ fontSize: '14px', color: '#F9F5ED', fontWeight: 600 }}>₹{originalPrice.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'rgba(250,247,242,0.55)', fontWeight: 600 }}>Customer Quoted Price</p>
                      <p style={{ fontSize: '18px', color: 'var(--color-gold)', fontWeight: 700, fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                        ₹{offeredPrice.toLocaleString('en-IN')}
                      </p>
                      <p style={{ fontSize: '10px', color: meetsThreshold ? '#4CAF78' : '#E8A838', marginTop: '3px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {meetsThreshold ? <><CheckCircle2 size={11} /> Exceeds min (+₹500 threshold: ₹{minThreshold.toLocaleString('en-IN')})</> : <><AlertTriangle size={11} /> Below +₹500 rule (Min: ₹{minThreshold.toLocaleString('en-IN')})</>}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'rgba(250,247,242,0.55)', fontWeight: 600 }}>Customer Contact</p>
                      <p style={{ fontSize: '14px', color: '#F9F5ED', fontWeight: 600 }}>{customerName}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 700, fontFamily: 'monospace' }}>{whatsapp}</p>
                    </div>
                  </div>

                  {req.requestType === 'customize' && (
                    <div style={{ background: 'rgba(197, 169, 107, 0.08)', border: '1px solid rgba(197, 169, 107, 0.25)', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#F9F5ED' }}>
                      <p style={{ color: 'var(--color-gold)', fontWeight: 700, marginBottom: '4px' }}>Custom Specifications:</p>
                      <p>• <strong>Fabric:</strong> {req.fabric || 'Standard'}</p>
                      <p>• <strong>Neckline:</strong> {req.neckline || 'Standard'}</p>
                      <p>• <strong>Sleeves:</strong> {req.sleeves || 'Standard'}</p>
                      <p>• <strong>Size/Fit:</strong> {req.size || 'Standard'}</p>
                    </div>
                  )}

                  {req.note && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: 'rgba(250,247,242,0.85)' }}>
                      <strong style={{ color: 'var(--color-gold)' }}>Note:</strong> {req.note}
                    </div>
                  )}

                  {/* Single Row Action Buttons (Only when review is pending) */}
                  {req.status === 'pending' && (
                    <div className="admin-request-card__actions">
                      <button
                        type="button"
                        className="btn btn-outline admin-request-card__btn-decline"
                        onClick={() => updateStatus(req.id, 'rejected')}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="btn btn-gold admin-request-card__btn-accept"
                        onClick={() => updateStatus(req.id, 'approved', req.whatsapp, req.productName, req.offeredPrice)}
                      >
                        <Phone size={13} /> <span>Accept &amp; WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

// ── 3. BRIDESMAID VIP LEADS DIRECTORY ───────────────────────
const BridesmaidVipTab = () => {
  const [vipList, setVipList] = useState(() => {
    const saved = localStorage.getItem('devaki_bridesmaid_vip');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { phone: '+91 98765 43210', name: 'Rhea Sen', weddingDate: '2026-11-15', bridesmaids: 6 },
      { phone: '+91 85550 74387', name: 'Ananya Reddy', weddingDate: '2026-12-05', bridesmaids: 8 }
    ];
  });

  const sendLaunchWhatsApp = (phone, name, weddingDate, bridesmaids) => {
    const msg = encodeURIComponent(`Greetings ${name || 'Bride'}! DEVAKI Studio here regarding your Bridesmaid Couture VIP request for ${bridesmaids || 6} bridesmaids (Wedding Date: ${weddingDate || 'Upcoming'}). We are excited to share our exclusive trousseau catalog & bespoke consultation: ${window.location.origin}/collection`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div>
      <h2 className="admin-section-title" style={{ marginBottom: 'var(--sp-6)' }}>Bridesmaid VIP Early Access Leads</h2>

      <div className="analytics-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="analytics-stat">
          <p className="analytics-stat__label">Total VIP Bride Leads</p>
          <p className="analytics-stat__value" style={{ color: 'var(--color-gold)' }}>{vipList.length}</p>
          <p className="analytics-stat__sub">Registered WhatsApp numbers</p>
        </div>
      </div>

      <div className="admin-card">
        {vipList.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)', textAlign: 'center', padding: 'var(--sp-6)' }}>
            No VIP sign-ups registered yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bride Contact</th>
                  <th>Wedding Date</th>
                  <th>Bridesmaids</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vipList.map((lead, idx) => {
                  const phone = typeof lead === 'string' ? lead : lead.phone;
                  const name = typeof lead === 'object' ? lead.name : 'Bride Member';
                  const date = typeof lead === 'object' ? lead.weddingDate : '2026';
                  const count = typeof lead === 'object' ? lead.bridesmaids : 5;

                  return (
                    <tr key={idx}>
                      <td style={{ color: 'var(--color-gold-dim)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#F9F5ED' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-gold)', fontFamily: 'monospace' }}>{phone}</div>
                      </td>
                      <td style={{ color: 'rgba(250,247,242,0.8)' }}>{date}</td>
                      <td style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>{count} Bridesmaids</td>
                      <td>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                          background: 'rgba(76, 175, 120, 0.15)', color: '#4CAF78', border: '1px solid rgba(76,175,120,0.3)',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          <CheckCircle2 size={11} /> VIP Access Member
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-gold"
                          style={{ padding: '5px 12px', fontSize: '11px', gap: '6px' }}
                          onClick={() => sendLaunchWhatsApp(phone, name, date, count)}
                        >
                          <Phone size={12} /> Concierge on WhatsApp
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── 2. PRODUCTS TAB (ADD & EDIT GARMENTS) ────────────────────
const ProductsTab = ({ triggerToast, askConfirm, editingProduct, onClearEditing }) => {
  const [products, setProducts] = useState(() => getStoredProducts());
  const [editingId, setEditingId] = useState(null);

  // Live Firestore Products Subscription
  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && Array.isArray(liveProducts)) {
        setProducts(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const defaultCustomSteps = [
    {
      id: 'step_front_neck',
      name: 'Front Neck',
      options: [
        { id: 'front_round', name: 'Round Neck', label: 'Round Neck', image: null },
        { id: 'front_vneck', name: 'V-Neck', label: 'V-Neck', image: null }
      ]
    },
    {
      id: 'step_back_neck',
      name: 'Back Neck',
      options: [
        { id: 'back_square', name: 'Deep Square Back', label: 'Deep Square Back', image: null },
        { id: 'back_uneck', name: 'U-Neck Back', label: 'U-Neck Back', image: null }
      ]
    },
    {
      id: 'step_sleeves',
      name: 'Sleeves',
      options: [
        { id: 'elbow', name: 'Elbow Sleeves', label: 'Elbow Sleeves', image: null },
        { id: 'full', name: 'Full Sleeves', label: 'Full Sleeves', image: null }
      ]
    },
    {
      id: 'step_fabric',
      name: 'Fabric',
      options: [
        { id: 'cotton_silk', name: 'Pure Cotton Silk', label: 'Pure Cotton Silk', image: null },
        { id: 'zari_silk', name: 'Zari Weave Silk', label: 'Zari Weave Silk', image: null }
      ]
    }
  ];

  const initialFormState = {
    name: '',
    tagline: '',
    fabric: 'Pure Silk',
    basePrice: 2499,
    customStandardPrice: 2649,
    customMeasurementPrice: 2749,
    sareeTransformationPrice: 2849,
    availableStock: 8,
    description: '',
    fabricCare: 'Dry clean recommended. Store folded in muslin cloth.',
    shippingInfo: 'Standard orders ship in 5–7 working days. Custom measurement orders ship in 10–14 working days.',
    isActive: true,
  };

  const [form, setForm] = useState(initialFormState);
  const [images, setImages] = useState([null, null, null]);
  const [customSteps, setCustomSteps] = useState(defaultCustomSteps);

  const handleSingleImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 800, 0.7);
      setImages(prev => {
        const next = [...prev];
        next[index] = compressed;
        return next;
      });
    }
  };

  const handleAddStep = () => {
    const newStepId = `step_${Date.now()}`;
    setCustomSteps(prev => [
      ...prev,
      {
        id: newStepId,
        name: 'New Custom Step',
        options: [
          { id: `opt_${Date.now()}_1`, name: 'Option 1', label: 'Option 1', image: null },
          { id: `opt_${Date.now()}_2`, name: 'Option 2', label: 'Option 2', image: null }
        ]
      }
    ]);
  };

  const handleDeleteStep = (stepId) => {
    setCustomSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const handleAddOptionToStep = (stepId) => {
    setCustomSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        const newOptId = `opt_${Date.now()}`;
        return {
          ...s,
          options: [...s.options, { id: newOptId, name: `Option ${s.options.length + 1}`, label: `Option ${s.options.length + 1}`, image: null }]
        };
      }
      return s;
    }));
  };

  const handleDeleteOptionFromStep = (stepId, optId) => {
    setCustomSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          options: s.options.filter(o => o.id !== optId)
        };
      }
      return s;
    }));
  };

  const handleOptionImageUpload = async (e, stepId, optId) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 600, 0.7);
      setCustomSteps(prev => prev.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            options: s.options.map(o => o.id === optId ? { ...o, image: compressed } : o)
          };
        }
        return s;
      }));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (onClearEditing) onClearEditing();
    setForm(initialFormState);
    setImages([null, null, null]);
    setCustomSteps(defaultCustomSteps);
  };

  const handleEdit = (product) => {
    if (!product) return;
    setEditingId(product.id);
    const bPrice = product.basePrice || 2499;
    setForm({
      id: product.id,
      name: product.name || '',
      tagline: product.tagline || '',
      fabric: product.fabric || 'Pure Cotton Silk',
      basePrice: bPrice,
      customStandardPrice: product.customStandardPrice || (bPrice + 150),
      customMeasurementPrice: product.customMeasurementPrice || (bPrice + 250),
      sareeTransformationPrice: product.sareeTransformationPrice || (bPrice + 350),
      availableStock: product.stock?.available ?? 8,
      description: product.description || '',
      fabricCare: product.fabricCare || 'Dry clean recommended. Store folded in muslin cloth.',
      shippingInfo: product.shippingInfo || 'Standard orders ship in 5–7 working days. Custom measurement orders ship in 10–14 working days.',
      isActive: product.isActive !== false,
    });
    setImages(
      product.images
        ? [product.images[0] || null, product.images[1] || null, product.images[2] || null]
        : [null, null, null]
    );

    if (product.customizationSteps && Array.isArray(product.customizationSteps) && product.customizationSteps.length > 0) {
      const normalized = product.customizationSteps.map((step, sIdx) => ({
        id: step.id || `step_${Date.now()}_${sIdx}`,
        name: step.name || step.label || step.title || `Step ${sIdx + 1}`,
        options: Array.isArray(step.options)
          ? step.options.map((opt, oIdx) => ({
              id: opt.id || `opt_${Date.now()}_${sIdx}_${oIdx}`,
              name: opt.name || opt.label || opt.title || `Option ${oIdx + 1}`,
              label: opt.label || opt.name || opt.title || `Option ${oIdx + 1}`,
              image: opt.image || null
            }))
          : []
      }));
      setCustomSteps(normalized);
    } else {
      setCustomSteps(defaultCustomSteps);
    }

    setTimeout(() => {
      const el = document.getElementById('admin-product-form-card');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Sync editingProduct prop change into form state
  useEffect(() => {
    if (editingProduct) {
      handleEdit(editingProduct);
    }
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productPayload = {
      id: editingId || `BL-00${products.length + 1}`,
      name: form.name || 'DEVAKI Custom Couture Piece',
      tagline: form.tagline || 'Timeless silhouette. Thoughtfully made.',
      fabric: form.fabric || 'Pure Cotton Silk',
      basePrice: Number(form.basePrice) || 2499,
      customStandardPrice: Number(form.customStandardPrice) || 2649,
      customMeasurementPrice: Number(form.customMeasurementPrice) || 2749,
      sareeTransformationPrice: Number(form.sareeTransformationPrice) || 2849,
      stock: {
        available: Number(form.availableStock),
        reserved: 0,
        sold: 0,
      },
      images: images,
      customizationSteps: customSteps,
      description: form.description || 'A signature piece that begins with an elegant silhouette.',
      fabricCare: form.fabricCare,
      shippingInfo: form.shippingInfo,
      isActive: form.isActive,
    };

    await saveProductToFirebase(productPayload);
    handleCancelEdit();
    triggerToast(`Product "${productPayload.name}" saved with 3 thumbnails & custom dynamic steps!`, 'success', 'Product Saved');
  };

  const toggleProductActive = async (id) => {
    const target = products.find(p => p.id === id);
    if (target) {
      await saveProductToFirebase({ ...target, isActive: !target.isActive });
    }
  };

  const adjustStock = async (id, delta) => {
    const target = products.find(p => p.id === id);
    if (target) {
      const current = target.stock?.available ?? 0;
      const newAvailable = Math.max(0, current + delta);
      await saveProductToFirebase({
        ...target,
        stock: { ...target.stock, available: newAvailable }
      });
    }
  };

  const deleteProduct = (id) => {
    askConfirm(
      'Delete Product',
      `Are you sure you want to delete product #${id}? This will remove it from the catalog.`,
      async () => {
        await deleteProductFromFirebase(id);
        triggerToast(`Product #${id} removed from catalog`, 'info');
      }
    );
  };

  const resetToDefaultCatalog = () => {
    askConfirm(
      'Reset Default Catalog',
      'Are you sure you want to reset the store catalog to default DEVAKI mock products in Firestore?',
      async () => {
        for (const prod of MOCK_PRODUCTS) {
          await saveProductToFirebase(prod);
        }
        triggerToast('Store catalog successfully reset to default DEVAKI products!', 'success');
      }
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h2 className="admin-section-title" style={{ marginBottom: '0' }}>Garment Catalog &amp; Customization</h2>
        </div>
        <button className="btn btn-outline" onClick={resetToDefaultCatalog} style={{ fontSize: '11px', padding: '6px 12px', color: 'var(--color-gold)', borderColor: 'rgba(197,169,107,0.3)' }}>
          <RefreshCw size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Reset Catalog
        </button>
      </div>

      {/* Main Form Card */}
      <div id="admin-product-form-card" className="admin-card" style={{ marginBottom: 'var(--sp-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-gold-dim)', margin: 0 }}>
            {editingId ? `Editing Garment #${editingId}` : 'Add New Garment'}
          </p>
          {editingId && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancelEdit}
              style={{ fontSize: '11px', padding: '4px 10px', color: '#E87A7A', borderColor: 'rgba(232,122,122,0.4)' }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          {/* Basic Fields */}
          <div className="admin-form-row admin-form-row--2">
            <div>
              <label className="admin-label" htmlFor="p-name">Product Name</label>
              <input id="p-name" className="admin-input" required placeholder="DEVAKI Signature Blouse" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="admin-label" htmlFor="p-fabric">Primary Fabric</label>
              <input id="p-fabric" className="admin-input" required placeholder="Pure Silk" value={form.fabric} onChange={e => setForm(f => ({ ...f, fabric: e.target.value }))} />
            </div>
          </div>

          {/* 4 Price Tiers & Inventory Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-3)' }}>
            <div>
              <label className="admin-label" htmlFor="p-price">Buy Price (₹)</label>
              <input id="p-price" className="admin-input" type="number" required placeholder="2499" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} />
            </div>
            <div>
              <label className="admin-label" htmlFor="p-std-price">Standard Custom (₹)</label>
              <input id="p-std-price" className="admin-input" type="number" required placeholder="2649" value={form.customStandardPrice} onChange={e => setForm(f => ({ ...f, customStandardPrice: e.target.value }))} />
            </div>
            <div>
              <label className="admin-label" htmlFor="p-custom-price">Custom Fit (₹)</label>
              <input id="p-custom-price" className="admin-input" type="number" required placeholder="2749" value={form.customMeasurementPrice} onChange={e => setForm(f => ({ ...f, customMeasurementPrice: e.target.value }))} />
            </div>
            <div>
              <label className="admin-label" htmlFor="p-saree-price" style={{ color: 'var(--color-gold)' }}>Saree Custom (₹)</label>
              <input id="p-saree-price" className="admin-input" type="number" required placeholder="2849" value={form.sareeTransformationPrice} onChange={e => setForm(f => ({ ...f, sareeTransformationPrice: e.target.value }))} style={{ borderColor: 'var(--color-gold)' }} />
            </div>
            <div>
              <label className="admin-label" htmlFor="p-stock">Stock Qty</label>
              <input id="p-stock" className="admin-input" type="number" required placeholder="8" value={form.availableStock} onChange={e => setForm(f => ({ ...f, availableStock: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="admin-label" htmlFor="p-tagline">Tagline</label>
            <input id="p-tagline" className="admin-input" placeholder="Timeless silhouette. Thoughtfully made." value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
          </div>

          <div>
            <label className="admin-label" htmlFor="p-desc">Garment Description</label>
            <textarea id="p-desc" className="admin-textarea" placeholder="Crafted in pure silk with intricate zari detailing..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* 1. THREE PRODUCT GALLERY THUMBNAILS */}
          <div style={{ background: 'rgba(6,22,40,0.5)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(197,169,107,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
              <label className="admin-label" style={{ color: 'var(--color-gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} /> Product Photos (3 Slots)
              </label>
              <span style={{ fontSize: '10px', color: '#4CAF78', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Photo 1 is main cover photo
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-3)' }}>
              {['Photo 1 (Front)', 'Photo 2 (Back)', 'Photo 3 (Detail)'].map((label, idx) => (
                <div key={idx}>
                  <p style={{ fontSize: '11px', color: 'rgba(250,247,242,0.7)', marginBottom: '4px' }}>{label}</p>
                  <label className="upload-zone" style={{ padding: 'var(--sp-3)' }}>
                    <input type="file" accept="image/*" onChange={e => handleSingleImageUpload(e, idx)} />
                    {images[idx] ? (
                      <img src={images[idx]} alt={label} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <>
                        <Upload size={16} color="var(--color-gold)" />
                        <span style={{ fontSize: '10px', color: 'rgba(250,247,242,0.5)' }}>Upload Photo {idx + 1}</span>
                      </>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 2. DYNAMIC CUSTOMIZATION STEPS MANAGER */}
          <div style={{ background: 'rgba(6,22,40,0.5)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(197,169,107,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label className="admin-label" style={{ color: 'var(--color-gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={16} /> Customization Steps &amp; Options
                </label>
              </div>

              <button
                type="button"
                className="btn btn-gold"
                onClick={handleAddStep}
                style={{ fontSize: '11px', padding: '5px 12px', gap: '4px' }}
              >
                + Add Step
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {customSteps.map((stepItem, stepIdx) => (
                <div key={stepItem.id} style={{ background: 'rgba(255,255,255,0.03)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(197,169,107,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 150px', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-gold)', background: 'rgba(197,169,107,0.15)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                        Step {stepIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={stepItem.name}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomSteps(prev => prev.map(s => s.id === stepItem.id ? { ...s, name: val } : s));
                        }}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-gold)', color: '#FFF', fontWeight: 700, fontSize: '13px', padding: '2px 4px', outline: 'none', width: '100%', minWidth: 0 }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleAddOptionToStep(stepItem.id)}
                        style={{ fontSize: '10px', padding: '4px 8px', color: 'var(--color-gold)', whiteSpace: 'nowrap' }}
                      >
                        + Add Option
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(stepItem.id)}
                        style={{ background: 'transparent', border: 'none', color: '#E87A7A', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
                        title="Delete Step"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Options Grid for this step */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-3)' }}>
                    {stepItem.options.map(opt => {
                      const optLabel = opt.name || opt.label || '';
                      return (
                        <div key={opt.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '4px' }}>
                            <input
                              type="text"
                              value={optLabel}
                              onChange={e => {
                                const val = e.target.value;
                                setCustomSteps(prev => prev.map(s => {
                                  if (s.id === stepItem.id) {
                                    return { ...s, options: s.options.map(o => o.id === opt.id ? { ...o, name: val, label: val } : o) };
                                  }
                                  return s;
                                }));
                              }}
                              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(197,169,107,0.25)', color: 'var(--color-gold-light)', fontSize: '11px', fontWeight: 600, width: '100%', minWidth: 0, outline: 'none' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteOptionFromStep(stepItem.id, opt.id)}
                              style={{ background: 'transparent', border: 'none', color: '#E87A7A', cursor: 'pointer', padding: '0 4px', fontSize: '14px', flexShrink: 0 }}
                              title="Remove Option"
                            >
                              ×
                            </button>
                          </div>

                          <label className="upload-zone" style={{ padding: '4px' }}>
                            <input type="file" accept="image/*" onChange={e => handleOptionImageUpload(e, stepItem.id, opt.id)} />
                            {opt.image ? (
                              <div style={{ position: 'relative', width: '100%', height: 75 }}>
                                <img src={opt.image} alt={optLabel} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', fontSize: '9px', color: 'rgba(250,247,242,0.4)', padding: '10px' }}>
                                <Upload size={12} /> Upload Photo
                              </div>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="p-active"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
            />
            <label htmlFor="p-active" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ivory)', fontWeight: 600, cursor: 'pointer' }}>
              Show on Customer Store (Active Product)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
            <button type="submit" className="btn btn-gold" style={{ padding: '10px 24px', fontSize: '12px' }}>
              {editingId ? 'Save Changes' : 'Create Product'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={handleCancelEdit} style={{ padding: '10px 18px', fontSize: '12px', color: '#FFF' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 3. STOCK TAB (CATALOG & STOCK CONTROL) ───────────────────
const StockTab = ({ triggerToast, askConfirm, onEditProduct }) => {
  const [products, setProducts] = useState(() => getStoredProducts());

  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && Array.isArray(liveProducts)) {
        setProducts(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleProductActive = async (id) => {
    const target = products.find(p => p.id === id);
    if (target) {
      await saveProductToFirebase({ ...target, isActive: !target.isActive });
      triggerToast(`Product #${id} visibility updated`, 'info');
    }
  };

  const deleteProduct = (id) => {
    askConfirm(
      'Delete Product',
      `Are you sure you want to delete product #${id}? This will remove it from the catalog.`,
      async () => {
        await deleteProductFromFirebase(id);
        triggerToast(`Product #${id} removed from catalog`, 'info');
      }
    );
  };

  const adjustStock = async (id, delta) => {
    const target = products.find(p => p.id === id);
    if (target) {
      const current = target.stock?.available ?? 0;
      const newAvailable = Math.max(0, current + delta);
      await saveProductToFirebase({
        ...target,
        stock: { ...target.stock, available: newAvailable }
      });
    }
  };

  return (
    <div>
      <h2 className="admin-section-title" style={{ marginBottom: 'var(--sp-5)' }}>Catalog &amp; Stock</h2>

      <div className="admin-card">
        {products.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)', textAlign: 'center', padding: 'var(--sp-6)' }}>
            No products added to catalog yet. Create a product in the Add &amp; Manage Garments tab first.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Img</th>
                  <th>Garment</th>
                  <th>ID</th>
                  <th>Fabric</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Visibility</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const avail = p.stock?.available ?? 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ width: 44, height: 55, borderRadius: '4px', overflow: 'hidden', background: '#061628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={18} color="rgba(255,255,255,0.3)" />}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFF' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(250,247,242,0.5)' }}>{p.tagline}</div>
                      </td>
                      <td style={{ color: 'var(--color-gold-dim)', fontFamily: 'monospace', fontWeight: 700 }}>{p.id}</td>
                      <td style={{ color: 'var(--color-gold-light)' }}>{p.fabric}</td>
                      <td style={{ fontWeight: 700 }}>₹{p.basePrice?.toLocaleString('en-IN')}</td>
                      <td>
                        <div className="stock-control" title={avail === 0 ? '0 Stock (Request Mode on store)' : `${avail} units in stock`}>
                          <button className="stock-control__btn" onClick={() => adjustStock(p.id, -1)}>−</button>
                          <span className="stock-control__value" style={{ fontSize: '12px', minWidth: '22px', textAlign: 'center', color: avail === 0 ? 'var(--color-gold)' : '#FFF' }}>
                            {avail}
                          </span>
                          <button className="stock-control__btn" onClick={() => adjustStock(p.id, +1)}>+</button>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleProductActive(p.id)}
                          title={p.isActive !== false ? "Visible on Store (Click to Hide)" : "Hidden (Click to Show)"}
                          style={{
                            background: p.isActive !== false ? 'rgba(76, 175, 120, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: p.isActive !== false ? '#4CAF78' : 'rgba(250,247,242,0.4)',
                            border: '1px solid ' + (p.isActive !== false ? 'rgba(76,175,120,0.3)' : 'rgba(255,255,255,0.15)'),
                            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          {p.isActive !== false ? (
                            <>
                              <Eye size={13} />
                              <span className="admin-visibility-label">Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} />
                              <span className="admin-visibility-label">Hidden</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => onEditProduct(p)}
                            style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--color-gold)', borderColor: 'rgba(197,169,107,0.3)' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            style={{ background: 'transparent', border: 'none', color: '#E87A7A', cursor: 'pointer', padding: '4px' }}
                            title="Delete product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MAIN ADMIN PANEL CONTAINER ───────────────────────────────
const TABS = [
  { id: 'collectionOrders', label: 'Collection Orders',        shortLabel: 'Collection',   icon: <Package size={15} /> },
  { id: 'sareeOrders',      label: 'Saree Transformation',    shortLabel: 'Saree Trans.', icon: <Scissors size={15} /> },
  { id: 'purchaseRequests', label: 'Price & Purchase Requests',shortLabel: 'Price Quotes', icon: <DollarSign size={15} /> },
  { id: 'products',         label: 'Add & Manage Garments',   shortLabel: 'Add Item',     icon: <PlusCircle size={15} /> },
  { id: 'stock',            label: 'Catalog & Stock',         shortLabel: 'Stock',        icon: <Layers size={15} /> },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('collectionOrders');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const triggerToast = (message, type = 'success', title = 'Studio Notice') => {
    setToast({ message, type, title, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const askConfirm = (title, message, onConfirm) => {
    setConfirmModal({ title, message, onConfirm });
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setActiveTab('products');
  };

  return (
    <div className="admin">
      {/* User-friendly Card Notification Toast */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* User-friendly Confirmation Modal */}
      <ConfirmationModal modalConfig={confirmModal} onClose={() => setConfirmModal(null)} />

      {/* Side Open/Close Navigation Drawer */}
      <AdminSideDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
      />

      <nav className="admin-nav">
        <div className="admin-nav__top-row">
          <div className="admin-nav__brand-group">
            <button
              className="admin-menu-toggle"
              onClick={() => setIsSidebarOpen(o => !o)}
              title="Toggle Navigation Menu"
              aria-label="Toggle Side Navigation Menu"
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="admin-nav__brand">DEVAKI</span>
            <span className="admin-nav__badge">Studio</span>
          </div>
          <Link to="/" className="admin-nav__store-link">
            <Store size={14} />
            <span>Store</span>
          </Link>
        </div>

        <div className="admin-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              className={`admin-tab${activeTab === tab.id ? ' admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-tab__icon">{tab.icon}</span>
              <span className="admin-tab__label">{tab.label}</span>
              <span className="admin-tab__short-label">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="admin-body">
        {activeTab === 'collectionOrders' && (
          <OrdersTab triggerToast={triggerToast} askConfirm={askConfirm} filterCategory="collection" />
        )}
        {activeTab === 'sareeOrders' && (
          <OrdersTab triggerToast={triggerToast} askConfirm={askConfirm} filterCategory="saree" />
        )}
        {activeTab === 'purchaseRequests' && (
          <PurchaseRequestsTab triggerToast={triggerToast} />
        )}
        {activeTab === 'products' && (
          <ProductsTab
            triggerToast={triggerToast}
            askConfirm={askConfirm}
            editingProduct={editingProduct}
            onClearEditing={() => setEditingProduct(null)}
          />
        )}
        {activeTab === 'stock' && (
          <StockTab
            triggerToast={triggerToast}
            askConfirm={askConfirm}
            onEditProduct={handleEditProduct}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
