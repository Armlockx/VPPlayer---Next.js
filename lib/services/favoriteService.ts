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

/**
 * Serviço para operações relacionadas a favoritos e watchlist
 */
export class FavoriteService {
  private supabase = createClient();

  /**
   * Buscar favoritos ou watchlist do usuário
   */
  async fetchFavorites(isWatchlist: boolean = false, limit: number = 50): Promise<FavoriteWithVideo[]> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return [];
    }

    const { data, error } = await this.supabase.rpc('get_user_favorites', {
      p_is_watchlist: isWatchlist,
      p_limit: limit,
      p_offset: 0
    });

    if (error) {
      // Se a tabela não existe ainda, retornar array vazio
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela video_favorites ainda não foi criada');
        return [];
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Buscar dados completos dos vídeos
    const videoIds = data.map((item: any) => item.video_id);
    const { data: videos, error: videosError } = await this.supabase
      .from('videos')
      .select('*')
      .in('id', videoIds);

    if (videosError) throw videosError;

    const videosMap = new Map((videos || []).map((v: Video) => [v.id, v]));

    return data.map((item: any) => ({
      ...item,
      video: videosMap.get(item.video_id) || null,
    })) as FavoriteWithVideo[];
  }

  /**
   * Alternar favorito
   */
  async toggleFavorite(videoId: string): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await this.supabase.rpc('toggle_video_favorite', {
      p_video_id: videoId,
      p_is_watchlist: false
    });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela video_favorites ainda não foi criada. Execute o script SQL.');
        return false;
      }
      throw error;
    }

    return data as boolean;
  }

  /**
   * Alternar watchlist
   */
  async toggleWatchlist(videoId: string): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await this.supabase.rpc('toggle_video_favorite', {
      p_video_id: videoId,
      p_is_watchlist: true
    });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela video_favorites ainda não foi criada. Execute o script SQL.');
        return false;
      }
      throw error;
    }

    return data as boolean;
  }

  /**
   * Verificar se vídeo é favorito
   */
  async isFavorite(videoId: string): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data, error } = await this.supabase
      .from('video_favorites')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', session.user.id)
      .eq('is_watchlist', false)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return !!data;
  }

  /**
   * Verificar se vídeo está na watchlist
   */
  async isInWatchlist(videoId: string): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data, error } = await this.supabase
      .from('video_favorites')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', session.user.id)
      .eq('is_watchlist', true)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return !!data;
  }
}

// Exportar instância singleton
export const favoriteService = new FavoriteService();

