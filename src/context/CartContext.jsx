// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToCoupons, DEFAULT_COUPONS } from '../services/firebaseService';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponsList, setCouponsList] = useState(DEFAULT_COUPONS);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('devaki_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Subscribe to live coupons list
  useEffect(() => {
    const unsubscribe = subscribeToCoupons((list) => {
      if (list && Array.isArray(list)) {
        setCouponsList(list);
      }
    });
    return () => unsubscribe();
  }, []);

  const addToCart = useCallback((item) => {
    const id = `${item.productId}-${Date.now()}`;
    setCartItems(prev => [...prev, { ...item, cartId: id }]);
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const updateCartItem = useCallback((cartId, updates) => {
    setCartItems(prev => prev.map(item =>
      item.cartId === cartId ? { ...item, ...updates } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const cartCount = cartItems.length;

  // Calculate dynamic coupon discount amount
  let discountAmount = 0;
  if (appliedCoupon && cartTotal > 0) {
    // Find active match in live list to get latest discount values
    const liveMatch = couponsList.find(c => c.code.toUpperCase() === appliedCoupon.code.toUpperCase() && c.isActive !== false);
    const couponToUse = liveMatch || appliedCoupon;

    if (couponToUse && (cartTotal >= (couponToUse.minOrderValue || 0))) {
      if (couponToUse.discountType === 'percentage') {
        discountAmount = Math.round((cartTotal * Number(couponToUse.discountValue || 0)) / 100);
      } else {
        discountAmount = Math.min(Number(couponToUse.discountValue || 0), cartTotal);
      }
    }
  }

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const applyCoupon = useCallback((codeString) => {
    if (!codeString || !codeString.trim()) {
      return { success: false, message: 'Please enter a valid coupon code.' };
    }

    const cleanCode = codeString.trim().toUpperCase();
    const match = couponsList.find(c => c.code.toUpperCase() === cleanCode && c.isActive !== false);

    if (!match) {
      return { success: false, message: `Invalid coupon code "${cleanCode}". Try "FIRSTORDER" for ₹500 OFF!` };
    }

    if (cartTotal < (match.minOrderValue || 0)) {
      return { success: false, message: `Coupon ${match.code} requires minimum cart total of ₹${match.minOrderValue.toLocaleString('en-IN')}.` };
    }

    let calculatedOff = 0;
    if (match.discountType === 'percentage') {
      calculatedOff = Math.round((cartTotal * Number(match.discountValue)) / 100);
    } else {
      calculatedOff = Math.min(Number(match.discountValue), cartTotal);
    }

    const couponObj = {
      id: match.id,
      code: match.code,
      discountType: match.discountType,
      discountValue: match.discountValue,
      description: match.description,
      calculatedOff
    };

    setAppliedCoupon(couponObj);
    try {
      localStorage.setItem('devaki_applied_coupon', JSON.stringify(couponObj));
    } catch (e) {}

    const discountText = match.discountType === 'percentage'
      ? `${match.discountValue}% OFF`
      : `₹${match.discountValue} OFF`;

    return {
      success: true,
      message: `Coupon "${match.code}" applied successfully (${discountText})!`
    };
  }, [couponsList, cartTotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('devaki_applied_coupon');
    } catch (e) {}
  }, []);

  return (
    <CartContext.Provider value={{
      cartItems, cartTotal, cartCount,
      addToCart, removeFromCart, updateCartItem, clearCart,
      isCartOpen, setIsCartOpen,
      appliedCoupon, applyCoupon, removeCoupon,
      discountAmount, finalTotal, couponsList
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
