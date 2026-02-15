# Instruções para Configurar o Histórico de Vídeos

## ⚠️ Erro 406 (Not Acceptable)

Se você está vendo erros `406 (Not Acceptable)` ao tentar acessar `video_history`, significa que a tabela ainda não foi criada no Supabase.

## 📋 Passos para Resolver

### 1. Executar o Script SQL

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Abra o arquivo `video_history_setup.sql` deste projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** para executar

### 2. Verificar se a Tabela foi Criada

Execute esta query no SQL Editor para verificar:

```sql
SELECT * FROM video_history LIMIT 1;
```

Se não houver erro, a tabela foi criada com sucesso!

### 3. Verificar Políticas RLS

As políticas RLS (Row Level Security) devem ter sido criadas automaticamente pelo script. Para verificar:

```sql
SELECT * FROM pg_policies WHERE tablename = 'video_history';
```

Você deve ver 4 políticas:
- Usuários podem ler seu próprio histórico
- Usuários podem inserir seu próprio histórico
- Usuários podem atualizar seu próprio histórico
- Usuários podem deletar seu próprio histórico

## ✅ Após Executar o Script

Depois de executar o script SQL:
1. Recarregue a página do aplicativo
2. Os erros 406 devem desaparecer
3. O histórico de vídeos começará a funcionar automaticamente

## 🔍 Troubleshooting

### Se ainda houver erros 406:

1. Verifique se você está autenticado (faça login)
2. Verifique se a tabela existe: `SELECT * FROM information_schema.tables WHERE table_name = 'video_history';`
3. Verifique as políticas RLS estão ativas: `ALTER TABLE video_history ENABLE ROW LEVEL SECURITY;`

### Se as funções RPC não funcionarem:

Execute novamente apenas a parte 4 do script SQL (funções RPC):
- `upsert_video_history`
- `get_user_video_history`
- `clear_video_history`

