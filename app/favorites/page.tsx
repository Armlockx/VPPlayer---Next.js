'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useAuth } from '@/lib/hooks/useAuth';
import { VideoCard } from '@/components/home/VideoCard';
import type { Video } from '@/types/video';

export default function FavoritesPage() {
  const router = useRouter();
  const auth = useAuth();
  const favorites = useFavorites();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirecionar se não estiver autenticado (com delay para evitar loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!auth.isAuthenticated || auth.isGuest) {
        router.push('/');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [auth.isAuthenticated, auth.isGuest, router]);

  // Recarregar favoritos quando necessário
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isGuest) {
      favorites.refreshFavorites();
    }
  }, [auth.isAuthenticated, auth.isGuest]);

  // Mostrar loading enquanto verifica autenticação
  if (auth.isAuthenticated === undefined || (!auth.isAuthenticated || auth.isGuest)) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#0f0f0f',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        Carregando...
      </div>
    );
  }

  // Filtrar lista por termo de busca
  const filteredList = favorites.favorites.filter(item => 
    item.video?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f0f0f' }}>
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main style={{ 
          flex: 1, 
          marginLeft: sidebarOpen ? '240px' : '0',
          transition: 'margin-left 0.3s ease',
          padding: '24px',
        }}>
          {/* Header da página */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}>
            <div>
              <h1 style={{
                color: 'white',
                fontSize: '32px',
                fontWeight: 600,
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <i className="bi bi-heart-fill" style={{ fontSize: '32px', color: '#e50914' }}></i>
                Favoritos
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0,
              }}>
                Seus vídeos favoritos
              </p>
            </div>
            {favorites.favorites.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                }}>
                  {favorites.favorites.length} {favorites.favorites.length === 1 ? 'vídeo' : 'vídeos'}
                </span>
              </div>
            )}
          </div>

          {/* Lista de vídeos */}
          {favorites.loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '18px',
            }}>
              Carregando...
            </div>
          ) : filteredList.length === 0 && searchTerm ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: 'rgba(255, 255, 255, 0.7)',
              gap: '16px',
            }}>
              <i 
                className="bi bi-search"
                style={{ fontSize: '64px', color: 'rgba(255, 255, 255, 0.3)' }}
              ></i>
              <p style={{ fontSize: '18px', margin: 0 }}>
                Nenhum vídeo encontrado para "{searchTerm}"
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: 'rgba(255, 255, 255, 0.7)',
              gap: '16px',
            }}>
              <i 
                className="bi bi-heart"
                style={{ fontSize: '64px', color: 'rgba(255, 255, 255, 0.3)' }}
              ></i>
              <p style={{ fontSize: '18px', margin: 0 }}>
                Nenhum vídeo favoritado ainda
              </p>
              <p style={{ fontSize: '14px', margin: 0, color: 'rgba(255, 255, 255, 0.5)' }}>
                Adicione vídeos aos favoritos clicando no ícone de coração nos cards de vídeo
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {filteredList.map((item) => {
                if (!item.video) return null;
                return <VideoCard key={item.video.id} video={item.video} />;
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

