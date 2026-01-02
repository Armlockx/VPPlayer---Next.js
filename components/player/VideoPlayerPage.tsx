'use client';

import { VideoPlayer } from './VideoPlayer';
import { VideoControls } from './VideoControls';
import { VideoLoader } from './VideoLoader';
import { VideoQueue } from '../queue/VideoQueue';
import { AuthModal } from '../auth/AuthModal';
import { StatsModal } from '../modals/StatsModal';
import { UploadModal } from '../modals/UploadModal';
import { UserDropdown } from '../user/UserDropdown';
import { useVideoPlayer } from '@/lib/hooks/useVideoPlayer';
import { useAuth } from '@/lib/hooks/useAuth';
import { useVideoHistory } from '@/lib/hooks/useVideoHistory';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface VideoPlayerPageProps {
  videoId?: string;
}

export function VideoPlayerPage({ videoId }: VideoPlayerPageProps = {} as VideoPlayerPageProps) {
  const player = useVideoPlayer();
  const auth = useAuth();
  const history = useVideoHistory();
  const router = useRouter();
  const [queueOpen, setQueueOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [queueSearchTerm, setQueueSearchTerm] = useState('');
  const progressSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Carregar vídeo específico se videoId for fornecido
  useEffect(() => {
    if (videoId && player.videos.length > 0) {
      const videoIndex = player.videos.findIndex(v => v.id === videoId);
      if (videoIndex !== -1 && player.currentVideoIndex !== videoIndex) {
        player.playVideo(videoIndex);
      }
    }
  }, [videoId, player.videos.length, player]);

  // Não mostrar modal de auth automaticamente - login é opcional
  // Removido o useEffect que forçava o modal

  // Mostrar banner de guest
  useEffect(() => {
    if (auth.isGuest) {
      setShowGuestBanner(true);
    } else {
      setShowGuestBanner(false);
    }
  }, [auth.isGuest]);

  // Verificar se é admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.user && !auth.isGuest) {
        const adminStatus = await auth.checkAdmin();
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [auth.user, auth.isGuest, auth]);

  // Carregar progresso salvo quando vídeo muda
  useEffect(() => {
    let mounted = true;
    
    const loadSavedProgress = async () => {
      if (!player.currentVideo || !auth.isAuthenticated || auth.isGuest) return;
      
      try {
        const savedTime = await history.getVideoProgress(player.currentVideo.id);
        if (mounted && savedTime !== null && savedTime > 5) {
          // Só restaurar se tiver mais de 5 segundos salvos
          player.seek(savedTime);
        }
      } catch (error) {
        // Ignorar erros silenciosamente (tabela pode não existir ainda)
      }
    };

    if (player.currentVideo) {
      // Debounce para evitar múltiplas chamadas
      const timeoutId = setTimeout(loadSavedProgress, 500);
      return () => {
        mounted = false;
        clearTimeout(timeoutId);
      };
    }
    
    return () => {
      mounted = false;
    };
  }, [player.currentVideo?.id, auth.isAuthenticated, auth.isGuest, history, player]);

  // Salvar progresso periodicamente
  useEffect(() => {
    if (!player.currentVideo || !auth.isAuthenticated || auth.isGuest) {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
        progressSaveIntervalRef.current = null;
      }
      return;
    }

    // Salvar progresso a cada 10 segundos
    progressSaveIntervalRef.current = setInterval(() => {
      if (player.currentVideo && player.duration > 0) {
        const currentTime = player.currentTime;
        // Só salvar se mudou significativamente (mais de 2 segundos)
        if (Math.abs(currentTime - lastSavedTimeRef.current) > 2) {
          history.saveProgress(
            player.currentVideo.id,
            currentTime,
            player.duration,
            false
          );
          lastSavedTimeRef.current = currentTime;
        }
      }
    }, 10000);

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [player.currentVideo?.id, player.currentTime, player.duration, auth.isAuthenticated, auth.isGuest, history]);

  // Salvar progresso quando vídeo termina
  useEffect(() => {
    const video = player.videoRef.current;
    if (!video || !player.currentVideo || !auth.isAuthenticated || auth.isGuest) return;

    const handleEnded = () => {
      history.saveProgress(
        player.currentVideo!.id,
        player.duration,
        player.duration,
        true // Completado
      );
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [player.currentVideo?.id, player.duration, auth.isAuthenticated, auth.isGuest, history, player]);

  // Comandos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input ou textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          player.togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.seekForward(5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.seekBackward(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.increaseVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.decreaseVolume(0.1);
          break;
        case 'KeyF':
          e.preventDefault();
          player.toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          player.changeVolume(player.volume > 0 ? 0 : 1);
          break;
        default:
          // Atalhos numéricos (0-9) para ir para 0-90% do vídeo
          if (e.code.startsWith('Digit') && player.duration > 0) {
            const digit = parseInt(e.code.replace('Digit', ''));
            if (digit >= 0 && digit <= 9) {
              e.preventDefault();
              const targetTime = (digit / 10) * player.duration;
              player.seek(targetTime);
            }
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [player]);

  return (
    <div 
      ref={player.playerContainerRef}
      className="player" 
      onMouseMove={player.resetControlsTimeout}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={player.videoRef}
        className="w-full h-full object-contain"
        onClick={player.togglePlayPause}
        controls={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      
      {player.currentVideo && (
        <div 
          className="video-title"
          style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            zIndex: 10,
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            maxWidth: 'calc(100% - 40px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: player.controlsVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: player.controlsVisible ? 'auto' : 'none',
          }}
        >
          {player.currentVideo.title}
        </div>
      )}

      {/* User Dropdown */}
      {auth.isAuthenticated && !auth.isGuest && (
        <UserDropdown isAdmin={isAdmin} controlsVisible={player.controlsVisible} />
      )}
      
      {/* Guest Login Button */}
      {(!auth.isAuthenticated || auth.isGuest) && (
        <button
          onClick={() => setAuthModalOpen(true)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '45px',
            height: '45px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            opacity: player.controlsVisible ? 0.7 : 0,
            transition: 'opacity 0.3s ease',
            padding: 0,
            pointerEvents: player.controlsVisible ? 'auto' : 'none',
          }}
          onMouseEnter={(e) => {
            if (player.controlsVisible) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (player.controlsVisible) {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }
          }}
          title="Entrar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              width: '24px',
              height: '24px',
              color: 'white',
            }}
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </button>
      )}

      {/* Banner de Guest */}
      {showGuestBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '50px',
            padding: '10px 20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <i className="bi bi-person" style={{ fontSize: '18px' }}></i>
          <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '14px', fontWeight: 500 }}>
            Modo <strong style={{ color: 'rgba(255, 193, 7, 1)' }}>Convidado</strong>
          </span>
          <button
            onClick={() => setAuthModalOpen(true)}
            style={{
              color: 'rgba(255, 193, 7, 1)',
              textDecoration: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              padding: '6px 14px',
              background: 'rgba(255, 193, 7, 0.15)',
              border: '1px solid rgba(255, 193, 7, 0.4)',
              borderRadius: '20px',
              marginLeft: '8px',
              borderStyle: 'none',
            }}
          >
            Entrar
          </button>
        </div>
      )}

      <VideoLoader isLoading={player.isLoading} progress={player.loadProgress} />
      
      <VideoControls
        player={player}
        visible={player.controlsVisible}
        onQueueToggle={() => setQueueOpen(!queueOpen)}
        onAuthRequired={() => setAuthModalOpen(true)}
        isGuest={auth.isGuest}
      />

      <VideoQueue
        videos={player.videos}
        currentIndex={player.currentVideoIndex}
        isOpen={queueOpen}
        onClose={() => setQueueOpen(false)}
        onSelectVideo={player.playVideo}
        onUploadClick={() => {
          setUploadModalOpen(true);
          setQueueOpen(false);
        }}
        onStatsClick={() => {
          setStatsModalOpen(true);
          setQueueOpen(false);
        }}
        searchTerm={queueSearchTerm}
        onSearchChange={setQueueSearchTerm}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        currentVideoId={player.currentVideo?.id || null}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onVideoAdded={() => {
          player.fetchVideos();
        }}
      />
    </div>
  );
}
