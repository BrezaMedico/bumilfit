import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  getWhatsAppStatus,
  reconnectWhatsApp,
  logoutWhatsApp,
  sendTestOtp,
} from '../controllers/whatsapp.controller.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware proteksi khusus role WHATSAPP_ADMIN
const requireWhatsAppAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'WHATSAPP_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Halaman dan aksi ini hanya untuk akun Administrator WhatsApp BUMILFIT.',
    });
  }
  next();
};

// Semua endpoint WhatsApp dilindungi oleh token autentikasi & role WHATSAPP_ADMIN
router.use(requireAuth, requireWhatsAppAdmin);

router.get('/status', getWhatsAppStatus);
router.post('/reconnect', reconnectWhatsApp);
router.post('/logout', logoutWhatsApp);
router.post('/test-otp', sendTestOtp);

export default router;
