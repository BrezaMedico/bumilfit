import type { Request, Response, NextFunction } from 'express';
import { getUserSubscription } from '../services/subscription.service.js';

export const requireSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const sub = await getUserSubscription(userId);
    if (!sub.hasActiveSubscription || !sub.canAccessDoctorConsultation) {
      return res.status(403).json({
        message: 'Fitur konsultasi dokter membutuhkan langganan aktif. Silakan pilih paket langganan Bunda.',
        code: 'SUBSCRIPTION_REQUIRED',
        subscription: sub,
      });
    }

    (req as any).subscription = sub;
    next();
  } catch (error) {
    console.error('Error in requireSubscription middleware:', error);
    res.status(500).json({ message: 'Gagal memverifikasi status langganan' });
  }
};

export const requireCameraScanAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const sub = await getUserSubscription(userId);
    if (!sub.hasActiveSubscription) {
      return res.status(403).json({
        message: 'Fitur Scan Kamera Nutrisi membutuhkan paket langganan aktif.',
        code: 'SUBSCRIPTION_REQUIRED',
        subscription: sub,
      });
    }

    if (!sub.canAccessCameraScan) {
      return res.status(403).json({
        message: 'Fitur Scan Kamera Nutrisi hanya tersedia untuk Paket Premium dan Paket Premium+.',
        code: 'UPGRADE_REQUIRED',
        subscription: sub,
      });
    }

    (req as any).subscription = sub;
    next();
  } catch (error) {
    console.error('Error in requireCameraScanAccess middleware:', error);
    res.status(500).json({ message: 'Gagal memverifikasi hak akses fitur scan kamera' });
  }
};
