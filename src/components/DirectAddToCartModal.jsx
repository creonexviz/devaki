// src/components/DirectAddToCartModal.jsx
import { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { STANDARD_SIZES, FABRIC_OPTIONS } from '../data/products';
import { useCart } from '../context/CartContext';
import SizeChartModal from './SizeChartModal';
import './DirectAddToCartModal.css';

const DirectAddToCartModal = ({ product, onClose }) => {
  // 1. Extract dynamic fabric step options if created in Admin Panel
  const fabricStep = product?.customizationSteps?.find(
    s => s.name?.toLowerCase().includes('fabric')
  );

  let availableFabrics = [];

  if (fabricStep && fabricStep.options && fabricStep.options.length > 0) {
    // Show strictly ONLY the fabrics added in the customization step!
    availableFabrics = fabricStep.options.map((opt, idx) => ({
      id: opt.id || `fab_${idx}`,
      label: opt.name || opt.label,
      image: opt.image || null,
      desc: `${opt.name || opt.label} fabric weave.`
    }));
  } else if (product?.fabric?.trim()) {
    availableFabrics = [{
      id: `primary_${product.fabric.replace(/\s+/g, '_').toLowerCase()}`,
      label: product.fabric.trim(),
      image: product.images?.[0] || null,
      desc: `${product.fabric} primary fabric.`
    }];
  } else {
    availableFabrics = FABRIC_OPTIONS;
  }

  const defaultFabricId = availableFabrics[0]?.id || 'cotton_silk';

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedFabric, setSelectedFabric] = useState(defaultFabricId);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [previewFabric, setPreviewFabric] = useState(null);
  const { addToCart } = useCart();

  const activeFabricObj = availableFabrics.find(f => f.id === selectedFabric) || availableFabrics[0];

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart({
      productId: product.id,
      productName: product.name,
      type: 'standard',
      size: selectedSize,
      fabric: activeFabricObj?.label || product.fabric || 'Pure Cotton Silk',
      basePrice: product.basePrice,
      customMeasurementFee: 0,
      finalPrice: product.basePrice,
      image: product.images?.[0] || null,
    });
    onClose();
  };

  if (showSizeChart) return <SizeChartModal onClose={() => setShowSizeChart(false)} />;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="add-cart-modal" role="dialog" aria-modal="true" aria-label="Add to cart">
        <div className="add-cart-modal__handle" />

        {/* Header */}
        <div className="add-cart-modal__header">
          <h2 className="add-cart-modal__title">Select Size &amp; Fabric</h2>
          <button className="add-cart-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Product Card */}
        <div className="add-cart-modal__product">
          <div className="add-cart-modal__product-img">
            {product.images?.[0]
              ? <img src={product.images[0]} alt={product.name} />
              : <div className="img-placeholder" style={{ height: '100%' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <p className="add-cart-modal__product-name">{product.name}</p>
            <p className="add-cart-modal__product-price">₹{product.basePrice.toLocaleString('en-IN')}</p>
          </div>
          <button
            type="button"
            className="add-cart-modal__view-btn"
            title="View product photo"
            onClick={() => setPreviewFabric({
              label: product.fabric || 'DEVAKI Silk Fabric',
              fabric: product.fabric || 'Pure Cotton Silk',
              image: product.images?.[0] || null,
              desc: product.description || 'Crafted with premium silk texture and comfortable drape.'
            })}
          >
            <Eye size={14} /> View
          </button>
        </div>

        {/* Choose Fabric Section (Vertical Rectangles with Horizontal Scroll) */}
        <div>
          <p className="add-cart-modal__label">
            Choose Fabric
            <span className="add-cart-modal__fabric-name">
              {activeFabricObj?.label}
            </span>
          </p>

          <div className="fabric-scroll-row">
            {availableFabrics.map(option => (
              <div
                key={option.id}
                id={`fabric-rect-${option.id}`}
                className={`fabric-rect-card${selectedFabric === option.id ? ' fabric-rect-card--active' : ''}`}
                onClick={() => setSelectedFabric(option.id)}
                role="radio"
                aria-checked={selectedFabric === option.id}
                tabIndex={0}
              >
                <div className="fabric-rect-card__image-box">
                  {option.image ? (
                    <img src={option.image} alt={option.label} />
                  ) : product.images?.[0] ? (
                    <img src={product.images[0]} alt={option.label} style={{ opacity: 0.8 }} />
                  ) : (
                    <div className="img-placeholder" style={{ height: '100%' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    className="fabric-rect-card__view-btn"
                    title={`View ${option.label} fabric image`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFabric(option);
                    }}
                  >
                    <Eye size={13} />
                  </button>
                </div>
                <p className="fabric-rect-card__title">{option.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Choose Size Section */}
        <div>
          <p className="add-cart-modal__label">
            Choose size
            <span className="add-cart-modal__size-link" onClick={() => setShowSizeChart(true)}>
              View size chart
            </span>
          </p>
          <div className="size-grid">
            {STANDARD_SIZES.map(size => (
              <button
                key={size}
                id={`size-${size}`}
                className={`size-btn${selectedSize === size ? ' size-btn--active' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="add-cart-modal__footer">
          <div className="add-cart-modal__total">
            <span className="add-cart-modal__total-label">Total</span>
            <span className="add-cart-modal__total-price">₹{product.basePrice.toLocaleString('en-IN')}</span>
          </div>
          <button
            id="modal-add-to-cart-btn"
            className="btn btn-primary add-cart-modal__btn"
            disabled={!selectedSize}
            onClick={handleAddToCart}
          >
            {selectedSize ? `Add to Cart — Size ${selectedSize}` : 'Select a size'}
          </button>
        </div>
      </div>

      {/* Fabric Detail Modal */}
      {previewFabric && (
        <div className="fabric-preview-modal" onClick={() => setPreviewFabric(null)}>
          <div className="fabric-preview-modal__content" onClick={e => e.stopPropagation()}>
            <div className="fabric-preview-modal__header">
              <span className="fabric-preview-modal__title">{previewFabric.label}</span>
              <button className="fabric-preview-modal__close" onClick={() => setPreviewFabric(null)} aria-label="Close fabric preview">
                <X size={18} />
              </button>
            </div>
            <div className="fabric-preview-modal__body">
              {previewFabric.image ? (
                <img src={previewFabric.image} alt={previewFabric.label} />
              ) : product.images?.[0] ? (
                <img src={product.images[0]} alt={previewFabric.label} />
              ) : (
                <div className="img-placeholder" style={{ height: 180 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#C5A96B' }}>{previewFabric.label}</p>
                </div>
              )}
              <p className="fabric-preview-modal__desc">{previewFabric.desc || `${previewFabric.label} fabric texture.`}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectAddToCartModal;
