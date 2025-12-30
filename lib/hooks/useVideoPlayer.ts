'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
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
  const currentTrackingVideoIdRef = useRef<string | null>(null);

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
        if (data.length > 0 && videoRef.current) {
          videoRef.current.src = data[0].url;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Controles de reprodução
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && videoRef.current) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const nextVideo = useCallback(() => {
    if (currentVideoIndex < videos.length - 1) {
      stopWatchTimeTracking();
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      if (videoRef.current) {
        videoRef.current.src = videos[nextIndex].url;
        videoRef.current.play();
      }
    }
  }, [currentVideoIndex, videos, stopWatchTimeTracking]);

  const previousVideo = useCallback(() => {
    if (currentVideoIndex > 0) {
      stopWatchTimeTracking();
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      if (videoRef.current) {
        videoRef.current.src = videos[prevIndex].url;
        videoRef.current.play();
      }
    }
  }, [currentVideoIndex, videos, stopWatchTimeTracking]);

  const playVideo = useCallback((index: number) => {
    if (index >= 0 && index < videos.length) {
      stopWatchTimeTracking();
      setCurrentVideoIndex(index);
      if (videoRef.current) {
        videoRef.current.src = videos[index].url;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [videos, stopWatchTimeTracking]);

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

    currentTrackingVideoIdRef.current = videoId;
    lastWatchTimeUpdateRef.current = Date.now();

    // Atualizar watch_time a cada 10 segundos
    watchTimeIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && currentTrackingVideoIdRef.current === videoId) {
        const now = Date.now();
        const elapsedSeconds = (now - lastWatchTimeUpdateRef.current) / 1000;

        if (elapsedSeconds >= 10) {
          incrementWatchTime(videoId, elapsedSeconds);
          lastWatchTimeUpdateRef.current = now;
        }
      }
    }, 10000); // Verificar a cada 10 segundos
  }, [incrementWatchTime]);

  // Parar rastreamento de watch_time
  const stopWatchTimeTracking = useCallback(() => {
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }

    // Salvar tempo restante antes de parar
    const video = videoRef.current;
    if (video && !video.paused && currentTrackingVideoIdRef.current) {
      const now = Date.now();
      const elapsedSeconds = (now - lastWatchTimeUpdateRef.current) / 1000;
      if (elapsedSeconds > 0) {
        incrementWatchTime(currentTrackingVideoIdRef.current, elapsedSeconds);
      }
    }

    currentTrackingVideoIdRef.current = null;
  }, [incrementWatchTime]);

  // Event handlers do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      
      // Usar o índice atual para obter o vídeo correto
      const currentIdx = currentVideoIndex;
      const currentVideo = videos[currentIdx];
      
      if (currentVideo) {
        // Incrementar views quando o vídeo começa a tocar pela primeira vez
        if (!viewTrackedRef.current.has(currentVideo.id)) {
          incrementViews(currentVideo.id);
        }

        // Iniciar rastreamento de watch_time
        startWatchTimeTracking(currentVideo.id);
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopWatchTimeTracking();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1);
        const progress = (buffered / video.duration) * 100;
        setLoadProgress(progress);
      }
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      stopWatchTimeTracking();
    };
  }, [videos, currentVideoIndex, incrementViews, startWatchTimeTracking, stopWatchTimeTracking]);

  // Parar rastreamento quando o vídeo muda
  useEffect(() => {
    return () => {
      stopWatchTimeTracking();
    };
  }, [currentVideoIndex, stopWatchTimeTracking]);

  // Limpar intervalo quando componente desmontar
  useEffect(() => {
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
      }
    };
  }, []);

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
    isPlaying,
    currentTime,
    duration,
    volume,
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
    toggleFullscreen,
    nextVideo,
    previousVideo,
    playVideo,
    resetControlsTimeout,
    fetchVideos,
  };
}


