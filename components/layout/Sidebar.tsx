'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  const menuItems = [
    { icon: 'bi-house', label: 'Início', path: '/' },
    { icon: 'bi-tv', label: 'Shorts', path: '#' },
    { icon: 'bi-list-ul', label: 'Inscrições', path: '#' },
  ];

  const userItems = [
    { icon: 'bi-heart-fill', label: 'Favoritos', path: '/favorites' },
    { icon: 'bi-clock-history', label: 'Histórico', path: '/history' },
    { icon: 'bi-clock', label: 'Assistir mais tarde', path: '/watchlist' },
    { icon: 'bi-hand-thumbs-up', label: 'Vídeos com Gostei', path: '/liked' },
  ];

  if (!isOpen) return null;

  return (
    <aside style={{
      width: '240px',
      height: 'calc(100vh - 56px)',
      background: '#212121',
      position: 'fixed',
      left: 0,
      top: '56px',
      overflowY: 'auto',
      zIndex: 90,
      padding: '12px 0'
    }}>
      {menuItems.map((item, index) => {
        // Para rota inicial, verificar se é exatamente '/' (não outras rotas)
        // Para outras rotas, verificar se corresponde exatamente ou começa com o path
        const isActive = item.path === '/' 
          ? pathname === '/' || pathname === ''
          : pathname === item.path || (item.path !== '#' && pathname.startsWith(item.path + '/'));
        return (
          <div
            key={index}
            onClick={() => item.path !== '#' && router.push(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              cursor: item.path !== '#' ? 'pointer' : 'default',
              color: isActive ? '#e50914' : 'white',
              fontSize: '14px',
              gap: '24px',
              background: isActive ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #e50914' : '3px solid transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (item.path !== '#' && !isActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <i className={`bi ${item.icon}`} style={{ fontSize: '20px', color: isActive ? '#e50914' : 'white' }}></i>
            <span>{item.label}</span>
          </div>
        );
      })}

      {auth.isAuthenticated && (
        <>
          <div style={{ 
            height: '1px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            margin: '12px 0' 
          }} />
          
          <div style={{ padding: '8px 24px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: 'bold' }}>
            VOCÊ
          </div>

          {userItems.map((item, index) => {
            // Verificar se a rota atual corresponde ao item (exato ou começa com o path)
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <div
                key={index}
                onClick={() => item.path !== '#' && router.push(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  cursor: item.path !== '#' ? 'pointer' : 'default',
                  color: isActive ? '#e50914' : 'white',
                  fontSize: '14px',
                  gap: '24px',
                  background: isActive ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #e50914' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (item.path !== '#' && !isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <i className={`bi ${item.icon}`} style={{ fontSize: '20px', color: isActive ? '#e50914' : 'white' }}></i>
                <span>{item.label}</span>
              </div>
            );
          })}
        </>
      )}
    </aside>
  );
}

