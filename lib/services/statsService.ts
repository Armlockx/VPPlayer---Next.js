import { createClient } from '@/lib/supabase/client';

export interface GeneralStats {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  totalUsers: number;
  totalAdmins: number;
}

export interface VideoStats {
  views: number;
  watch_time: number;
}

/**
 * Serviço para operações relacionadas a estatísticas
 */
export class StatsService {
  private supabase = createClient();

  /**
   * Buscar estatísticas gerais
   */
  async fetchGeneralStats(): Promise<GeneralStats> {
    // Estatísticas de vídeos
    const { count: videosCount } = await this.supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    const { data: videosStats } = await this.supabase
      .from('videos')
      .select('views, watch_time');

    const totalViews = videosStats?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
    const totalWatchTime = videosStats?.reduce((sum, v) => sum + (v.watch_time || 0), 0) || 0;

    // Estatísticas de usuários
    const { count: usersCount } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: adminsCount } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true);

    return {
      totalVideos: videosCount || 0,
      totalViews,
      totalWatchTime,
      totalUsers: usersCount || 0,
      totalAdmins: adminsCount || 0,
    };
  }

  /**
   * Buscar estatísticas de um vídeo específico
   */
  async fetchVideoStats(videoId: string): Promise<VideoStats | null> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('views, watch_time')
      .eq('id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      views: data?.views || 0,
      watch_time: data?.watch_time || 0,
    };
  }
}

// Exportar instância singleton
export const statsService = new StatsService();

