// src/components/HowToMeasureModal.jsx
import { X, Sparkles } from 'lucide-react';
import { MEASUREMENT_FIELDS } from '../data/products';
import './HowToMeasureModal.css';

const HowToMeasureModal = ({ onClose }) => (
  <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="measure-modal" role="dialog" aria-modal="true" aria-label="How to measure">
      <div className="add-cart-modal__handle" />
      <div className="size-chart-modal__header">
        <h2 className="measure-modal__title">How to Measure</h2>
        <button className="add-cart-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <p className="size-chart-modal__hint">
        Use a soft measuring tape. Stand straight and measure snugly — not tight, not loose.
        Ask someone to help for more accurate readings.
      </p>

      <div className="measure-steps">
        {MEASUREMENT_FIELDS.map((field, i) => (
          <div key={field.id} className="measure-step">
            <div className="measure-step__number">{i + 1}</div>
            <div>
              <p className="measure-step__label">{field.label} <span style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>({field.unit})</span></p>
              <p className="measure-step__tip">{field.tip}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="measure-modal__note">
        <Sparkles size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', color: 'var(--color-gold)' }} /> <strong>Tip:</strong> For blouse measurements, always measure over your saree blouse or innerwear — not directly over the skin.
      </div>

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Got it</button>
    </div>
  </div>
);

export default HowToMeasureModal;
