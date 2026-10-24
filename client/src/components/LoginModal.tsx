import React, { useState } from 'react';
import { Shield, BookOpen, Key, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DEMO_ACCOUNTS = [
  {
    role: 'admin',
    name: 'BookLeaf Admin',
    desc: 'Triage queue, AI draft generator, status & private notes',
    email: 'admin@bookleaf.com',
    pass: 'AdminPassword123!',
    tag: 'Super Admin'
  },
  {
    role: 'author',
    name: 'Priya Sharma (AUTH001)',
    desc: '2 Published Books ("Whispers of the Ganges", "The Saffron Diaries")',
    email: 'priya.sharma@email.com',
    pass: 'AuthorPassword123!',
    tag: 'Author'
  },
  {
    role: 'author',
    name: 'Sneha Kulkarni (AUTH007)',
    desc: '3 Books: 2 Published + 1 In Production (Tests null-safe "—" display)',
    email: 'sneha.kulkarni@email.com',
    pass: 'AuthorPassword123!',
    tag: 'Author (Production Book)'
  },
  {
    role: 'author',
    name: 'Rohit Kapoor (AUTH002)',
    desc: 'Best-selling author (2,000+ copies sold, ₹84k+ royalties)',
    email: 'rohit.kapoor@email.com',
    pass: 'AuthorPassword123!',
    tag: 'Author'
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  loading,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    onLogin(email, password);
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    onLogin(demoEmail, demoPass);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 18,
        maxWidth: 580,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
          padding: '24px 28px',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}>
              <Sparkles size={13} color="#10b981" />
              Role-Based Authentication
            </span>
          </div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 22,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0
          }}>
            Sign In to BookLeaf Portal
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', marginTop: 4 }}>
            Select a verified demo account for instant 1-click evaluation, or enter your credentials.
          </p>
        </div>

        <div style={{ padding: '24px 28px', maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 18
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Demo Profiles */}
          <div style={{ marginBottom: 22 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748b',
              marginBottom: 10
            }}>
              1-Click Demo Profiles (Recommended for Evaluators)
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  id={`quick-login-${acc.role}-${acc.email.split('@')[0]}`}
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = acc.role === 'admin' ? '#d97706' : '#10b981';
                    e.currentTarget.style.backgroundColor = acc.role === 'admin' ? '#fffbeb' : '#ecfdf5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: acc.role === 'admin' ? '#fef3c7' : '#d1fae5',
                      color: acc.role === 'admin' ? '#b45309' : '#047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {acc.role === 'admin' ? <Shield size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {acc.desc}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: acc.role === 'admin' ? '#fed7aa' : '#bbf7d0',
                    color: acc.role === 'admin' ? '#9a3412' : '#166534'
                  }}>
                    {acc.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '18px 0',
            color: '#94a3b8',
            fontSize: 12
          }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span>OR ENTER CUSTOM CREDENTIALS</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Email Address
              </label>
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@email.com or admin@bookleaf.com"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Password
              </label>
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                style={{
                  padding: '9px 22px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 61, 46, 0.3)'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
