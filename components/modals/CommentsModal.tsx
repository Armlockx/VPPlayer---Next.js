'use client';

import { useState } from 'react';
import { useComments } from '@/lib/hooks/useComments';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatTime } from '@/lib/utils/formatTime';
import { FiEdit2, FiTrash2, FiCornerUpRight, FiX, FiCheck, FiClock } from 'react-icons/fi';
import type { Comment } from '@/lib/hooks/useComments';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  onSeek?: (time: number) => void; // Callback para fazer seek no vídeo
}

export function CommentsModal({ isOpen, onClose, videoId, onSeek }: CommentsModalProps) {
  const { comments, loading, addComment, editComment, deleteComment } = useComments(videoId);
  const auth = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [timestampSeconds, setTimestampSeconds] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    await addComment(commentText, replyingTo, timestampSeconds);
    setCommentText('');
    setReplyingTo(null);
    setTimestampSeconds(null);
    setSubmitting(false);
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment_text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    await editComment(commentId, editText);
    setEditingComment(null);
    setEditText('');
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      await deleteComment(commentId);
    }
  };

  const handleTimestampClick = (seconds: number) => {
    if (onSeek) {
      onSeek(seconds);
      onClose(); // Fechar modal e ir para o timestamp
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleSetTimestamp = () => {
    // Solicitar tempo do usuário
    const timeInput = prompt('Digite o tempo no formato MM:SS ou HH:MM:SS (ex: 2:30 ou 1:02:30):');
    if (!timeInput) return;

    // Converter formato de tempo para segundos
    const parts = timeInput.split(':').map(Number);
    let seconds = 0;
    
    if (parts.length === 2) {
      // MM:SS
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      // Tentar como número direto
      seconds = parseFloat(timeInput);
    }

    if (!isNaN(seconds) && seconds >= 0) {
      setTimestampSeconds(seconds);
    } else {
      alert('Formato de tempo inválido. Use MM:SS ou HH:MM:SS');
    }
  };

  const CommentItem = ({ 
    comment, 
    isReply = false 
  }: { 
    comment: Comment; 
    isReply?: boolean;
  }) => {
    const isOwnComment = auth.user?.id === comment.user_id;
    const isEditing = editingComment === comment.id;
    const hasReplies = (comment.reply_count || 0) > 0 || (comment.replies?.length || 0) > 0;
    const repliesVisible = showReplies.has(comment.id);

    return (
      <div
        style={{
          display: 'flex',
          gap: '12px',
          background: isOwnComment 
            ? 'rgba(229, 9, 20, 0.1)' 
            : isReply 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '16px',
          border: isOwnComment ? '1px solid rgba(229, 9, 20, 0.2)' : 'none',
          marginLeft: isReply ? '48px' : '0',
          marginTop: isReply ? '12px' : '0',
          borderLeft: isReply ? '3px solid rgba(229, 9, 20, 0.3)' : 'none',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {comment.profiles?.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt={comment.profiles.username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>
                {comment.profiles?.username || 'Usuário'}
              </span>
              {comment.timestamp_seconds !== null && comment.timestamp_seconds !== undefined && (
                <button
                  onClick={() => handleTimestampClick(comment.timestamp_seconds!)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: 'rgba(229, 9, 20, 0.2)',
                    border: '1px solid rgba(229, 9, 20, 0.4)',
                    borderRadius: '4px',
                    color: '#e50914',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(229, 9, 20, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(229, 9, 20, 0.2)';
                  }}
                >
                  <FiClock size={12} />
                  {formatTime(comment.timestamp_seconds)}
                </button>
              )}
              {comment.edited_at && (
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', fontStyle: 'italic' }}>
                  (editado)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isOwnComment && !isReply && (
                <>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        style={{
                          background: 'rgba(76, 175, 80, 0.2)',
                          border: '1px solid rgba(76, 175, 80, 0.4)',
                          color: '#4caf50',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <FiX size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(comment)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        style={{
                          background: 'rgba(255, 68, 68, 0.2)',
                          border: '1px solid rgba(255, 68, 68, 0.4)',
                          color: '#ff6b6b',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
                        }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                resize: 'vertical',
                minHeight: '60px',
                boxSizing: 'border-box',
                marginBottom: '8px',
              }}
              autoFocus
            />
          ) : (
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: '0 0 12px 0',
              }}
            >
              {comment.comment_text}
            </p>
          )}

          {!isReply && auth.isAuthenticated && !auth.isGuest && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setCommentText('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <FiCornerUpRight size={14} />
                Responder
              </button>
              {hasReplies && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  {repliesVisible 
                    ? `Ocultar ${comment.reply_count || comment.replies?.length || 0} resposta(s)` 
                    : `Ver ${comment.reply_count || comment.replies?.length || 0} resposta(s)`}
                </button>
              )}
            </div>
          )}

          {/* Mostrar respostas */}
          {repliesVisible && comment.replies && comment.replies.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#141414',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'sticky',
            top: 0,
            background: '#141414',
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 600 }}>
            Comentários {comments.length > 0 && `(${comments.length})`}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '32px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <FiX size={24} />
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {auth.isAuthenticated && !auth.isGuest && (
            <div
              style={{
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {replyingTo && (
                <div
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(229, 9, 20, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(229, 9, 20, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                    Respondendo a {comments.find(c => c.id === replyingTo)?.profiles?.username || 'usuário'}
                  </span>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setCommentText('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? "Escreva uma resposta..." : "Escreva um comentário..."}
                  rows={3}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif',
                    resize: 'vertical',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSetTimestamp}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: timestampSeconds !== null 
                        ? 'rgba(229, 9, 20, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: timestampSeconds !== null
                        ? '1px solid rgba(229, 9, 20, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: timestampSeconds !== null ? '#e50914' : 'rgba(255, 255, 255, 0.8)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FiClock size={14} />
                    {timestampSeconds !== null ? formatTime(timestampSeconds) : 'Adicionar Timestamp'}
                  </button>
                  {timestampSeconds !== null && (
                    <button
                      type="button"
                      onClick={() => setTimestampSeconds(null)}
                      style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    style={{
                      padding: '10px 24px',
                      background: submitting 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'linear-gradient(135deg, #e50914, #f40612)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.5 : 1,
                      marginLeft: 'auto',
                    }}
                  >
                    {submitting ? 'Enviando...' : replyingTo ? 'Responder' : 'Comentar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '40px 20px' }}>
                Carregando comentários...
              </p>
            ) : comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '40px 20px' }}>
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
