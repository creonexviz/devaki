// src/components/BridesmaidTeaserModal.jsx
import { useState } from 'react';
import { X, Sparkles, Heart, CheckCircle2, Bell } from 'lucide-react';
import logoImg from '../assets/logo.png';
import './BridesmaidTeaserModal.css';

const BridesmaidTeaserModal = ({ onClose }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!whatsapp) return;
    const existing = JSON.parse(localStorage.getItem('devaki_bridesmaid_vip') || '[]');
    localStorage.setItem('devaki_bridesmaid_vip', JSON.stringify([whatsapp, ...existing]));
    setIsSubscribed(true);
  };

  return (
    <div className="bridesmaid-modal-overlay" onClick={onClose}>
      <div className="bridesmaid-modal-content" onClick={e => e.stopPropagation()}>
        <button className="bridesmaid-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="bridesmaid-modal-header">
          <span className="bridesmaid-badge"><Sparkles size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> COMING SOON</span>
          <img src={logoImg} alt="DEVAKI Logo" className="bridesmaid-logo" />
          <h2 className="bridesmaid-title">DEVAKI Bridesmaid Couture</h2>
          <p className="bridesmaid-subtitle">
            Coordinated luxury outfits &amp; bespoke trousseau designs tailored for your special wedding squad.
          </p>
        </div>

        {isSubscribed ? (
          <div className="bridesmaid-success">
            <CheckCircle2 size={44} color="var(--color-gold)" />
            <h3>You're on the VIP Access List!</h3>
            <p>We will notify you directly on WhatsApp <strong>({whatsapp})</strong> the moment our Bridesmaid Collection drops.</p>
            <button className="btn btn-gold" onClick={onClose} style={{ width: '100%', marginTop: '16px' }}>
              Back to Collection
            </button>
          </div>
        ) : (
          <form className="bridesmaid-form" onSubmit={handleSubmit}>
            <div className="bridesmaid-features">
              <div className="bridesmaid-feature">
                <Sparkles size={16} color="var(--color-gold)" />
                <span>Group Color Coordination &amp; Custom Fabrics</span>
              </div>
              <div className="bridesmaid-feature">
                <Heart size={16} color="var(--color-gold)" />
                <span>Made-to-Measure Fits for All Bridesmaids</span>
              </div>
              <div className="bridesmaid-feature">
                <Bell size={16} color="var(--color-gold)" />
                <span>Exclusive Pre-Launch VIP Access &amp; Ateliers</span>
              </div>
            </div>

            <div className="bridesmaid-input-wrapper">
              <label htmlFor="bmWhatsapp" className="bridesmaid-input-label">
                Get WhatsApp Early Access &amp; Launch Notification
              </label>
              <div className="bridesmaid-input-box">
                <input
                  id="bmWhatsapp"
                  type="tel"
                  required
                  placeholder="Enter WhatsApp Number (+91...)"
                  className="bridesmaid-input"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
                <button type="submit" className="btn btn-gold bridesmaid-submit-btn">
                  Notify Me
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BridesmaidTeaserModal;
