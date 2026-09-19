// src/components/AuthCard.jsx
import { useState, useEffect } from 'react';
import { UserPlus, LogIn } from 'lucide-react';
import { loginWithFirebase, registerWithFirebase } from '../services/firebaseService';
import '../pages/CheckoutPage.css';

const AuthCard = ({ onAuthenticated, subtitle, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      let userObj;
      if (mode === 'register') {
        userObj = await registerWithFirebase(email, password, name);
      } else {
        userObj = await loginWithFirebase(email, password);
      }
      if (onAuthenticated) onAuthenticated(userObj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-auth" style={{ maxWidth: '420px', margin: '0 auto' }}>
      <div className="checkout-auth__icon">
        {mode === 'login' ? <LogIn size={24} /> : <UserPlus size={24} />}
      </div>
      <p className="checkout-auth__title">
        {mode === 'login' ? 'Sign In to Continue' : 'Create Your Account'}
      </p>
      <p className="checkout-auth__desc">
        {subtitle || (mode === 'login'
          ? 'Sign in to securely access your orders and account.'
          : 'Create a free account to track your orders.')}
      </p>
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
      >
        {mode === 'register' && (
          <div className="form-field">
            <label className="form-label" htmlFor="auth-name">Full Name</label>
            <input
              id="auth-name"
              className="form-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-field">
          <label className="form-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: 'var(--sp-3)', marginTop: 'var(--sp-1)' }}>
          {mode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}
        </button>
      </form>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, marginTop: 'var(--sp-2)' }}
        onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
      </button>
    </div>
  );
};

export default AuthCard;
