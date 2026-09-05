import { Router } from 'express';
import { getCurrentSubscription, activateSubscriptionPlan } from '../controllers/subscription.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Semua rute subscription memerlukan autentikasi login
router.get('/current', requireAuth, getCurrentSubscription);
router.post('/activate', requireAuth, activateSubscriptionPlan);

export default router;
