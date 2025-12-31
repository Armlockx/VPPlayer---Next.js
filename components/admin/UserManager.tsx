'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';
import { FiUsers, FiShield, FiRefreshCw, FiSearch, FiMail, FiCalendar } from 'react-icons/fi';
import { SkeletonCard, SkeletonCircle, SkeletonText } from './SkeletonLoader';

export function UserManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalUsers = users.filter((user) => !user.is_admin);
  const adminUsers = users.filter((user) => user.is_admin);

  return (
    <section
      style={{
        marginBottom: '40px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'slideInUp 0.4s ease 0.3s both',
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
        <FiUsers size={24} />
        Gerenciamento de Usuários
      </h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') loadUsers();
            }}
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
          onClick={loadUsers}
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
          <span className="hide-on-small">Atualizar Lista</span>
        </button>
      </div>

      <div
        className="user-manager-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiUsers size={20} />
            Usuários ({normalUsers.length})
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
                  <SkeletonCircle size="50px" />
                  <div style={{ flex: 1 }}>
                    <SkeletonText width="60%" height="16px" />
                    <SkeletonText width="80%" height="14px" margin="8px 0" />
                    <SkeletonText width="40%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          ) : normalUsers.length === 0 ? (
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
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>👤</div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Nenhum usuário encontrado</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                {searchTerm ? 'Tente buscar com outros termos' : 'Ainda não há usuários cadastrados'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '600px',
                overflowY: 'auto',
              }}
            >
              {normalUsers.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                    animation: `slideInUp 0.3s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>
                      {user.username || 'Sem nome'}
                    </h4>
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FiMail size={14} />
                      {user.email}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FiCalendar size={12} />
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiShield size={20} color="#ffd700" />
            Administradores ({adminUsers.length})
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
                  <SkeletonCircle size="50px" />
                  <div style={{ flex: 1 }}>
                    <SkeletonText width="60%" height="16px" />
                    <SkeletonText width="80%" height="14px" margin="8px 0" />
                    <SkeletonText width="40%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          ) : adminUsers.length === 0 ? (
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
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>👑</div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Nenhum administrador encontrado</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Administradores aparecerão aqui
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '600px',
                overflowY: 'auto',
              }}
            >
              {adminUsers.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(234, 179, 8, 0.05))',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    transition: 'all 0.2s ease',
                    animation: `slideInUp 0.3s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(234, 179, 8, 0.1))';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(234, 179, 8, 0.05))';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255, 215, 0, 0.5)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        border: '2px solid rgba(255, 215, 0, 0.5)',
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        {user.username || 'Sem nome'}
                      </h4>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          background: 'rgba(255, 215, 0, 0.2)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#ffd700',
                          border: '1px solid rgba(255, 215, 0, 0.4)',
                        }}
                      >
                        <FiShield size={10} />
                        Admin
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FiMail size={14} />
                      {user.email}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FiCalendar size={12} />
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
