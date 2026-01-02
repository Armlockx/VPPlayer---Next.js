'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<'auto' | number>('auto');
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'medium' | 'poor'>('good');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Rastreamento de estatísticas
  const viewTrackedRef = useRef<Set<string>>(new Set());
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWatchTimeUpdateRef = useRef<number>(Date.now());
  const lastVideoTimeRef = useRef<number>(0); // Último currentTime do vídeo
  const currentTrackingVideoIdRef = useRef<string | null>(null);
  const currentVideoUrlRef = useRef<string | null>(null); // Rastrear URL do vídeo atual
  const wasPlayingWhenHiddenRef = useRef<boolean>(false); // Se estava tocando quando perdeu foco

  const supabase = createClient();

  // Buscar vídeos do Supabase
  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setVideos(data);
        // Não iniciar vídeo automaticamente - será controlado pelo componente
      }
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Controles de reprodução
  const togglePlayPause = useCallback(async () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          // Autoplay bloqueado - usuário precisa interagir primeiro
          console.log('Autoplay bloqueado, aguardando interação do usuário');
          setIsPlaying(false);
        }
      }
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const seekForward = useCallback((seconds: number = 5) => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + seconds, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const seekBackward = useCallback((seconds: number = 5) => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - seconds, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const increaseVolume = useCallback((step: number = 0.1) => {
    if (videoRef.current) {
      const newVolume = Math.min(volume + step, 1);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, [volume]);

  const decreaseVolume = useCallback((step: number = 0.1) => {
    if (videoRef.current) {
      const newVolume = Math.max(volume - step, 0);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, [volume]);

  const changeVolume = useCallback((vol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  }, []);

  // Controles de velocidade de reprodução
  const changePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  // Controles de qualidade visual (CSS scaling)
  const changeQuality = useCallback((quality: 'auto' | number) => {
    setQuality(quality);
    if (videoRef.current) {
      const video = videoRef.current;
      if (quality === 'auto') {
        video.style.transform = '';
        video.style.transformOrigin = '';
      } else {
        video.style.transform = `scale(${quality})`;
        video.style.transformOrigin = 'center center';
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    // Verificar se já está em fullscreen (com suporte a prefixos)
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      // Entrar em fullscreen usando o container, não o video
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        // Safari
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        // Firefox
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) {
        // IE/Edge
        (container as any).msRequestFullscreen();
      }
    } else {
      // Sair do fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }, []);

  // Função para incrementar views
  const incrementViews = useCallback(async (videoId: string) => {
    if (!videoId || viewTrackedRef.current.has(videoId)) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('increment_video_views', {
        video_id: videoId,
      });

      if (error) {
        console.error('Erro ao incrementar views:', error);
        return;
      }

      viewTrackedRef.current.add(videoId);
      console.log('Views incrementadas para vídeo:', videoId, 'Total:', data);

      // Atualizar lista de vídeos localmente
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? { ...video, views: typeof data === 'number' ? data : (video.views || 0) + 1 }
            : video
        )
      );
    } catch (error) {
      console.error('Erro ao incrementar views:', error);
    }
  }, [supabase]);

  // Função para incrementar watch_time
  const incrementWatchTime = useCallback(async (videoId: string, seconds: number) => {
    if (!videoId || seconds <= 0) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('increment_video_watch_time', {
        video_id: videoId,
        seconds: seconds,
      });

      if (error) {
        console.error('Erro ao incrementar watch_time:', error);
        return;
      }

      console.log(`Watch_time incrementado para vídeo ${videoId}: +${seconds}s, Total:`, data);

      // Atualizar lista de vídeos localmente
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? { ...video, watch_time: typeof data === 'number' ? data : (video.watch_time || 0) + seconds }
            : video
        )
      );

      lastWatchTimeUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Erro ao incrementar watch_time:', error);
    }
  }, [supabase]);

  // Iniciar rastreamento de watch_time
  const startWatchTimeTracking = useCallback((videoId: string) => {
    // Parar rastreamento anterior se houver
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }

    if (!videoId) return;

    const video = videoRef.current;
    if (!video) return;

    currentTrackingVideoIdRef.current = videoId;
    lastWatchTimeUpdateRef.current = Date.now();
    lastVideoTimeRef.current = video.currentTime || 0;
    wasPlayingWhenHiddenRef.current = !video.paused;

    // Atualizar watch_time a cada 5 segundos
    // IMPORTANTE: Continuar contando mesmo quando a aba não está focada
    watchTimeIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      // Verificar se ainda estamos rastreando o mesmo vídeo
      // Verificar pela URL também para garantir que é o vídeo correto
      const currentUrl = video.src || video.currentSrc;
      if (currentVideoUrlRef.current && currentUrl !== currentVideoUrlRef.current) {
        // Vídeo mudou, parar rastreamento
        return;
      }

      // Continuar contando mesmo se a aba não estiver focada
      // Usar o currentTime do vídeo para calcular o tempo real assistido
      if (currentTrackingVideoIdRef.current === videoId && !video.ended) {
        const currentVideoTime = video.currentTime || 0;
        const timeElapsed = currentVideoTime - lastVideoTimeRef.current;
        
        // Só contar se o tempo avançou (vídeo estava tocando)
        // Se estava tocando quando perdeu foco, continuar contando
        if (timeElapsed > 0 || wasPlayingWhenHiddenRef.current) {
          const now = Date.now();
          const elapsedSeconds = (now - lastWatchTimeUpdateRef.current) / 1000;

          // Atualizar se passaram pelo menos 5 segundos
          if (elapsedSeconds >= 5) {
            // Usar o tempo real do vídeo (currentTime) como base
            // Isso garante que contamos apenas o tempo que o vídeo realmente avançou
            const timeToCount = timeElapsed > 0 ? timeElapsed : elapsedSeconds;
            
            if (timeToCount > 0) {
              incrementWatchTime(videoId, timeToCount).catch((error) => {
                console.error('Erro ao incrementar watch_time no intervalo:', error);
              });
              lastWatchTimeUpdateRef.current = now;
              lastVideoTimeRef.current = currentVideoTime;
            }
          }
        }
      }
    }, 5000); // Verificar a cada 5 segundos
  }, [incrementWatchTime]);

  // Função auxiliar para salvar tempo assistido
  const saveWatchTime = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !currentTrackingVideoIdRef.current) return;

    const now = Date.now();
    const elapsedSeconds = (now - lastWatchTimeUpdateRef.current) / 1000;
    
    // Salvar se tiver pelo menos 0.1 segundos (para evitar salvar valores muito pequenos)
    if (elapsedSeconds > 0.1) {
      try {
        await incrementWatchTime(currentTrackingVideoIdRef.current, elapsedSeconds);
        lastWatchTimeUpdateRef.current = now;
      } catch (error) {
        console.error('Erro ao salvar watch_time:', error);
      }
    }
  }, [incrementWatchTime]);

  // Parar rastreamento de watch_time
  const stopWatchTimeTracking = useCallback((saveRemainingTime: boolean = true) => {
    // Salvar tempo restante antes de parar (se solicitado)
    if (saveRemainingTime) {
      saveWatchTime();
    }

    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }

    currentTrackingVideoIdRef.current = null;
  }, [saveWatchTime]);

  const nextVideo = useCallback(async () => {
    if (currentVideoIndex < videos.length - 1) {
      stopWatchTimeTracking();
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      if (videoRef.current) {
        videoRef.current.src = videos[nextIndex].url;
        currentVideoUrlRef.current = videos[nextIndex].url; // Atualizar URL atual
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          // Autoplay bloqueado
          setIsPlaying(false);
        }
      }
    }
  }, [currentVideoIndex, videos, stopWatchTimeTracking]);

  const previousVideo = useCallback(async () => {
    if (currentVideoIndex > 0) {
      stopWatchTimeTracking();
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      if (videoRef.current) {
        videoRef.current.src = videos[prevIndex].url;
        currentVideoUrlRef.current = videos[prevIndex].url; // Atualizar URL atual
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          // Autoplay bloqueado
          setIsPlaying(false);
        }
      }
    }
  }, [currentVideoIndex, videos, stopWatchTimeTracking]);

  const playVideo = useCallback(async (index: number) => {
    if (index >= 0 && index < videos.length) {
      stopWatchTimeTracking();
      setCurrentVideoIndex(index);
      if (videoRef.current) {
        videoRef.current.src = videos[index].url;
        currentVideoUrlRef.current = videos[index].url; // Atualizar URL atual
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          // Autoplay bloqueado - usuário precisa clicar para iniciar
          setIsPlaying(false);
        }
      }
    }
  }, [videos, stopWatchTimeTracking]);

  // Monitorar qualidade de conexão
  const updateConnectionQuality = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // networkState: 0 = EMPTY, 1 = IDLE, 2 = LOADING, 3 = NO_SOURCE
    // readyState: 0 = HAVE_NOTHING, 1 = HAVE_METADATA, 2 = HAVE_CURRENT_DATA, 3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA
    
    if (video.readyState >= 4) {
      setConnectionQuality('good');
    } else if (video.readyState >= 2) {
      setConnectionQuality('medium');
    } else {
      setConnectionQuality('poor');
    }
  }, []);

  // Event handlers do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      wasPlayingWhenHiddenRef.current = true;
      
      // Identificar vídeo atual pela URL do elemento video, não pelo índice
      // Isso garante que sempre pegamos o vídeo correto
      const currentUrl = video.src || video.currentSrc;
      currentVideoUrlRef.current = currentUrl;
      
      // Encontrar o vídeo na lista pela URL
      const currentVideo = videos.find(v => v.url === currentUrl);
      
      if (currentVideo) {
        // Incrementar views quando o vídeo começa a tocar pela primeira vez
        if (!viewTrackedRef.current.has(currentVideo.id)) {
          incrementViews(currentVideo.id);
        }

        // Se já estava rastreando este vídeo, apenas atualizar o timestamp
        // Caso contrário, iniciar novo rastreamento
        if (currentTrackingVideoIdRef.current !== currentVideo.id) {
          startWatchTimeTracking(currentVideo.id);
        } else {
          // Continuar rastreamento, apenas atualizar timestamp e currentTime
          lastWatchTimeUpdateRef.current = Date.now();
          lastVideoTimeRef.current = video.currentTime || 0;
        }
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      wasPlayingWhenHiddenRef.current = false;
      
      // Salvar o tempo assistido quando pausa (mesmo que seja menos de 5 segundos)
      // Mas só salvar se foi pausado manualmente, não por perda de foco
      // Verificar se a aba está visível
      if (!document.hidden) {
        saveWatchTime();
      }
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1);
        const progress = (buffered / video.duration) * 100;
        setLoadProgress(progress);
        
        // Atualizar ranges de buffer
        const ranges: { start: number; end: number }[] = [];
        for (let i = 0; i < video.buffered.length; i++) {
          ranges.push({
            start: video.buffered.start(i),
            end: video.buffered.end(i)
          });
        }
        setBufferedRanges(ranges);
      }
    };
    const handleFullscreenChange = () => {
      // Verificar fullscreen com suporte a prefixos de diferentes navegadores
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreen);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadeddata', updateConnectionQuality);
    video.addEventListener('canplaythrough', updateConnectionQuality);
    video.addEventListener('waiting', () => setConnectionQuality('poor'));
    video.addEventListener('playing', () => updateConnectionQuality());
    
    // Adicionar listeners para fullscreen com suporte a prefixos
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadeddata', updateConnectionQuality);
      video.removeEventListener('canplaythrough', updateConnectionQuality);
      video.removeEventListener('waiting', () => setConnectionQuality('poor'));
      video.removeEventListener('playing', () => updateConnectionQuality());
      
      // Remover listeners de fullscreen
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      stopWatchTimeTracking(true); // Salvar tempo ao desmontar
    };
  }, [videos, currentVideoIndex, incrementViews, startWatchTimeTracking, stopWatchTimeTracking, saveWatchTime, updateConnectionQuality]);

  // Parar e salvar rastreamento quando o vídeo muda
  useEffect(() => {
    // Quando o vídeo muda, salvar o tempo do vídeo anterior
    return () => {
      stopWatchTimeTracking(true); // Salvar tempo restante
    };
  }, [currentVideoIndex, stopWatchTimeTracking]);

  // Salvar watch_time quando sair da página (beforeunload) ou aba ficar oculta
  // IMPORTANTE: Continuar contando watch time mesmo quando a aba não está focada
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Salvar tempo assistido ao sair da página (não podemos esperar pela promise)
      const video = videoRef.current;
      if (!video || !currentTrackingVideoIdRef.current) return;

      const now = Date.now();
      const elapsedSeconds = (now - lastWatchTimeUpdateRef.current) / 1000;
      
      if (elapsedSeconds > 0.1) {
        const videoId = currentTrackingVideoIdRef.current;
        // Fazer chamada direta sem esperar resposta (fire and forget)
        incrementWatchTime(videoId, elapsedSeconds).catch(() => {
          // Ignorar erros ao sair da página
        });
      }
    };

    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video || !currentTrackingVideoIdRef.current) return;

      if (document.hidden) {
        // Quando a aba fica oculta, salvar o tempo até agora
        // Marcar se estava tocando para continuar contando
        wasPlayingWhenHiddenRef.current = !video.paused;
        if (wasPlayingWhenHiddenRef.current) {
          saveWatchTime();
        }
      } else {
        // Quando volta a ficar visível, atualizar timestamp para continuar contando
        // Se estava tocando quando perdeu foco e ainda não terminou, continuar
        if (wasPlayingWhenHiddenRef.current && !video.ended) {
          lastWatchTimeUpdateRef.current = Date.now();
          lastVideoTimeRef.current = video.currentTime || 0;
          // Se o vídeo foi pausado pelo navegador, não fazer nada
          // Se ainda está tocando, continuar rastreamento
          if (!video.paused) {
            wasPlayingWhenHiddenRef.current = true;
          }
        }
      }
    };

    // Continuar contando watch time mesmo quando a aba não está focada
    // Usar um intervalo separado que verifica o currentTime do vídeo
    const backgroundWatchTimeInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !currentTrackingVideoIdRef.current) return;

      // Verificar se o vídeo ainda é o mesmo pela URL
      const currentUrl = video.src || video.currentSrc;
      if (currentVideoUrlRef.current && currentUrl !== currentVideoUrlRef.current) {
        return; // Vídeo mudou
      }

      // Continuar contando mesmo se a aba não estiver focada
      // Usar o currentTime do vídeo para calcular o tempo real assistido
      if (currentTrackingVideoIdRef.current && !video.ended && wasPlayingWhenHiddenRef.current) {
        const currentVideoTime = video.currentTime || 0;
        const timeElapsed = currentVideoTime - lastVideoTimeRef.current;
        
        // Se o tempo do vídeo avançou, contar (mesmo que esteja pausado pelo navegador)
        // Isso permite contar o tempo que o vídeo estava tocando antes de perder foco
        if (timeElapsed > 0) {
          const now = Date.now();
          const elapsedSeconds = (now - lastWatchTimeUpdateRef.current) / 1000;

          // Atualizar a cada 10 segundos quando em background
          if (elapsedSeconds >= 10) {
            // Usar o tempo real do vídeo
            incrementWatchTime(currentTrackingVideoIdRef.current, timeElapsed).catch(() => {
              // Ignorar erros em background
            });
            lastWatchTimeUpdateRef.current = now;
            lastVideoTimeRef.current = currentVideoTime;
          }
        }
      }
    }, 10000); // Verificar a cada 10 segundos quando em background

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(backgroundWatchTimeInterval);
      // Também salvar ao desmontar o componente
      saveWatchTime();
    };
  }, [saveWatchTime, incrementWatchTime]);

  // Limpar intervalo quando componente desmontar
  useEffect(() => {
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
      }
      // Salvar tempo restante ao desmontar
      saveWatchTime();
    };
  }, [saveWatchTime]);

  // Controles automáticos (esconder após inatividade)
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setControlsVisible(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  return {
    videoRef,
    playerContainerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    quality,
    bufferedRanges,
    connectionQuality,
    isFullscreen,
    isLoading,
    loadProgress,
    videos,
    currentVideoIndex,
    currentVideo: videos[currentVideoIndex] || null,
    controlsVisible,
    togglePlayPause,
    seek,
    seekForward,
    seekBackward,
    changeVolume,
    increaseVolume,
    decreaseVolume,
    changePlaybackRate,
    changeQuality,
    toggleFullscreen,
    nextVideo,
    previousVideo,
    playVideo,
    resetControlsTimeout,
    fetchVideos,
  };
}


