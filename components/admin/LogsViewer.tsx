'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiFileText, FiRefreshCw, FiShield, FiX } from 'react-icons/fi';

interface LogFile {
  name: string;
  path: string;
  content: string;
}

const LOG_FILES = [
  { name: 'Progresso Atual', path: '/api/logs?file=PROGRESSO_ATUAL.md' },
  { name: 'Checklist de Melhorias', path: '/api/logs?file=CHECKLIST_MELHORIAS.md' },
  { name: 'Instruções PWA', path: '/api/logs?file=INSTRUCOES_ICONES_PWA.md' },
  { name: 'Instruções Histórico', path: '/api/logs?file=INSTRUCOES_HISTORICO.md' },
  { name: 'Instruções Admin', path: '/api/logs?file=INSTRUCOES_ADMIN.md' },
];

export function LogsViewer() {
  const auth = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogFile | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);

  // Permitir scroll na página admin
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (auth.loading) return;

      if (!auth.user) {
        router.push('/');
        return;
      }

      try {
        const adminStatus = await auth.checkAdmin();
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          router.push('/admin');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [auth, router]);

  const loadLogFile = async (filePath: string) => {
    setLoadingLog(true);
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Erro ao carregar arquivo');
      }
      const data = await response.json();
      const fileName = LOG_FILES.find(f => f.path === filePath)?.name || filePath;
      
      setSelectedLog({
        name: fileName,
        path: filePath,
        content: data.content || '',
      });
    } catch (error) {
      console.error('Erro ao carregar log:', error);
      alert('Erro ao carregar o arquivo. Verifique se o arquivo existe.');
    } finally {
      setLoadingLog(false);
    }
  };

  const formatMarkdown = (content: string) => {
    // Dividir em linhas para processar melhor
    const lines = content.split('\n');
    let html = '';
    let inCodeBlock = false;
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          html += '</pre>';
          inCodeBlock = false;
        } else {
          html += '<pre style="background: rgba(0, 0, 0, 0.5); padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid rgba(255, 255, 255, 0.1); margin: 16px 0;"><code style="color: #e50914; font-family: \'Courier New\', monospace; font-size: 14px; white-space: pre-wrap;">';
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        html += line + '\n';
        continue;
      }

      // Headers
      if (trimmedLine.startsWith('### ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h3 style="margin: 24px 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff; border-bottom: 2px solid rgba(229, 9, 20, 0.3); padding-bottom: 8px;">${trimmedLine.substring(4)}</h3>`;
        continue;
      }
      if (trimmedLine.startsWith('## ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h2 style="margin: 32px 0 20px 0; font-size: 24px; font-weight: 600; color: #ffffff;">${trimmedLine.substring(3)}</h2>`;
        continue;
      }
      if (trimmedLine.startsWith('# ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h1 style="margin: 40px 0 24px 0; font-size: 32px; font-weight: 700; color: #ffffff;">${trimmedLine.substring(2)}</h1>`;
        continue;
      }

      // Horizontal rules
      if (trimmedLine === '---') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />';
        continue;
      }

      // Lists
      if (trimmedLine.startsWith('- [x]') || trimmedLine.startsWith('- [X]')) {
        if (!inList) {
          html += '<ul style="margin: 16px 0; padding-left: 24px; list-style: none;">';
          inList = true;
        }
        const text = trimmedLine.substring(6).trim();
        html += `<li style="margin: 8px 0; padding-left: 8px; color: #4ade80;">✅ ${processInlineMarkdown(text)}</li>`;
        continue;
      }
      if (trimmedLine.startsWith('- [ ]')) {
        if (!inList) {
          html += '<ul style="margin: 16px 0; padding-left: 24px; list-style: none;">';
          inList = true;
        }
        const text = trimmedLine.substring(5).trim();
        html += `<li style="margin: 8px 0; padding-left: 8px; color: rgba(255, 255, 255, 0.7);">☐ ${processInlineMarkdown(text)}</li>`;
        continue;
      }
      if (trimmedLine.startsWith('- ')) {
        if (!inList) {
          html += '<ul style="margin: 16px 0; padding-left: 24px; list-style: none;">';
          inList = true;
        }
        const text = trimmedLine.substring(2).trim();
        html += `<li style="margin: 8px 0; padding-left: 8px; color: rgba(255, 255, 255, 0.8);">• ${processInlineMarkdown(text)}</li>`;
        continue;
      }

      // Fechar lista se necessário
      if (inList && trimmedLine === '') {
        html += '</ul>';
        inList = false;
      }

      // Paragraphs
      if (trimmedLine !== '') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p style="margin: 16px 0; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">${processInlineMarkdown(trimmedLine)}</p>`;
      } else {
        html += '<br />';
      }
    }

    // Fechar lista se ainda estiver aberta
    if (inList) {
      html += '</ul>';
    }

    return html;
  };

  const processInlineMarkdown = (text: string): string => {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="font-weight: 600; color: #ffffff;">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code style="background: rgba(229, 9, 20, 0.2); padding: 2px 6px; border-radius: 4px; color: #e50914; font-family: \'Courier New\', monospace; font-size: 13px;">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #e50914; text-decoration: underline;">$1</a>');
  };

  if (loading || isAdmin === null) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'white', fontSize: '16px' }}>Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '500px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⛔</div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: 600 }}>Acesso Negado</h2>
          <p style={{ margin: '0 0 30px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', lineHeight: '1.6' }}>
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => router.push('/admin')}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
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
            Voltar ao Painel Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 30px',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1600px',
            margin: '0 auto',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiFileText size={28} color="#e50914" />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#ffffff' }}>
              Logs e Documentação
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/admin')}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FiArrowLeft size={16} />
              <span>Voltar ao Painel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '30px',
          display: 'flex',
          gap: '30px',
          height: 'calc(100vh - 100px)',
        }}
      >
        {/* Sidebar - Lista de Logs */}
        <aside
          style={{
            width: '300px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              paddingBottom: '15px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Arquivos Disponíveis
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LOG_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => loadLogFile(file.path)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: selectedLog?.path === file.path 
                    ? 'rgba(229, 9, 20, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedLog?.path === file.path
                    ? '1px solid rgba(229, 9, 20, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: selectedLog?.path === file.path ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: selectedLog?.path === file.path ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => {
                  if (selectedLog?.path !== file.path) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLog?.path !== file.path) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <FiFileText size={16} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content - Visualizador de Log */}
        <main
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {loadingLog ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '20px',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: '#e50914',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' }}>Carregando arquivo...</p>
            </div>
          ) : selectedLog ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '30px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <FiFileText size={24} color="#e50914" />
                  {selectedLog.name}
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>
              <div
                style={{
                  lineHeight: '1.8',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
                dangerouslySetInnerHTML={{ __html: formatMarkdown(selectedLog.content) }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <FiFileText size={64} />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                Selecione um arquivo para visualizar
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Escolha um arquivo na barra lateral para ver seu conteúdo
              </p>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

