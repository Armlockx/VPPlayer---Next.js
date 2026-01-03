'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useAuth } from '@/lib/hooks/useAuth';
import { VideoCard } from '@/components/home/VideoCard';

export default function WatchlistPage() {
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

  // Filtrar watchlist por termo de busca
  const filteredWatchlist = favorites.watchlist.filter(item => 
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
                <i className="bi bi-bookmark-fill" style={{ fontSize: '32px', color: '#ffc107' }}></i>
                Assistir Mais Tarde
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0,
              }}>
                Vídeos salvos para assistir depois
              </p>
            </div>
            {favorites.watchlist.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                }}>
                  {favorites.watchlist.length} {favorites.watchlist.length === 1 ? 'vídeo' : 'vídeos'}
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
          ) : filteredWatchlist.length === 0 && searchTerm ? (
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
          ) : filteredWatchlist.length === 0 ? (
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
                className="bi bi-bookmark"
                style={{ fontSize: '64px', color: 'rgba(255, 255, 255, 0.3)' }}
              ></i>
              <p style={{ fontSize: '18px', margin: 0 }}>
                Nenhum vídeo na sua watchlist
              </p>
              <p style={{ fontSize: '14px', margin: 0, color: 'rgba(255, 255, 255, 0.5)' }}>
                Adicione vídeos à watchlist clicando no ícone de bookmark nos cards de vídeo
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {filteredWatchlist.map((item) => {
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

