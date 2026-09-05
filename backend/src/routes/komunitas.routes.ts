import { Router } from 'express';
import { 
  getPosts, 
  createPost, 
  deletePost, 
  toggleLike, 
  getCommentsByPostId,
  createComment, 
  deleteComment,
  reportComment,
  reportPost
} from '../controllers/komunitas.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/posts', requireAuth, getPosts);
router.post('/posts', requireAuth, createPost);
router.delete('/posts/:id', requireAuth, deletePost);
router.post('/posts/:id/like', requireAuth, toggleLike);
router.post('/posts/:id/report', requireAuth, reportPost);
router.get('/posts/:id/comments', requireAuth, getCommentsByPostId);
router.post('/posts/:id/comments', requireAuth, createComment);
router.delete('/comments/:id', requireAuth, deleteComment);
router.post('/comments/:id/report', requireAuth, reportComment);

export default router;
