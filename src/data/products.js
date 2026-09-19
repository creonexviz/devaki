// src/data/products.js
// ─────────────────────────────────────────────────────────────
// Mock product catalog — replace image URLs with your own
// uploaded images via the Admin Panel (Firebase Storage URLs).
// ─────────────────────────────────────────────────────────────

export const FRONT_NECK_OPTIONS = [
  { id: 'round', label: 'Round Neck', image: null },
  { id: 'vneck', label: 'V-Neck', image: null },
];

export const BACK_NECK_OPTIONS = [
  { id: 'back_square', label: 'Deep Square Back', image: null },
  { id: 'back_uneck', label: 'U-Neck Back', image: null },
];

export const NECKLINE_OPTIONS = FRONT_NECK_OPTIONS;

export const SLEEVE_OPTIONS = [
  { id: 'elbow', label: 'Elbow Sleeves', image: null },
  { id: 'full', label: 'Full Sleeves', image: null },
];

export const FABRIC_OPTIONS = [
  { id: 'cotton-silk', label: 'Pure Cotton Silk', fabric: 'Pure Cotton Silk', image: null, desc: 'Soft lustre, breathable drape & comfortable touch' },
  { id: 'zari-silk', label: 'Zari Weave Silk', fabric: 'Zari Silk', image: null, desc: 'Woven with gold zari thread for subtle sparkle' },
];

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SIZE_CHART = [
  { size: 'XS',  bust: 32, waist: 26, shoulder: 13.0, armhole: 13.5, length: 14 },
  { size: 'S',   bust: 34, waist: 28, shoulder: 13.5, armhole: 14.0, length: 14 },
  { size: 'M',   bust: 36, waist: 30, shoulder: 14.0, armhole: 14.5, length: 14.5 },
  { size: 'L',   bust: 38, waist: 32, shoulder: 14.5, armhole: 15.0, length: 15 },
  { size: 'XL',  bust: 40, waist: 34, shoulder: 15.0, armhole: 15.5, length: 15 },
  { size: 'XXL', bust: 42, waist: 36, shoulder: 15.5, armhole: 16.0, length: 15.5 },
];

export const MEASUREMENT_FIELDS = [
  { id: 'dressLength',   label: 'Dress Length',     unit: 'inches', tip: 'Measure from shoulder down to desired dress length.' },
  { id: 'shoulder',      label: 'Shoulder',         unit: 'inches', tip: 'Measure from shoulder tip to shoulder tip across back.' },
  { id: 'armhole',       label: 'Arm Hole',         unit: 'inches', tip: 'Measure around the armhole seam opening.' },
  { id: 'frontNeckDeep', label: 'Front Neck Deep',  unit: 'inches', tip: 'Measure vertically from shoulder line to front neck depth.' },
  { id: 'backNeckDeep',  label: 'Back Neck Deep',   unit: 'inches', tip: 'Measure vertically from shoulder line to back neck depth.' },
  { id: 'yokeLength',    label: 'Yoke Length',      unit: 'inches', tip: 'Measure from top shoulder to bottom of yoke seam.' },
  { id: 'sleeveLength',  label: 'Sleeve Length',    unit: 'inches', tip: 'Measure from shoulder seam to sleeve hem.' },
  { id: 'sleeveLoose',   label: 'Sleeve Loose',     unit: 'inches', tip: 'Measure circumference around sleeve hem opening.' },
  { id: 'biceps',        label: 'Biceps',           unit: 'inches', tip: 'Measure around fullest part of your upper arm.' },
  { id: 'upperChest',    label: 'Upper Chest',      unit: 'inches', tip: 'Measure around upper chest above bust level.' },
  { id: 'chest',         label: 'Chest',            unit: 'inches', tip: 'Measure around fullest part of chest / bust.' },
  { id: 'waist',         label: 'Waist',            unit: 'inches', tip: 'Measure around your natural narrow waistline.' },
];

// Live real products catalog — create & manage real products via Admin Studio
export const MOCK_PRODUCTS = [];

export const getStockLabel = (stock) => {
  const available = typeof stock === 'object' ? stock?.available : Number(stock);
  const count = typeof available === 'number' && !isNaN(available) ? Math.max(0, available) : 0;

  if (count === 0) return { label: 'Request to Purchase', level: 'sold-out' };
  if (count === 1) return { label: 'Only 1 piece remaining', level: 'critical' };
  if (count <= 3)  return { label: `Only ${count} pieces remaining`, level: 'low' };
  return { label: `${count} pieces available`, level: 'normal' };
};

// Helper to identify explicit hardcoded mock products
export const isMockProduct = (p) => {
  if (!p) return false;
  return Boolean(p.isMock || p.isHardcodedMock);
};

export const getStoredProducts = () => {
  const saved = localStorage.getItem('devaki_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out any residual mock products from browser storage
        const realProducts = parsed
          .filter(p => !isMockProduct(p))
          .map(p => {
            let avail = p.stock && typeof p.stock.available !== 'undefined' ? Number(p.stock.available) : 0;
            avail = isNaN(avail) ? 0 : Math.max(0, avail);

            const baseP = typeof p.basePrice !== 'undefined' ? Number(p.basePrice) : 2499;
            return {
              ...p,
              basePrice: baseP,
              customStandardPrice: typeof p.customStandardPrice !== 'undefined' ? Number(p.customStandardPrice) : baseP + 150,
              customMeasurementPrice: typeof p.customMeasurementPrice !== 'undefined' ? Number(p.customMeasurementPrice) : baseP + 250,
              stock: {
                available: avail,
                reserved: Number(p.stock?.reserved ?? 0),
                sold: Number(p.stock?.sold ?? 0),
              },
              images: Array.isArray(p.images) ? p.images : [null, null, null],
              isActive: p.isActive !== false,
            };
          });

        localStorage.setItem('devaki_products', JSON.stringify(realProducts));
        return realProducts;
      }
    } catch (e) {}
  }
  localStorage.setItem('devaki_products', JSON.stringify([]));
  return [];
};

export const BASE_PRICE = 2499;
export const CUSTOM_STANDARD_PRICE = 2649;     // Custom neckline/sleeves + standard size
export const CUSTOM_MEASUREMENT_PRICE = 2749;  // Custom neckline/sleeves + custom measurements
export const CUSTOM_TOTAL = CUSTOM_MEASUREMENT_PRICE;
