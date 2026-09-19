// src/components/SizeChartModal.jsx
import { X } from 'lucide-react';
import { SIZE_CHART } from '../data/products';
import './SizeChartModal.css';

const SizeChartModal = ({ onClose }) => (
  <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="size-chart-modal" role="dialog" aria-modal="true" aria-label="Size chart">
      <div className="add-cart-modal__handle" />
      <div className="size-chart-modal__header">
        <h2 className="size-chart-modal__title">Size Chart</h2>
        <button className="add-cart-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <p className="size-chart-modal__hint">All measurements are in inches. For best fit, measure loosely over your innerwear.</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="size-chart-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Bust</th>
              <th>Waist</th>
              <th>Shoulder</th>
              <th>Armhole</th>
              <th>Length</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map(row => (
              <tr key={row.size}>
                <td>{row.size}</td>
                <td>{row.bust}"</td>
                <td>{row.waist}"</td>
                <td>{row.shoulder}"</td>
                <td>{row.armhole}"</td>
                <td>{row.length}"</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-outline" style={{ width: '100%' }} onClick={onClose}>Close</button>
    </div>
  </div>
);

export default SizeChartModal;
