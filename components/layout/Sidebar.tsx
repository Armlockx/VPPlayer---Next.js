'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const auth = useAuth();

  const menuItems = [
    { icon: 'bi-house', label: 'Início', path: '/' },
    { icon: 'bi-tv', label: 'Shorts', path: '#' },
    { icon: 'bi-list-ul', label: 'Inscrições', path: '#' },
  ];

  const userItems = [
    { icon: 'bi-clock-history', label: 'Histórico', path: '#' },
    { icon: 'bi-play-circle', label: 'Playlists', path: '#' },
    { icon: 'bi-clock', label: 'Assistir mais tarde', path: '#' },
    { icon: 'bi-hand-thumbs-up', label: 'Vídeos com Gostei', path: '#' },
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
      {menuItems.map((item, index) => (
        <div
          key={index}
          onClick={() => item.path !== '#' && router.push(item.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            cursor: item.path !== '#' ? 'pointer' : 'default',
            color: 'white',
            fontSize: '14px',
            gap: '24px'
          }}
          onMouseEnter={(e) => {
            if (item.path !== '#') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <i className={`bi ${item.icon}`} style={{ fontSize: '20px' }}></i>
          <span>{item.label}</span>
        </div>
      ))}

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

          {userItems.map((item, index) => (
            <div
              key={index}
              onClick={() => item.path !== '#' && router.push(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                cursor: item.path !== '#' ? 'pointer' : 'default',
                color: 'white',
                fontSize: '14px',
                gap: '24px'
              }}
              onMouseEnter={(e) => {
                if (item.path !== '#') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '20px' }}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </>
      )}
    </aside>
  );
}

