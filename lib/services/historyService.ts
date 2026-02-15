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

/**
 * Serviço para operações relacionadas ao histórico de vídeos
 */
export class HistoryService {
  private supabase = createClient();

  /**
   * Buscar histórico do usuário
   */
  async fetchHistory(limit: number = 50): Promise<VideoHistoryWithVideo[]> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return [];
    }

    const { data, error } = await this.supabase.rpc('get_user_video_history', {
      p_limit: limit,
      p_offset: 0
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Buscar dados completos dos vídeos
    const videoIds = data.map((item: any) => item.video_id);
    const { data: videos, error: videosError } = await this.supabase
      .from('videos')
      .select('*')
      .in('id', videoIds);

    if (!videosError && videos) {
      return data.map((item: any) => ({
        ...item,
        video: videos.find(v => v.id === item.video_id) || null
      })) as VideoHistoryWithVideo[];
    }

    return data.map((item: any) => ({ ...item, video: null })) as VideoHistoryWithVideo[];
  }

  /**
   * Salvar/atualizar progresso de um vídeo
   */
  async saveProgress(
    videoId: string,
    currentTime: number,
    duration: number,
    completed: boolean = false
  ): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return; // Usuário não autenticado, não salvar
    }

    // Considerar completo se assistiu 90% ou mais do vídeo
    const isCompleted = completed || (currentTime / duration >= 0.9);

    const { error } = await this.supabase.rpc('upsert_video_history', {
      p_video_id: videoId,
      p_last_watched_time: currentTime,
      p_completed: isCompleted
    });

    if (error) {
      // Erro 406 ou PGRST116 significa que a tabela não existe ou não há permissão
      if (error.code === 'PGRST116' || error.message?.includes('406') || error.code === '42P01') {
        // Tabela não existe ainda - silenciar erro
        return;
      }
      throw error;
    }
  }

  /**
   * Obter progresso de um vídeo específico
   */
  async getVideoProgress(videoId: string): Promise<number | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('video_history')
      .select('last_watched_time, completed')
      .eq('user_id', session.user.id)
      .eq('video_id', videoId)
      .maybeSingle(); // Usar maybeSingle ao invés de single para evitar erro 406

    // Se erro 406 (tabela não existe ou RLS bloqueando), retornar null silenciosamente
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('406') || error.code === '42P01') {
        return null;
      }
      // Outros erros - logar apenas uma vez
      if (error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Erro ao obter progresso:', error);
      }
      return null;
    }

    if (data && !data.completed) {
      return data.last_watched_time;
    }

    return null;
  }

  /**
   * Limpar histórico (tudo ou de um vídeo específico)
   */
  async clearHistory(videoId?: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await this.supabase.rpc('clear_video_history', {
      p_video_id: videoId || null
    });

    if (error) throw error;
  }
}

// Exportar instância singleton
export const historyService = new HistoryService();

