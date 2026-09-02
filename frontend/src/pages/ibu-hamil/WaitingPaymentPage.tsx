import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, Loader2, ShieldCheck, Copy } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export const WaitingPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);

  // Ambil data dari state navigasi (fallback ke default jika tidak ada)
  const totalBill = location.state?.totalBill || 0;
  const paymentMethod = location.state?.paymentMethod || 'qris';
  const bankName = location.state?.bankName || 'BCA';

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
  const handleCheckPayment = () => {
    setPaymentStatus('verifying');

    // Jeda 1.5 detik untuk simulasi validasi server
    setTimeout(() => {
      setPaymentStatus('success');
      clearCart(); // Kosongkan keranjang belanja

      // Jeda 2 detik lalu navigasikan ke Dashboard
      setTimeout(() => {
        navigate('/');
      }, 2500);
    }, 1500);
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
          <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">Transaksi</h1>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Card 1: Status Pembayaran */}
          <div className="bg-white rounded-[1.25rem] border border-gray-100 p-6 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
            
            {paymentStatus === 'pending' && (
              <>
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                  <Clock size={28} />
                </div>
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  MENUNGGU PEMBAYARAN
                </span>
                <p className="text-xs text-gray-400 mt-2 font-medium">Mohon selesaikan pembayaran Bunda sebelum batas waktu berakhir.</p>
              </>
            )}

            {paymentStatus === 'verifying' && (
              <>
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center text-[#389D9C] mb-4">
                  <Loader2 size={28} className="animate-spin" />
                </div>
                <span className="bg-teal-50 text-[#389D9C] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  MEMVERIFIKASI...
                </span>
                <p className="text-xs text-gray-400 mt-2 font-medium">Sedang mencocokkan mutasi pembayaran dengan server kami...</p>
              </>
            )}

            {paymentStatus === 'success' && (
              <div className="animate-in zoom-in-95 duration-300 w-full flex flex-col items-center">
                {/* CSS Success Checkmark Animation */}
                <div className="w-16 h-16 mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16" viewBox="0 0 52 52">
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
                  Terima kasih Bunda! Transaksi Anda telah berhasil diverifikasi. Halaman akan dialihkan ke beranda...
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Instruksi Tagihan Pembayaran */}
          <div className="bg-white rounded-[1.25rem] border border-gray-100 p-6 shadow-[0_4px_15px_rgba(0,0,0,0.02)] space-y-4">
            <div className="text-center pb-3 border-b border-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Tagihan</span>
              <span className="text-2xl font-black text-[#389D9C] mt-1 block">
                {formatRupiah(totalBill)}
              </span>
            </div>

            {/* Konten detail berdasarkan Metode Pembayaran */}
            {paymentMethod === 'qris' && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-gray-500 font-bold">SCAN KODE QRIS DI BAWAH INI</p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center max-w-[240px] mx-auto">
                  {/* QR Code Graphic */}
                  <div className="bg-white p-3 border border-gray-200 rounded-xl mb-2 flex items-center justify-center">
                    <svg width="150" height="150" viewBox="0 0 100 100" className="text-slate-800">
                      <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="8" y="8" width="19" height="19" fill="white" />
                      <rect x="11" y="11" width="13" height="13" fill="currentColor" />
                      
                      <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="73" y="8" width="19" height="19" fill="white" />
                      <rect x="76" y="11" width="13" height="13" fill="currentColor" />
                      
                      <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                      <rect x="8" y="73" width="19" height="19" fill="white" />
                      <rect x="11" y="76" width="13" height="13" fill="currentColor" />
                      
                      <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                      <rect x="40" y="40" width="20" height="20" fill="white" />
                      <rect x="47" y="47" width="6" height="6" fill="currentColor" />
                      
                      <rect x="40" y="10" width="10" height="15" fill="currentColor" />
                      <rect x="55" y="15" width="10" height="10" fill="currentColor" />
                      <rect x="15" y="40" width="15" height="10" fill="currentColor" />
                      <rect x="10" y="55" width="10" height="10" fill="currentColor" />
                      <rect x="75" y="40" width="15" height="20" fill="currentColor" />
                      <rect x="40" y="75" width="25" height="15" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">BumilFit QRIS Merchant</span>
                </div>
                <div className="bg-teal-50/20 border border-teal-100/30 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5 text-left">
                  <p className="font-extrabold text-[#389D9C]">Langkah Pembayaran:</p>
                  <p className="font-medium">1. Ambil screenshot / simpan kode QR di atas.</p>
                  <p className="font-medium">2. Buka aplikasi e-wallet Anda (Gopay, OVO, Dana) atau mobile banking.</p>
                  <p className="font-medium">3. Pilih menu scan QR, lalu unggah screenshot QR.</p>
                  <p className="font-medium">4. Klik tombol "Cek Pembayaran" di bawah ini setelah membayar.</p>
                </div>
              </div>
            )}

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
        </div>
      </div>

      {/* Button Action Check Payment */}
      <div className="max-w-md mx-auto w-full px-4 mt-8 flex-shrink-0">
        <button 
          onClick={handleCheckPayment}
          disabled={paymentStatus !== 'pending'}
          className="w-full bg-[#389D9C] hover:bg-[#2b7f7e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center gap-2"
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
      </div>
    </div>
  );
};
