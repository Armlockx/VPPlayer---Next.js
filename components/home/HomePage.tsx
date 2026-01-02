'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '../layout/Header';
import { Sidebar } from '../layout/Sidebar';
import { VideoGrid } from './VideoGrid';
import type { Video } from '@/types/video';

export function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setVideos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f0f' }}>
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '0',
          marginLeft: sidebarOpen ? '240px' : '0',
          transition: 'margin-left 0.3s ease',
          background: '#0f0f0f'
        }}>
          <VideoGrid videos={filteredVideos} loading={loading} />
        </main>
      </div>
    </div>
  );
}

