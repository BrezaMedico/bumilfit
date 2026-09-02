import { Router } from 'express';
import { sendMessageAI } from '../controllers/chat-ai.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
// Proteksi endpoint agar hanya user login yang bisa akses
router.post('/', requireAuth, sendMessageAI);

export default router;
