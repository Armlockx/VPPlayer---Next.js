# 📦 Camada de Serviços

Esta pasta contém a camada de serviços do projeto, responsável por encapsular toda a lógica de comunicação com a API (Supabase).

## 🎯 Objetivo

Separar a lógica de negócio e chamadas de API dos componentes React, facilitando:
- **Testabilidade**: Serviços podem ser testados independentemente
- **Reutilização**: Lógica de API pode ser reutilizada em diferentes hooks/componentes
- **Manutenibilidade**: Mudanças na API são centralizadas
- **Organização**: Código mais limpo e estruturado

## 📁 Estrutura

```
lib/services/
├── videoService.ts      # Operações com vídeos
├── commentService.ts    # Operações com comentários
├── favoriteService.ts   # Operações com favoritos/watchlist
├── historyService.ts    # Operações com histórico
├── likeService.ts       # Operações com likes
├── statsService.ts      # Operações com estatísticas
├── adminService.ts      # Operações administrativas
├── index.ts            # Barrel export
└── README.md           # Este arquivo
```

## 🔧 Serviços Disponíveis

### 1. VideoService

Operações relacionadas a vídeos:

```typescript
import { videoService } from '@/lib/services';

// Buscar todos os vídeos
const videos = await videoService.fetchVideos();

// Buscar vídeo por ID
const video = await videoService.fetchVideoById(videoId);

// Incrementar visualizações
await videoService.incrementViews(videoId);

// Incrementar tempo assistido
await videoService.incrementWatchTime(videoId, seconds);

// Buscar vídeos com filtro
const results = await videoService.searchVideos(searchTerm);
```

### 2. CommentService

Operações relacionadas a comentários:

```typescript
import { commentService } from '@/lib/services';

// Buscar comentários de um vídeo (com threads)
const comments = await commentService.fetchComments(videoId);

// Adicionar comentário
const comment = await commentService.addComment(videoId, content, parentId, timestamp);

// Editar comentário
await commentService.editComment(commentId, newText);

// Deletar comentário
await commentService.deleteComment(commentId);
```

### 3. FavoriteService

Operações relacionadas a favoritos e watchlist:

```typescript
import { favoriteService } from '@/lib/services';

// Buscar favoritos
const favorites = await favoriteService.fetchFavorites(false);

// Buscar watchlist
const watchlist = await favoriteService.fetchFavorites(true);

// Alternar favorito
const isFavorite = await favoriteService.toggleFavorite(videoId);

// Alternar watchlist
const isInWatchlist = await favoriteService.toggleWatchlist(videoId);

// Verificar status
const isFavorite = await favoriteService.isFavorite(videoId);
const isInWatchlist = await favoriteService.isInWatchlist(videoId);
```

### 4. HistoryService

Operações relacionadas ao histórico:

```typescript
import { historyService } from '@/lib/services';

// Buscar histórico
const history = await historyService.fetchHistory(limit);

// Salvar progresso
await historyService.saveProgress(videoId, currentTime, duration, completed);

// Obter progresso de um vídeo
const progress = await historyService.getVideoProgress(videoId);

// Limpar histórico
await historyService.clearHistory(); // Tudo
await historyService.clearHistory(videoId); // Vídeo específico
```

### 5. LikeService

Operações relacionadas a likes:

```typescript
import { likeService } from '@/lib/services';

// Buscar vídeos curtidos pelo usuário
const likedVideos = await likeService.fetchLikedVideos();

// Buscar likes de um vídeo
const { count, userLiked } = await likeService.fetchVideoLikes(videoId);

// Alternar like
const isLiked = await likeService.toggleLike(videoId);
```

### 6. StatsService

Operações relacionadas a estatísticas:

```typescript
import { statsService } from '@/lib/services';

// Buscar estatísticas gerais
const stats = await statsService.fetchGeneralStats();
// Retorna: { totalVideos, totalViews, totalWatchTime, totalUsers, totalAdmins }

// Buscar estatísticas de um vídeo
const videoStats = await statsService.fetchVideoStats(videoId);
// Retorna: { views, watch_time }
```

### 7. AdminService

Operações administrativas:

```typescript
import { adminService } from '@/lib/services';

// Buscar todos os vídeos
const videos = await adminService.fetchAllVideos(searchTerm);

// Criar vídeo
const newVideo = await adminService.createVideo(videoData);

// Atualizar vídeo
await adminService.updateVideo(videoId, videoData);

// Deletar vídeo
await adminService.deleteVideo(videoId);

// Buscar todos os usuários
const users = await adminService.fetchAllUsers(searchTerm);

// Verificar se é admin
const isAdmin = await adminService.checkIsAdmin();
```

## 📦 Importação

### Importação Individual

```typescript
import { videoService } from '@/lib/services/videoService';
import { commentService } from '@/lib/services/commentService';
```

### Importação via Barrel Export

```typescript
import { 
  videoService, 
  commentService, 
  favoriteService 
} from '@/lib/services';
```

## 🔄 Migração de Hooks

Os hooks existentes (`useComments`, `useFavorites`, etc.) podem ser gradualmente migrados para usar os serviços:

**Antes:**
```typescript
const { data, error } = await supabase
  .from('video_comments')
  .select('*')
  .eq('video_id', videoId);
```

**Depois:**
```typescript
const comments = await commentService.fetchComments(videoId);
```

## ✅ Benefícios

1. **Separação de Responsabilidades**: Lógica de API separada da lógica de UI
2. **Testabilidade**: Serviços podem ser mockados facilmente
3. **Reutilização**: Mesma lógica pode ser usada em diferentes contextos
4. **Manutenibilidade**: Mudanças na API são centralizadas
5. **Type Safety**: TypeScript garante tipos corretos
6. **Error Handling**: Tratamento de erros centralizado

## 🚀 Próximos Passos

1. Migrar hooks existentes para usar os serviços
2. Adicionar testes unitários para os serviços
3. Implementar cache nos serviços quando apropriado
4. Adicionar retry logic para operações críticas
5. Implementar logging centralizado

## 📝 Notas

- Todos os serviços são singletons (uma única instância)
- Serviços gerenciam autenticação internamente
- Erros são propagados para o caller (hooks/componentes)
- Tratamento de erros específicos (tabelas não existentes) é feito nos serviços

---

**Última atualização:** 2024-01-XX

