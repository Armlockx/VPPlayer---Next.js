import { createClient } from '@/lib/supabase/client';

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string | null;
  timestamp_seconds?: number | null;
  parent_comment_id?: string | null;
  reply_count?: number;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

/**
 * Serviço para operações relacionadas a comentários
 */
export class CommentService {
  private supabase = createClient();

  /**
   * Buscar comentários de um vídeo (com threads)
   */
  async fetchComments(videoId: string): Promise<Comment[]> {
    // Buscar comentários principais (sem parent_comment_id)
    const { data: commentsData, error: commentsError } = await this.supabase
      .from('video_comments')
      .select('*')
      .eq('video_id', videoId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;

    if (!commentsData || commentsData.length === 0) {
      return [];
    }

    // Buscar perfis dos usuários
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await this.supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    // Para cada comentário principal, buscar suas respostas
    const commentsWithReplies = await Promise.all(
      commentsData.map(async (comment) => {
        // Buscar respostas deste comentário
        const { data: repliesData } = await this.supabase
          .from('video_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        // Buscar perfis das respostas
        let repliesWithProfiles: Comment[] = [];
        if (repliesData && repliesData.length > 0) {
          const replyUserIds = [...new Set(repliesData.map(r => r.user_id))];
          const { data: replyProfiles } = await this.supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', replyUserIds);

          repliesWithProfiles = repliesData.map(reply => ({
            ...reply,
            profiles: replyProfiles?.find(p => p.id === reply.user_id) || null,
          })) as Comment[];
        }

        return {
          ...comment,
          profiles: profilesData?.find(p => p.id === comment.user_id) || null,
          reply_count: repliesWithProfiles.length,
          replies: repliesWithProfiles,
        };
      })
    );

    return commentsWithReplies as Comment[];
  }

  /**
   * Adicionar comentário
   */
  async addComment(
    videoId: string,
    content: string,
    parentCommentId?: string | null,
    timestampSeconds?: number | null
  ): Promise<Comment> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const insertData: any = {
      video_id: videoId,
      user_id: session.user.id,
      comment_text: content.trim(),
    };

    if (parentCommentId) {
      insertData.parent_comment_id = parentCommentId;
    }

    if (timestampSeconds !== null && timestampSeconds !== undefined) {
      insertData.timestamp_seconds = timestampSeconds;
    }

    const { data, error } = await this.supabase
      .from('video_comments')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    // Buscar perfil do usuário
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', session.user.id)
      .single();

    return {
      ...data,
      profiles: profile || null,
      replies: [],
      reply_count: 0,
    } as Comment;
  }

  /**
   * Editar comentário
   */
  async editComment(commentId: string, newText: string): Promise<Comment> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o comentário pertence ao usuário
    const { data: comment } = await this.supabase
      .from('video_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (comment?.user_id !== session.user.id) {
      throw new Error('Você não tem permissão para editar este comentário');
    }

    const { data: updatedComment, error } = await this.supabase
      .from('video_comments')
      .update({ comment_text: newText.trim() })
      .eq('id', commentId)
      .select('*')
      .single();

    if (error) throw error;
    return updatedComment as Comment;
  }

  /**
   * Deletar comentário
   */
  async deleteComment(commentId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o comentário pertence ao usuário
    const { data: comment } = await this.supabase
      .from('video_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (comment?.user_id !== session.user.id) {
      throw new Error('Você não tem permissão para excluir este comentário');
    }

    const { error } = await this.supabase
      .from('video_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }
}

// Exportar instância singleton
export const commentService = new CommentService();

