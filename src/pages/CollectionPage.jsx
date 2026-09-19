// src/pages/CollectionPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredProducts, getStockLabel } from '../data/products';
import { subscribeToProducts } from '../services/firebaseService';
import { useVisitorTracking } from '../hooks/useVisitorTracking';
import './CollectionPage.css';

const ImagePlaceholder = ({ label }) => (
  <div className="img-placeholder">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <span>{label || 'Product photo'}</span>
  </div>
);

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const stockInfo = getStockLabel(product?.stock);
  const priceNum = Number(product?.basePrice) || 2499;
  const availableStock = product?.stock?.available ?? 0;

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/product/${product.id}`)}
    >
      <div className="product-card__image">
        {product?.images?.[0]
          ? <img src={product.images[0]} alt={product.name} />
          : <ImagePlaceholder label="Product photo" />
        }
        <span className={`product-card__stock-badge badge-${stockInfo.level}`}>
          {stockInfo.label}
        </span>
      </div>
      <div className="product-card__info">
        <p className="product-card__fabric">{product?.fabric || 'Pure Silk'}</p>
        <h3 className="product-card__name">{product?.name || 'DEVAKI Piece'}</h3>
        <p className="product-card__price">
          {availableStock === 0 ? `Your price to buy: ₹${priceNum.toLocaleString('en-IN')}` : `₹${priceNum.toLocaleString('en-IN')}`}
        </p>
      </div>
    </div>
  );
};

const CollectionPage = () => {
  useVisitorTracking();
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'limited' | 'request'
  const [productsList, setProductsList] = useState(() => getStoredProducts());

  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && Array.isArray(liveProducts)) {
        setProductsList(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const activeProducts = productsList.filter(p => p.isActive !== false);

  const filteredProducts = activeProducts.filter(p => {
    if (selectedCategory === 'limited') return p.stock?.available > 0 && p.stock?.available <= 3;
    if (selectedCategory === 'request') return p.stock?.available === 0;
    return true; // 'all' -> The Collection (All-In-One)
  });

  return (
    <main className="collection-page page-with-sticky-cta">
      <header className="collection-page__header">
        <h1 className="collection-page__title">The Collection</h1>
      </header>

      {/* Category Navigation Menu Bar */}
      <div className="collection-category-bar">
        <button
          className={`collection-cat-tab${selectedCategory === 'all' ? ' collection-cat-tab--active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Pieces <span className="cat-count">({activeProducts.length})</span>
        </button>
        <button
          className={`collection-cat-tab${selectedCategory === 'limited' ? ' collection-cat-tab--active' : ''}`}
          onClick={() => setSelectedCategory('limited')}
        >
          Limited Pieces
        </button>
        <button
          className={`collection-cat-tab${selectedCategory === 'request' ? ' collection-cat-tab--active' : ''}`}
          onClick={() => setSelectedCategory('request')}
        >
          Request Purchase
        </button>
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12) var(--sp-4)' }}>
          <p style={{ color: 'var(--color-plum)', fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)' }}>
            No products found
          </p>
        </div>
      ) : (
        <div className="collection-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
};

export default CollectionPage;
