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
