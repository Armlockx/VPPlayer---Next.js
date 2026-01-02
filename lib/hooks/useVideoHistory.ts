'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export interface VideoHistoryItem {
  id: string;
  video_id: string;
  last_watched_time: number;
  completed: boolean;
  watch_count: number;
  last_watched_at: string;
  video_title?: string;
  video_thumbnail?: string | null;
  video_duration?: string | null;
  video_url?: string;
}

export interface VideoHistoryWithVideo extends VideoHistoryItem {
  video: Video | null;
}

export function useVideoHistory() {
  const [history, setHistory] = useState<VideoHistoryWithVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Buscar histórico do usuário
  const fetchHistory = useCallback(async (limit: number = 50) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase.rpc('get_user_video_history', {
        p_limit: limit,
        p_offset: 0
      });

      if (error) throw error;

      // Buscar dados completos dos vídeos
      if (data && data.length > 0) {
        const videoIds = data.map((item: any) => item.video_id);
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .in('id', videoIds);

        if (!videosError && videos) {
          const historyWithVideos: VideoHistoryWithVideo[] = data.map((item: any) => ({
            ...item,
            video: videos.find(v => v.id === item.video_id) || null
          }));
          setHistory(historyWithVideos);
        } else {
          setHistory(data.map((item: any) => ({ ...item, video: null })));
        }
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Salvar/atualizar progresso de um vídeo
  const saveProgress = useCallback(async (
    videoId: string,
    currentTime: number,
    duration: number,
    completed: boolean = false
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return; // Usuário não autenticado, não salvar
      }

      // Considerar completo se assistiu 90% ou mais do vídeo
      const isCompleted = completed || (currentTime / duration >= 0.9);

      const { error } = await supabase.rpc('upsert_video_history', {
        p_video_id: videoId,
        p_last_watched_time: currentTime,
        p_completed: isCompleted
      });

      if (error) {
        console.error('Erro ao salvar progresso:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, [supabase]);

  // Cache para evitar múltiplas chamadas para o mesmo vídeo
  const progressCacheRef = useRef<Map<string, { time: number | null; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5000; // 5 segundos

  // Obter progresso de um vídeo específico
  const getVideoProgress = useCallback(async (videoId: string): Promise<number | null> => {
    try {
      // Verificar cache primeiro
      const cached = progressCacheRef.current.get(videoId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.time;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        progressCacheRef.current.set(videoId, { time: null, timestamp: Date.now() });
        return null;
      }

      const { data, error } = await supabase
        .from('video_history')
        .select('last_watched_time, completed')
        .eq('user_id', session.user.id)
        .eq('video_id', videoId)
        .maybeSingle(); // Usar maybeSingle ao invés de single para evitar erro 406

      // Se erro 406 (tabela não existe ou RLS bloqueando), retornar null silenciosamente
      if (error) {
        // Erro 406 ou PGRST116 significa que a tabela não existe ou não há permissão
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.code === '42P01') {
          // Tabela não existe ainda - cache null para evitar spam
          progressCacheRef.current.set(videoId, { time: null, timestamp: Date.now() });
          return null;
        }
        // Outros erros - logar apenas uma vez
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao obter progresso:', error);
        }
        progressCacheRef.current.set(videoId, { time: null, timestamp: Date.now() });
        return null;
      }

      let result: number | null = null;
      if (data && !data.completed) {
        result = data.last_watched_time;
      }

      // Cachear resultado
      progressCacheRef.current.set(videoId, { time: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      // Erro geral - cache null para evitar spam
      progressCacheRef.current.set(videoId, { time: null, timestamp: Date.now() });
      return null;
    }
  }, [supabase]);

  // Limpar histórico (tudo ou de um vídeo específico)
  const clearHistory = useCallback(async (videoId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return;
      }

      const { error } = await supabase.rpc('clear_video_history', {
        p_video_id: videoId || null
      });

      if (error) {
        throw error;
      }

      // Atualizar estado local
      if (videoId) {
        setHistory(prev => prev.filter(item => item.video_id !== videoId));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      throw error;
    }
  }, [supabase]);

  // Verificar se vídeo foi completado
  const isVideoCompleted = useCallback((videoId: string): boolean => {
    const item = history.find(h => h.video_id === videoId);
    return item?.completed || false;
  }, [history]);

  // Obter vídeos "Continuar Assistindo" (não completados)
  const getContinueWatching = useCallback((): VideoHistoryWithVideo[] => {
    return history
      .filter(item => !item.completed && item.video !== null)
      .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
      .slice(0, 20); // Limitar a 20 vídeos
  }, [history]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    fetchHistory,
    saveProgress,
    getVideoProgress,
    clearHistory,
    isVideoCompleted,
    getContinueWatching
  };
}

