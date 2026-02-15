-- Migration: 009_fix_profiles_rls.sql
-- Descrição: Corrige políticas RLS da tabela profiles (migration de correção)
-- Data: 2024-01-XX
-- Dependências: 001_initial_profiles.sql
-- NOTA: Execute apenas se houver problemas com políticas RLS

-- ============================================
-- PARTE 1: Verificar estado atual
-- ============================================

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificar políticas existentes
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- PARTE 2: Corrigir políticas RLS
-- ============================================

-- Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Todos podem ler perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política que permite SELECT para TODOS (public, anon, authenticated)
CREATE POLICY "Todos podem ler perfis"
ON profiles
FOR SELECT
TO public
USING (true);

-- Criar política específica para anon (fallback)
CREATE POLICY "Anônimos podem ler perfis"
ON profiles
FOR SELECT
TO anon
USING (true);

-- Criar política específica para authenticated (fallback)
CREATE POLICY "Autenticados podem ler perfis"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir que usuários insiram seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

