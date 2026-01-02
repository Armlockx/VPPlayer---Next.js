'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserDropdown } from '../user/UserDropdown';
import { useState, useEffect } from 'react';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onMenuClick: () => void;
}

export function Header({ searchTerm, onSearchChange, onMenuClick }: HeaderProps) {
  const auth = useAuth();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.user && !auth.isGuest) {
        const adminStatus = await auth.checkAdmin();
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [auth.user, auth.isGuest, auth]);

  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: '56px',
        background: '#212121',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="bi bi-list"></i>
        </button>

        {/* Logo */}
        <div
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginRight: '40px'
          }}
        >
          <i className="bi bi-play-circle-fill" style={{ color: '#FF0000', fontSize: '24px', marginRight: '4px' }}></i>
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>VP Player</span>
        </div>

        {/* Search Bar */}
        <div style={{ flex: 1, maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar"
            style={{
              width: '100%',
              height: '40px',
              padding: '0 16px',
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '40px',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            style={{
              height: '40px',
              width: '64px',
              background: '#303030',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderLeft: 'none',
              borderRadius: '0 40px 40px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              right: 0,
              top: 0
            }}
          >
            <i className="bi bi-search" style={{ color: 'white', fontSize: '18px' }}></i>
          </button>
        </div>

        {/* User Menu */}
        <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {auth.isAuthenticated && !auth.isGuest ? (
            <UserDropdown isAdmin={isAdmin} />
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '18px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

