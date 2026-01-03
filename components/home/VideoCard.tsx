'use client';

import { useRouter } from 'next/navigation';
import { useVideoHistory } from '@/lib/hooks/useVideoHistory';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useState } from 'react';
import type { Video } from '@/types/video';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const router = useRouter();
  const history = useVideoHistory();
  const auth = useAuth();
  const favorites = useFavorites();
  const [isHovered, setIsHovered] = useState(false);
  
  const isCompleted = auth.isAuthenticated && !auth.isGuest 
    ? history.isVideoCompleted(video.id)
    : false;
  
  const isFavorite = auth.isAuthenticated && !auth.isGuest
    ? favorites.isFavorite(video.id)
    : false;
  
  const isInWatchlist = auth.isAuthenticated && !auth.isGuest
    ? favorites.isInWatchlist(video.id)
    : false;
  
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (auth.isAuthenticated && !auth.isGuest) {
      await favorites.toggleFavorite(video.id);
    }
  };
  
  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (auth.isAuthenticated && !auth.isGuest) {
      await favorites.toggleWatchlist(video.id);
    }
  };

  const handleClick = () => {
    router.push(`/watch/${video.id}`);
  };

  const formatViews = (views: number) => {
    if (views === 0) return '0 visualizações';
    if (views === 1) return '1 visualização';
    if (views < 1000) return `${views} visualizações`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)} mil visualizações`;
    return `${(views / 1000000).toFixed(1)} mi visualizações`;
  };

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        setIsHovered(false);
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#212121',
        marginBottom: '12px'
      }}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <i className="bi bi-camera-reels"></i>
          </div>
        )}
        
        {/* Duration overlay */}
        {video.duration && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {video.duration}
          </div>
        )}

        {/* Badge "Assistir de novo" */}
        {isCompleted && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(229, 9, 20, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 2,
          }}>
            <i className="bi bi-arrow-clockwise" style={{ fontSize: '10px' }}></i>
            Assistir de novo
          </div>
        )}

        {/* Botões de ação (favoritar/watchlist) */}
        {auth.isAuthenticated && !auth.isGuest && isHovered && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '8px',
            zIndex: 3,
          }}>
            <button
              onClick={handleFavoriteClick}
              style={{
                background: isFavorite ? 'rgba(229, 9, 20, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = isFavorite ? 'rgba(229, 9, 20, 1)' : 'rgba(0, 0, 0, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = isFavorite ? 'rgba(229, 9, 20, 0.9)' : 'rgba(0, 0, 0, 0.7)';
              }}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
            </button>
            <button
              onClick={handleWatchlistClick}
              style={{
                background: isInWatchlist ? 'rgba(255, 193, 7, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = isInWatchlist ? 'rgba(255, 193, 7, 1)' : 'rgba(0, 0, 0, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = isInWatchlist ? 'rgba(255, 193, 7, 0.9)' : 'rgba(0, 0, 0, 0.7)';
              }}
              title={isInWatchlist ? 'Remover da watchlist' : 'Adicionar à watchlist'}
            >
              <i className={`bi ${isInWatchlist ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
            </button>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            color: 'white',
            fontSize: '16px',
            fontFamily: '"Roboto", "Roboto Fallback", Arial, sans-serif',
            fontWeight: 500,
            margin: '0 0 4px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4rem',
            letterSpacing: '0.011em',
            maxHeight: '2.8rem'
          }}>
            {video.title}
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
            fontFamily: '"Roboto", "Roboto Fallback", Arial, sans-serif',
            fontWeight: 400,
            margin: '4px 0 0 0',
            lineHeight: '1.4rem'
          }}>
            {formatViews(video.views)}
          </p>
        </div>
      </div>
    </div>
  );
}

