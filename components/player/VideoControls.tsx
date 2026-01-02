'use client';

import { formatTime } from '@/lib/utils/formatTime';
import { useLikes } from '@/lib/hooks/useLikes';
import { useComments } from '@/lib/hooks/useComments';
import { useState, useRef, useCallback, useEffect } from 'react';
import { CommentsModal } from '../modals/CommentsModal';

interface VideoControlsProps {
  player: ReturnType<typeof import('@/lib/hooks/useVideoPlayer').useVideoPlayer>;
  visible: boolean;
  onQueueToggle: () => void;
  onAuthRequired?: () => void;
  isGuest?: boolean;
}

export function VideoControls({ player, visible, onQueueToggle, onAuthRequired, isGuest = false }: VideoControlsProps) {
  const likes = useLikes(player.currentVideo?.id || null);
  const { comments } = useComments(player.currentVideo?.id || null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<number>(0);
  const hasDraggedRef = useRef(false);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLikeClick = async () => {
    // Se for guest, mostrar modal de login
    if (isGuest) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    // Tentar fazer like - se não estiver autenticado, o hook mostrará o modal
    // Mas vamos verificar antes para ter melhor controle
    try {
      await likes.toggleLike();
    } catch (error) {
      // Se houver erro e for por falta de autenticação, mostrar modal
      if (onAuthRequired) {
        onAuthRequired();
      }
    }
  };

  // Criar canvas e vídeo oculto para preview
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Criar canvas se não existir
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }

    // Criar vídeo preview se não existir
    if (!previewVideoRef.current) {
      const previewVideo = document.createElement('video');
      previewVideo.style.display = 'none';
      previewVideo.muted = true;
      previewVideo.preload = 'auto';
      previewVideo.crossOrigin = 'anonymous';
      document.body.appendChild(previewVideo);
      previewVideoRef.current = previewVideo;
    }

    return () => {
      // Limpar canvas
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      // Limpar vídeo preview
      if (previewVideoRef.current && previewVideoRef.current.parentNode) {
        previewVideoRef.current.parentNode.removeChild(previewVideoRef.current);
        previewVideoRef.current = null;
      }
    };
  }, []);

  // Atualizar src do vídeo preview quando o vídeo principal mudar
  useEffect(() => {
    const previewVideo = previewVideoRef.current;
    const currentVideo = player.currentVideo;
    
    if (previewVideo && currentVideo?.url) {
      previewVideo.src = currentVideo.url;
      previewVideo.crossOrigin = 'anonymous';
      previewVideo.load();
    }
  }, [player.currentVideo?.id, player.currentVideo?.url]);

  const captureFrame = useCallback((time: number) => {
    const video = player.videoRef.current;
    const previewVideo = previewVideoRef.current;
    const canvas = canvasRef.current;

    if (!canvas || !previewVideo) return Promise.resolve(null);

    // Se não tiver src no preview, não pode capturar
    if (!previewVideo.src) return Promise.resolve(null);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return Promise.resolve(null);

      // Configurar canvas com proporção do vídeo (usar vídeo principal como referência)
      let videoAspect = 16 / 9;
      if (video && video.videoWidth && video.videoHeight) {
        videoAspect = video.videoWidth / video.videoHeight;
      } else if (previewVideo.videoWidth && previewVideo.videoHeight) {
        videoAspect = previewVideo.videoWidth / previewVideo.videoHeight;
      }

      const previewWidth = 160;
      const previewHeight = Math.round(previewWidth / videoAspect);

      canvas.width = previewWidth;
      canvas.height = previewHeight;

      // Usar vídeo preview para capturar frame sem interferir no principal
      return new Promise<string | null>((resolve) => {
        let resolved = false;

        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            previewVideo.removeEventListener('seeked', handleSeeked);
            previewVideo.removeEventListener('loadeddata', handleLoadedData);
            previewVideo.removeEventListener('error', handleError);
          }
        };

        const handleSeeked = () => {
          if (resolved) return;
          cleanup();
          try {
            // Aguardar um pouco para garantir que o frame está pronto
            requestAnimationFrame(() => {
              try {
                if (previewVideo.videoWidth > 0 && previewVideo.videoHeight > 0) {
                  ctx.drawImage(previewVideo, 0, 0, previewWidth, previewHeight);
                  const imageData = canvas.toDataURL('image/jpeg', 0.8);
                  resolve(imageData);
                } else {
                  resolve(null);
                }
              } catch (error) {
                console.error('Erro ao desenhar frame:', error);
                resolve(null);
              }
            });
          } catch (error) {
            console.error('Erro no handleSeeked:', error);
            resolve(null);
          }
        };

        const handleLoadedData = () => {
          // Quando o vídeo carregar, fazer seek
          if (!resolved && previewVideo.readyState >= 2) {
            previewVideo.currentTime = time;
          }
        };

        const handleError = (e: Event) => {
          console.error('Erro no preview video:', e);
          cleanup();
          resolve(null);
        };

        // Adicionar listeners
        previewVideo.addEventListener('seeked', handleSeeked);
        previewVideo.addEventListener('error', handleError);

        // Se o vídeo já tem dados carregados, fazer seek direto
        if (previewVideo.readyState >= 2) {
          previewVideo.currentTime = time;
        } else {
          // Caso contrário, esperar carregar primeiro
          previewVideo.addEventListener('loadeddata', handleLoadedData);
          if (!previewVideo.src) {
            cleanup();
            resolve(null);
          }
        }
        
        // Timeout de segurança
        setTimeout(() => {
          if (!resolved) {
            cleanup();
            resolve(null);
          }
        }, 1500);
      });
    } catch (error) {
      console.error('Erro ao capturar frame:', error);
      return Promise.resolve(null);
    }
  }, [player.videoRef]);

  const updateProgressFromMouse = useCallback((clientX: number) => {
    if (!player.duration || player.duration === 0) return;

    const progressContainer = progressContainerRef.current;
    if (!progressContainer) return;

    const rect = progressContainer.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
    const time = percentage * player.duration;

    return { time, percentage: percentage * 100 };
  }, [player.duration]);

  const handleProgressMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return; // Não fazer hover durante arraste
    if (!player.duration || player.duration === 0) return;

    const result = updateProgressFromMouse(e.clientX);
    if (!result) return;

    setHoverTime(result.time);
    setHoverPosition(result.percentage);

    // Debounce para capturar preview
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }

    captureTimeoutRef.current = setTimeout(() => {
      captureFrame(result.time).then((imageData) => {
        if (imageData) {
          setPreviewImage(imageData);
        }
      });
    }, 150);
  }, [player.duration, captureFrame, isDragging, updateProgressFromMouse]);

  const handleProgressMouseLeave = useCallback(() => {
    // Não esconder preview durante arraste
    if (isDragging) return;
    
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
    setHoverTime(null);
    setPreviewImage(null);
  }, [isDragging]);

  // Handler para iniciar arraste
  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!player.duration || player.duration === 0) return;
    
    e.preventDefault();
    hasDraggedRef.current = false;
    setIsDragging(true);
    
    const result = updateProgressFromMouse(e.clientX);
    if (result) {
      setDragTime(result.time);
      setDragPosition(result.percentage);
      setHoverTime(result.time);
      setHoverPosition(result.percentage);
      
      // Capturar preview imediatamente
      captureFrame(result.time).then((imageData) => {
        if (imageData) {
          setPreviewImage(imageData);
        }
      });
    }
  }, [player.duration, updateProgressFromMouse, captureFrame]);

  // Handler para arrastar
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!player.duration || player.duration === 0) return;

      hasDraggedRef.current = true;
      const result = updateProgressFromMouse(e.clientX);
      if (result) {
        setDragTime(result.time);
        setDragPosition(result.percentage);
        setHoverTime(result.time);
        setHoverPosition(result.percentage);

        // Atualizar preview durante arraste (com debounce menor)
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
        }

        captureTimeoutRef.current = setTimeout(() => {
          captureFrame(result.time).then((imageData) => {
            if (imageData) {
              setPreviewImage(imageData);
            }
          });
        }, 100);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && dragTime !== null) {
        // Aplicar seek quando soltar
        player.seek(dragTime);
        setIsDragging(false);
        setDragTime(null);
        // Manter preview por um momento antes de esconder
        setTimeout(() => {
          setHoverTime(null);
          setPreviewImage(null);
        }, 200);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragTime, player.duration, updateProgressFromMouse, captureFrame, player]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Se arrastou, não fazer click (evitar seek duplo)
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    if (!player.duration || player.duration === 0) return;
    
    const result = updateProgressFromMouse(e.clientX);
    if (result) {
      player.seek(result.time);
      setHoverTime(null);
      setPreviewImage(null);
    }
  };

  return (
    <>
      <div 
        className={`controls ${visible ? '' : 'hidden'}`}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            padding: '0',
            position: 'relative',
          }}
        >
          
          {/* Preview no hover ou durante arraste */}
          {((hoverTime !== null && !isDragging) || (isDragging && dragTime !== null)) && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: `${isDragging && dragTime !== null ? dragPosition : hoverPosition}%`,
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  background: 'black',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  width: previewImage ? '160px' : 'auto',
                  minWidth: '60px',
                }}
              >
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                )}
                <div
                  style={{
                    padding: '4px 8px',
                    color: 'white',
                    fontSize: '12px',
                    textAlign: 'center',
                    background: previewImage ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {formatTime(isDragging && dragTime !== null ? dragTime : (hoverTime || 0))}
                </div>
              </div>
            </div>
          )}

          {/* Barra de progresso */}
          <div
            ref={progressContainerRef}
            className="progress-container"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            style={{
              width: '100%',
              padding: '8px 0',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          >
            {/* Barra de fundo */}
            <div
              style={{
                width: '100%',
                height: '3px',
                background: 'rgba(255, 255, 255, 0.3)',
                position: 'relative',
                borderRadius: '2px',
              }}
            >
              {/* Progresso assistido (vermelho) - mostrar posição atual ou de arraste */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: isDragging && dragTime !== null
                    ? `${dragPosition}%`
                    : player.duration > 0 
                      ? `${(player.currentTime / player.duration) * 100}%`
                      : '0%',
                  background: 'red',
                  borderRadius: '2px',
                  transition: isDragging ? 'none' : 'width 0.1s ease',
                }}
              />
              
              {/* Bolinha - mostrar na posição de arraste ou posição atual */}
              {(isDragging && dragTime !== null) || (player.duration > 0 && player.currentTime > 0) ? (
                <div
                  style={{
                    position: 'absolute',
                    left: isDragging && dragTime !== null
                      ? `${dragPosition}%`
                      : `${(player.currentTime / player.duration) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isDragging ? '14px' : '12px',
                    height: isDragging ? '14px' : '12px',
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: isDragging ? '0 0 6px rgba(255, 255, 255, 0.8)' : '0 0 4px rgba(0, 0, 0, 0.5)',
                    transition: isDragging ? 'none' : 'all 0.1s ease',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: 10,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div 
          className="controls-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            position: 'relative',
          }}
        >
          <button
            onClick={player.togglePlayPause}
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {player.isPlaying ? (
              <i className="bi bi-pause-circle-fill" style={{ fontSize: '18px' }}></i>
            ) : (
              <i className="bi bi-play-circle-fill" style={{ fontSize: '18px' }}></i>
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(e) => player.changeVolume(parseFloat(e.target.value))}
            style={{
              width: '100px',
              height: '5px',
              cursor: 'pointer',
            }}
          />

          <div className="time" style={{ color: 'white', fontSize: '14px' }}>
            {formatTime(player.currentTime)} / {formatTime(player.duration)}
          </div>

          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            className={`like-btn ${likes.liked ? 'liked' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: likes.liked ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <i 
              className={`bi ${likes.liked ? 'bi-heart-fill' : 'bi-heart'}`}
              style={{ fontSize: '18px' }}
            ></i>
            <span className="like-count" style={{ fontSize: '13px', fontWeight: 500 }}>
              {likes.likeCount}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setCommentsModalOpen(true)}
            className="comments-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <i className="bi bi-chat-dots" style={{ fontSize: '18px' }}></i>
            <span className="comments-count" style={{ fontSize: '13px', fontWeight: 500 }}>
              {comments.length}
            </span>
          </button>

          {/* Queue Button - Floating on the right */}
          <button
            onClick={onQueueToggle}
            style={{
              position: 'absolute',
              right: '50px',
              width: '40px',
              height: '40px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              zIndex: 11,
            }}
          >
            <span style={{ position: 'relative' }}>
              <i className="bi bi-list" style={{ fontSize: '20px' }}></i>
              {player.videos.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'red',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {player.videos.length}
                </span>
              )}
            </span>
          </button>

          {/* Fullscreen Button - Floating on the right */}
          <button
            onClick={player.toggleFullscreen}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 11,
            }}
          >
            <i className="bi bi-arrows-fullscreen" style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      </div>

      <CommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        videoId={player.currentVideo?.id || null}
      />
    </>
  );
}
