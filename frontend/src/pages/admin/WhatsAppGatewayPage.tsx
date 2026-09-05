import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  Send, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { toast } from '../../store/useToastStore';
import logoBumilfit from '../../assets/logo-bumilfit.png';

interface WhatsAppStatusData {
  status: 'WAITING_FOR_QR' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'LOGGED_OUT' | 'ERROR';
  qrCode: string | null;
  phoneNumber: string | null;
  isConnected: boolean;
  connectedAt: string | null;
}

export const WhatsAppGatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>('bumilfit@gmail.com');
  const [statusData, setStatusData] = useState<WhatsAppStatusData>({
    status: 'CONNECTING',
    qrCode: null,
    phoneNumber: null,
    isConnected: false,
    connectedAt: null,
  });

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; otpCode?: string } | null>(null);

  const pollTimerRef = useRef<any>(null);

  // 1. Verifikasi role WHATSAPP_ADMIN
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const profileRes = await apiClient.get('/auth/profile');
        if (profileRes.data.role !== 'WHATSAPP_ADMIN') {
          toast.error('Akses Ditolak', 'Halaman ini hanya untuk Administrator WhatsApp.');
          navigate('/');
          return;
        }
        setAdminEmail(profileRes.data.email || 'bumilfit@gmail.com');
      } catch (err) {
        toast.error('Sesi Berakhir', 'Silakan masuk kembali.');
        navigate('/login');
      }
    };
    verifyAdmin();
  }, [navigate]);

  // 2. Fetch status WhatsApp & setup polling interval
  const fetchStatus = async () => {
    try {
      const response = await apiClient.get('/whatsapp/status');
      if (response.data.success && response.data.data) {
        setStatusData(response.data.data);
      }
    } catch (err: any) {
      console.warn('Gagal mengambil status WhatsApp:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Polling setiap 2.5 detik untuk mendeteksi perubahan koneksi dan QR baru secara real-time
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Handler: Sambungkan Ulang (Reset & re-generate QR)
  const handleReconnect = async () => {
    setIsActionLoading(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/whatsapp/reconnect');
      toast.info('Menyiapkan QR Baru', res.data.message || 'Penyambungan ulang dimulai.');
      await fetchStatus();
    } catch (err: any) {
      toast.error('Gagal Sambungkan Ulang', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Logout WhatsApp (Hanya putuskan sesi WhatsApp, bukan akun admin)
  const handleLogoutWhatsApp = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp ini? Sesi akan diputus dan QR code baru akan dibuat.')) {
      return;
    }

    setIsActionLoading(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/whatsapp/logout');
      toast.success('WhatsApp Terputus', res.data.message || 'Sesi WhatsApp berhasil diputuskan.');
      await fetchStatus();
    } catch (err: any) {
      toast.error('Gagal Logout WhatsApp', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Kirim Pesan OTP Uji Coba
  const handleSendTestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.warning('Nomor Kosong', 'Harap masukkan nomor WhatsApp tujuan.');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/whatsapp/test-otp', { phoneNumber: testPhone });
      setTestResult({
        success: true,
        message: res.data.message,
        otpCode: res.data.otpCode,
      });
      toast.success('Pesan OTP Terkirim!', `Kode [${res.data.otpCode}] telah dikirim ke ${testPhone}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengirim pesan OTP uji coba.';
      setTestResult({
        success: false,
        message: msg,
      });
      toast.error('Gagal Mengirim OTP', msg);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handler: Logout Akun Admin BUMILFIT
  const handleLogoutAdminAccount = async () => {
    localStorage.removeItem('auth_token');
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {}
    toast.info('Keluar Sesi', 'Anda telah keluar dari akun Administrator.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-800">
      {/* Top Header Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoBumilfit} alt="BUMILFIT" className="h-8 sm:h-9 w-auto object-contain" />
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="bg-[#194668] text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                WhatsApp Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-slate-500 font-medium">Administrator</span>
              <span className="text-xs font-semibold text-[#194668]">{adminEmail}</span>
            </div>

            <button
              onClick={handleLogoutAdminAccount}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
              title="Keluar dari akun admin"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout Akun</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {loadingInitial ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#389D9C]" size={40} />
            <p className="mt-4 text-sm font-medium text-slate-500">Memeriksa status koneksi WhatsApp Gateway...</p>
          </div>
        ) : (
          <div className="w-full">
            {/* STATUS BADGE & HEADER TITLE */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border transition-all">
                {statusData.status === 'CONNECTED' ? (
                  <span className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border-emerald-200">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    WhatsApp Terhubung
                  </span>
                ) : statusData.status === 'WAITING_FOR_QR' ? (
                  <span className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 border-amber-200">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    Menunggu pemindaian...
                  </span>
                ) : statusData.status === 'CONNECTING' ? (
                  <span className="inline-flex items-center gap-2 text-cyan-700 bg-cyan-50 border-cyan-200">
                    <Loader2 size={13} className="animate-spin text-cyan-600" />
                    Menghubungkan...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-rose-700 bg-rose-50 border-rose-200">
                    <XCircle size={13} />
                    WhatsApp Tidak Terhubung
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
                {statusData.status === 'CONNECTED' ? 'WhatsApp Gateway Aktif' : 'Sambungkan WhatsApp'}
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
                {statusData.status === 'CONNECTED'
                  ? 'Akun WhatsApp Anda berhasil terhubung dan siap digunakan oleh sistem BUMILFIT untuk mengirimkan OTP secara otomatis.'
                  : 'Pindai QR Code di bawah ini menggunakan aplikasi WhatsApp pada ponsel Anda agar sistem dapat mengirimkan kode OTP kepada pengguna.'}
              </p>
            </div>

            {/* KONDISI 1: SUDAH TERHUBUNG (CONNECTED) */}
            {statusData.status === 'CONNECTED' ? (
              <div className="max-w-xl mx-auto space-y-6">
                {/* Connected Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-[0_15px_40px_rgba(16,185,129,0.06)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                      <CheckCircle2 size={32} />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Status Koneksi
                      </div>
                      <h3 className="text-xl font-bold text-[#194668] mt-0.5">
                        WhatsApp Terhubung
                      </h3>

                      {statusData.phoneNumber && (
                        <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl w-fit">
                          <Smartphone size={15} className="text-[#389D9C]" />
                          <span>+{statusData.phoneNumber}</span>
                        </div>
                      )}

                      {statusData.connectedAt && (
                        <div className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400">
                          <Clock size={13} />
                          <span>Terhubung sejak: {new Date(statusData.connectedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-xl">
                        <Sparkles size={14} className="text-emerald-500 shrink-0" />
                        <span>Sistem otomatis BUMILFIT siap mengirimkan kode OTP secara instan.</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Logout WhatsApp & Sambungkan Ulang */}
                  <div className="mt-7 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      onClick={handleReconnect}
                      disabled={isActionLoading}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isActionLoading ? 'animate-spin' : ''} />
                      Sambungkan Ulang
                    </button>

                    <button
                      onClick={handleLogoutWhatsApp}
                      disabled={isActionLoading}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <LogOut size={14} />
                      Logout WhatsApp
                    </button>
                  </div>
                </div>

                {/* Widget Uji Coba Pengiriman OTP */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_10px_30px_rgba(25,70,104,0.04)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-cyan-50 text-[#389D9C]">
                      <Send size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#194668]">Uji Coba Pengiriman OTP</h4>
                      <p className="text-xs text-slate-500">Kirimkan pesan OTP uji coba untuk memverifikasi fungsionalitas WhatsApp.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSendTestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nomor WhatsApp Tujuan
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#389D9C]/30 focus:border-[#389D9C] transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingTest}
                      className="w-full bg-[#389D9C] hover:bg-[#2E8281] text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingTest ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Mengirimkan Pesan OTP...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Kirim OTP Uji Coba</span>
                        </>
                      )}
                    </button>
                  </form>

                  {testResult && (
                    <div className={`mt-4 p-3.5 rounded-xl text-xs border ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <div className="font-semibold flex items-center gap-1.5">
                        {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {testResult.message}
                      </div>
                      {testResult.otpCode && (
                        <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                          <span>Kode OTP yang Terkirim:</span>
                          <span className="font-mono font-bold text-sm tracking-widest bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                            {testResult.otpCode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview Template Pesan OTP */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Format Pesan WhatsApp yang Dikirim:
                    </span>
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
{`🔐 *Kode Verifikasi BUMILFIT*

Halo, kode OTP Anda untuk verifikasi akun BUMILFIT adalah:

*${testResult?.otpCode || '123456'}*

Kode ini berlaku selama *5 menit*.

Demi keamanan akun Anda, jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengatasnamakan BUMILFIT.

Jika Anda tidak meminta kode ini, abaikan pesan ini.

Terima kasih,
*BUMILFIT*`}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* KONDISI 2: BELUM TERHUBUNG / WAITING FOR QR / DISCONNECTED */
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                {/* QR CODE CONTAINER (LEFT / TOP) */}
                <div className="md:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(25,70,104,0.06)] flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#194668] uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode size={16} className="text-[#389D9C]" />
                      QR Code WhatsApp Web
                    </span>

                    <button
                      onClick={handleReconnect}
                      disabled={isActionLoading}
                      title="Muat ulang QR Code"
                      className="p-1.5 text-slate-400 hover:text-[#389D9C] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw size={15} className={isActionLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {/* QR Box */}
                  <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center relative shadow-inner">
                    {statusData.qrCode ? (
                      <img
                        src={statusData.qrCode}
                        alt="QR Code WhatsApp"
                        className="w-full h-full object-contain rounded-lg select-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="animate-spin text-[#389D9C] mb-3" size={32} />
                        <p className="text-xs text-slate-500 font-medium">Menyiapkan QR Code baru dari server...</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Status: Menunggu pemindaian...
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      QR Code akan otomatis diperbarui. Layar akan otomatis berubah ketika WhatsApp tersambung.
                    </p>
                  </div>
                </div>

                {/* INSTRUCTIONS CONTAINER (RIGHT / BOTTOM) */}
                <div className="md:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(25,70,104,0.06)] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#194668] mb-1">
                      Cara Menyambungkan:
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Ikuti langkah-langkah mudah berikut pada aplikasi WhatsApp di ponsel Anda:
                    </p>

                    <ol className="space-y-4">
                      <li className="flex items-start gap-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#389D9C]/10 text-[#389D9C] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#389D9C]/20">
                          1
                        </span>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          Buka aplikasi <strong>WhatsApp</strong> pada smartphone Anda.
                        </div>
                      </li>

                      <li className="flex items-start gap-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#389D9C]/10 text-[#389D9C] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#389D9C]/20">
                          2
                        </span>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          Masuk ke menu <strong>Perangkat Tertaut</strong> (<em>Linked Devices</em>) di Setelan atau menu titik tiga.
                        </div>
                      </li>

                      <li className="flex items-start gap-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#389D9C]/10 text-[#389D9C] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#389D9C]/20">
                          3
                        </span>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          Pilih tombol <strong>Tautkan Perangkat</strong> (<em>Link a Device</em>).
                        </div>
                      </li>

                      <li className="flex items-start gap-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#389D9C]/10 text-[#389D9C] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#389D9C]/20">
                          4
                        </span>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          Arahkan kamera smartphone Anda ke <strong>QR Code</strong> yang tampil pada halaman ini.
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck size={16} className="text-[#389D9C]" />
                      <span>Koneksi aman terenkripsi end-to-end</span>
                    </div>

                    <button
                      onClick={handleReconnect}
                      disabled={isActionLoading}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#194668] hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isActionLoading ? 'animate-spin' : ''} />
                      <span>Sambungkan Ulang</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-100 bg-white/60 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          BUMILFIT WhatsApp Gateway Service &copy; {new Date().getFullYear()} &bull; Sistem Pengiriman OTP Otomatis
        </div>
      </footer>
    </div>
  );
};
export default WhatsAppGatewayPage;
