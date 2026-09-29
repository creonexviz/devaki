// src/components/StickyMobileCTA.jsx
import './StickyMobileCTA.css';

const StickyMobileCTA = ({ price, sublabel = 'Standard price', label, onAction, onSecondary, secondaryLabel, isCrossed = false }) => (
  <div className="sticky-cta">
    <div className="sticky-cta__price">
      <span className={`sticky-cta__amount ${isCrossed ? 'sticky-cta__amount--crossed' : ''}`}>
        {price}
      </span>
      <span className={`sticky-cta__label ${isCrossed ? 'sticky-cta__label--gold' : ''}`}>
        {sublabel}
      </span>
    </div>
    <div className="sticky-cta__buttons">
      {onSecondary && (
        <button className="btn btn-outline sticky-cta__btn-secondary" onClick={onSecondary}>
          {secondaryLabel || 'Customize'}
        </button>
      )}
      <button className="btn btn-primary sticky-cta__btn-primary" onClick={onAction}>
        {label}
      </button>
    </div>
  </div>
);

export default StickyMobileCTA;
