import React from 'react';
import type { User } from '../types';
import { BookOpen, LogOut, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenDemoSwitcher: () => void;
  socketConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenDemoSwitcher,
  socketConnected
}) => {
  return (
    <header style={{
      background: '#0f3d2e',
      color: '#ffffff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
          }}>
            <BookOpen size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: '-0.02em',
                color: '#ffffff'
              }}>
                BookLeaf Publishing
              </span>
              <span style={{
                background: user?.role === 'admin' ? '#d97706' : '#10b981',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {user?.role === 'admin' ? 'Admin Desk' : 'Author Portal'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
              Author Support & Royalty Intelligence System
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: socketConnected ? '#10b981' : '#f59e0b',
              boxShadow: socketConnected ? '0 0 8px #10b981' : 'none'
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              {socketConnected ? 'Live Sync Active' : 'Connecting Sync...'}
            </span>
          </div>

          <button
            id="demo-switcher-btn"
            onClick={onOpenDemoSwitcher}
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s'
            }}
            title="Switch easily between demo authors and admin"
          >
            <RefreshCw size={13} />
            <span>Switch Account</span>
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>
                  {user.authorId ? `ID: ${user.authorId}` : 'Super Administrator'}
                </div>
              </div>

              <button
                id="logout-btn"
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
