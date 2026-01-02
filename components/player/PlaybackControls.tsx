'use client';

import { useState, useRef, useEffect } from 'react';

interface PlaybackControlsProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  quality: 'auto' | number;
  onQualityChange: (quality: 'auto' | number) => void;
  connectionQuality: 'good' | 'medium' | 'poor';
  visible: boolean;
}

export function PlaybackControls({
  playbackRate,
  onPlaybackRateChange,
  quality,
  onQualityChange,
  connectionQuality,
  visible,
}: PlaybackControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const qualities = [
    { label: 'Auto', value: 'auto' as const },
    { label: '1080p', value: 1.0 },
    { label: '720p', value: 0.67 },
    { label: '480p', value: 0.44 },
    { label: '360p', value: 0.33 },
  ];

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node)) {
        setShowQualityMenu(false);
      }
    };

    if (showSpeedMenu || showQualityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSpeedMenu, showQualityMenu]);

  if (!visible) return null;

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'poor':
        return '🔴';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
      }}
    >
      {/* Indicador de qualidade de conexão */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          fontSize: '12px',
        }}
        title={`Conexão: ${connectionQuality === 'good' ? 'Boa' : connectionQuality === 'medium' ? 'Média' : 'Ruim'}`}
      >
        <span>{getConnectionIcon()}</span>
      </div>

      {/* Seletor de velocidade */}
      <div ref={speedMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          style={{
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
            minWidth: '60px',
          }}
        >
          {playbackRate}x
        </button>
        {showSpeedMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              background: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '100px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          >
            {speeds.map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  onPlaybackRateChange(speed);
                  setShowSpeedMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: playbackRate === speed ? 'rgba(229, 9, 20, 0.3)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: '4px',
                }}
                onMouseEnter={(e) => {
                  if (playbackRate !== speed) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (playbackRate !== speed) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {speed}x {speed === 1 && 'Normal'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Seletor de qualidade */}
      <div ref={qualityMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          style={{
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
            minWidth: '70px',
          }}
        >
          {quality === 'auto' ? 'Auto' : `${Math.round(quality * 1080)}p`}
        </button>
        {showQualityMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              background: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '100px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          >
            {qualities.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  onQualityChange(q.value);
                  setShowQualityMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background:
                    (quality === 'auto' && q.value === 'auto') ||
                    (typeof quality === 'number' && q.value === quality)
                      ? 'rgba(229, 9, 20, 0.3)'
                      : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: '4px',
                }}
                onMouseEnter={(e) => {
                  if (
                    !(
                      (quality === 'auto' && q.value === 'auto') ||
                      (typeof quality === 'number' && q.value === quality)
                    )
                  ) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    !(
                      (quality === 'auto' && q.value === 'auto') ||
                      (typeof quality === 'number' && q.value === quality)
                    )
                  ) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

