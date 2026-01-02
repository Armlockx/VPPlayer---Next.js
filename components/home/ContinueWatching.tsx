'use client';

import { useRouter } from 'next/navigation';
import { useVideoHistory } from '@/lib/hooks/useVideoHistory';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatTime } from '@/lib/utils/formatTime';

export function ContinueWatching() {
  const history = useVideoHistory();
  const auth = useAuth();
  const router = useRouter();

  const continueWatching = history.getContinueWatching();

  if (!auth.isAuthenticated || auth.isGuest || continueWatching.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: '40px', padding: '0 24px' }}>
      <h2
        style={{
          margin: '0 0 20px 0',
          color: 'white',
          fontSize: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <i className="bi bi-clock-history" style={{ fontSize: '20px' }}></i>
        Continuar Assistindo
      </h2>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '10px',
          scrollbarWidth: 'thin',
        }}
      >
        {continueWatching.map((item) => {
          if (!item.video) return null;

          const progressPercent = item.video.duration
            ? (item.last_watched_time / parseDuration(item.video.duration)) * 100
            : 0;

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/watch/${item.video!.id}`)}
              style={{
                cursor: 'pointer',
                minWidth: '280px',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#212121',
                  marginBottom: '8px',
                }}
              >
                {item.video.thumbnail ? (
                  <img
                    src={item.video.thumbnail}
                    alt={item.video.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    <i className="bi bi-camera-reels"></i>
                  </div>
                )}

                {/* Barra de progresso */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(progressPercent, 100)}%`,
                      background: '#e50914',
                    }}
                  />
                </div>

                {/* Botão play overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50px',
                    height: '50px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  className="play-overlay"
                >
                  <i className="bi bi-play-fill" style={{ fontSize: '24px', color: 'white' }}></i>
                </div>
              </div>

              {/* Info */}
              <div>
                <h3
                  style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.video.title}
                </h3>
                <p
                  style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    margin: 0,
                  }}
                >
                  {formatTime(item.last_watched_time)} de {item.video.duration || '--:--'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        div:hover .play-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
}

// Função auxiliar para converter duração "MM:SS" ou "HH:MM:SS" para segundos
function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

