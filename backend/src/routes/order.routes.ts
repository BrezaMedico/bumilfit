import { Router } from 'express';
import {
  handleCreateOrder,
  handleGetUserOrders,
  handleGetOrderById,
  handlePayOrder,
} from '../controllers/order.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Semua rute pesanan membutuhkan autentikasi
router.post('/', requireAuth, handleCreateOrder);
router.get('/my-orders', requireAuth, handleGetUserOrders);
router.get('/:id', requireAuth, handleGetOrderById);
router.post('/:id/pay', requireAuth, handlePayOrder);

export default router;
