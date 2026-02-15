import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';
import type { Profile } from '@/types/user';

/**
 * Serviço para operações administrativas
 */
export class AdminService {
  private supabase = createClient();

  /**
   * Buscar todos os vídeos (admin)
   */
  async fetchAllVideos(searchTerm?: string): Promise<Video[]> {
    let query = this.supabase
      .from('videos')
      .select('*')
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Criar novo vídeo
   */
  async createVideo(videoData: Partial<Video>): Promise<Video> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const { data, error } = await this.supabase
      .from('videos')
      .insert({
        title: videoData.title,
        url: videoData.url,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration || null,
        order_index: videoData.order_index !== undefined ? videoData.order_index : null,
        user_id: videoData.user_id || session?.user?.id || null,
        views: 0,
        watch_time: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualizar vídeo
   */
  async updateVideo(videoId: string, videoData: Partial<Video>): Promise<Video> {
    const { data, error } = await this.supabase
      .from('videos')
      .update({
        title: videoData.title,
        url: videoData.url,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration || null,
        order_index: videoData.order_index !== undefined ? videoData.order_index : null,
        user_id: videoData.user_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Deletar vídeo
   */
  async deleteVideo(videoId: string): Promise<void> {
    const { error } = await this.supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) throw error;
  }

  /**
   * Buscar todos os usuários (admin)
   */
  async fetchAllUsers(searchTerm?: string): Promise<Profile[]> {
    let query = this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Verificar se usuário é admin
   */
  async checkIsAdmin(): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data, error } = await this.supabase.rpc('check_user_admin', {
      p_user_id: session.user.id
    });

    if (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }

    return data === true;
  }
}

// Exportar instância singleton
export const adminService = new AdminService();

