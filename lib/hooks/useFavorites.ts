'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export interface FavoriteItem {
  id: string;
  video_id: string;
  is_watchlist: boolean;
  created_at: string;
  video_title?: string;
  video_thumbnail?: string | null;
  video_duration?: string | null;
  video_url?: string;
}

export interface FavoriteWithVideo extends FavoriteItem {
  video: Video | null;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteWithVideo[]>([]);
  const [watchlist, setWatchlist] = useState<FavoriteWithVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const favoritesCacheRef = useRef<Map<string, { isFavorite: boolean; isWatchlist: boolean; timestamp: number }>>(new Map());
  const CACHE_DURATION = 30000; // 30 segundos
  const supabase = createClient();

  // Buscar favoritos do usuário
  const fetchFavorites = useCallback(async (isWatchlist: boolean = false, limit: number = 50) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        if (isWatchlist) {
          setWatchlist([]);
        } else {
          setFavorites([]);
        }
        return;
      }

      const { data, error } = await supabase.rpc('get_user_favorites', {
        p_is_watchlist: isWatchlist,
        p_limit: limit,
        p_offset: 0
      });

      if (error) {
        // Se a tabela não existe ainda, apenas retornar array vazio
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.warn('Tabela video_favorites ainda não foi criada');
          if (isWatchlist) {
            setWatchlist([]);
          } else {
            setFavorites([]);
          }
          return;
        }
        throw error;
      }

      // Buscar dados completos dos vídeos
      if (data && data.length > 0) {
        const videoIds = data.map((item: any) => item.video_id);
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .in('id', videoIds);

        if (videosError) throw videosError;

        const videosMap = new Map((videos || []).map((v: Video) => [v.id, v]));

        const favoritesWithVideos: FavoriteWithVideo[] = data.map((item: any) => ({
          ...item,
          video: videosMap.get(item.video_id) || null,
        }));

        if (isWatchlist) {
          setWatchlist(favoritesWithVideos);
        } else {
          setFavorites(favoritesWithVideos);
        }
      } else {
        if (isWatchlist) {
          setWatchlist([]);
        } else {
          setFavorites([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      if (isWatchlist) {
        setWatchlist([]);
      } else {
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Verificar se vídeo é favorito (com cache)
  const isFavorite = useCallback((videoId: string): boolean => {
    const cached = favoritesCacheRef.current.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.isFavorite;
    }

    // Verificar na lista atual
    const found = favorites.find(f => f.video_id === videoId && !f.is_watchlist);
    return !!found;
  }, [favorites]);

  // Verificar se vídeo está na watchlist (com cache)
  const isInWatchlist = useCallback((videoId: string): boolean => {
    const cached = favoritesCacheRef.current.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.isWatchlist;
    }

    // Verificar na lista atual
    const found = watchlist.find(f => f.video_id === videoId && f.is_watchlist);
    return !!found;
  }, [watchlist]);

  // Adicionar/remover favorito
  const toggleFavorite = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data, error } = await supabase.rpc('toggle_video_favorite', {
        p_video_id: videoId,
        p_is_watchlist: false
      });

      if (error) {
        // Se a tabela não existe ainda, apenas logar aviso
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.warn('Tabela video_favorites ainda não foi criada. Execute o script SQL.');
          return false;
        }
        throw error;
      }

      // Atualizar cache
      const isNowFavorite = data as boolean;
      favoritesCacheRef.current.set(videoId, {
        isFavorite: isNowFavorite,
        isWatchlist: false,
        timestamp: Date.now()
      });

      // Recarregar lista de favoritos
      await fetchFavorites(false);
      
      // Se estava na watchlist e agora é favorito, atualizar watchlist também
      if (isNowFavorite) {
        await fetchFavorites(true);
      }

      return data as boolean;
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      return false;
    }
  }, [supabase, fetchFavorites]);

  // Adicionar/remover da watchlist
  const toggleWatchlist = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data, error } = await supabase.rpc('toggle_video_favorite', {
        p_video_id: videoId,
        p_is_watchlist: true
      });

      if (error) {
        // Se a tabela não existe ainda, apenas logar aviso
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.warn('Tabela video_favorites ainda não foi criada. Execute o script SQL.');
          return false;
        }
        throw error;
      }

      // Atualizar cache
      const isNowInWatchlist = data as boolean;
      favoritesCacheRef.current.set(videoId, {
        isFavorite: false,
        isWatchlist: isNowInWatchlist,
        timestamp: Date.now()
      });

      // Recarregar lista de watchlist
      await fetchFavorites(true);
      
      // Se estava nos favoritos e agora é watchlist, atualizar favoritos também
      if (isNowInWatchlist) {
        await fetchFavorites(false);
      }

      return data as boolean;
    } catch (error) {
      console.error('Erro ao alternar watchlist:', error);
      return false;
    }
  }, [supabase, fetchFavorites]);

  // Remover favorito
  const removeFavorite = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data, error } = await supabase.rpc('remove_video_favorite', {
        p_video_id: videoId,
        p_is_watchlist: false
      });

      if (error) throw error;

      // Limpar cache
      favoritesCacheRef.current.delete(videoId);

      // Recarregar lista
      await fetchFavorites(false);

      return data as boolean;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      return false;
    }
  }, [supabase, fetchFavorites]);

  // Remover da watchlist
  const removeFromWatchlist = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data, error } = await supabase.rpc('remove_video_favorite', {
        p_video_id: videoId,
        p_is_watchlist: true
      });

      if (error) throw error;

      // Limpar cache
      favoritesCacheRef.current.delete(videoId);

      // Recarregar lista
      await fetchFavorites(true);

      return data as boolean;
    } catch (error) {
      console.error('Erro ao remover da watchlist:', error);
      return false;
    }
  }, [supabase, fetchFavorites]);

  // Carregar favoritos e watchlist ao montar
  useEffect(() => {
    fetchFavorites(false);
    fetchFavorites(true);
  }, [fetchFavorites]);

  return {
    favorites,
    watchlist,
    loading,
    isFavorite,
    isInWatchlist,
    toggleFavorite,
    toggleWatchlist,
    removeFavorite,
    removeFromWatchlist,
    refreshFavorites: () => {
      fetchFavorites(false);
      fetchFavorites(true);
    }
  };
}

