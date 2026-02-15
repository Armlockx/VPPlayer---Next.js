/**
 * Barrel export para todos os serviços
 * Facilita imports: import { videoService, commentService } from '@/lib/services'
 */

export { videoService, VideoService } from './videoService';
export { commentService, CommentService, type Comment } from './commentService';
export { favoriteService, FavoriteService, type FavoriteItem, type FavoriteWithVideo } from './favoriteService';
export { historyService, HistoryService, type VideoHistoryItem, type VideoHistoryWithVideo } from './historyService';
export { likeService, LikeService, type LikedVideoItem } from './likeService';
export { statsService, StatsService, type GeneralStats, type VideoStats } from './statsService';
export { adminService, AdminService } from './adminService';

