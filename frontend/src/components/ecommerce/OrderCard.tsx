import React from 'react';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { useCartStore } from '../../store/useCartStore';
import { useNavigate } from 'react-router-dom';

export interface OrderItemData {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  status: 'BELUM_BAYAR' | 'DIKEMAS' | 'DIKIRIM' | 'SELESAI' | 'DIBATALKAN';
  items: OrderItemData[];
  totalPrice: number;
  subtotal: number;
  shippingFee: number;
  courierName?: string | null;
  paymentMethod: string;
  bankName?: string | null;
  vaNumber?: string | null;
  shippingAddress?: string | null;
  createdAt: string;
  paymentDeadline: string;
  paidAt?: string | null;
  packedAt?: string | null;
  packedDeadline?: string | null;
  shippedAt?: string | null;
  shippingDeadline?: string | null;
  completedAt?: string | null;
}

interface OrderCardProps {
  order: OrderData;
  onRefresh: () => void;
  onPayNow?: (order: OrderData) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onRefresh, onPayNow }) => {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  // Helper mata uang
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Helper format tanggal
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Target deadline untuk countdown berdasarkan status aktif
  const targetDeadline =
    order.status === 'BELUM_BAYAR'
      ? order.paymentDeadline
      : order.status === 'DIKEMAS'
      ? order.packedDeadline
      : order.status === 'DIKIRIM'
      ? order.shippingDeadline
      : null;

  // Countdown yang memicu refresh status otomatis ketika waktu habis
  const countdown = useCountdown(targetDeadline, onRefresh);

  // Action Beli Lagi untuk pesanan selesai
  const handleBuyAgain = () => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          description: item.description,
        });
      });
      navigate('/keranjang');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all p-5 sm:p-6 text-left space-y-4">
      {/* 1. Header Card: Nomor Pesanan, Tanggal, & Badge Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor Pesanan</span>
            <span className="text-sm font-black text-gray-800 tracking-tight">#{order.orderNumber}</span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium block">
            Dibuat pada {formatDate(order.createdAt)}
          </span>
        </div>

        {/* Badge Status Tematik Hijau / Teal */}
        <div>
          {order.status === 'BELUM_BAYAR' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
              <Clock size={13} className="text-[#389D9C]" />
              <span>Belum Bayar</span>
            </span>
          )}

          {order.status === 'DIKEMAS' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
              <Package size={13} className="text-[#389D9C]" />
              <span>Sedang Dikemas</span>
            </span>
          )}

          {order.status === 'DIKIRIM' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
              <Truck size={13} className="text-[#389D9C]" />
              <span>Dalam Pengiriman</span>
            </span>
          )}

          {order.status === 'SELESAI' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Selesai</span>
            </span>
          )}

          {order.status === 'DIBATALKAN' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
              <AlertCircle size={13} className="text-slate-500" />
              <span>Dibatalkan</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Daftar Item Produk (Ringkas & Bersih) */}
      <div className="space-y-3">
        {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3.5 py-1">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain mix-blend-multiply"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Obat';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-gray-800 truncate leading-snug">
                {item.name}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {item.quantity} barang × {formatRupiah(item.price)}
              </p>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-[#194668] text-right">
              {formatRupiah(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Panel Status Tematik Hijau / Teal */}
      {order.status === 'BELUM_BAYAR' && (
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100/80 text-[#389D9C] flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 block">
                Batas Waktu Pembayaran (1 Hari)
              </span>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {countdown.isExpired ? (
                  <span className="font-bold text-rose-600">Waktu pembayaran telah habis</span>
                ) : (
                  <span>Selesaikan sebelum batas waktu berakhir</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {!countdown.isExpired && (
              <span className="text-base sm:text-lg font-black font-mono tracking-wider text-[#194668] bg-white px-3 py-1 rounded-xl border border-teal-200 shadow-xs">
                {countdown.formatted}
              </span>
            )}
            <button
              onClick={() => onPayNow?.(order)}
              className="px-4 py-2 bg-[#389D9C] hover:bg-[#2e8281] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard size={14} />
              <span>Bayar Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {order.status === 'DIKIRIM' && (
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100/80 text-[#389D9C] flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 block">
                Pesanan Sedang Dalam Pengiriman
              </span>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {order.courierName ? `Dikirim via ${order.courierName}. Kurir sedang menuju alamat Bunda.` : 'Kurir sedang mengantar paket ke alamat tujuan.'}
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 shadow-3xs">
              <span className="w-2 h-2 rounded-full bg-[#389D9C]" />
              <span>Dalam Perjalanan</span>
            </span>
          </div>
        </div>
      )}

      {order.status === 'SELESAI' && (
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between gap-3 text-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Pesanan Selesai Diterima
              </span>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {order.completedAt ? `Tiba pada ${formatDate(order.completedAt)}` : 'Pesanan telah berhasil diserahkan.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleBuyAgain}
            className="px-4 py-2 bg-white hover:bg-teal-50 text-[#389D9C] border border-teal-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={13} />
            <span>Beli Lagi</span>
          </button>
        </div>
      )}

      {/* 4. Footer Card: Total Pembayaran & Detail Ringkas */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-400 font-medium">
          Total {order.items ? order.items.reduce((s, it) => s + it.quantity, 0) : 0} Barang
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Tagihan:</span>
          <span className="text-base sm:text-lg font-black text-[#389D9C]">
            {formatRupiah(order.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};
