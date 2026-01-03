'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export interface LikedVideoItem {
  id: string;
  video_id: string;
  created_at: string;
  video?: Video;
}

export function useLikedVideos() {
  const [likedVideos, setLikedVideos] = useState<LikedVideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchLikedVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLikedVideos([]);
        return;
      }

      // Buscar likes do usuário
      const { data: likes, error: likesError } = await supabase
        .from('video_likes')
        .select('id, video_id, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (likesError) {
        // Se a tabela não existe ainda, apenas retornar array vazio
        if (likesError.code === '42P01' || likesError.code === 'PGRST116') {
          console.warn('Tabela video_likes ainda não foi criada');
          setLikedVideos([]);
          return;
        }
        throw likesError;
      }

      if (!likes || likes.length === 0) {
        setLikedVideos([]);
        return;
      }

      // Buscar dados completos dos vídeos
      const videoIds = likes.map(like => like.video_id);
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .in('id', videoIds);

      if (videosError) throw videosError;

      const videosMap = new Map((videos || []).map((v: Video) => [v.id, v]));

      const likedVideosWithData: LikedVideoItem[] = likes.map(like => ({
        ...like,
        video: videosMap.get(like.video_id),
      }));

      setLikedVideos(likedVideosWithData);
    } catch (error) {
      console.error('Erro ao buscar vídeos curtidos:', error);
      setLikedVideos([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLikedVideos();
  }, [fetchLikedVideos]);

  return {
    likedVideos,
    loading,
    refresh: fetchLikedVideos,
  };
}

