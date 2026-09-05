import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Loader2,
  AlertCircle,
  X,
  QrCode,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { OrderCard, type OrderData } from '../../components/ecommerce/OrderCard';
import { toast } from '../../store/useToastStore';

type TabStatus = 'BELUM_BAYAR' | 'DIKEMAS' | 'DIKIRIM' | 'SELESAI';

const TABS: Array<{ id: TabStatus; label: string; icon: any }> = [
  { id: 'BELUM_BAYAR', label: 'Belum Bayar', icon: Clock },
  { id: 'DIKEMAS', label: 'Dikemas', icon: Package },
  { id: 'DIKIRIM', label: 'Dikirim', icon: Truck },
  { id: 'SELESAI', label: 'Selesai', icon: CheckCircle2 },
];

export const StatusPesananPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab aktif (bisa dari query params ?tab=dikemas)
  const initialTab = (searchParams.get('tab')?.toUpperCase() as TabStatus) || 'BELUM_BAYAR';
  const [activeTab, setActiveTab] = useState<TabStatus>(
    ['BELUM_BAYAR', 'DIKEMAS', 'DIKIRIM', 'SELESAI'].includes(initialTab)
      ? initialTab
      : 'BELUM_BAYAR'
  );

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State modal pembayaran
  const [selectedPayOrder, setSelectedPayOrder] = useState<OrderData | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);

  // Fetch data pesanan dari database
  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    setError(null);
    try {
      const res = await apiClient.get('/orders/my-orders');
      setOrders(res.data.orders || []);
    } catch (err: any) {
      console.error('Gagal memuat pesanan:', err);
      setError(err.response?.data?.message || 'Gagal memuat data pesanan. Silakan periksa koneksi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update query params saat ganti tab
  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
  };

  // Filter pesanan sesuai tab aktif
  const filteredOrders = orders.filter((order) => order.status === activeTab);

  // Hitung jumlah pesanan untuk tiap tab
  const countByTab: Record<TabStatus, number> = {
    BELUM_BAYAR: orders.filter((o) => o.status === 'BELUM_BAYAR').length,
    DIKEMAS: orders.filter((o) => o.status === 'DIKEMAS').length,
    DIKIRIM: orders.filter((o) => o.status === 'DIKIRIM').length,
    SELESAI: orders.filter((o) => o.status === 'SELESAI').length,
  };

  // Handler klik Bayar Sekarang
  const handleOpenPayModal = (order: OrderData) => {
    setSelectedPayOrder(order);
  };

  // Handler konfirmasi pembayaran dummy
  const handleConfirmPayment = async () => {
    if (!selectedPayOrder) return;
    setIsPaying(true);
    try {
      await apiClient.post(`/orders/${selectedPayOrder.id}/pay`);
      setSelectedPayOrder(null);
      toast.success('Pembayaran berhasil diverifikasi! Pesanan segera diproses.');
      // Refresh pesanan & pindah otomatis ke tab "Dikemas"
      await fetchOrders();
      handleTabChange('DIKEMAS');
    } catch (err: any) {
      console.error('Gagal memverifikasi pembayaran:', err);
      toast.error(err.response?.data?.message || 'Gagal memproses pembayaran.');
    } finally {
      setIsPaying(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 mobile-bottom-pad font-sans text-left">
      {/* 1. Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4 shadow-3xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/belanja-obat')}
            className="flex items-center gap-2 text-[#389D9C] hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-sm font-bold"
            aria-label="Kembali ke Belanja Obat"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Belanja Obat</span>
          </button>

          <h1 className="text-base sm:text-lg font-black text-[#194668] tracking-tight text-center">
            Aktivitas Pembelian
          </h1>

          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-[#389D9C] hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
            title="Muat Ulang Status"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-[#389D9C]' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 2. Tab Bar Segmented Control (4 Kategori Utama) */}
        <div className="bg-white p-1 sm:p-1.5 rounded-2xl border border-teal-100/80 shadow-sm grid grid-cols-4 gap-1 w-full select-none">
          {TABS.map((tab) => {
            const count = countByTab[tab.id];
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#389D9C] text-white shadow-xs sm:scale-[1.02]'
                    : 'text-slate-600 hover:text-[#389D9C] hover:bg-teal-50/60'
                }`}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <Icon size={16} className={`transition-transform duration-200 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-[#389D9C]'}`} />
                  {count > 0 && (
                    <span
                      className={`sm:hidden absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] rounded-full text-[9px] font-black flex items-center justify-center leading-none shadow-2xs ${
                        isActive ? 'bg-white text-[#389D9C]' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] xs:text-[11px] sm:text-sm text-center leading-tight sm:leading-normal">
                  {tab.label}
                </span>
                {count > 0 && (
                  <span
                    className={`hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive ? 'bg-white text-[#389D9C]' : 'bg-teal-50 text-teal-700 border border-teal-200/70'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Daftar Card Pesanan Sesuai Tab */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-gray-400">
            <Loader2 size={36} className="animate-spin text-[#389D9C]" />
            <p className="text-xs font-semibold">Memuat status pesanan...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-sm text-center space-y-3 max-w-md mx-auto">
            <AlertCircle size={36} className="text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-gray-700">{error}</p>
            <button
              onClick={() => fetchOrders(true)}
              className="px-4 py-2 bg-[#389D9C] text-white rounded-xl text-xs font-bold hover:bg-[#2E8281] transition-all cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 px-4 bg-white rounded-3xl border border-gray-100 text-center space-y-4 shadow-3xs max-w-md mx-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-[#389D9C] flex items-center justify-center mx-auto">
              <ShoppingBag size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-800">
                Tidak ada pesanan di tab {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {activeTab === 'BELUM_BAYAR'
                  ? 'Semua tagihan pesanan obat Anda sudah diselesaikan.'
                  : activeTab === 'DIKEMAS'
                  ? 'Saat ini tidak ada obat yang sedang dikemas oleh apotek.'
                  : activeTab === 'DIKIRIM'
                  ? 'Tidak ada paket obat yang sedang dalam perjalanan kurir.'
                  : 'Riwayat pesanan yang telah selesai akan muncul di sini.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/belanja-obat')}
              className="px-5 py-2.5 rounded-xl bg-[#389D9C] hover:bg-[#2E8281] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              <span>Belanja Obat Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRefresh={fetchOrders}
                onPayNow={handleOpenPayModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Modal Dialog Pembayaran Langsung */}
      {selectedPayOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-left space-y-5 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setSelectedPayOrder(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pembayaran Pesanan</span>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">
                #{selectedPayOrder.orderNumber}
              </h3>
            </div>

            {/* Total Tagihan */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Total Pembayaran</span>
              <span className="text-xl font-black text-[#389D9C]">
                {formatRupiah(selectedPayOrder.totalPrice)}
              </span>
            </div>

            {/* Metode Pembayaran Ringkas */}
            {selectedPayOrder.paymentMethod === 'bank' ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Virtual Account {selectedPayOrder.bankName || 'BCA'}</span>
                  <Building2 size={16} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-black font-mono tracking-wider text-gray-800">
                    {selectedPayOrder.vaNumber || '3901081234567890'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPayOrder.vaNumber || '3901081234567890');
                      setCopiedVa(true);
                      setTimeout(() => setCopiedVa(false), 2000);
                    }}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center gap-1"
                  >
                    {copiedVa ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                <span className="text-xs font-bold text-gray-500 block uppercase tracking-wide">
                  Metode: QRIS Instant
                </span>
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-gray-700">
                  <QrCode size={26} />
                </div>
                <p className="text-[11px] text-gray-400">
                  Simulasikan konfirmasi pembayaran dengan menekan tombol verifikasi di bawah ini.
                </p>
              </div>
            )}

            {/* Tombol Aksi Pembayaran */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayOrder(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isPaying}
                className="flex-1 py-3 rounded-xl bg-[#389D9C] hover:bg-[#2E8281] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Konfirmasi Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
