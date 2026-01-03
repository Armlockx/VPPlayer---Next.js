'use client';

import { VideoCard } from './VideoCard';
import type { Video } from '@/types/video';

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
}

export function VideoGrid({ videos, loading }: VideoGridProps) {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '24px',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{
            background: '#212121',
            borderRadius: '12px',
            aspectRatio: '16/9',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '18px'
      }}>
        Nenhum vídeo encontrado
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '40px 16px',
      padding: '24px',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

