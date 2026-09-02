import { Router } from 'express';
import { analisisGiziMakanan, kalkulatorGizi } from '../controllers/gizi.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Proteksi endpoint agar hanya pengguna login yang bisa mengakses fitur hitung gizi & scanner AI
router.post('/scan', requireAuth, analisisGiziMakanan);
router.post('/kalkulator', requireAuth, kalkulatorGizi);

export default router;
