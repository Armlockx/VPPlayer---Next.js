-- Migration: 008_admin_delete_permission.sql
-- Descrição: Permite que administradores excluam vídeos
-- Data: 2024-01-XX
-- Dependências: 002_admin_setup.sql (requer função check_user_admin e coluna is_admin)

-- ============================================
-- PARTE 1: Criar função RPC para excluir vídeo (recomendado)
-- ============================================

CREATE OR REPLACE FUNCTION delete_video(video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Verificar se usuário está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se usuário é admin
    SELECT COALESCE(profiles.is_admin, FALSE) INTO is_admin
    FROM profiles
    WHERE profiles.id = auth.uid();
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Apenas administradores podem excluir vídeos';
    END IF;
    
    -- Excluir vídeo
    DELETE FROM videos WHERE id = video_id;
    
    RETURN TRUE;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION delete_video(UUID) TO authenticated, anon, public;

-- ============================================
-- PARTE 2: Criar política RLS para DELETE (alternativa)
-- ============================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins podem excluir vídeos" ON videos;

-- Criar política RLS para permitir DELETE apenas para admins
CREATE POLICY "Admins podem excluir vídeos"
ON videos
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
);

