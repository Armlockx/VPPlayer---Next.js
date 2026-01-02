'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  replies?: Comment[]; // Respostas (threads)
}

export function useComments(videoId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Limpar comentários imediatamente quando videoId muda ou é null
    setComments([]);
    
    if (!videoId) {
      return;
    }

    let cancelled = false;

    const loadComments = async () => {
      setLoading(true);
      try {
        // Primeiro buscar comentários
        const { data: commentsData, error: commentsError } = await supabase
          .from('video_comments')
          .select('*')
          .eq('video_id', videoId)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        // Verificar se a requisição foi cancelada
        if (cancelled) return;

        if (commentsData && commentsData.length > 0) {
          // Buscar perfis dos usuários
          const userIds = [...new Set(commentsData.map(c => c.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          // Verificar novamente se foi cancelada
          if (cancelled) return;

          // Combinar comentários com perfis
          const commentsWithProfiles = commentsData.map(comment => ({
            ...comment,
            profiles: profilesData?.find(p => p.id === comment.user_id) || null,
          }));

          setComments(commentsWithProfiles as Comment[]);
        } else {
          setComments([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao carregar comentários:', error);
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [videoId, supabase]);

  const loadComments = useCallback(async () => {
    if (!videoId) {
      setComments([]);
      return;
    }

    setLoading(true);
    try {
      // Buscar comentários principais (sem parent_comment_id)
      const { data: commentsData, error: commentsError } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        // Buscar perfis dos usuários
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Para cada comentário principal, buscar suas respostas
        const commentsWithReplies = await Promise.all(
          commentsData.map(async (comment) => {
            // Buscar respostas deste comentário
            const { data: repliesData } = await supabase
              .from('video_comments')
              .select('*')
              .eq('parent_comment_id', comment.id)
              .order('created_at', { ascending: true });

            // Buscar perfis das respostas
            let repliesWithProfiles: Comment[] = [];
            if (repliesData && repliesData.length > 0) {
              const replyUserIds = [...new Set(repliesData.map(r => r.user_id))];
              const { data: replyProfiles } = await supabase
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

        setComments(commentsWithReplies as Comment[]);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [videoId, supabase]);

  const addComment = useCallback(async (
    content: string, 
    parentCommentId?: string | null, 
    timestampSeconds?: number | null
  ) => {
    if (!videoId || !content.trim() || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Você precisa estar logado para comentar');
      return;
    }

    setLoading(true);

    try {
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

      const { data, error } = await supabase
        .from('video_comments')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;
      
      if (data) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', session.user.id)
          .single();

        const commentWithProfile = {
          ...data,
          profiles: profile || null,
          replies: [],
          reply_count: 0,
        };

        if (parentCommentId) {
          // Se é uma resposta, atualizar o comentário pai
          setComments((prev) =>
            prev.map((comment) => {
              if (comment.id === parentCommentId) {
                return {
                  ...comment,
                  reply_count: (comment.reply_count || 0) + 1,
                  replies: [...(comment.replies || []), commentWithProfile as Comment],
                };
              }
              return comment;
            })
          );
        } else {
          // Se é um comentário principal, adicionar no início
          setComments((prev) => [commentWithProfile as Comment, ...prev]);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário');
    } finally {
      setLoading(false);
    }
  }, [videoId, loading, supabase]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!commentId || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);

    try {
      // Verificar se o comentário pertence ao usuário
      const { data: comment } = await supabase
        .from('video_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (comment?.user_id !== session.user.id) {
        alert('Você não tem permissão para excluir este comentário');
        return;
      }

      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário');
    } finally {
      setLoading(false);
    }
  }, [loading, supabase]);

  const editComment = useCallback(async (commentId: string, newText: string) => {
    if (!commentId || !newText.trim() || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);

    try {
      // Verificar se o comentário pertence ao usuário
      const { data: comment } = await supabase
        .from('video_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (comment?.user_id !== session.user.id) {
        alert('Você não tem permissão para editar este comentário');
        return;
      }

      const { data: updatedComment, error } = await supabase
        .from('video_comments')
        .update({ comment_text: newText.trim() })
        .eq('id', commentId)
        .select('*')
        .single();

      if (error) throw error;

      // Atualizar comentário na lista
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, ...updatedComment };
          }
          // Atualizar também nas respostas
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((reply) =>
                reply.id === commentId ? { ...reply, ...updatedComment } : reply
              ),
            };
          }
          return c;
        })
      );
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Erro ao editar comentário');
    } finally {
      setLoading(false);
    }
  }, [loading, supabase]);

  return {
    comments,
    loading,
    addComment,
    editComment,
    deleteComment,
    refreshComments: loadComments,
  };
}


