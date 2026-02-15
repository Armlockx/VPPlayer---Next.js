-- Migration: 002_admin_setup.sql
-- Descrição: Configura sistema de administração (coluna is_admin e funções RPC)
-- Data: 2024-01-XX
-- Dependências: 001_initial_profiles.sql (requer tabela profiles)

-- ============================================
-- PARTE 1: Remover coluna admin e usar is_admin
-- ============================================

-- Remover coluna admin se existir (já existe is_admin)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'admin'
    ) THEN
        ALTER TABLE profiles DROP COLUMN admin;
    END IF;
END $$;

-- Garantir que is_admin existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
        CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin);
    END IF;
END $$;

-- ============================================
-- PARTE 2: Criar função RPC para verificar se usuário é admin
-- ============================================

CREATE OR REPLACE FUNCTION check_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    -- Verificar se usuário está autenticado
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar status admin do perfil (qualificar coluna com nome da tabela para evitar ambiguidade)
    SELECT COALESCE(profiles.is_admin, FALSE) INTO admin_status
    FROM profiles
    WHERE profiles.id = auth.uid();
    
    RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION check_user_admin() TO authenticated, anon, public;

-- ============================================
-- PARTE 3: Criar função RPC para obter perfil com informação de admin
-- ============================================

CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data JSON;
BEGIN
    -- Verificar se usuário está autenticado
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar perfil do usuário
    SELECT json_build_object(
        'id', id,
        'username', username,
        'avatar_url', avatar_url,
        'email', email,
        'is_admin', COALESCE(is_admin, FALSE),
        'admin', COALESCE(is_admin, FALSE), -- Manter compatibilidade
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO profile_data
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN profile_data;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION get_user_profile() TO authenticated, anon, public;

