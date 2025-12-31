'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { VideoManager } from './VideoManager';
import { UserManager } from './UserManager';
import { StatsPanel } from './StatsPanel';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';
import { ToastContainer, useToast } from './Toast';
import { FiLogOut, FiArrowLeft, FiShield, FiRefreshCw } from 'react-icons/fi';
import { SkeletonCard, SkeletonCircle, SkeletonText } from './SkeletonLoader';

export function AdminDashboard() {
  const auth = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast } = useToast();

  // Permitir scroll na página admin
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (auth.loading) return;

      if (!auth.user) {
        router.push('/');
        return;
      }

      try {
        const adminStatus = await auth.checkAdmin();
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          router.push('/');
          return;
        }

        // Carregar perfil do usuário
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [auth, router]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading || isAdmin === null) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'white', fontSize: '16px' }}>Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '500px',
            animation: 'scaleIn 0.3s ease',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⛔</div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: 600 }}>Acesso Negado</h2>
          <p style={{ margin: '0 0 30px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', lineHeight: '1.6' }}>
            Você não tem permissão para acessar o painel de administração.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Voltar ao Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 30px',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiShield size={28} color="#ffd700" />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#ffffff' }}>
              Painel de Administração
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FiRefreshCw size={16} />
              <span className="hide-on-mobile">Atualizar</span>
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FiArrowLeft size={16} />
              <span className="hide-on-mobile">Voltar ao Player</span>
            </button>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid rgba(255, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FiLogOut size={16} />
              <span className="hide-on-mobile">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '30px',
        }}
      >
        {/* User Info */}
        {userProfile && (
          <section
            style={{
              marginBottom: '40px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'slideInUp 0.4s ease',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px 0',
                fontSize: '24px',
                fontWeight: 600,
                color: '#ffffff',
                paddingBottom: '15px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Informações do Usuário
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                flexWrap: 'wrap',
              }}
            >
              {userProfile.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.username}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid rgba(255, 215, 0, 0.3)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    border: '3px solid rgba(255, 215, 0, 0.3)',
                  }}
                >
                  {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>
                  {userProfile.username || 'Usuário'}
                </h3>
                <p style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  {userProfile.email}
                </p>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'rgba(255, 215, 0, 0.2)',
                    color: '#ffd700',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                  }}
                >
                  <FiShield size={14} />
                  Administrador
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Statistics */}
        <StatsPanel />

        {/* Video Management */}
        <VideoManager />

        {/* User Management */}
        <UserManager />
      </div>
    </div>
  );
}
