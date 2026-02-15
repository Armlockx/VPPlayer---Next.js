-- Migration: 005_video_history.sql
-- Descrição: Cria tabela de histórico de vídeos assistidos
-- Data: 2024-01-XX
-- Dependências: Requer tabela videos e auth.users

-- ============================================
-- PARTE 1: Criar tabela de histórico
-- ============================================

CREATE TABLE IF NOT EXISTS video_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    last_watched_time DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Tempo em segundos
    completed BOOLEAN NOT NULL DEFAULT false, -- Se o vídeo foi assistido completamente
    watch_count INTEGER NOT NULL DEFAULT 1, -- Quantas vezes foi assistido
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id) -- Um registro por usuário/vídeo
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS video_history_user_id_idx ON video_history(user_id);
CREATE INDEX IF NOT EXISTS video_history_video_id_idx ON video_history(video_id);
CREATE INDEX IF NOT EXISTS video_history_last_watched_at_idx ON video_history(last_watched_at DESC);

-- ============================================
-- PARTE 2: Políticas RLS
-- ============================================

-- Habilitar RLS
ALTER TABLE video_history ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ler seu próprio histórico" ON video_history;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio histórico" ON video_history;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio histórico" ON video_history;
DROP POLICY IF EXISTS "Usuários podem deletar seu próprio histórico" ON video_history;

-- Permitir que usuários leiam apenas seu próprio histórico
CREATE POLICY "Usuários podem ler seu próprio histórico"
ON video_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários insiram seu próprio histórico
CREATE POLICY "Usuários podem inserir seu próprio histórico"
ON video_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem seu próprio histórico
CREATE POLICY "Usuários podem atualizar seu próprio histórico"
ON video_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários deletem seu próprio histórico
CREATE POLICY "Usuários podem deletar seu próprio histórico"
ON video_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PARTE 3: Função para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_video_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS video_history_updated_at_trigger ON video_history;
CREATE TRIGGER video_history_updated_at_trigger
    BEFORE UPDATE ON video_history
    FOR EACH ROW
    EXECUTE FUNCTION update_video_history_updated_at();

-- ============================================
-- PARTE 4: Função RPC para salvar/atualizar histórico
-- ============================================

CREATE OR REPLACE FUNCTION upsert_video_history(
    p_video_id UUID,
    p_last_watched_time DECIMAL,
    p_completed BOOLEAN DEFAULT false
)
RETURNS video_history AS $$
DECLARE
    v_user_id UUID;
    v_result video_history;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Inserir ou atualizar histórico
    INSERT INTO video_history (user_id, video_id, last_watched_time, completed, watch_count, last_watched_at)
    VALUES (v_user_id, p_video_id, p_last_watched_time, p_completed, 1, NOW())
    ON CONFLICT (user_id, video_id)
    DO UPDATE SET
        last_watched_time = GREATEST(video_history.last_watched_time, p_last_watched_time),
        completed = CASE 
            WHEN p_completed THEN true 
            ELSE video_history.completed 
        END,
        watch_count = CASE 
            WHEN p_completed AND NOT video_history.completed THEN video_history.watch_count + 1
            ELSE video_history.watch_count
        END,
        last_watched_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 5: Função RPC para obter histórico do usuário
-- ============================================

CREATE OR REPLACE FUNCTION get_user_video_history(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    video_id UUID,
    last_watched_time DECIMAL,
    completed BOOLEAN,
    watch_count INTEGER,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    video_title TEXT,
    video_thumbnail TEXT,
    video_duration TEXT,
    video_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vh.id,
        vh.video_id,
        vh.last_watched_time,
        vh.completed,
        vh.watch_count,
        vh.last_watched_at,
        v.title as video_title,
        v.thumbnail as video_thumbnail,
        v.duration as video_duration,
        v.url as video_url
    FROM video_history vh
    INNER JOIN videos v ON vh.video_id = v.id
    WHERE vh.user_id = auth.uid()
    ORDER BY vh.last_watched_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 6: Função RPC para limpar histórico
-- ============================================

CREATE OR REPLACE FUNCTION clear_video_history(
    p_video_id UUID DEFAULT NULL -- Se NULL, limpa todo o histórico
)
RETURNS INTEGER AS $$
DECLARE
    v_user_id UUID;
    v_deleted_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    IF p_video_id IS NULL THEN
        -- Limpar todo o histórico do usuário
        DELETE FROM video_history WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    ELSE
        -- Limpar histórico de um vídeo específico
        DELETE FROM video_history WHERE user_id = v_user_id AND video_id = p_video_id;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    END IF;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

