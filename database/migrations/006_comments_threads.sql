-- Migration: 006_comments_threads.sql
-- Descrição: Adiciona suporte a threads (respostas) e edição de comentários
-- Data: 2024-01-XX
-- Dependências: Requer tabela video_comments (criada manualmente ou via Supabase)

-- ============================================
-- PARTE 1: Adicionar colunas necessárias
-- ============================================

-- Adicionar coluna parent_comment_id para threads (respostas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'video_comments' AND column_name = 'parent_comment_id'
    ) THEN
        ALTER TABLE video_comments 
        ADD COLUMN parent_comment_id UUID REFERENCES video_comments(id) ON DELETE CASCADE;
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS video_comments_parent_comment_id_idx 
        ON video_comments(parent_comment_id);
    END IF;
END $$;

-- Adicionar coluna edited_at para rastrear edições
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'video_comments' AND column_name = 'edited_at'
    ) THEN
        ALTER TABLE video_comments 
        ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Adicionar coluna timestamp_seconds para timestamps clicáveis
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'video_comments' AND column_name = 'timestamp_seconds'
    ) THEN
        ALTER TABLE video_comments 
        ADD COLUMN timestamp_seconds NUMERIC(10, 2);
        
        -- Criar índice para busca rápida
        CREATE INDEX IF NOT EXISTS video_comments_timestamp_seconds_idx 
        ON video_comments(timestamp_seconds);
    END IF;
END $$;

-- ============================================
-- PARTE 2: Atualizar políticas RLS (se necessário)
-- ============================================

-- Verificar se RLS está habilitado
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- Política para permitir edição de próprios comentários
DROP POLICY IF EXISTS "Usuários podem editar seus próprios comentários" ON video_comments;

CREATE POLICY "Usuários podem editar seus próprios comentários"
ON video_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PARTE 3: Função para atualizar edited_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_edited_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o texto do comentário mudou, atualizar edited_at
    IF OLD.comment_text IS DISTINCT FROM NEW.comment_text THEN
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar edited_at
DROP TRIGGER IF EXISTS trigger_update_comment_edited_at ON video_comments;

CREATE TRIGGER trigger_update_comment_edited_at
BEFORE UPDATE ON video_comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_edited_at();

-- ============================================
-- PARTE 4: Função RPC para obter comentários com threads
-- ============================================

CREATE OR REPLACE FUNCTION get_video_comments_with_threads(p_video_id UUID)
RETURNS TABLE (
    id UUID,
    video_id UUID,
    user_id UUID,
    comment_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    timestamp_seconds NUMERIC(10, 2),
    parent_comment_id UUID,
    username TEXT,
    avatar_url TEXT,
    reply_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vc.id,
        vc.video_id,
        vc.user_id,
        vc.comment_text,
        vc.created_at,
        vc.updated_at,
        vc.edited_at,
        vc.timestamp_seconds,
        vc.parent_comment_id,
        p.username,
        p.avatar_url,
        (
            SELECT COUNT(*)::BIGINT
            FROM video_comments vc2
            WHERE vc2.parent_comment_id = vc.id
        ) AS reply_count
    FROM video_comments vc
    LEFT JOIN profiles p ON vc.user_id = p.id
    WHERE vc.video_id = p_video_id
        AND (vc.parent_comment_id IS NULL) -- Apenas comentários principais
    ORDER BY vc.created_at DESC;
END;
$$;

-- Função para obter respostas de um comentário
CREATE OR REPLACE FUNCTION get_comment_replies(p_parent_comment_id UUID)
RETURNS TABLE (
    id UUID,
    video_id UUID,
    user_id UUID,
    comment_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    timestamp_seconds NUMERIC(10, 2),
    parent_comment_id UUID,
    username TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vc.id,
        vc.video_id,
        vc.user_id,
        vc.comment_text,
        vc.created_at,
        vc.updated_at,
        vc.edited_at,
        vc.timestamp_seconds,
        vc.parent_comment_id,
        p.username,
        p.avatar_url
    FROM video_comments vc
    LEFT JOIN profiles p ON vc.user_id = p.id
    WHERE vc.parent_comment_id = p_parent_comment_id
    ORDER BY vc.created_at ASC;
END;
$$;

-- Grant de execução para as funções RPC
GRANT EXECUTE ON FUNCTION get_video_comments_with_threads(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_comment_replies(UUID) TO authenticated, anon;

