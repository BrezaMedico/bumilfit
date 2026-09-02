import { Router } from 'express';
import { 
  getPosts, 
  createPost, 
  deletePost, 
  toggleLike, 
  getCommentsByPostId,
  createComment, 
  deleteComment 
} from '../controllers/komunitas.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/posts', requireAuth, getPosts);
router.post('/posts', requireAuth, createPost);
router.delete('/posts/:id', requireAuth, deletePost);
router.post('/posts/:id/like', requireAuth, toggleLike);
router.get('/posts/:id/comments', requireAuth, getCommentsByPostId);
router.post('/posts/:id/comments', requireAuth, createComment);
router.delete('/comments/:id', requireAuth, deleteComment);

export default router;
