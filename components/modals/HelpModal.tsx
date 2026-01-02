'use client';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Espaço', description: 'Play/Pause' },
    { key: '←', description: 'Voltar 5 segundos' },
    { key: '→', description: 'Avançar 5 segundos' },
    { key: '↑', description: 'Aumentar volume' },
    { key: '↓', description: 'Diminuir volume' },
    { key: 'F', description: 'Fullscreen' },
    { key: 'M', description: 'Mutar/Desmutar' },
    { key: '0-9', description: 'Ir para 0-90% do vídeo' },
  ];

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
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 600 }}>
            Atalhos de Teclado
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
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                  {shortcut.description}
                </span>
                <kbd
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(229, 9, 20, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(229, 9, 20, 0.3)',
            }}
          >
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
              💡 <strong>Dica:</strong> Clique no vídeo para pausar/reproduzir. Passe o mouse sobre a barra de progresso para ver preview.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

