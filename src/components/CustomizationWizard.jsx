// src/components/CustomizationWizard.jsx
import { useState } from 'react';
import { ChevronLeft, X, Check, Eye, Ruler, AlertTriangle, CheckCircle2, Upload, Camera, Sparkles } from 'lucide-react';
import {
  FABRIC_OPTIONS, SLEEVE_OPTIONS, FRONT_NECK_OPTIONS, BACK_NECK_OPTIONS,
  STANDARD_SIZES, MEASUREMENT_FIELDS, CUSTOM_STANDARD_PRICE, CUSTOM_MEASUREMENT_PRICE
} from '../data/products';
import { useCart } from '../context/CartContext';
import { compressImage } from '../utils/imageCompressor';
import HowToMeasureModal from './HowToMeasureModal';
import SizeChartModal from './SizeChartModal';
import './CustomizationWizard.css';

const ImagePlaceholder = ({ label }) => (
  <div className="img-placeholder" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', background: 'rgba(197,169,107,0.06)' }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-dim)" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <span style={{ fontSize: '10px', color: 'rgba(250,247,242,0.6)', marginTop: '6px', textAlign: 'center' }}>
      {label || 'Option Style'}
    </span>
  </div>
);

const MEASUREMENT_GROUPS = [
  {
    title: '1. Length & Structure',
    fields: [
      { id: 'dressLength',   label: 'Dress Length',     placeholder: '42' },
      { id: 'yokeLength',    label: 'Yoke Length',      placeholder: '14' },
      { id: 'shoulder',      label: 'Shoulder',         placeholder: '14.5' },
    ]
  },
  {
    title: '2. Chest & Torso',
    fields: [
      { id: 'upperChest',    label: 'Upper Chest',      placeholder: '34' },
      { id: 'chest',         label: 'Chest / Bust',     placeholder: '36' },
      { id: 'waist',         label: 'Waist',            placeholder: '30' },
    ]
  },
  {
    title: '3. Necklines & Depth',
    fields: [
      { id: 'frontNeckDeep', label: 'Front Neck Deep',  placeholder: '6.5' },
      { id: 'backNeckDeep',  label: 'Back Neck Deep',   placeholder: '8.5' },
    ]
  },
  {
    title: '4. Sleeves & Arms',
    fields: [
      { id: 'armhole',       label: 'Arm Hole',         placeholder: '14' },
      { id: 'sleeveLength',  label: 'Sleeve Length',    placeholder: '10' },
      { id: 'sleeveLoose',   label: 'Sleeve Loose',     placeholder: '11' },
      { id: 'biceps',        label: 'Biceps',           placeholder: '12' },
    ]
  }
];

const CustomizationWizard = ({ product, onRequestSubmit, onClose, isSareeTransformation = false }) => {
  // Build default 4 customization steps if product doesn't have custom ones saved
  const defaultSteps = [
    {
      id: 'step_front_neck',
      name: 'Front Neck',
      options: FRONT_NECK_OPTIONS || [
        { id: 'front_round', name: 'Round Neck', image: null },
        { id: 'front_vneck', name: 'V-Neck', image: null }
      ]
    },
    {
      id: 'step_back_neck',
      name: 'Back Neck',
      options: BACK_NECK_OPTIONS || [
        { id: 'back_square', name: 'Deep Square Back', image: null },
        { id: 'back_uneck', name: 'U-Neck Back', image: null }
      ]
    },
    {
      id: 'step_sleeves',
      name: 'Sleeves',
      options: (SLEEVE_OPTIONS || []).map(s => ({ id: s.id, name: s.label, image: s.image }))
    },
    {
      id: 'step_fabric',
      name: 'Fabric',
      options: (FABRIC_OPTIONS || []).map(f => ({ id: f.id, name: f.label, image: f.image }))
    }
  ];

  const customizationSteps = (product?.customizationSteps && product.customizationSteps.length > 0)
    ? product.customizationSteps
    : defaultSteps;

  // Active steps titles for wizard header
  const activeStepNames = [
    ...customizationSteps.map(s => s.name),
    'Fit',
    ...(onRequestSubmit ? [] : ['Review'])
  ];

  // AUTO-SELECT THE FIRST OPTION IN EACH STEP BY DEFAULT!
  const [selectedChoices, setSelectedChoices] = useState(() => {
    const initial = {};
    customizationSteps.forEach(s => {
      if (s.options && s.options.length > 0) {
        initial[s.id] = s.options[0].id || s.options[0].name;
      }
    });
    return initial;
  });

  const [step, setStep] = useState(0);
  const [fitType, setFitType] = useState('standard');
  const [standardSize, setStandardSize] = useState('M');
  const [measurements, setMeasurements] = useState({});
  const filledCount = Object.values(measurements).filter(v => v && String(v).trim() !== '').length;
  const [showMeasureGuide, setShowMeasureGuide] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [sareeImage1, setSareeImage1] = useState(null);
  const [sareeImage2, setSareeImage2] = useState(null);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const { addToCart } = useCart();

  const standardFitPrice = isSareeTransformation
    ? (Number(product?.sareeTransformationPrice) || (product?.basePrice ? Number(product.basePrice) + 350 : 2849))
    : (Number(product?.customStandardPrice) || (product?.basePrice ? Number(product.basePrice) + 150 : CUSTOM_STANDARD_PRICE));

  const customFitPrice = isSareeTransformation
    ? (Number(product?.sareeTransformationPrice ? Number(product.sareeTransformationPrice) + 100 : null) || (product?.basePrice ? Number(product.basePrice) + 450 : 2949))
    : (Number(product?.customMeasurementPrice) || (product?.basePrice ? Number(product.basePrice) + 250 : CUSTOM_MEASUREMENT_PRICE));

  const totalPrice = fitType === 'custom' ? customFitPrice : standardFitPrice;
  const fitBasePrice = totalPrice;
  const minQuotePrice = fitBasePrice + 500;

  const isCustomStep = step < customizationSteps.length;
  const isFitStep = step === customizationSteps.length;
  const isReviewStep = !onRequestSubmit && step === customizationSteps.length + 1;

  const canContinue = () => {
    if (isCustomStep) {
      const currentStep = customizationSteps[step];
      if (isSareeTransformation && (currentStep.name.toLowerCase() === 'fabric' || currentStep.id === 'step_fabric')) {
        return !!(sareeImage1 || sareeImage2);
      }
      return !!selectedChoices[currentStep.id];
    }
    if (isFitStep) {
      if (!fitType) return false;
      if (fitType === 'standard') return !!standardSize;
      if (fitType === 'custom') return MEASUREMENT_FIELDS.every(f => measurements[f.id]?.trim());
    }
    return true;
  };

  const handleContinue = () => {
    const totalStepCount = activeStepNames.length;
    if (step < totalStepCount - 1) {
      setStep(s => s + 1);
    } else {
      handleFinalAction();
    }
  };

  const handleBack = () => {
    if (step === 0) onClose();
    else setStep(s => s - 1);
  };

  const handleFinalAction = () => {
    const selectionsSummary = {};
    customizationSteps.forEach(s => {
      const selId = selectedChoices[s.id];
      const opt = s.options?.find(o => o.id === selId || o.name === selId) || s.options?.[0];
      selectionsSummary[s.name] = opt?.name || opt?.label || 'Default';
    });

    const frontNeck = selectionsSummary['Front Neck'] || selectionsSummary[customizationSteps[0]?.name] || 'Round Neck';
    const backNeck = selectionsSummary['Back Neck'] || 'Deep Square Back';
    const sleeves = selectionsSummary['Sleeves'] || 'Elbow Sleeves';
    const fabric = isSareeTransformation ? 'Memorable Saree (Customer Uploaded)' : (selectionsSummary['Fabric'] || product.fabric || 'Pure Cotton Silk');

    if (onRequestSubmit) {
      onRequestSubmit({
        fabric,
        sareeImage: sareeImage1 || sareeImage2 || null,
        sareeImage2: sareeImage2 || null,
        sareeImages: [sareeImage1, sareeImage2].filter(Boolean),
        isSareeTransformation: !!isSareeTransformation,
        neckline: frontNeck,
        backNeck,
        sleeves,
        fitType,
        size: fitType === 'standard' ? standardSize : 'Custom Measurements',
        measurements: fitType === 'custom' ? measurements : null,
        selectionsSummary,
        fitBasePrice,
        minQuotePrice,
      });
    } else {
      addToCart({
        productId: product.id,
        productName: product.name,
        type: 'custom',
        fabric,
        neckline: frontNeck,
        backNeck,
        sleeves,
        fitType,
        size: fitType === 'standard' ? standardSize : null,
        measurements: fitType === 'custom' ? measurements : null,
        selectionsSummary,
        basePrice: product.basePrice || 2499,
        customMeasurementFee: fitType === 'custom' ? 250 : 150,
        finalPrice: totalPrice,
        image: product.images?.[0] || null,
      });
      onClose();
    }
  };

  if (showMeasureGuide) return <HowToMeasureModal onClose={() => setShowMeasureGuide(false)} />;
  if (showSizeChart) return <SizeChartModal onClose={() => setShowSizeChart(false)} />;

  const progressPct = ((step + 1) / activeStepNames.length) * 100;
  const currentCustomStep = isCustomStep ? customizationSteps[step] : null;

  return (
    <div className="wizard-overlay">
      {/* Header */}
      <header className="wizard-header">
        <button className="wizard-header__back" onClick={handleBack} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <div className="wizard-header__info">
          <p className="wizard-header__title">Customize Yours</p>
          <p className="wizard-header__step">Step {step + 1} of {activeStepNames.length} — {activeStepNames[step]}</p>
        </div>
        <button className="wizard-header__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="wizard-progress">
        <div className="wizard-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Body */}
      <div className="wizard-body">

        {/* ── Dynamic Custom Steps (e.g. Front Neck, Back Neck, Sleeves, Fabric) ── */}
        {isCustomStep && isSareeTransformation && (currentCustomStep.name.toLowerCase() === 'fabric' || currentCustomStep.id === 'step_fabric') ? (
          <div className="saree-upload-step">
            <h2 className="wizard-step-title">Upload Your Saree Photos</h2>
            <p className="wizard-step-hint">
              You can upload up to 2 photos (Photo 1: Full Saree View, Photo 2: Border or Pallu Detail). Our master artisans will inspect fabric layout &amp; suitability.
            </p>

            <div className="saree-dual-upload-grid">
              {/* Slot 1: Full Saree View */}
              <div className="saree-upload-card">
                <p className="saree-slot-label">Photo 1: Full Saree View *</p>
                {sareeImage1 ? (
                  <div className="saree-upload-preview">
                    <img src={sareeImage1} alt="Saree Full View" className="saree-upload-preview__img" />
                    <div className="saree-upload-preview__actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        onClick={() => setPreviewItem({ title: 'Photo 1: Full Saree View', image: sareeImage1 })}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <label className="btn btn-outline saree-upload-reselect-btn">
                        <Upload size={12} /> Change
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingSlot(1);
                              const compressed = await compressImage(file, 900, 0.75);
                              setSareeImage1(compressed);
                              setUploadingSlot(null);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '10px', padding: '4px 8px', color: '#E87A7A', borderColor: 'rgba(232,122,122,0.4)' }}
                        onClick={() => setSareeImage1(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="saree-upload-dropzone">
                    {uploadingSlot === 1 ? (
                      <div className="saree-upload-dropzone__loading">
                        <Sparkles size={24} className="spin-gold" />
                        <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-gold)' }}>Compressing photo 1...</p>
                      </div>
                    ) : (
                      <>
                        <div className="saree-upload-dropzone__icon">
                          <Upload size={24} color="var(--color-gold)" />
                        </div>
                        <h4 className="saree-upload-dropzone__title">Upload Photo 1</h4>
                        <p className="saree-upload-dropzone__subtitle">Full saree layout view</p>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingSlot(1);
                              const compressed = await compressImage(file, 900, 0.75);
                              setSareeImage1(compressed);
                              setUploadingSlot(null);
                            }
                          }}
                        />
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Slot 2: Pallu / Border Detail View */}
              <div className="saree-upload-card">
                <p className="saree-slot-label">Photo 2: Border / Pallu Detail (Optional)</p>
                {sareeImage2 ? (
                  <div className="saree-upload-preview">
                    <img src={sareeImage2} alt="Border / Pallu Detail" className="saree-upload-preview__img" />
                    <div className="saree-upload-preview__actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        onClick={() => setPreviewItem({ title: 'Photo 2: Border / Pallu Detail', image: sareeImage2 })}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <label className="btn btn-outline saree-upload-reselect-btn">
                        <Upload size={12} /> Change
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingSlot(2);
                              const compressed = await compressImage(file, 900, 0.75);
                              setSareeImage2(compressed);
                              setUploadingSlot(null);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '10px', padding: '4px 8px', color: '#E87A7A', borderColor: 'rgba(232,122,122,0.4)' }}
                        onClick={() => setSareeImage2(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="saree-upload-dropzone">
                    {uploadingSlot === 2 ? (
                      <div className="saree-upload-dropzone__loading">
                        <Sparkles size={24} className="spin-gold" />
                        <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-gold)' }}>Compressing photo 2...</p>
                      </div>
                    ) : (
                      <>
                        <div className="saree-upload-dropzone__icon">
                          <Upload size={24} color="var(--color-gold)" />
                        </div>
                        <h4 className="saree-upload-dropzone__title">Upload Photo 2</h4>
                        <p className="saree-upload-dropzone__subtitle">Border or Pallu close-up detail</p>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingSlot(2);
                              const compressed = await compressImage(file, 900, 0.75);
                              setSareeImage2(compressed);
                              setUploadingSlot(null);
                            }
                          }}
                        />
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>
        ) : isCustomStep && currentCustomStep && (
          <>
            <h2 className="wizard-step-title">Choose Your {currentCustomStep.name}</h2>
            <p className="wizard-step-hint">First option is auto-selected by default. Tap to change selection.</p>
            <div className="wizard-options-grid">
              {currentCustomStep.options.map((option, optIdx) => {
                const optId = option.id || option.name;
                const isSelected = selectedChoices[currentCustomStep.id] === optId;
                const optLabel = option.name || option.label;

                return (
                  <div
                    key={optId || optIdx}
                    id={`opt-${currentCustomStep.id}-${optIdx}`}
                    className={`wizard-option-card${isSelected ? ' wizard-option-card--active' : ''}`}
                    onClick={() => setSelectedChoices(prev => ({ ...prev, [currentCustomStep.id]: optId }))}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedChoices(prev => ({ ...prev, [currentCustomStep.id]: optId }))}
                  >
                    <div className="wizard-option-card__image">
                      {optIdx === 0 && (
                        <span className="wizard-option-card__original-badge">Auto Selected</span>
                      )}
                      {option.image ? (
                        <img src={option.image} alt={optLabel} />
                      ) : (
                        <ImagePlaceholder label={optLabel} />
                      )}
                      {option.image && (
                        <button
                          type="button"
                          className="wizard-option-card__view-btn"
                          title={`View ${optLabel}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem({ title: optLabel, image: option.image });
                          }}
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      <div className="wizard-option-card__check"><Check size={12} /></div>
                    </div>
                    <div className="wizard-option-card__info">
                      <p className="wizard-option-card__name">{optLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Fit Step ── */}
        {isFitStep && (
          <>
            <h2 className="wizard-step-title">
              {onRequestSubmit ? 'Choose Your Custom Fit & Tailoring' : 'Choose Your Fit'}
            </h2>
            <p className="wizard-step-hint" style={{ marginBottom: 'var(--sp-4)' }}>
              {onRequestSubmit
                ? 'Specify size or exact measurements for this custom piece.'
                : 'Select standard size or enter custom measurements.'}
            </p>

            <div className="fit-options">
              {/* Standard Size */}
              <div
                id="fit-standard"
                className={`fit-option${fitType === 'standard' ? ' fit-option--active' : ''}`}
                onClick={() => setFitType('standard')}
                role="radio" aria-checked={fitType === 'standard'} tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setFitType('standard')}
              >
                <div className="fit-option__radio">
                  <div className="fit-option__radio-dot" />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="fit-option__title">Standard Size Reference</p>
                  <p className="fit-option__desc">Customized silhouette with standard size chart.</p>
                  {!onRequestSubmit && (
                    <p className="fit-option__price">₹{standardFitPrice.toLocaleString('en-IN')}</p>
                  )}
                  {fitType === 'standard' && (
                    <div className="fit-size-grid">
                      <p className="add-cart-modal__label" style={{ marginBottom: 'var(--sp-2)' }}>
                        Select size
                        <span className="add-cart-modal__size-link" onClick={(e) => { e.stopPropagation(); setShowSizeChart(true); }}>
                          View chart
                        </span>
                      </p>
                      <div className="size-grid">
                        {STANDARD_SIZES.map(sz => (
                          <button
                            key={sz}
                            id={`wizard-size-${sz}`}
                            className={`size-btn${standardSize === sz ? ' size-btn--active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setStandardSize(sz); }}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Measurements */}
              <div
                id="fit-custom"
                className={`fit-option${fitType === 'custom' ? ' fit-option--active' : ''}`}
                onClick={() => setFitType('custom')}
                role="radio" aria-checked={fitType === 'custom'} tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setFitType('custom')}
              >
                <div className="fit-option__radio">
                  <div className="fit-option__radio-dot" />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="fit-option__title">Made-to-Measure Custom Fit</p>
                  <p className="fit-option__desc">Tailored precisely to your 12 custom tailoring measurements.</p>
                  {!onRequestSubmit && (
                    <p className="fit-option__price">₹{customFitPrice.toLocaleString('en-IN')}</p>
                  )}
                  {fitType === 'custom' && (
                    <div className="measure-container" onClick={e => e.stopPropagation()}>
                      <div className="measure-header-bar">
                        <div>
                          <span className="measure-header-title">Tailoring Measurements</span>
                          <span className="measure-header-badge">{filledCount} of 12 entered</span>
                        </div>
                        <button type="button" className="measure-guide-btn" onClick={() => setShowMeasureGuide(true)}>
                          <Ruler size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Guide
                        </button>
                      </div>

                      {filledCount < 12 ? (
                        <div style={{
                          background: 'rgba(232, 168, 56, 0.15)',
                          border: '1px solid rgba(232, 168, 56, 0.5)',
                          color: '#FFF3D1',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <AlertTriangle size={14} style={{ color: '#E8A838', flexShrink: 0 }} />
                          <span>
                            <strong>All 12 measurements are mandatory</strong> for Made-to-Measure Custom Fit ({12 - filledCount} remaining to unlock Continue).
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(76, 175, 120, 0.15)',
                          border: '1px solid rgba(76, 175, 120, 0.5)',
                          color: '#D1F9E2',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <CheckCircle2 size={14} style={{ color: '#4CAF50', flexShrink: 0 }} />
                          <span>
                            <strong>All 12 measurements entered!</strong> Ready to proceed.
                          </span>
                        </div>
                      )}

                      <div className="measure-groups">
                        {MEASUREMENT_GROUPS.map(group => (
                          <div key={group.title} className="measure-group-box">
                            <div className="measure-group-title">{group.title}</div>
                            <div className="measure-group-grid">
                              {group.fields.map(field => (
                                <div key={field.id} className="measure-input-card">
                                  <label className="measure-input-label" htmlFor={`m-${field.id}`}>
                                    {field.label}
                                  </label>
                                  <div className="measure-input-wrapper">
                                    <input
                                      id={`m-${field.id}`}
                                      className="measure-input-field"
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      placeholder={field.placeholder}
                                      value={measurements[field.id] || ''}
                                      onChange={e => setMeasurements(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    />
                                    <span className="measure-input-suffix">in</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Review Step ── */}
        {isReviewStep && (
          <>
            <h2 className="wizard-step-title">Your Design</h2>
            <p className="wizard-step-hint" style={{ marginBottom: 'var(--sp-5)' }}>
              Review your customized choices before adding to cart.
            </p>
            <div className="review-card">
              <div className="review-card__header">YOUR DEVAKI PIECE</div>

              {/* Outfit Preview Image */}
              <div className="review-card__outfit-preview">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="review-card__outfit-img" />
                ) : (
                  <div className="review-card__outfit-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <span>Outfit Design Preview</span>
                  </div>
                )}
                <div className="review-card__outfit-badge">
                  <span>{product.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-gold)', display: 'block', marginTop: '2px' }}>
                    Customized Silhouette
                  </span>
                </div>
              </div>

              <div className="review-rows">
                <div className="review-row">
                  <span className="review-row__key">Base Design</span>
                  <span className="review-row__value">{product.name}</span>
                </div>

                {customizationSteps.map(s => {
                  const selId = selectedChoices[s.id];
                  const opt = s.options?.find(o => o.id === selId || o.name === selId) || s.options?.[0];
                  return (
                    <div key={s.id} className="review-row">
                      <span className="review-row__key">{s.name}</span>
                      <span className="review-row__value"><CheckCircle2 size={13} style={{ color: 'var(--color-gold)', marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />{opt?.name || opt?.label || 'Default'}</span>
                    </div>
                  );
                })}

                <div className="review-row">
                  <span className="review-row__key">Fit</span>
                  <span className="review-row__value">
                    <CheckCircle2 size={13} style={{ color: 'var(--color-gold)', marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />{fitType === 'standard' ? `Standard Size — ${standardSize}` : 'Custom Measurements'}
                  </span>
                </div>
              </div>

              <div className="review-card__total">
                <span className="review-card__total-label">TOTAL</span>
                <span className="review-card__total-price">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--sp-5)' }}>
              <button
                className="btn btn-gold"
                style={{ width: '100%', padding: 'var(--sp-4)', fontSize: 'var(--text-base)' }}
                onClick={handleFinalAction}
              >
                {onRequestSubmit ? 'Request to Customize & Name Price →' : 'Add to Cart'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sticky Footer */}
      {(step < activeStepNames.length - 1 || onRequestSubmit) && (
        <div className="wizard-footer">
          <div className="wizard-footer__price">
            <span className="wizard-footer__price-amount">
              ₹{(onRequestSubmit ? fitBasePrice : totalPrice).toLocaleString('en-IN')}
            </span>
            <span className="wizard-footer__price-label">
              Your price to buy
            </span>
          </div>
          <button
            id={`wizard-continue-step-${step}`}
            className="btn btn-primary wizard-footer__btn"
            disabled={!canContinue()}
            onClick={handleContinue}
          >
            {onRequestSubmit && step === activeStepNames.length - 1 ? 'Proceed to Name Price →' : 'Continue →'}
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewItem && (
        <div className="img-preview-modal" onClick={() => setPreviewItem(null)}>
          <div className="img-preview-modal__content" onClick={e => e.stopPropagation()}>
            <div className="img-preview-modal__header">
              <span className="img-preview-modal__title">{previewItem.title}</span>
              <button className="img-preview-modal__close" onClick={() => setPreviewItem(null)} aria-label="Close preview">
                <X size={20} />
              </button>
            </div>
            <div className="img-preview-modal__body">
              {previewItem.image ? (
                <img src={previewItem.image} alt={previewItem.title} />
              ) : (
                <div className="img-preview-modal__placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <p style={{ marginTop: '12px', fontSize: '14px', color: '#D9C08C' }}>{previewItem.title} Detail Photo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizationWizard;
