'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FiFilm, FiEye, FiClock, FiUsers, FiShield } from 'react-icons/fi';
import { SkeletonCard, SkeletonText } from './SkeletonLoader';

interface Stats {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  totalUsers: number;
  totalAdmins: number;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  color: string;
  borderColor: string;
}

function AnimatedNumber({ value }: { value: number }) {
  return <span style={{ animation: 'countUp 0.3s ease' }}>{value.toLocaleString()}</span>;
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalViews: 0,
    totalWatchTime: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Estatísticas de vídeos
      const { count: videosCount } = await supabase.from('videos').select('*', { count: 'exact', head: true });

      const { data: videosStats } = await supabase.from('videos').select('views, watch_time');

      const totalViews = videosStats?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalWatchTime = videosStats?.reduce((sum, v) => sum + (v.watch_time || 0), 0) || 0;

      // Estatísticas de usuários
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      const { count: adminsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);

      setStats({
        totalVideos: videosCount || 0,
        totalViews,
        totalWatchTime,
        totalUsers: usersCount || 0,
        totalAdmins: adminsCount || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const statCards: StatCard[] = [
    {
      label: 'Total de Vídeos',
      value: stats.totalVideos,
      icon: <FiFilm size={32} />,
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))',
      color: '#3b82f6',
      borderColor: 'rgba(59, 130, 246, 0.4)',
    },
    {
      label: 'Total de Visualizações',
      value: stats.totalViews,
      icon: <FiEye size={32} />,
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
      color: '#22c55e',
      borderColor: 'rgba(34, 197, 94, 0.4)',
    },
    {
      label: 'Tempo Total Assistido',
      value: formatWatchTime(stats.totalWatchTime),
      icon: <FiClock size={32} />,
      gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(239, 68, 68, 0.15))',
      color: '#eab308',
      borderColor: 'rgba(234, 179, 8, 0.4)',
    },
    {
      label: 'Total de Usuários',
      value: stats.totalUsers,
      icon: <FiUsers size={32} />,
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15))',
      color: '#ec4899',
      borderColor: 'rgba(236, 72, 153, 0.4)',
    },
    {
      label: 'Administradores',
      value: stats.totalAdmins,
      icon: <FiShield size={32} />,
      gradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(234, 179, 8, 0.15))',
      color: '#ffd700',
      borderColor: 'rgba(255, 215, 0, 0.4)',
    },
  ];

  return (
    <section
      style={{
        marginBottom: '40px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'slideInUp 0.4s ease 0.1s both',
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
        }}
      >
        Estatísticas Gerais
      </h2>

      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} height="140px" />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          {statCards.map((card, index) => (
            <div
              key={card.label}
              style={{
                padding: '25px',
                background: card.gradient,
                borderRadius: '16px',
                border: `1px solid ${card.borderColor}`,
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
                animation: `slideInUp 0.4s ease ${0.1 + index * 0.05}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${card.color}20, ${card.color}10)`,
                  marginBottom: '16px',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: '#ffffff',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {typeof card.value === 'number' ? <AnimatedNumber value={card.value} /> : card.value}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
