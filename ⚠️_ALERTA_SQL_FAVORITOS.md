# ⚠️🚨 ALERTA IMPORTANTE - SQL NECESSÁRIO! 🚨⚠️

## 🔴🔴🔴 EXECUTE O SCRIPT SQL AGORA! 🔴🔴🔴

### 📋 O QUE PRECISA SER FEITO:

**Você precisa executar o script SQL `favorites_setup.sql` no Supabase para que o sistema de favoritos funcione!**

---

## 🎯 PASSO A PASSO:

### 1️⃣ Acesse o Supabase Dashboard
- Vá para: https://app.supabase.com
- Selecione seu projeto

### 2️⃣ Abra o SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

### 3️⃣ Execute o Script
- Abra o arquivo `favorites_setup.sql` deste projeto
- **COPIE TODO O CONTEÚDO** do arquivo
- **COLE** no SQL Editor do Supabase
- Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 4️⃣ Verifique se Funcionou
Execute esta query para verificar:

```sql
SELECT * FROM video_favorites LIMIT 1;
```

Se não houver erro, a tabela foi criada com sucesso! ✅

---

## 📊 O QUE O SCRIPT CRIA:

1. ✅ Tabela `video_favorites` com:
   - Favoritos (`is_watchlist = false`)
   - Watchlist / Assistir Mais Tarde (`is_watchlist = true`)

2. ✅ Políticas RLS (Row Level Security)
   - Usuários só veem seus próprios favoritos

3. ✅ Funções RPC:
   - `toggle_video_favorite` - Adicionar/remover favorito
   - `is_video_favorite` - Verificar se é favorito
   - `get_user_favorites` - Buscar favoritos do usuário
   - `remove_video_favorite` - Remover favorito

---

## ⚠️ IMPORTANTE:

- **Sem executar este script, os favoritos NÃO funcionarão!**
- Você verá erros no console do navegador
- Os botões de favoritar não funcionarão

---

## ✅ APÓS EXECUTAR:

1. Recarregue a página do aplicativo
2. Faça login (se necessário)
3. Teste adicionar um vídeo aos favoritos
4. Acesse a página `/favorites` para ver seus favoritos

---

## 🆘 SE TIVER PROBLEMAS:

1. Verifique se você está autenticado no Supabase
2. Verifique se o projeto está ativo
3. Verifique se há erros no SQL Editor
4. Tente executar o script novamente

---

**🚨 NÃO ESQUEÇA: Execute o script SQL antes de usar os favoritos! 🚨**

