import { Router } from 'express';
import { analisisGiziMakanan, kalkulatorGizi } from '../controllers/gizi.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireCameraScanAccess } from '../middlewares/subscription.middleware.js';

const router = Router();

// Proteksi endpoint: Scan Camera hanya untuk Premium & Premium Lengkap aktif
router.post('/scan', requireAuth, requireCameraScanAccess, analisisGiziMakanan);
// Kalkulator gizi dasar terbuka untuk semua pengunjung & pengguna
router.post('/kalkulator', kalkulatorGizi);

export default router;
