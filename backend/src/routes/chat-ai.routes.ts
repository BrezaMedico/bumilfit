import { Router } from 'express';
import { sendMessageAI } from '../controllers/chat-ai.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireSubscription } from '../middlewares/subscription.middleware.js';

const router = Router();
// Proteksi endpoint agar hanya user login dan memiliki langganan aktif yang bisa akses konsultasi dokter
router.post('/', requireAuth, requireSubscription, sendMessageAI);

export default router;
