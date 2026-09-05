import prisma from '../lib/prisma.js';
import type { Order, OrderStatus } from '@prisma/client';

export interface CreateOrderInput {
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    description?: string;
  }>;
  totalPrice: number;
  subtotal: number;
  shippingFee: number;
  courierName?: string;
  paymentMethod: string;
  bankName?: string;
  vaNumber?: string;
  shippingAddress?: string;
}

/**
 * Sinkronisasi status pesanan berdasarkan timestamp aktual di database.
 * Fungsi ini memastikan sistem tidak bergantung pada timer frontend dan konsisten setelah refresh.
 */
export const syncOrderStatus = async (order: Order): Promise<Order> => {
  const now = new Date();
  let updated = false;
  let newStatus: OrderStatus = order.status;
  let shippedAt = order.shippedAt;
  let shippingDeadline = order.shippingDeadline;
  let completedAt = order.completedAt;

  // 1. Cek batas pembayaran untuk pesanan BELUM_BAYAR
  if (order.status === 'BELUM_BAYAR') {
    if (now.getTime() >= order.paymentDeadline.getTime()) {
      newStatus = 'DIBATALKAN';
      updated = true;
    }
  }

  // 2. Cek estimasi 30 menit untuk pesanan DIKEMAS
  if (order.status === 'DIKEMAS' && order.packedDeadline) {
    if (now.getTime() >= order.packedDeadline.getTime()) {
      newStatus = 'DIKIRIM';
      shippedAt = order.packedDeadline;
      // Waktu pengiriman: 1 hari (24 jam) dari packedDeadline
      shippingDeadline = new Date(order.packedDeadline.getTime() + 24 * 60 * 60 * 1000);
      updated = true;

      // Chaining check: jika waktu sekarang juga sudah melewati shippingDeadline (misal user kembali 2 hari kemudian)
      if (now.getTime() >= shippingDeadline.getTime()) {
        newStatus = 'SELESAI';
        completedAt = shippingDeadline;
      }
    }
  }

  // 3. Cek estimasi 1 hari untuk pesanan DIKIRIM
  if (order.status === 'DIKIRIM' && order.shippingDeadline) {
    if (now.getTime() >= order.shippingDeadline.getTime()) {
      newStatus = 'SELESAI';
      completedAt = order.shippingDeadline;
      updated = true;
    }
  }

  // Jika ada perubahan status otomatis, simpan ke database
  if (updated) {
    return await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        shippedAt,
        shippingDeadline,
        completedAt,
      },
    });
  }

  return order;
};

/**
 * Membuat pesanan baru saat checkout
 */
export const createOrder = async (userId: string, input: CreateOrderInput): Promise<Order> => {
  if (!input.items || input.items.length === 0) {
    throw new Error('Keranjang belanja kosong. Harap pilih produk terlebih dahulu.');
  }

  // Generate nomor pesanan unik e.g. #ORD-829104
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderNumber = `ORD-${randomSuffix}`;

  const createdAt = new Date();
  // Batas pembayaran = 1 hari (24 jam)
  const paymentDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  const newOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: 'BELUM_BAYAR',
      items: input.items,
      totalPrice: input.totalPrice,
      subtotal: input.subtotal,
      shippingFee: input.shippingFee,
      courierName: input.courierName || null,
      paymentMethod: input.paymentMethod,
      bankName: input.bankName || null,
      vaNumber: input.vaNumber || null,
      shippingAddress: input.shippingAddress || null,
      createdAt,
      paymentDeadline,
    },
  });

  return newOrder;
};

/**
 * Mengambil semua pesanan milik pengguna yang sedang login
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Sinkronisasi status secara otomatis untuk setiap pesanan
  const syncedOrders = await Promise.all(orders.map((order) => syncOrderStatus(order)));
  return syncedOrders;
};

/**
 * Mengambil detail satu pesanan berdasarkan ID
 */
export const getOrderById = async (userId: string, orderId: string): Promise<Order> => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  return await syncOrderStatus(order);
};

/**
 * Menjalankan simulasi pembayaran pesanan
 * Mengubah status dari BELUM_BAYAR -> DIKEMAS
 * Waktu status DIKEMAS = 30 menit
 */
export const payOrder = async (userId: string, orderId: string): Promise<Order> => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  // Jika sudah dibayar atau status lain
  if (order.status !== 'BELUM_BAYAR') {
    return await syncOrderStatus(order);
  }

  const now = new Date();
  // Cek apakah sudah kadaluwarsa
  if (now.getTime() >= order.paymentDeadline.getTime()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DIBATALKAN' },
    });
    throw new Error('Batas waktu pembayaran pesanan ini telah habis.');
  }

  // Pembayaran Berhasil -> Pindah ke DIKEMAS
  const paidAt = now;
  const packedAt = now;
  // Durasi simulasi Dikemas: 30 menit
  const packedDeadline = new Date(packedAt.getTime() + 30 * 60 * 1000);

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'DIKEMAS',
      paidAt,
      packedAt,
      packedDeadline,
    },
  });

  return updatedOrder;
};
