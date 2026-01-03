-- Script para criar tabela de favoritos e watchlist
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Criar tabela de favoritos
-- ============================================

CREATE TABLE IF NOT EXISTS video_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    is_watchlist BOOLEAN NOT NULL DEFAULT false, -- true = assistir mais tarde, false = favorito
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id) -- Um registro por usuário/vídeo
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS video_favorites_user_id_idx ON video_favorites(user_id);
CREATE INDEX IF NOT EXISTS video_favorites_video_id_idx ON video_favorites(video_id);
CREATE INDEX IF NOT EXISTS video_favorites_is_watchlist_idx ON video_favorites(is_watchlist);
CREATE INDEX IF NOT EXISTS video_favorites_created_at_idx ON video_favorites(created_at DESC);

-- ============================================
-- PARTE 2: Políticas RLS
-- ============================================

-- Habilitar RLS
ALTER TABLE video_favorites ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ler seus próprios favoritos" ON video_favorites;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios favoritos" ON video_favorites;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios favoritos" ON video_favorites;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios favoritos" ON video_favorites;

-- Permitir que usuários leiam apenas seus próprios favoritos
CREATE POLICY "Usuários podem ler seus próprios favoritos"
ON video_favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários insiram seus próprios favoritos
CREATE POLICY "Usuários podem inserir seus próprios favoritos"
ON video_favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem seus próprios favoritos
CREATE POLICY "Usuários podem atualizar seus próprios favoritos"
ON video_favorites
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários deletem seus próprios favoritos
CREATE POLICY "Usuários podem deletar seus próprios favoritos"
ON video_favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PARTE 3: Função para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_video_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS video_favorites_updated_at_trigger ON video_favorites;
CREATE TRIGGER video_favorites_updated_at_trigger
    BEFORE UPDATE ON video_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_video_favorites_updated_at();

-- ============================================
-- PARTE 4: Função RPC para adicionar/remover favorito
-- ============================================

CREATE OR REPLACE FUNCTION toggle_video_favorite(
    p_video_id UUID,
    p_is_watchlist BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
    v_current_is_watchlist BOOLEAN;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se já existe
    SELECT EXISTS(
        SELECT 1 FROM video_favorites 
        WHERE user_id = v_user_id AND video_id = p_video_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Se existe, verificar se é watchlist ou favorito
        SELECT is_watchlist INTO v_current_is_watchlist
        FROM video_favorites
        WHERE user_id = v_user_id AND video_id = p_video_id;
        
        -- Se está tentando adicionar o mesmo tipo, remover
        IF v_current_is_watchlist = p_is_watchlist THEN
            DELETE FROM video_favorites
            WHERE user_id = v_user_id AND video_id = p_video_id;
            RETURN false; -- Removido
        ELSE
            -- Se está mudando o tipo, atualizar
            UPDATE video_favorites
            SET is_watchlist = p_is_watchlist,
                updated_at = NOW()
            WHERE user_id = v_user_id AND video_id = p_video_id;
            RETURN true; -- Atualizado
        END IF;
    ELSE
        -- Se não existe, adicionar
        INSERT INTO video_favorites (user_id, video_id, is_watchlist)
        VALUES (v_user_id, p_video_id, p_is_watchlist);
        RETURN true; -- Adicionado
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 5: Função RPC para verificar se vídeo é favorito
-- ============================================

CREATE OR REPLACE FUNCTION is_video_favorite(
    p_video_id UUID,
    p_is_watchlist BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar se existe
    RETURN EXISTS(
        SELECT 1 FROM video_favorites
        WHERE user_id = v_user_id 
        AND video_id = p_video_id
        AND is_watchlist = p_is_watchlist
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 6: Função RPC para obter favoritos do usuário
-- ============================================

CREATE OR REPLACE FUNCTION get_user_favorites(
    p_is_watchlist BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    video_id UUID,
    is_watchlist BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    video_title TEXT,
    video_thumbnail TEXT,
    video_duration TEXT,
    video_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vf.id,
        vf.video_id,
        vf.is_watchlist,
        vf.created_at,
        v.title AS video_title,
        v.thumbnail AS video_thumbnail,
        v.duration AS video_duration,
        v.url AS video_url
    FROM video_favorites vf
    INNER JOIN videos v ON vf.video_id = v.id
    WHERE vf.user_id = auth.uid()
    AND vf.is_watchlist = p_is_watchlist
    ORDER BY vf.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 7: Função RPC para remover favorito
-- ============================================

CREATE OR REPLACE FUNCTION remove_video_favorite(
    p_video_id UUID,
    p_is_watchlist BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Deletar favorito
    DELETE FROM video_favorites
    WHERE user_id = v_user_id 
    AND video_id = p_video_id
    AND is_watchlist = p_is_watchlist;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

