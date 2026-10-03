import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, ArrowRight, Shield, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onNavigateSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem'
    }}>
      <div className="glass-card" style={{ maxWidth: '470px', width: '100%', padding: '2.25rem 2rem' }}>
        {/* Brand Logo & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <img
              src="/logo.png"
              alt="Future University"
              style={{ maxHeight: '72px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', letterSpacing: '0.02em' }}>Future University</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Learn • Assimilate • Transcend | Biometric ERP Portal
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fb7185',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">University Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@futureuniversity.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Demo Accounts Switcher */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.85rem', fontWeight: 600 }}>
            <Sparkles size={13} color="#6366f1" />
            Quick Demo 1-Click Login
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.785rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}
              onClick={() => handleQuickDemo('dean@futureuniversity.edu.in', 'dean123')}
            >
              <GraduationCap size={15} color="#818cf8" />
              <span style={{ fontWeight: 700, color: '#a5b4fc' }}>🎓 Academic Head</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.785rem' }}
              onClick={() => handleQuickDemo('admin@futureuniversity.edu.in', 'admin123')}
            >
              <Shield size={14} color="#f59e0b" />
              <span>👑 Admin Portal</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.785rem' }}
              onClick={() => handleQuickDemo('sarah.chen@futureuniversity.edu.in', 'password123')}
            >
              <User size={14} color="#10b981" />
              <span>Prof. Sarah (CSE)</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.785rem' }}
              onClick={() => handleQuickDemo('saatwik.gosain@futureuniversity.edu.in', 'password123')}
            >
              <GraduationCap size={14} color="#3b82f6" />
              <span>Saatwik Gosain (CSE20)</span>
            </button>
          </div>
        </div>

        {/* Footer switch */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Need new faculty / student credentials?{' '}
          <button
            onClick={onNavigateSignup}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--emerald-500)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
