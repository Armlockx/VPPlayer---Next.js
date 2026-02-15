import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export interface LikedVideoItem {
  id: string;
  video_id: string;
  created_at: string;
  video?: Video;
}

/**
 * Serviço para operações relacionadas a likes
 */
export class LikeService {
  private supabase = createClient();

  /**
   * Buscar vídeos curtidos pelo usuário
   */
  async fetchLikedVideos(): Promise<LikedVideoItem[]> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return [];
    }

    // Buscar likes do usuário
    const { data: likes, error: likesError } = await this.supabase
      .from('video_likes')
      .select('id, video_id, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (likesError) {
      // Se a tabela não existe ainda, retornar array vazio
      if (likesError.code === '42P01' || likesError.code === 'PGRST116') {
        console.warn('Tabela video_likes ainda não foi criada');
        return [];
      }
      throw likesError;
    }

    if (!likes || likes.length === 0) {
      return [];
    }

    // Buscar dados completos dos vídeos
    const videoIds = likes.map(like => like.video_id);
    const { data: videos, error: videosError } = await this.supabase
      .from('videos')
      .select('*')
      .in('id', videoIds);

    if (videosError) throw videosError;

    const videosMap = new Map((videos || []).map((v: Video) => [v.id, v]));

    return likes.map(like => ({
      ...like,
      video: videosMap.get(like.video_id),
    })) as LikedVideoItem[];
  }

  /**
   * Buscar likes de um vídeo específico
   */
  async fetchVideoLikes(videoId: string): Promise<{ count: number; userLiked: boolean }> {
    // Buscar likes do vídeo
    const { data: likes, error } = await this.supabase
      .from('video_likes')
      .select('*')
      .eq('video_id', videoId);

    if (error) {
      // Se a tabela não existe ainda, retornar valores padrão
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return { count: 0, userLiked: false };
      }
      throw error;
    }

    const count = likes?.length || 0;

    // Verificar se usuário atual curtiu
    const { data: { session } } = await this.supabase.auth.getSession();
    const userLiked = session?.user
      ? !!likes?.find((like) => like.user_id === session.user.id)
      : false;

    return { count, userLiked };
  }

  /**
   * Alternar like de um vídeo
   */
  async toggleLike(videoId: string): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se já curtiu
    const { data: existingLike } = await this.supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingLike) {
      // Remover like
      const { error } = await this.supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return false;
    } else {
      // Adicionar like
      const { error } = await this.supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          user_id: session.user.id,
        });

      if (error) {
        if (error.code === '23505') {
          // Like já existe, apenas retornar true
          return true;
        }
        throw error;
      }
      return true;
    }
  }
}

// Exportar instância singleton
export const likeService = new LikeService();

