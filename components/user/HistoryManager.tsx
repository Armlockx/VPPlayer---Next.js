'use client';

import { useState } from 'react';
import { useVideoHistory } from '@/lib/hooks/useVideoHistory';
import { useAuth } from '@/lib/hooks/useAuth';

interface HistoryManagerProps {
  onClose?: () => void;
}

export function HistoryManager({ onClose }: HistoryManagerProps) {
  const history = useVideoHistory();
  const auth = useAuth();
  const [clearing, setClearing] = useState(false);
  const [clearingVideoId, setClearingVideoId] = useState<string | null>(null);

  if (!auth.isAuthenticated || auth.isGuest) {
    return null;
  }

  const handleClearAll = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico?')) {
      return;
    }

    try {
      setClearing(true);
      await history.clearHistory();
      if (onClose) onClose();
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      alert('Erro ao limpar histórico');
    } finally {
      setClearing(false);
    }
  };

  const handleClearVideo = async (videoId: string) => {
    try {
      setClearingVideoId(videoId);
      await history.clearHistory(videoId);
    } catch (error) {
      console.error('Erro ao limpar histórico do vídeo:', error);
      alert('Erro ao limpar histórico');
    } finally {
      setClearingVideoId(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 600 }}>
          Histórico de Visualização
        </h3>
        {history.history.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            style={{
              padding: '8px 16px',
              background: clearing ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 68, 68, 0.2)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: '6px',
              color: '#ff6b6b',
              fontSize: '13px',
              fontWeight: 500,
              cursor: clearing ? 'not-allowed' : 'pointer',
            }}
          >
            {clearing ? 'Limpando...' : 'Limpar Tudo'}
          </button>
        )}
      </div>

      {history.loading ? (
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
          Carregando histórico...
        </div>
      ) : history.history.length === 0 ? (
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
          Nenhum vídeo no histórico
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.history.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {item.video?.thumbnail && (
                <img
                  src={item.video.thumbnail}
                  alt={item.video.title}
                  style={{
                    width: '120px',
                    height: '68px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    margin: '0 0 4px 0',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.video?.title || 'Vídeo removido'}
                </h4>
                <p style={{ margin: '4px 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  {item.completed ? '✓ Completo' : `Parou em ${Math.round(item.last_watched_time)}s`}
                </p>
                <p style={{ margin: '4px 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
                  {new Date(item.last_watched_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => item.video_id && handleClearVideo(item.video_id)}
                disabled={clearingVideoId === item.video_id}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 68, 68, 0.2)',
                  border: '1px solid rgba(255, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#ff6b6b',
                  fontSize: '12px',
                  cursor: clearingVideoId === item.video_id ? 'not-allowed' : 'pointer',
                  height: 'fit-content',
                }}
              >
                {clearingVideoId === item.video_id ? '...' : 'Remover'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

