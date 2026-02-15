# 📊 Database - Migrations e Scripts SQL

Este diretório contém todas as migrations e scripts SQL do projeto 👌vPlay.

## 📁 Estrutura

```
database/
├── migrations/          # Migrations versionadas (executar na ordem)
├── seeds/              # Scripts de seed e utilitários
└── README.md          # Este arquivo
```

---

## 🚀 Migrations

### Ordem de Execução

**IMPORTANTE:** Execute as migrations na ordem numérica (001, 002, 003...)

#### Migrations Principais (Obrigatórias)

1. **001_initial_profiles.sql**
   - Cria tabela `profiles`
   - Configura políticas RLS para perfis
   - Configura storage para avatares
   - **Dependências:** Nenhuma (requer apenas `auth.users` do Supabase)

2. **002_admin_setup.sql**
   - Adiciona coluna `is_admin` na tabela `profiles`
   - Cria funções RPC: `check_user_admin()` e `get_user_profile()`
   - **Dependências:** 001_initial_profiles.sql

3. **003_create_profile_rpc.sql**
   - Cria função RPC `create_user_profile()` para criar/atualizar perfis
   - **Dependências:** 001_initial_profiles.sql

4. **004_video_functions.sql**
   - Cria funções RPC para estatísticas de vídeos:
     - `increment_video_views(video_id)`
     - `increment_video_watch_time(video_id, seconds)`
   - Configura políticas RLS para `videos`, `video_likes`, `video_comments`
   - **Dependências:** Requer tabela `videos` (criada manualmente ou via Supabase)

5. **005_video_history.sql**
   - Cria tabela `video_history`
   - Cria funções RPC:
     - `upsert_video_history()`
     - `get_user_video_history()`
     - `clear_video_history()`
   - **Dependências:** Requer tabela `videos` e `auth.users`

6. **006_comments_threads.sql**
   - Adiciona suporte a threads (respostas) em comentários
   - Adiciona colunas: `parent_comment_id`, `edited_at`, `timestamp_seconds`
   - Cria funções RPC:
     - `get_video_comments_with_threads()`
     - `get_comment_replies()`
   - **Dependências:** Requer tabela `video_comments` (criada manualmente ou via Supabase)

7. **007_favorites.sql**
   - Cria tabela `video_favorites` (favoritos e watchlist)
   - Cria funções RPC:
     - `toggle_video_favorite()`
     - `is_video_favorite()`
     - `get_user_favorites()`
     - `remove_video_favorite()`
   - **Dependências:** Requer tabela `videos` e `auth.users`

8. **008_admin_delete_permission.sql**
   - Permite que administradores excluam vídeos
   - Cria função RPC `delete_video()`
   - Cria política RLS para DELETE
   - **Dependências:** 002_admin_setup.sql

#### Migrations de Correção (Opcionais - Execute apenas se necessário)

9. **009_fix_profiles_rls.sql**
   - Corrige políticas RLS da tabela `profiles`
   - **Quando usar:** Se houver problemas de acesso/permissões na tabela profiles
   - **Dependências:** 001_initial_profiles.sql

10. **010_fix_check_user_admin.sql**
    - Corrige erro de ambiguidade na função `check_user_admin()`
    - **Quando usar:** Se houver erro de ambiguidade ao executar `check_user_admin()`
    - **Dependências:** 002_admin_setup.sql

---

## 📝 Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute cada migration na ordem (001, 002, 003...)
5. Verifique se não há erros

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref seu-project-ref

# Executar migrations
supabase db push
```

---

## 🔍 Scripts Utilitários (database/seeds/)

### Scripts de Seed

- **create_existing_users_profiles.sql**
  - Cria perfis para usuários existentes que não têm perfil
  - **Quando usar:** Após migration 001, se houver usuários sem perfil

### Scripts de Verificação

- **verify_profiles.sql**
  - Verifica estrutura e dados da tabela `profiles`
  - **Quando usar:** Para debug e verificação

- **test_create_profile.sql**
  - Script de teste para criação de perfis
  - **Quando usar:** Para testar políticas RLS e funções RPC

---

## ⚠️ Importante

### Antes de Executar

1. ✅ Faça backup do banco de dados
2. ✅ Verifique se todas as dependências estão criadas
3. ✅ Execute em ambiente de desenvolvimento primeiro

### Durante a Execução

1. ✅ Execute migrations na ordem numérica
2. ✅ Verifique se não há erros
3. ✅ Não pule migrations (cada uma depende da anterior)

### Após a Execução

1. ✅ Verifique se as tabelas foram criadas
2. ✅ Teste as funções RPC
3. ✅ Verifique as políticas RLS

---

## 📋 Checklist de Migrations

- [ ] 001_initial_profiles.sql
- [ ] 002_admin_setup.sql
- [ ] 003_create_profile_rpc.sql
- [ ] 004_video_functions.sql
- [ ] 005_video_history.sql
- [ ] 006_comments_threads.sql
- [ ] 007_favorites.sql
- [ ] 008_admin_delete_permission.sql
- [ ] 009_fix_profiles_rls.sql (opcional)
- [ ] 010_fix_check_user_admin.sql (opcional)

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- **Causa:** Migration executada antes da dependência
- **Solução:** Execute as migrations na ordem correta

### Erro: "policy already exists"
- **Causa:** Migration executada mais de uma vez
- **Solução:** As migrations usam `DROP POLICY IF EXISTS`, então podem ser executadas novamente

### Erro: "function already exists"
- **Causa:** Função já existe no banco
- **Solução:** As migrations usam `CREATE OR REPLACE`, então podem ser executadas novamente

### Erro de RLS bloqueando acesso
- **Causa:** Políticas RLS muito restritivas
- **Solução:** Execute a migration 009_fix_profiles_rls.sql

---

## 📚 Documentação Adicional

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Functions Documentation](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🔄 Versionamento

As migrations seguem o padrão:
- `XXX_nome_da_migration.sql`
- Onde `XXX` é um número sequencial (001, 002, 003...)

**Nunca altere uma migration já executada em produção!**
- Se precisar corrigir, crie uma nova migration (009, 010...)

---

**Última atualização:** 2024-01-XX

