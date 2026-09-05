import { Router } from 'express';
import { getDailyTodos, completeTodo, createKeluhanLog, evaluateSymptoms, triggerRemindersManual } from '../controllers/todo.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/daily', requireAuth, getDailyTodos);
router.post('/complete', requireAuth, completeTodo);
router.post('/keluhan', requireAuth, createKeluhanLog);
router.post('/evaluate', requireAuth, evaluateSymptoms);
router.post('/trigger-reminders', requireAuth, triggerRemindersManual);

export default router;
