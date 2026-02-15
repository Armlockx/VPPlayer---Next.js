import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

/**
 * Serviço para operações relacionadas a vídeos
 */
export class VideoService {
  private supabase = createClient();

  /**
   * Buscar todos os vídeos ordenados
   */
  async fetchVideos(): Promise<Video[]> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Buscar vídeo por ID
   */
  async fetchVideoById(videoId: string): Promise<Video | null> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Incrementar contador de visualizações
   */
  async incrementViews(videoId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('increment_video_views', {
      video_id: videoId,
    });

    if (error) throw error;
    return typeof data === 'number' ? data : 0;
  }

  /**
   * Incrementar tempo assistido
   */
  async incrementWatchTime(videoId: string, seconds: number): Promise<number> {
    if (seconds <= 0) return 0;

    const { data, error } = await this.supabase.rpc('increment_video_watch_time', {
      video_id: videoId,
      seconds: seconds,
    });

    if (error) throw error;
    return typeof data === 'number' ? data : 0;
  }

  /**
   * Buscar vídeos com filtro de busca
   */
  async searchVideos(searchTerm: string): Promise<Video[]> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .ilike('title', `%${searchTerm}%`)
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Exportar instância singleton
export const videoService = new VideoService();

