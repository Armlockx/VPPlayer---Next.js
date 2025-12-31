'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';
import { VideoEditModal } from './VideoEditModal';
import { showToast } from './Toast';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch, FiFilm, FiEye, FiClock, FiHash } from 'react-icons/fi';
import { SkeletonCard, SkeletonText } from './SkeletonLoader';

export function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadVideos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('videos')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setVideos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      showToast('Erro ao carregar vídeos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadVideos();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    if (selectedVideoId) {
      const video = videos.find((v) => v.id === selectedVideoId);
      setSelectedVideo(video || null);
      
      // Scroll suave para a área de botões quando um vídeo é selecionado
      if (buttonsRef.current) {
        setTimeout(() => {
          buttonsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      }
    } else {
      setSelectedVideo(null);
    }
  }, [selectedVideoId, videos]);

  const formatWatchTime = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const isNewVideo = (video: Video): boolean => {
    const daysSinceCreation = (Date.now() - new Date(video.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7; // Considera novo se criado há menos de 7 dias
  };

  const handleAddVideo = () => {
    setEditingVideo(null);
    setIsModalOpen(true);
  };

  const handleEditVideo = () => {
    if (!selectedVideo) {
      showToast('Por favor, selecione um vídeo para editar.', 'warning');
      return;
    }
    setEditingVideo(selectedVideo);
    setIsModalOpen(true);
  };

  const handleDeleteVideo = async () => {
    if (!selectedVideo) {
      showToast('Por favor, selecione um vídeo para excluir.', 'warning');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o vídeo "${selectedVideo.title}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeleting(true);
      const { error } = await supabase.from('videos').delete().eq('id', selectedVideo.id);
      if (error) throw error;

      setSelectedVideoId(null);
      setSelectedVideo(null);
      await loadVideos();
      showToast('Vídeo excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      showToast('Erro ao excluir vídeo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveVideo = async (videoData: Partial<Video>) => {
    try {
      if (videoData.id) {
        // Atualizar vídeo existente
        const { error } = await supabase
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
          .eq('id', videoData.id);

        if (error) throw error;
        showToast('Vídeo atualizado com sucesso!', 'success');
      } else {
        // Criar novo vídeo
        const { data: { session } } = await supabase.auth.getSession();
        const { error } = await supabase.from('videos').insert({
          title: videoData.title,
          url: videoData.url,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration || null,
          order_index: videoData.order_index !== undefined ? videoData.order_index : null,
          user_id: videoData.user_id || session?.user?.id || null,
          views: 0,
          watch_time: 0,
        });

        if (error) throw error;
        showToast('Vídeo criado com sucesso!', 'success');
      }

      await loadVideos();
      setIsModalOpen(false);
      setEditingVideo(null);
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      showToast('Erro ao salvar vídeo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), 'error');
      throw error;
    }
  };

  return (
    <section
      style={{
        marginBottom: '40px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'slideInUp 0.4s ease 0.2s both',
      }}
    >
      <h2
        style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: 600,
          color: '#ffffff',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <FiFilm size={24} />
        Gerenciamento de Vídeos
      </h2>

      <div
        ref={buttonsRef}
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FiSearch
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px 10px 40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
        </div>
        <button
          onClick={loadVideos}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <FiRefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span className="hide-on-small">Atualizar</span>
        </button>
        <button
          onClick={handleAddVideo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '8px',
            color: '#22c55e',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <FiPlus size={16} />
          <span className="hide-on-small">Adicionar</span>
        </button>
        <button
          onClick={handleEditVideo}
          disabled={!selectedVideo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: selectedVideo ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: selectedVideo ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: selectedVideo ? '#eab308' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: selectedVideo ? 'pointer' : 'not-allowed',
            opacity: selectedVideo ? 1 : 0.5,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedVideo) {
              e.currentTarget.style.background = 'rgba(234, 179, 8, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedVideo) {
              e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <FiEdit2 size={16} />
          <span className="hide-on-small">Editar</span>
        </button>
        <button
          onClick={handleDeleteVideo}
          disabled={!selectedVideo || deleting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: selectedVideo ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: selectedVideo ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: selectedVideo ? '#ef4444' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: selectedVideo && !deleting ? 'pointer' : 'not-allowed',
            opacity: selectedVideo ? (deleting ? 0.5 : 1) : 0.5,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedVideo && !deleting) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedVideo && !deleting) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <FiTrash2 size={16} style={{ animation: deleting ? 'pulse 1s infinite' : 'none' }} />
          <span className="hide-on-small">{deleting ? 'Excluindo...' : 'Excluir'}</span>
        </button>
      </div>

      <div
        className="video-manager-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '24px',
        }}
      >
        <div style={{ minHeight: '400px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} height="100px" borderRadius="12px" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🎬</div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Nenhum vídeo encontrado</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                {searchTerm ? 'Tente buscar com outros termos' : 'Adicione seu primeiro vídeo clicando em "Adicionar"'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background:
                      selectedVideoId === video.id
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border:
                      selectedVideoId === video.id
                        ? '2px solid rgba(59, 130, 246, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    animation: `slideInUp 0.3s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedVideoId !== video.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedVideoId !== video.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '140px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      flexShrink: 0,
                    }}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon';
                            icon.style.cssText = 'font-size: 32px;';
                            icon.textContent = '🎬';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <div>🎬</div>
                    )}
                    {video.duration && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          background: 'rgba(0, 0, 0, 0.85)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {video.duration}
                      </div>
                    )}
                    {isNewVideo(video) && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          background: 'rgba(34, 197, 94, 0.9)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        Novo
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: selectedVideoId === video.id ? '#60a5fa' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {video.title || 'Sem título'}
                      {selectedVideoId === video.id && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Selecionado
                        </span>
                      )}
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiEye size={14} />
                        {video.views || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiClock size={14} />
                        {formatWatchTime(video.watch_time || 0)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiHash size={14} />
                        {video.order_index !== null && video.order_index !== undefined ? video.order_index : 'N/A'}
                      </span>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {new Date(video.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div
          className="video-preview-sticky"
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            height: 'fit-content',
            overflowY: 'auto',
          }}
        >
          <h3
            style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiFilm size={20} />
            Preview do Vídeo
          </h3>
          {selectedVideo ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.1)',
                  marginBottom: '16px',
                }}
              >
                <video
                  src={selectedVideo.url}
                  controls
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                {selectedVideo.title}
              </h4>
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiEye size={16} />
                    Views:
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                    {(selectedVideo.views || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiClock size={16} />
                    Tempo assistido:
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                    {formatWatchTime(selectedVideo.watch_time || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiHash size={16} />
                    Ordem:
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                    {selectedVideo.order_index !== null && selectedVideo.order_index !== undefined
                      ? selectedVideo.order_index
                      : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>Criado em:</span>
                  <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '13px' }}>
                    {new Date(selectedVideo.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  URL do Vídeo:
                </label>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    wordBreak: 'break-all',
                    fontFamily: 'Courier New, monospace',
                    lineHeight: '1.5',
                    maxHeight: '60px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedVideo.url}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🎬</div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Selecione um vídeo para visualizar o preview</p>
            </div>
          )}
        </div>
      </div>

      <VideoEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleSaveVideo}
        video={editingVideo}
      />
    </section>
  );
}
