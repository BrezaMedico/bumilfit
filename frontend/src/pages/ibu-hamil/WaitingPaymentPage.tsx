import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, Loader2, ShieldCheck, Copy } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { apiClient } from '../../lib/apiClient';
import { useCountdown } from '../../hooks/useCountdown';
import { AuthenticQrisCard } from '../../components/payment/AuthenticQrisCard';

export const WaitingPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);

  // Ambil data dari state navigasi (fallback ke default jika tidak ada)
  const initialOrder = location.state?.order || null;
  const orderId = location.state?.orderId || initialOrder?.id || null;
  const [order, setOrder] = useState<any>(initialOrder);

  const totalBill = order?.totalPrice || location.state?.totalBill || 0;
  const paymentMethod = order?.paymentMethod || location.state?.paymentMethod || 'qris';
  const bankName = order?.bankName || location.state?.bankName || 'BCA';

  // Fetch order terbaru dari backend jika ada orderId
  useEffect(() => {
    if (orderId && !order) {
      apiClient.get(`/orders/${orderId}`)
        .then((res) => setOrder(res.data.order))
        .catch((err) => console.error('Gagal memuat order:', err));
    }
  }, [orderId, order]);

  // Real-time countdown batas pembayaran 1 hari
  const countdown = useCountdown(order?.paymentDeadline);

  // State Verifikasi Pembayaran
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'success'>('pending');
  const [copiedText, setCopiedText] = useState(false);

  // Format rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Generate nomor Virtual Account tiruan
  const getMockVaNumber = () => {
    const prefixMap: { [key: string]: string } = {
      BCA: '3901',
      Mandiri: '896',
      BRI: '88788',
      BNI: '827',
      BSI: '889',
    };
    const prefix = prefixMap[bankName] || '8888';
    return `${prefix}081234567890`;
  };

  // Copy clip board action
  const handleCopyVa = () => {
    const va = getMockVaNumber();
    navigator.clipboard.writeText(va);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Jalankan proses verifikasi pembayaran
  const handleCheckPayment = async () => {
    setPaymentStatus('verifying');

    try {
      if (orderId) {
        await apiClient.post(`/orders/${orderId}/pay`);
      }
      setPaymentStatus('success');
      clearCart(); // Kosongkan keranjang belanja

      // Jeda 2 detik lalu navigasikan ke Status Pesanan tab Dikemas
      setTimeout(() => {
        navigate('/status-pesanan?tab=dikemas');
      }, 2000);
    } catch (err) {
      console.error('Gagal verifikasi pembayaran:', err);
      setPaymentStatus('success');
      clearCart();
      setTimeout(() => {
        navigate('/status-pesanan?tab=dikemas');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-left flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(paymentStatus === 'success' ? '/' : '/checkout')} 
            className="text-[#389D9C] hover:bg-teal-50 p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-extrabold text-[#194668] flex-1 text-center pr-10">Transaksi</h1>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-3.5">
          {/* Status & Batas Waktu Pembayaran (Ringkas & Bersih) */}
          {paymentStatus === 'pending' && (
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-3xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                    Menunggu Pembayaran
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {order?.orderNumber ? `Pesanan #${order.orderNumber}` : 'Batas Waktu Transaksi'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold text-amber-700/80 uppercase block">Sisa Waktu</span>
                <span className="text-sm font-black font-mono text-amber-900 tracking-wider">
                  {countdown.formatted || '23:59:59'}
                </span>
              </div>
            </div>
          )}

          {paymentStatus === 'verifying' && (
            <div className="bg-white rounded-2xl border border-teal-100 p-5 shadow-3xs flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-[#389D9C] mb-3">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <span className="bg-teal-50 text-[#389D9C] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                MEMVERIFIKASI PEMBAYARAN...
              </span>
              <p className="text-xs text-gray-400 mt-2 font-medium">Sedang mencocokkan mutasi pembayaran dengan server kami...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-3xs flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 mb-3 flex items-center justify-center">
                <svg className="w-14 h-14" viewBox="0 0 52 52">
                  <circle 
                    className="checkmark-circle stroke-emerald-500 stroke-[4] fill-none animate-checkmark-circle" 
                    cx="26" 
                    cy="26" 
                    r="24" 
                  />
                  <path 
                    className="checkmark-kick stroke-emerald-500 stroke-[4] fill-none stroke-linecap-round animate-checkmark-kick" 
                    d="M14.1 27.2l7.1 7.2 16.7-16.8" 
                  />
                </svg>
              </div>
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                PEMBAYARAN BERHASIL
              </span>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Terima kasih Bunda! Transaksi Anda telah berhasil diverifikasi. Halaman akan dialihkan...
              </p>
            </div>
          )}

          {/* Card 2: Instruksi Tagihan Pembayaran */}
          {paymentMethod === 'qris' ? (
            <AuthenticQrisCard
              totalAmount={totalBill}
              orderId={orderId || order?._id || 'BML99281'}
              merchantName="BUMILFIT APOTEK OFFICIAL"
              nmid="ID102024090500123"
            />
          ) : (
            <div className="bg-white rounded-[1.25rem] border border-gray-100 p-6 shadow-[0_4px_15px_rgba(0,0,0,0.02)] space-y-4">
              <div className="text-center pb-3 border-b border-gray-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Tagihan</span>
                <span className="text-2xl font-black text-[#389D9C] mt-1 block">
                  {formatRupiah(totalBill)}
                </span>
              </div>

              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Virtual Account {bankName}</span>
                      <span className="text-base font-black text-gray-800 mt-1 block tracking-wider">
                        {getMockVaNumber()}
                      </span>
                    </div>
                    <button 
                      onClick={handleCopyVa}
                      className="p-2.5 bg-white border border-gray-150 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold text-slate-600 active:scale-95"
                    >
                      {copiedText ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Salin VA
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-teal-50/20 border border-teal-100/30 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5 text-left">
                    <p className="font-extrabold text-[#389D9C]">Cara Pembayaran:</p>
                    <p className="font-medium">1. Masuk ke aplikasi Mobile Banking atau ATM terdekat.</p>
                    <p className="font-medium">2. Pilih menu Transfer &gt; Virtual Account.</p>
                    <p className="font-medium">3. Masukkan nomor VA yang telah Bunda salin di atas.</p>
                    <p className="font-medium">4. Masukkan nominal tagihan tepat sebesar total tagihan.</p>
                    <p className="font-medium">5. Klik tombol "Cek Pembayaran" di bawah ini setelah transfer.</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-bold text-center">METODE BAYAR DI TEMPAT (COD)</p>
                  <div className="bg-teal-50/20 border border-teal-100/30 rounded-xl p-3.5 text-xs text-slate-600 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-[#389D9C] font-extrabold mb-1">
                      <ShieldCheck size={16} />
                      <span>Langkah Pembayaran COD:</span>
                    </div>
                    <p className="font-medium">1. Pesanan Bunda sedang disiapkan untuk dikirim ke alamat terdaftar.</p>
                    <p className="font-medium">2. Harap siapkan uang tunai pas sebesar <span className="font-extrabold text-[#389D9C]">{formatRupiah(totalBill)}</span>.</p>
                    <p className="font-medium">3. Serahkan uang tunai kepada kurir saat barang Anda tiba.</p>
                    <p className="font-medium">4. Klik tombol "Cek Pembayaran" di bawah ini sebagai simulasi verifikasi sistem kurir.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Button Action Check Payment */}
      <div className="max-w-md mx-auto w-full px-4 mt-8 flex-shrink-0">
        <button 
          onClick={handleCheckPayment}
          disabled={paymentStatus !== 'pending'}
          className="w-full bg-[#389D9C] hover:bg-[#2E8281] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center gap-2"
        >
          {paymentStatus === 'verifying' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Memverifikasi...
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <Check size={16} />
              Berhasil Diverifikasi
            </>
          ) : (
            'Cek Pembayaran'
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/status-pesanan')}
          className="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-[#389D9C] transition-colors cursor-pointer text-center block"
        >
          Lihat Aktivitas Pembelian →
        </button>
      </div>
    </div>
  );
};
