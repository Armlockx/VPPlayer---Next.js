-- Migration: 010_fix_check_user_admin.sql
-- Descrição: Corrige erro de ambiguidade na função check_user_admin (migration de correção)
-- Data: 2024-01-XX
-- Dependências: 002_admin_setup.sql
-- NOTA: Execute apenas se houver erro de ambiguidade na função check_user_admin

-- Corrigir função check_user_admin removendo ambiguidade
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

