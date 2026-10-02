// src/services/firebaseService.js
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, set as setRtdb, remove as removeRtdb } from 'firebase/database';
import { db, auth, rtdb } from '../firebase';
import { getStoredProducts, isMockProduct } from '../data/products';

// Helper to sanitize items for localStorage so base64 strings don't bloat local cache
const sanitizeForLocalStorage = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLocalStorage(item));
  }
  if (typeof data === 'object') {
    const copy = { ...data };
    if (Array.isArray(copy.images)) {
      copy.images = copy.images.map(img => (typeof img === 'string' && img.length > 20000 ? null : img));
    }
    if (Array.isArray(copy.customizationSteps)) {
      copy.customizationSteps = copy.customizationSteps.map(step => ({
        ...step,
        options: Array.isArray(step?.options)
          ? step.options.map(opt => ({
              ...opt,
              image: typeof opt?.image === 'string' && opt.image.length > 20000 ? null : opt?.image
            }))
          : []
      }));
    }
    return copy;
  }
  return data;
};

// Helper to safely write to localStorage without crashing on QuotaExceededError
const safeSetLocalStorage = (key, data) => {
  try {
    const lightweight = sanitizeForLocalStorage(data);
    localStorage.setItem(key, JSON.stringify(lightweight));
  } catch (e) {
    try {
      localStorage.removeItem('devaki_demo_orders');
      localStorage.removeItem('devaki_mock_data');
      const lightweight = sanitizeForLocalStorage(data);
      localStorage.setItem(key, JSON.stringify(lightweight));
    } catch (err) {}
  }
};

// ── PRODUCTS SYNC ─────────────────────────────────────────────

/**
 * Subscribe to real-time product updates from Firestore.
 */
export const subscribeToProducts = (callback) => {
  // 1. Instant 0ms emission from local cache
  try {
    const cached = getStoredProducts();
    if (cached && cached.length > 0 && callback) {
      callback(cached);
    }
  } catch (e) {}

  // 2. Real-time background snapshot listener
  try {
    const productsRef = collection(db, 'products');

    return onSnapshot(productsRef, (snapshot) => {
      if (snapshot.empty) {
        safeSetLocalStorage('devaki_products', []);
        window.dispatchEvent(new Event('devaki_products_updated'));
        if (callback) callback([]);
        return;
      }

      const products = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(p => !isMockProduct(p));

      safeSetLocalStorage('devaki_products', products);
      window.dispatchEvent(new Event('devaki_products_updated'));

      if (callback) callback(products);
    }, (error) => {
      const cleanLocal = getStoredProducts();
      if (callback) callback(cleanLocal);
    });
  } catch (err) {
    if (callback) callback(getStoredProducts());
    return () => {};
  }
};

/**
 * Save or update a product in Firestore and Realtime Database without requiring Firebase Storage.
 */
export const saveProductToFirebase = async (productData) => {
  const prodId = productData.id || `BL-${Date.now().toString().slice(-4)}`;
  const cleanData = { ...productData, id: prodId, updatedAt: new Date().toISOString() };

  // 1. Instant local cache update
  const saved = JSON.parse(localStorage.getItem('devaki_products') || '[]');
  const idx = saved.findIndex(p => p.id === prodId);
  if (idx >= 0) {
    saved[idx] = cleanData;
  } else {
    saved.unshift(cleanData);
  }
  safeSetLocalStorage('devaki_products', saved);
  window.dispatchEvent(new Event('devaki_products_updated'));

  // 2. Parallel background sync to Firestore & Realtime DB
  Promise.allSettled([
    setDoc(doc(db, 'products', prodId), cleanData, { merge: true }),
    rtdb ? setRtdb(ref(rtdb, `products/${prodId}`), cleanData) : Promise.resolve()
  ]).catch(() => {});

  return cleanData;
};

/**
 * Delete a product from Firestore and Realtime Database.
 */
export const deleteProductFromFirebase = async (productId) => {
  // Local update
  const saved = JSON.parse(localStorage.getItem('devaki_products') || '[]');
  const updated = saved.filter(p => p.id !== productId);
  safeSetLocalStorage('devaki_products', updated);
  window.dispatchEvent(new Event('devaki_products_updated'));

  // Firestore delete
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {}

  // Realtime Database delete
  try {
    if (rtdb) {
      await removeRtdb(ref(rtdb, `products/${productId}`));
    }
  } catch (err) {}
};

// ── ORDERS SYNC ───────────────────────────────────────────────

/**
 * Subscribe to ALL orders in real-time (Admin Panel view).
 */
export const subscribeToAllOrders = (callback) => {
  try {
    const ordersRef = collection(db, 'orders');

    return onSnapshot(ordersRef, (snapshot) => {
      const orders = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      localStorage.setItem('devaki_orders', JSON.stringify(orders));
      window.dispatchEvent(new Event('devaki_orders_updated'));

      if (callback) callback(orders);
    }, (error) => {
      console.warn('[Firebase] All orders snapshot error, falling back to local storage:', error);
      const saved = localStorage.getItem('devaki_orders');
      if (saved && callback) {
        try { callback(JSON.parse(saved)); } catch (e) {}
      }
    });
  } catch (err) {
    console.warn('[Firebase] All orders subscribe error:', err);
    return () => {};
  }
};

/**
 * Subscribe to specific customer orders in real-time (Customer Portal view).
 */
export const subscribeToCustomerOrders = (customerEmail, callback) => {
  try {
    const ordersRef = collection(db, 'orders');

    return onSnapshot(ordersRef, (snapshot) => {
      const allOrders = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      const filtered = allOrders.filter(o => {
        const email = o.customer?.email || o.email;
        return email?.toLowerCase() === customerEmail?.toLowerCase();
      }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      localStorage.setItem('devaki_user_orders', JSON.stringify(filtered));
      window.dispatchEvent(new Event('devaki_orders_updated'));

      if (callback) callback(filtered);
    }, (error) => {
      console.warn('[Firebase] Customer orders snapshot error, fallback:', error);
      const saved = localStorage.getItem('devaki_user_orders');
      if (saved && callback) {
        try { callback(JSON.parse(saved)); } catch (e) {}
      }
    });
  } catch (err) {
    console.warn('[Firebase] Customer orders subscribe error:', err);
    return () => {};
  }
};

/**
 * Save new order placed by customer to Firestore and sync to Admin & Customer portals.
 */
export const saveOrderToFirebase = async (orderData) => {
  const orderId = orderData.id || `${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanOrder = {
    ...orderData,
    id: orderId,
    createdAt: orderData.createdAt || new Date().toISOString(),
    status: orderData.status || 'inProduction'
  };

  // 1. Instant local cache update
  try {
    const userOrders = JSON.parse(localStorage.getItem('devaki_user_orders') || '[]');
    localStorage.setItem('devaki_user_orders', JSON.stringify([cleanOrder, ...userOrders]));

    const allOrders = JSON.parse(localStorage.getItem('devaki_orders') || '[]');
    localStorage.setItem('devaki_orders', JSON.stringify([cleanOrder, ...allOrders]));
    window.dispatchEvent(new Event('devaki_orders_updated'));
  } catch (e) {}

  // 2. Parallel background sync
  Promise.allSettled([
    setDoc(doc(db, 'orders', orderId), cleanOrder, { merge: true }),
    rtdb ? setRtdb(ref(rtdb, `orders/${orderId}`), cleanOrder) : Promise.resolve()
  ]).catch(() => {});

  return cleanOrder;
};

/**
 * Update order status live in Firestore (Admin Panel action).
 * Customer portal immediately sees tracker update!
 */
export const updateOrderStatusInFirebase = async (orderId, newStatus) => {
  // Update local storage first for fast response
  const updateList = (key) => {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = saved.map(o => o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o);
    localStorage.setItem(key, JSON.stringify(updated));
  };
  updateList('devaki_orders');
  updateList('devaki_user_orders');
  window.dispatchEvent(new Event('devaki_orders_updated'));

  // Firestore update
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firebase] Order #${orderId} status updated live to "${newStatus}"`);
  } catch (err) {
    console.warn('[Firebase] Firestore order status update fallback:', err);
  }
};

/**
 * Delete order from Firestore & sync local storage (Admin Panel action).
 */
export const deleteOrderFromFirebase = async (orderId) => {
  try {
    const saved = JSON.parse(localStorage.getItem('devaki_orders') || '[]');
    const updated = saved.filter(o => o.id !== orderId);
    localStorage.setItem('devaki_orders', JSON.stringify(updated));

    const userSaved = JSON.parse(localStorage.getItem('devaki_user_orders') || '[]');
    const userUpdated = userSaved.filter(o => o.id !== orderId);
    localStorage.setItem('devaki_user_orders', JSON.stringify(userUpdated));

    window.dispatchEvent(new Event('devaki_orders_updated'));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, 'orders', orderId));
    if (rtdb) await removeRtdb(ref(rtdb, `orders/${orderId}`));
    console.log(`[Firebase] Order #${orderId} deleted successfully`);
  } catch (err) {
    console.warn('[Firebase] Firestore order delete fallback:', err);
  }
};

// ── PURCHASE REQUESTS / ENQUIRIES ─────────────────────────────

/**
 * Subscribe to Request to Purchase submissions (Admin Panel).
 */
export const subscribeToPurchaseRequests = (callback) => {
  try {
    const reqRef = collection(db, 'requests');
    return onSnapshot(reqRef, (snapshot) => {
      const requests = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      localStorage.setItem('devaki_purchase_requests', JSON.stringify(requests));
      if (callback) callback(requests);
    }, (err) => {
      console.warn('[Firebase] Requests snapshot error:', err);
      const saved = localStorage.getItem('devaki_purchase_requests');
      if (saved && callback) {
        try { callback(JSON.parse(saved)); } catch (e) {}
      }
    });
  } catch (err) {
    return () => {};
  }
};

/**
 * Submit Request to Purchase from Customer Portal.
 */
export const savePurchaseRequestToFirebase = async (requestData) => {
  const reqId = requestData.id || `REQ-${Date.now().toString().slice(-4)}`;
  const saved = JSON.parse(localStorage.getItem('devaki_purchase_requests') || '[]');
  const existing = saved.find(r => r.id === reqId) || {};

  const cleanReq = {
    ...existing,
    ...requestData,
    id: reqId,
    createdAt: requestData.createdAt || existing.createdAt || new Date().toISOString()
  };

  const updated = saved.some(r => r.id === reqId)
    ? saved.map(r => r.id === reqId ? cleanReq : r)
    : [cleanReq, ...saved];

  localStorage.setItem('devaki_purchase_requests', JSON.stringify(updated));

  try {
    await setDoc(doc(db, 'requests', reqId), cleanReq, { merge: true });
    console.log('[Firebase] Purchase request saved live:', reqId);
  } catch (err) {
    console.warn('[Firebase] Firestore purchase request fallback:', err);
  }
  return cleanReq;
};

// ── AUTHENTICATION SYNC ───────────────────────────────────────

/**
 * Sign in user with Firebase Auth & sync local user state.
 */
export const loginWithFirebase = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userObj = {
      uid: cred.user.uid,
      email: cred.user.email,
      name: cred.user.displayName || email.split('@')[0]
    };
    localStorage.setItem('devaki_user', JSON.stringify(userObj));
    window.dispatchEvent(new Event('devaki_auth_change'));
    return userObj;
  } catch (err) {
    console.warn('[Firebase] Auth login fallback to local session:', err.message);
    const userObj = { email, name: email.split('@')[0] };
    localStorage.setItem('devaki_user', JSON.stringify(userObj));
    window.dispatchEvent(new Event('devaki_auth_change'));
    return userObj;
  }
};

/**
 * Register user with Firebase Auth & save user doc in Firestore.
 */
export const registerWithFirebase = async (email, password, name) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userObj = {
      uid: cred.user.uid,
      email: cred.user.email,
      name: name || email.split('@')[0]
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), userObj, { merge: true });
    } catch (e) {}

    localStorage.setItem('devaki_user', JSON.stringify(userObj));
    window.dispatchEvent(new Event('devaki_auth_change'));
    return userObj;
  } catch (err) {
    console.warn('[Firebase] Auth register fallback to local session:', err.message);
    const userObj = { email, name: name || email.split('@')[0] };
    localStorage.setItem('devaki_user', JSON.stringify(userObj));
    window.dispatchEvent(new Event('devaki_auth_change'));
    return userObj;
  }
};

/**
 * Sign out user from Firebase Auth and clear local session.
 */
export const logoutFromFirebase = async () => {
  try {
    await signOut(auth);
  } catch (e) {}
  localStorage.removeItem('devaki_user');
  window.dispatchEvent(new Event('devaki_auth_change'));
};

// ── COUPONS SYNC ──────────────────────────────────────────────

export const DEFAULT_COUPONS = [
  {
    id: 'c_firstorder',
    code: 'FIRSTORDER',
    discountType: 'flat', // 'flat' (₹) or 'percentage' (%)
    discountValue: 500,
    minOrderValue: 0,
    isActive: true,
    description: 'Welcome Offer — ₹500 OFF on your first couture order!'
  }
];

export const getStoredCoupons = () => {
  try {
    const saved = localStorage.getItem('devaki_coupons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_COUPONS;
};

export const subscribeToCoupons = (callback) => {
  try {
    const cached = getStoredCoupons();
    if (cached && callback) callback(cached);

    const couponsRef = collection(db, 'coupons');
    return onSnapshot(couponsRef, (snapshot) => {
      if (snapshot.empty) {
        localStorage.setItem('devaki_coupons', JSON.stringify(DEFAULT_COUPONS));
        if (callback) callback(DEFAULT_COUPONS);
        return;
      }

      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      localStorage.setItem('devaki_coupons', JSON.stringify(list));
      window.dispatchEvent(new Event('devaki_coupons_updated'));
      if (callback) callback(list);
    }, (err) => {
      const fallback = getStoredCoupons();
      if (callback) callback(fallback);
    });
  } catch (err) {
    const fallback = getStoredCoupons();
    if (callback) callback(fallback);
    return () => {};
  }
};

export const saveCouponToFirebase = async (couponData) => {
  const couponId = couponData.id || `coupon_${Date.now()}`;
  const cleanCoupon = {
    ...couponData,
    id: couponId,
    code: (couponData.code || 'COUPON').trim().toUpperCase(),
    discountType: couponData.discountType || 'flat',
    discountValue: Number(couponData.discountValue || 0),
    minOrderValue: Number(couponData.minOrderValue || 0),
    isActive: couponData.isActive !== false,
    updatedAt: new Date().toISOString()
  };

  try {
    const current = getStoredCoupons();
    const exists = current.some(c => c.id === couponId);
    const updated = exists ? current.map(c => c.id === couponId ? cleanCoupon : c) : [cleanCoupon, ...current];
    localStorage.setItem('devaki_coupons', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_coupons_updated'));
  } catch (e) {}

  try {
    await setDoc(doc(db, 'coupons', couponId), cleanCoupon, { merge: true });
  } catch (err) {}

  return cleanCoupon;
};

export const deleteCouponFromFirebase = async (couponId) => {
  try {
    const current = getStoredCoupons();
    const updated = current.filter(c => c.id !== couponId);
    localStorage.setItem('devaki_coupons', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_coupons_updated'));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (err) {}
};

// ── SLOT BOOKING CATEGORIES & BOOKINGS SYNC ────────────────────

export const DEFAULT_SLOT_CATEGORIES = [
  {
    id: 'sc_birthday',
    name: 'Birthday Couture Consultation',
    tagline: 'Bespoke birthday outfits designed to make your special day unforgettable.',
    price: 499,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    description: '1-on-1 personal styling session for custom birthday dresses, gowns, and fusion outfits.',
    isActive: true
  },
  {
    id: 'sc_bridal',
    name: 'Bridal Couture & Trousseau',
    tagline: 'Exclusive trousseau & bridal consultation with DEVAKI head designer.',
    price: 999,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    description: 'Comprehensive wedding wardrobe planning, fabric customization, and bridal fittings.',
    isActive: true
  },
  {
    id: 'sc_saree',
    name: 'Custom Saree Transformation',
    tagline: 'Convert your heirloom saree into a modern handcrafted designer ensemble.',
    price: 299,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    description: 'Bring or send your vintage saree and work with our master tailors to transform it into lehengas, kurtis, or cape sets.',
    isActive: true
  },
  {
    id: 'sc_squad',
    name: 'Bridesmaid Squad Fitting',
    tagline: 'Coordinated luxury trousseau & squad fitting for your wedding entourage.',
    price: 599,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
    description: 'Design matching color-coordinated outfits for up to 10 bridesmaids with custom sizes.',
    isActive: true
  }
];

export const getStoredSlotCategories = () => {
  try {
    const saved = localStorage.getItem('devaki_slot_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_SLOT_CATEGORIES;
};

export const subscribeToSlotCategories = (callback) => {
  try {
    const cached = getStoredSlotCategories();
    if (cached && callback) callback(cached);

    const categoriesRef = collection(db, 'slot_categories');
    return onSnapshot(categoriesRef, (snapshot) => {
      if (snapshot.empty) {
        localStorage.setItem('devaki_slot_categories', JSON.stringify(DEFAULT_SLOT_CATEGORIES));
        if (callback) callback(DEFAULT_SLOT_CATEGORIES);
        return;
      }

      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      localStorage.setItem('devaki_slot_categories', JSON.stringify(list));
      window.dispatchEvent(new Event('devaki_slot_categories_updated'));
      if (callback) callback(list);
    }, () => {
      const fallback = getStoredSlotCategories();
      if (callback) callback(fallback);
    });
  } catch (err) {
    const fallback = getStoredSlotCategories();
    if (callback) callback(fallback);
    return () => {};
  }
};

export const saveSlotCategoryToFirebase = async (categoryData) => {
  const catId = categoryData.id || `sc_${Date.now()}`;
  const cleanCategory = {
    ...categoryData,
    id: catId,
    name: (categoryData.name || 'Slot Category').trim(),
    tagline: (categoryData.tagline || '').trim(),
    price: Number(categoryData.price || 0),
    image: categoryData.image || '',
    description: (categoryData.description || '').trim(),
    isActive: categoryData.isActive !== false,
    updatedAt: new Date().toISOString()
  };

  try {
    const current = getStoredSlotCategories();
    const exists = current.some(c => c.id === catId);
    const updated = exists ? current.map(c => c.id === catId ? cleanCategory : c) : [cleanCategory, ...current];
    localStorage.setItem('devaki_slot_categories', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_slot_categories_updated'));
  } catch (e) {}

  try {
    await setDoc(doc(db, 'slot_categories', catId), cleanCategory, { merge: true });
  } catch (err) {}

  return cleanCategory;
};

export const deleteSlotCategoryFromFirebase = async (catId) => {
  try {
    const current = getStoredSlotCategories();
    const updated = current.filter(c => c.id !== catId);
    localStorage.setItem('devaki_slot_categories', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_slot_categories_updated'));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, 'slot_categories', catId));
  } catch (err) {}
};

// ── BOOKED SLOTS SYNC ──────────────────────────────────────────

export const getStoredSlotBookings = () => {
  try {
    const saved = localStorage.getItem('devaki_slot_bookings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return [];
};

export const subscribeToSlotBookings = (callback) => {
  try {
    const cached = getStoredSlotBookings();
    if (cached && callback) callback(cached);

    const bookingsRef = collection(db, 'slot_bookings');
    return onSnapshot(bookingsRef, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      localStorage.setItem('devaki_slot_bookings', JSON.stringify(list));
      window.dispatchEvent(new Event('devaki_slot_bookings_updated'));
      if (callback) callback(list);
    }, () => {
      const fallback = getStoredSlotBookings();
      if (callback) callback(fallback);
    });
  } catch (err) {
    const fallback = getStoredSlotBookings();
    if (callback) callback(fallback);
    return () => {};
  }
};

export const saveSlotBookingToFirebase = async (bookingData) => {
  const bookingId = bookingData.id || `SLOT-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanBooking = {
    ...bookingData,
    id: bookingId,
    status: bookingData.status || 'Pending',
    createdAt: bookingData.createdAt || new Date().toISOString()
  };

  try {
    const current = getStoredSlotBookings();
    const updated = [cleanBooking, ...current.filter(b => b.id !== bookingId)];
    localStorage.setItem('devaki_slot_bookings', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_slot_bookings_updated'));
  } catch (e) {}

  try {
    await setDoc(doc(db, 'slot_bookings', bookingId), cleanBooking, { merge: true });
  } catch (err) {}

  return cleanBooking;
};

export const updateSlotBookingStatusInFirebase = async (bookingId, newStatus) => {
  try {
    const current = getStoredSlotBookings();
    const updated = current.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
    localStorage.setItem('devaki_slot_bookings', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_slot_bookings_updated'));
  } catch (e) {}

  try {
    await updateDoc(doc(db, 'slot_bookings', bookingId), { status: newStatus });
  } catch (err) {}
};

export const deleteSlotBookingFromFirebase = async (bookingId) => {
  try {
    const current = getStoredSlotBookings();
    const updated = current.filter(b => b.id !== bookingId);
    localStorage.setItem('devaki_slot_bookings', JSON.stringify(updated));
    window.dispatchEvent(new Event('devaki_slot_bookings_updated'));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, 'slot_bookings', bookingId));
  } catch (err) {}
};
