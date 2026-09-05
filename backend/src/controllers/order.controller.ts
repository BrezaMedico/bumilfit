import type { Request, Response } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  payOrder,
  type CreateOrderInput,
} from '../services/order.service.js';

export const handleCreateOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const input: CreateOrderInput = req.body;
    const order = await createOrder(userId, input);

    res.status(201).json({
      message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran.',
      order,
    });
  } catch (error: any) {
    console.error('Gagal membuat pesanan:', error);
    res.status(400).json({ message: error.message || 'Terjadi kesalahan saat memproses checkout pesanan.' });
  }
};

export const handleGetUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const orders = await getUserOrders(userId);
    res.status(200).json({ orders });
  } catch (error: any) {
    console.error('Gagal mengambil daftar pesanan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat data pesanan Anda.' });
  }
};

export const handleGetOrderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const order = await getOrderById(userId, id);
    res.status(200).json({ order });
  } catch (error: any) {
    console.error('Gagal mengambil detail pesanan:', error);
    res.status(404).json({ message: error.message || 'Pesanan tidak ditemukan.' });
  }
};

export const handlePayOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Akses ditolak. Sesi tidak ditemukan.' });
    }

    const updatedOrder = await payOrder(userId, id);
    res.status(200).json({
      message: 'Pembayaran berhasil diverifikasi. Pesanan sedang dikemas.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Gagal memproses pembayaran pesanan:', error);
    res.status(400).json({ message: error.message || 'Gagal memproses verifikasi pembayaran.' });
  }
};
