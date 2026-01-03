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
  const accumulatedWatchTimeRef = useRef<number>(0); // Tempo acumulado desde a última atualização no banco
  const isTrackingRef = useRef<boolean>(false); // Se está rastreando ativamente

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

  // Função para incrementar watch_time no banco
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

      console.log(`✅ Watch_time salvo no banco para vídeo ${videoId}: +${seconds.toFixed(2)}s, Total:`, data);

      // Atualizar lista de vídeos localmente
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? { ...video, watch_time: typeof data === 'number' ? data : (video.watch_time || 0) + seconds }
            : video
        )
      );

      // Resetar acumulador após salvar
      accumulatedWatchTimeRef.current = 0;
      lastWatchTimeUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Erro ao incrementar watch_time:', error);
    }
  }, [supabase]);

  // Função para salvar watch_time acumulado no banco
  const saveAccumulatedWatchTime = useCallback(async (force: boolean = false) => {
    const video = videoRef.current;
    // Verificar se tudo está pronto - retornar silenciosamente se não estiver
    if (!video || !currentTrackingVideoIdRef.current || !isTrackingRef.current) {
      return; // Não logar warnings desnecessários
    }

    // Se está tocando, atualizar acumulador antes de salvar
    // IMPORTANTE: Só contar tempo quando o vídeo está realmente tocando (não pausado)
    if (!video.paused && !video.ended) {
      const currentVideoTime = video.currentTime || 0;
      const timeElapsed = currentVideoTime - lastVideoTimeRef.current;
      
      // Só contar se o tempo avançou (vídeo está realmente tocando)
      if (timeElapsed > 0) {
        accumulatedWatchTimeRef.current += timeElapsed;
        lastVideoTimeRef.current = currentVideoTime;
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`📊 [${timestamp}] Tempo acumulado: +${timeElapsed.toFixed(2)}s (Total acumulado: ${accumulatedWatchTimeRef.current.toFixed(2)}s, vídeo em: ${currentVideoTime.toFixed(1)}s)`);
      } else {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`⏸️ [${timestamp}] Vídeo não avançou (pode estar pausado ou travado). Último tempo: ${lastVideoTimeRef.current.toFixed(1)}s, Atual: ${currentVideoTime.toFixed(1)}s`);
      }
    } else {
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.log(`⏸️ [${timestamp}] Vídeo pausado ou finalizado (paused: ${video.paused}, ended: ${video.ended}). Acumulado: ${accumulatedWatchTimeRef.current.toFixed(2)}s`);
    }
    // Se está pausado, não acumular tempo, mas manter o que já foi acumulado

    // Salvar no banco se acumulou pelo menos 5 segundos ou se for forçado
    const shouldSave = force || accumulatedWatchTimeRef.current >= 5;
    
    if (shouldSave && accumulatedWatchTimeRef.current > 0) {
      const timeToSave = accumulatedWatchTimeRef.current;
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.log(`💾 [${timestamp}] ✅ Salvando watch time no banco: ${timeToSave.toFixed(2)}s (forçado: ${force})`);
      await incrementWatchTime(currentTrackingVideoIdRef.current, timeToSave);
    } else if (accumulatedWatchTimeRef.current > 0) {
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.log(`⏳ [${timestamp}] Aguardando mais tempo... (${accumulatedWatchTimeRef.current.toFixed(2)}s acumulado, precisa de 5s)`);
    } else {
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.log(`⏳ [${timestamp}] Nenhum tempo acumulado ainda...`);
    }
  }, [incrementWatchTime]);

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

    console.log(`🎬 Iniciando rastreamento de watch time para vídeo: ${videoId}`);
    
    currentTrackingVideoIdRef.current = videoId;
    lastWatchTimeUpdateRef.current = Date.now();
    lastVideoTimeRef.current = video.currentTime || 0;
    accumulatedWatchTimeRef.current = 0;
    isTrackingRef.current = true;
    wasPlayingWhenHiddenRef.current = !video.paused;

    // Salvar watch_time no banco a cada 5 segundos enquanto está tocando
    watchTimeIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      // Verificar se tudo está pronto antes de tentar salvar
      if (!video || !currentTrackingVideoIdRef.current || !isTrackingRef.current) {
        return; // Não logar warning aqui, apenas retornar silenciosamente
      }
      
      if (!video.paused && !video.ended) {
        console.log(`⏱️ [${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] Intervalo de 5s: Verificando watch time (acumulado: ${accumulatedWatchTimeRef.current.toFixed(2)}s)`);
        saveAccumulatedWatchTime(false); // false = só salvar se acumulou >= 5s
      }
    }, 5000); // Verificar a cada 5 segundos
    
    console.log(`✅ Rastreamento iniciado. Intervalo configurado para 5 segundos.`);
  }, [saveAccumulatedWatchTime]);

  // Função auxiliar para salvar tempo assistido (força salvamento imediato)
  const saveWatchTime = useCallback(async () => {
    await saveAccumulatedWatchTime(true); // true = forçar salvamento mesmo se < 5s
  }, [saveAccumulatedWatchTime]);

  // Parar rastreamento de watch_time
  const stopWatchTimeTracking = useCallback(async (saveRemainingTime: boolean = true) => {
    // Salvar tempo restante antes de parar (se solicitado)
    if (saveRemainingTime) {
      await saveWatchTime();
    }

    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }

    isTrackingRef.current = false;
    currentTrackingVideoIdRef.current = null;
    accumulatedWatchTimeRef.current = 0;
  }, [saveWatchTime]);

  const nextVideo = useCallback(async () => {
    if (currentVideoIndex < videos.length - 1) {
      await stopWatchTimeTracking();
      const nextIndex = currentVideoIndex + 1;
      const nextVideo = videos[nextIndex];
      setCurrentVideoIndex(nextIndex);
      if (videoRef.current) {
        videoRef.current.src = nextVideo.url;
        currentVideoUrlRef.current = nextVideo.url; // Atualizar URL atual
        
        // NÃO iniciar rastreamento aqui - esperar pelo evento 'play'
        // Isso evita iniciar duas vezes
        
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          // O rastreamento será iniciado no handlePlay
        } catch (error) {
          // Autoplay bloqueado
          setIsPlaying(false);
        }
      }
    }
  }, [currentVideoIndex, videos, stopWatchTimeTracking]);

  const previousVideo = useCallback(async () => {
    if (currentVideoIndex > 0) {
      await stopWatchTimeTracking();
      const prevIndex = currentVideoIndex - 1;
      const prevVideo = videos[prevIndex];
      setCurrentVideoIndex(prevIndex);
      if (videoRef.current) {
        videoRef.current.src = prevVideo.url;
        currentVideoUrlRef.current = prevVideo.url; // Atualizar URL atual
        
        // NÃO iniciar rastreamento aqui - esperar pelo evento 'play'
        // Isso evita iniciar duas vezes
        
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          // O rastreamento será iniciado no handlePlay
        } catch (error) {
          // Autoplay bloqueado
          setIsPlaying(false);
        }
      }
    }
  }, [currentVideoIndex, videos, stopWatchTimeTracking]);

  const playVideo = useCallback(async (index: number): Promise<void> => {
    if (index >= 0 && index < videos.length) {
      // Parar rastreamento do vídeo anterior
      await stopWatchTimeTracking();
      
      const video = videos[index];
      console.log(`🎬 playVideo chamado - Índice: ${index}, Vídeo ID: ${video.id}, URL: ${video.url}`);
      
      if (videoRef.current) {
        // Atualizar índice primeiro
        setCurrentVideoIndex(index);
        
        // Verificar se a URL mudou antes de atualizar
        // Normalizar URLs para comparação (remover query params e fragmentos)
        const normalizeUrl = (url: string) => {
          try {
            const urlObj = new URL(url);
            return urlObj.origin + urlObj.pathname;
          } catch {
            return url;
          }
        };
        
        const currentSrc = videoRef.current.src || '';
        const normalizedCurrentSrc = normalizeUrl(currentSrc);
        const normalizedVideoUrl = normalizeUrl(video.url);
        
        // Só recarregar se a URL realmente mudou
        const needsReload = normalizedCurrentSrc !== normalizedVideoUrl && currentVideoUrlRef.current !== video.url;
        
        if (needsReload) {
          console.log(`📹 Mudando fonte do vídeo de ${currentVideoUrlRef.current} para ${video.url}`);
          
          videoRef.current.src = video.url;
          currentVideoUrlRef.current = video.url;
          
          // Carregar o vídeo explicitamente
          videoRef.current.load();
          setIsLoading(true);
          setIsPlaying(false); // Garantir que o estado está correto
        } else {
          // URL já está correta, garantir que está atualizada
          if (currentVideoUrlRef.current !== video.url) {
            currentVideoUrlRef.current = video.url;
          }
          console.log(`✅ Vídeo já está com a URL correta (${video.url}), verificando estado...`);
          console.log(`📊 Estado do vídeo - readyState: ${videoRef.current.readyState}, paused: ${videoRef.current.paused}, networkState: ${videoRef.current.networkState}`);
          setIsLoading(false);
        }
        
        // Função para tentar reproduzir o vídeo
        const tryPlay = async () => {
          if (!videoRef.current) {
            console.warn(`⚠️ videoRef.current é null, não é possível fazer play`);
            return;
          }
          
          const video = videoRef.current;
          console.log(`🎯 tryPlay chamado - readyState: ${video.readyState}, paused: ${video.paused}, src: ${video.src ? 'definido' : 'vazio'}, networkState: ${video.networkState}`);
          
          try {
            // Verificar se o vídeo já tem metadados carregados
            if (video.readyState >= 1) {
              // Vídeo tem metadados ou é o primeiro vídeo, tentar play
              if (video.paused || video.ended) {
                if (video.ended) {
                  video.currentTime = 0;
                }
                
                console.log(`▶️ Tentando play - readyState: ${video.readyState}, paused: ${video.paused}`);
                await video.play();
                setIsPlaying(true);
                setIsLoading(false);
                console.log(`✅ Vídeo iniciado com sucesso! (readyState: ${video.readyState})`);
              } else {
                console.log(`▶️ Vídeo já está tocando`);
                setIsPlaying(true);
                setIsLoading(false);
              }
            } else {
              // Aguardar metadados ou dados suficientes
              console.log(`⏳ Aguardando vídeo carregar metadados (readyState: ${video.readyState})`);
              
              const onCanPlay = () => {
                if (videoRef.current && (videoRef.current.paused || videoRef.current.ended)) {
                  if (videoRef.current.ended) {
                    videoRef.current.currentTime = 0;
                  }
                  videoRef.current.play().then(() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                    console.log(`▶️ Vídeo iniciado após carregar (readyState: ${videoRef.current?.readyState})`);
                  }).catch((error: any) => {
                    console.log(`⏸️ Autoplay bloqueado: ${error.message}`);
                    setIsPlaying(false);
                    setIsLoading(false);
                  });
                  videoRef.current?.removeEventListener('canplay', onCanPlay);
                  videoRef.current?.removeEventListener('loadedmetadata', onCanPlay);
                  videoRef.current?.removeEventListener('canplaythrough', onCanPlay);
                }
              };
              
              // Adicionar listeners para quando o vídeo estiver pronto
              video.addEventListener('canplay', onCanPlay, { once: true });
              video.addEventListener('loadedmetadata', onCanPlay, { once: true });
              video.addEventListener('canplaythrough', onCanPlay, { once: true });
              
              // Timeout de segurança - se não carregar em 5 segundos, permitir interação manual
              const timeoutId = setTimeout(() => {
                if (videoRef.current && videoRef.current.paused) {
                  console.log(`⏱️ Timeout: Vídeo não carregou em tempo hábil, aguardando interação do usuário`);
                  setIsLoading(false);
                  videoRef.current?.removeEventListener('canplay', onCanPlay);
                  videoRef.current?.removeEventListener('loadedmetadata', onCanPlay);
                  videoRef.current?.removeEventListener('canplaythrough', onCanPlay);
                }
              }, 5000);
              
              // Limpar timeout se o vídeo começar a tocar
              const onPlayStart = () => {
                clearTimeout(timeoutId);
                videoRef.current?.removeEventListener('play', onPlayStart);
              };
              video.addEventListener('play', onPlayStart, { once: true });
            }
          } catch (error: any) {
            // Autoplay bloqueado - usuário precisa clicar para iniciar
            console.log(`⏸️ Erro ao tentar play: ${error.message}`);
            console.log(`📊 Estado do vídeo - readyState: ${video.readyState}, networkState: ${video.networkState}, src: ${video.src ? 'definido' : 'vazio'}`);
            setIsPlaying(false);
            setIsLoading(false);
          }
        };
        
        // Sempre tentar play, mas com timing diferente dependendo se precisa recarregar
        if (!needsReload) {
          // Não precisa recarregar, tentar play imediatamente
          console.log(`⚡ Tentando play imediatamente (não precisa recarregar)`);
          tryPlay();
        } else {
          // Precisa recarregar, aguardar um pouco para garantir que o DOM foi atualizado e o vídeo começou a carregar
          const delay = 200;
          console.log(`⏳ Aguardando ${delay}ms antes de tentar play (precisa recarregar)`);
          setTimeout(tryPlay, delay);
        }
      }
    } else {
      console.warn(`⚠️ Índice de vídeo inválido: ${index} (total de vídeos: ${videos.length})`);
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

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Atualizar lastVideoTimeRef para que o cálculo no intervalo seja preciso
      // Isso garante que o saveAccumulatedWatchTime calcule corretamente o tempo decorrido
      if (isTrackingRef.current && !video.paused && !video.ended) {
        // Manter lastVideoTimeRef atualizado para cálculos precisos
        // O acumulador será atualizado no saveAccumulatedWatchTime a cada 5s
        const currentVideoTime = video.currentTime || 0;
        // Não atualizar lastVideoTimeRef aqui, deixar o saveAccumulatedWatchTime fazer isso
        // para evitar problemas de sincronização
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = async () => {
      setIsPlaying(true);
      wasPlayingWhenHiddenRef.current = true;
      
      console.log('▶️ Vídeo iniciado (play)');
      
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

        // Se o rastreamento ainda não foi iniciado (caso raro), iniciar agora
        if (currentTrackingVideoIdRef.current !== currentVideo.id) {
          console.log(`🔄 Rastreamento não encontrado no play, iniciando agora para vídeo ${currentVideo.id}`);
          startWatchTimeTracking(currentVideo.id);
        } else {
          // Continuar rastreamento, apenas atualizar estado de reprodução
          isTrackingRef.current = true;
          lastWatchTimeUpdateRef.current = Date.now();
          lastVideoTimeRef.current = video.currentTime || 0;
          console.log(`🔄 Continuando rastreamento para vídeo ${currentVideo.id} (acumulado: ${accumulatedWatchTimeRef.current.toFixed(2)}s)`);
        }
      }
    };
    const handlePause = async () => {
      setIsPlaying(false);
      wasPlayingWhenHiddenRef.current = false;
      
      console.log('⏸️ Vídeo pausado');
      
      // Salvar o tempo assistido quando pausa (mesmo que seja menos de 5 segundos)
      // Isso garante que não perdemos tempo assistido ao pausar
      if (isTrackingRef.current && currentTrackingVideoIdRef.current) {
        // Atualizar acumulador com o tempo desde a última atualização
        const currentVideoTime = video.currentTime || 0;
        const timeElapsed = currentVideoTime - lastVideoTimeRef.current;
        if (timeElapsed > 0) {
          accumulatedWatchTimeRef.current += timeElapsed;
          lastVideoTimeRef.current = currentVideoTime;
          console.log(`📊 Tempo acumulado ao pausar: +${timeElapsed.toFixed(2)}s (Total: ${accumulatedWatchTimeRef.current.toFixed(2)}s)`);
        }
        // Forçar salvamento imediato
        console.log('💾 Forçando salvamento ao pausar...');
        await saveWatchTime();
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

    const handleVisibilityChange = async () => {
      const video = videoRef.current;
      if (!video || !currentTrackingVideoIdRef.current) return;

      if (document.hidden) {
        // Quando a aba fica oculta, salvar o tempo até agora
        // Marcar se estava tocando para continuar contando
        wasPlayingWhenHiddenRef.current = !video.paused;
        if (wasPlayingWhenHiddenRef.current && isTrackingRef.current) {
          await saveWatchTime();
        }
      } else {
        // Quando volta a ficar visível, atualizar contadores para continuar contando
        // Se estava tocando quando perdeu foco e ainda não terminou, continuar
        if (wasPlayingWhenHiddenRef.current && !video.ended && isTrackingRef.current) {
          lastWatchTimeUpdateRef.current = Date.now();
          lastVideoTimeRef.current = video.currentTime || 0;
          accumulatedWatchTimeRef.current = 0;
          // Se o vídeo ainda está tocando, continuar rastreamento
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
      if (!video || !currentTrackingVideoIdRef.current || !isTrackingRef.current) return;

      // Verificar se o vídeo ainda é o mesmo pela URL
      const currentUrl = video.src || video.currentSrc;
      if (currentVideoUrlRef.current && currentUrl !== currentVideoUrlRef.current) {
        return; // Vídeo mudou
      }

      // Continuar contando mesmo se a aba não estiver focada
      // Usar o currentTime do vídeo para calcular o tempo real assistido
      if (!video.ended && wasPlayingWhenHiddenRef.current && !video.paused) {
        const currentVideoTime = video.currentTime || 0;
        const timeElapsed = currentVideoTime - lastVideoTimeRef.current;
        
        // Se o tempo do vídeo avançou, acumular
        if (timeElapsed > 0) {
          accumulatedWatchTimeRef.current += timeElapsed;
          lastVideoTimeRef.current = currentVideoTime;
          
          // Salvar no banco a cada 5 segundos acumulados
          if (accumulatedWatchTimeRef.current >= 5) {
            const timeToSave = accumulatedWatchTimeRef.current;
            incrementWatchTime(currentTrackingVideoIdRef.current, timeToSave).catch(() => {
              // Ignorar erros em background
            });
          }
        }
      }
    }, 5000); // Verificar a cada 5 segundos quando em background

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


