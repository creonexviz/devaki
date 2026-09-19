// src/context/CartContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  return (
    <CartContext.Provider value={{
      cartItems, cartTotal, cartCount,
      addToCart, removeFromCart, updateCartItem, clearCart,
      isCartOpen, setIsCartOpen,
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
