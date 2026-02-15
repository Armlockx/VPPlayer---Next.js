# Instruções para Configurar Comentários com Threads

## 📋 O que foi implementado

### ✅ Funcionalidades
1. **Respostas a comentários (threads)** - Usuários podem responder a comentários
2. **Editar próprios comentários** - Usuários podem editar seus próprios comentários
3. **Timestamps em comentários** - Comentários podem ter timestamps clicáveis que fazem seek no vídeo

## 🗄️ Configuração do Banco de Dados

### Passo 1: Executar o Script SQL

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `comments_threads_setup.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** ou pressione `Ctrl+Enter`

### O que o script faz:

1. **Adiciona colunas:**
   - `parent_comment_id` - Para identificar respostas (threads)
   - `edited_at` - Para rastrear quando um comentário foi editado
   - `timestamp_seconds` - Para timestamps clicáveis

2. **Cria índices** para melhor performance

3. **Atualiza políticas RLS** para permitir edição

4. **Cria triggers** para atualizar `edited_at` automaticamente

5. **Cria funções RPC** para buscar comentários com threads

## 🎯 Como Usar

### Para Usuários:

#### Adicionar Comentário:
1. Clique no botão de comentários no player
2. Digite seu comentário
3. (Opcional) Clique em "Adicionar Timestamp" para vincular a um momento do vídeo
4. Clique em "Comentar"

#### Responder a um Comentário:
1. Clique em "Responder" abaixo de um comentário
2. Digite sua resposta
3. Clique em "Responder"

#### Editar Comentário:
1. Clique no ícone de editar (lápis) no seu comentário
2. Edite o texto
3. Clique no ícone de check (✓) para salvar
4. Ou clique no X para cancelar

#### Usar Timestamp:
1. Ao criar um comentário, clique em "Adicionar Timestamp"
2. Digite o tempo no formato MM:SS ou HH:MM:SS
3. O timestamp aparecerá como um botão clicável no comentário
4. Clique no timestamp para ir para aquele momento do vídeo

### Para Desenvolvedores:

#### Estrutura de Dados:

```typescript
interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string | null;
  timestamp_seconds?: number | null;
  parent_comment_id?: string | null; // null = comentário principal
  reply_count?: number;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[]; // Array de respostas
}
```

#### Hook useComments:

```typescript
const { 
  comments,        // Array de comentários principais com replies
  loading,         // Estado de carregamento
  addComment,      // Função para adicionar comentário/resposta
  editComment,     // Função para editar comentário
  deleteComment,   // Função para deletar comentário
  refreshComments  // Função para recarregar comentários
} = useComments(videoId);
```

#### Adicionar Comentário:

```typescript
// Comentário principal
await addComment('Texto do comentário');

// Resposta a um comentário
await addComment('Texto da resposta', parentCommentId);

// Comentário com timestamp
await addComment('Texto do comentário', null, 120); // 120 segundos
```

#### Editar Comentário:

```typescript
await editComment(commentId, 'Novo texto do comentário');
```

## 🔒 Segurança

- Apenas o dono do comentário pode editá-lo ou deletá-lo
- RLS (Row Level Security) está configurado no Supabase
- Políticas de segurança garantem que usuários só podem modificar seus próprios comentários

## 🐛 Troubleshooting

### Erro: "Arquivo não encontrado"
- Certifique-se de que executou o script SQL no Supabase

### Erro: "Você não tem permissão para editar"
- Verifique se você é o dono do comentário
- Verifique se está autenticado

### Timestamps não funcionam
- Certifique-se de que a prop `onSeek` foi passada para o `CommentsModal`
- Verifique se o player está funcionando corretamente

## 📝 Notas

- Comentários editados mostram "(editado)" ao lado do nome
- Respostas são indentadas e têm uma borda esquerda vermelha
- Timestamps são exibidos como botões clicáveis com ícone de relógio
- O modal fecha automaticamente quando você clica em um timestamp

---

*Última atualização: Janeiro 2025*

