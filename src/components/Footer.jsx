// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, AlertCircle, Globe, Download } from 'lucide-react';
import logoImg from '../assets/logo.png';
import './Footer.css';

// SVG Instagram Icon
const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* Column 1: Brand Info */}
        <div className="footer__brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoImg} alt="DEVAKI Logo" className="footer__logo-icon" />
            <span className="footer__logo">DEVAKI</span>
          </Link>
          <span className="footer__tagline">Online Store Only · From Telangana</span>
          <p className="footer__desc">
            DEVAKI — Online Store Only, From Telangana.
            Thoughtfully crafted limited edition Indian couture blouses.
            Buy as designed or personalize your neckline, sleeves, and custom measurements.
          </p>
        </div>

        {/* Column 2: Contact Details */}
        <div>
          <h3 className="footer__heading">Contact Us</h3>
          <ul className="footer__list">
            <li>
              <a href="mailto:creonex.viz@gmail.com" className="footer__link">
                <Mail size={16} />
                <span>creonex.viz@gmail.com</span>
              </a>
            </li>
            <li>
              <a href="https://wa.me/918555074387" target="_blank" rel="noopener noreferrer" className="footer__link">
                <Phone size={16} />
                <span>+91 85550 74387</span>
              </a>
            </li>
            <li>
              <span className="footer__link" style={{ cursor: 'default' }}>
                <MapPin size={16} />
                <span>DEVAKI — Online Store Only, From Telangana</span>
              </span>
            </li>
          </ul>
        </div>

        {/* Column 3: Social Media & Assets */}
        <div>
          <h3 className="footer__heading">Support &amp; Assets</h3>
          <ul className="footer__list">
            <li>
              <a href="https://wa.me/918555074387" target="_blank" rel="noopener noreferrer" className="footer__link">
                <MessageCircle size={16} />
                <span>WhatsApp Support (+91 8555074387)</span>
              </a>
            </li>
            <li>
              <Link to="/track-order" className="footer__link" style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                <Phone size={15} />
                <span>Track Your Order (by Phone)</span>
              </Link>
            </li>
            <li>
              <Link to="/collection" className="footer__link">
                <Globe size={16} />
                <span>Browse Full Collection →</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Policy & Notice */}
        <div>
          <h3 className="footer__heading">Store Policy</h3>
          <div className="footer__policy-card">
            <div className="footer__policy-title">
              <AlertCircle size={15} color="var(--color-gold)" />
              <span>Return &amp; Exchange Policy</span>
            </div>
            <p className="footer__policy-desc">
              <strong>No Return or Exchange.</strong>
            </p>
            <p className="footer__policy-desc">
              <span className="footer__policy-highlight">Exchange is applicable ONLY for damaged fabric</span> upon opening your order parcel.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} DEVAKI. All rights reserved.</p>
        <p>DEVAKI — Online Store Only, From Telangana · Limited Pieces, Thoughtfully Made</p>
      </div>
    </footer>
  );
};

export default Footer;
