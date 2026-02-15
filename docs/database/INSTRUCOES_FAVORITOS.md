# 📋 Instruções para Configurar o Sistema de Favoritos

## ⚠️ IMPORTANTE: Execute o Script SQL

Para que o sistema de favoritos funcione, você precisa executar o script SQL no Supabase.

## 🚀 Passos para Configurar

### 1. Executar o Script SQL

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Abra o arquivo `favorites_setup.sql` deste projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** para executar

### 2. Verificar se a Tabela foi Criada

Execute esta query no SQL Editor para verificar:

```sql
SELECT * FROM video_favorites LIMIT 1;
```

Se não houver erro, a tabela foi criada com sucesso! ✅

### 3. Verificar Políticas RLS

As políticas RLS (Row Level Security) devem ter sido criadas automaticamente pelo script. Para verificar:

```sql
SELECT * FROM pg_policies WHERE tablename = 'video_favorites';
```

Você deve ver 4 políticas:
- Usuários podem ler seus próprios favoritos
- Usuários podem inserir seus próprios favoritos
- Usuários podem atualizar seus próprios favoritos
- Usuários podem deletar seus próprios favoritos

## ✅ Após Executar o Script

Depois de executar o script SQL:
1. Recarregue a página do aplicativo
2. Faça login (se necessário)
3. Teste adicionar um vídeo aos favoritos (ícone de coração)
4. Teste adicionar um vídeo à watchlist (ícone de bookmark)
5. Acesse a página `/favorites` para ver seus favoritos

## 🎯 Funcionalidades Disponíveis

- ✅ **Favoritar vídeos** - Clique no ícone de coração nos cards de vídeo
- ✅ **Watchlist** - Clique no ícone de bookmark para "Assistir Mais Tarde"
- ✅ **Página de Favoritos** - Acesse via menu do usuário ou `/favorites`
- ✅ **Tabs** - Alternar entre Favoritos e Assistir Mais Tarde
- ✅ **Busca** - Buscar vídeos dentro dos favoritos/watchlist

## 🔍 Troubleshooting

### Se os botões não aparecerem:
- Verifique se você está autenticado (faça login)
- Verifique se não está em modo guest

### Se os botões não funcionarem:
- Verifique se a tabela existe: `SELECT * FROM information_schema.tables WHERE table_name = 'video_favorites';`
- Verifique se as políticas RLS estão ativas: `ALTER TABLE video_favorites ENABLE ROW LEVEL SECURITY;`
- Verifique se as funções RPC foram criadas: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%favorite%';`

### Se houver erros 406:
- Execute o script SQL novamente
- Verifique se está autenticado no Supabase

---

**✅ Tudo pronto? Execute o script SQL e comece a usar os favoritos!**

