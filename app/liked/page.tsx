'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useLikedVideos } from '@/lib/hooks/useLikedVideos';
import { useAuth } from '@/lib/hooks/useAuth';
import { VideoCard } from '@/components/home/VideoCard';

export default function LikedVideosPage() {
  const router = useRouter();
  const auth = useAuth();
  const { likedVideos, loading } = useLikedVideos();
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

  // Filtrar vídeos curtidos por termo de busca
  const filteredLikedVideos = likedVideos.filter(item => 
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
                <i className="bi bi-hand-thumbs-up-fill" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
                Vídeos com Gostei
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0,
              }}>
                Todos os vídeos que você curtiu
              </p>
            </div>
            {likedVideos.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                }}>
                  {likedVideos.length} {likedVideos.length === 1 ? 'vídeo' : 'vídeos'}
                </span>
              </div>
            )}
          </div>

          {/* Lista de vídeos */}
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '18px',
            }}>
              Carregando vídeos curtidos...
            </div>
          ) : filteredLikedVideos.length === 0 && searchTerm ? (
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
          ) : filteredLikedVideos.length === 0 ? (
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
                className="bi bi-hand-thumbs-up"
                style={{ fontSize: '64px', color: 'rgba(255, 255, 255, 0.3)' }}
              ></i>
              <p style={{ fontSize: '18px', margin: 0 }}>
                Nenhum vídeo curtido ainda
              </p>
              <p style={{ fontSize: '14px', margin: 0, color: 'rgba(255, 255, 255, 0.5)' }}>
                Curta alguns vídeos para vê-los aqui
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {filteredLikedVideos.map((item) => {
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

