import type { Request, Response } from 'express';
import { getUserSubscription, activateSubscription } from '../services/subscription.service.js';

export const getCurrentSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const subscription = await getUserSubscription(userId);
    res.status(200).json(subscription);
  } catch (error: any) {
    console.error('Gagal mengambil status subscription:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat status langganan.' });
  }
};

export const activateSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    if (!planId) {
      return res.status(400).json({ message: 'Pilihan paket (planId) wajib diisi.' });
    }

    const subscription = await activateSubscription(userId, planId);
    res.status(200).json({
      message: `Selamat! ${subscription.planName} Anda telah aktif.`,
      subscription,
    });
  } catch (error: any) {
    console.error('Gagal mengaktifkan subscription:', error);
    res.status(400).json({ message: error.message || 'Terjadi kesalahan saat mengaktifkan langganan.' });
  }
};
