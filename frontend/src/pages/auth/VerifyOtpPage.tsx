import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { ShieldCheck, Phone, Check, RotateCcw, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { AuroraBackground } from '../../components/ui/AuroraBackground';
import { toast } from '../../store/useToastStore';
import logoBumilfit from '../../assets/logo-bumilfit.png';
import { useLoadingStore } from '../../store/useLoadingStore';

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showLoginLoader = useLoadingStore((state) => state.showLoginLoader);

  // Ambil state userId & email/phone dari navigasi sebelumnya
  const userId = location.state?.userId;
  const email = location.state?.email;
  const phone = location.state?.phone || location.state?.nomorWhatsapp;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Proteksi: Jika tidak ada userId (akses manual tanpa parameter), kembalikan ke register
  if (!userId) {
    return <Navigate to="/register" replace />;
  }

  // Countdown timer 60 detik
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-focus box pertama saat mount
  useEffect(() => {
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 150);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    const nextOtp = [...otp];

    if (!digitsOnly) {
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    nextOtp[index] = digitsOnly.slice(-1);
    setOtp(nextOtp);

    if (index < 5 && digitsOnly) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || '';
    }
    setOtp(nextOtp);

    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMsg('Masukkan 6 digit kode OTP secara lengkap');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        userId,
        kode: otpCode,
      });

      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      toast.success('Verifikasi Berhasil!', 'Akun Anda telah aktif.');
      showLoginLoader();
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Kode OTP tidak valid atau telah kedaluwarsa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/resend-otp', { 
        userId, 
        channel: phone ? 'whatsapp' : 'email' 
      });
      toast.success(res.data?.message || 'Kode OTP baru telah berhasil dikirimkan');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim ulang kode OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4 py-8">
      {/* Background Aurora Hijau Interaktif dengan Fisika Kursor */}
      <AuroraBackground />

      {/* Card Utama Verifikasi OTP */}
      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-[2rem] p-7 sm:p-9 shadow-[0_20px_50px_rgba(25,70,104,0.07)] border border-white/80 relative z-10 transition-all">
        {/* Logo BUMILFIT Ringan & Terpusat */}
        <div className="flex justify-center mb-5">
          <img 
            src={logoBumilfit} 
            alt="BUMILFIT" 
            className="h-8 sm:h-9 w-auto object-contain select-none" 
            loading="eager"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#389D9C]/10 text-[#389D9C] text-xs font-semibold mb-3">
            <ShieldCheck size={13} />
            <span>Verifikasi Akun</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
            Verifikasi Kode OTP
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
            {phone ? (
              <span>
                Masukkan kode 6 digit yang dikirim ke nomor WhatsApp{' '}
                <strong className="text-[#194668] inline-flex items-center gap-1">
                  <Phone size={13} className="text-[#389D9C]" />
                  {phone}
                </strong>
              </span>
            ) : email ? (
              <span>
                Masukkan kode 6 digit yang dikirim untuk akun{' '}
                <strong className="text-[#194668]">{email}</strong>
              </span>
            ) : (
              <span>Masukkan kode verifikasi 6 digit yang telah dikirimkan</span>
            )}
          </p>
        </div>

        {/* Notifikasi Kesalahan */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Formulir Input OTP */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl bg-slate-50/90 border border-slate-200 text-[#194668] focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/20 focus:bg-white transition-all outline-none"
              />
            ))}
          </div>

          {/* Countdown & Tombol Resend */}
          <div className="text-center text-xs text-gray-500 pt-1">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-[#389D9C] font-semibold hover:underline cursor-pointer"
              >
                <RotateCcw size={13} className={isResending ? 'animate-spin' : ''} />
                <span>Kirim Ulang Kode OTP</span>
              </button>
            ) : (
              <span>
                Kirim ulang dalam <strong className="text-[#194668]">{countdown}</strong> detik
              </span>
            )}
          </div>

          {/* Informasi Cek Folder Spam / Promosi */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2 text-left">
            <span className="text-sm shrink-0">💡</span>
            <span>
              <strong>Tips:</strong> Jika email belum muncul di Kotak Masuk (Inbox), pastikan untuk memeriksa folder <strong>Spam</strong> atau tab <strong>Promosi</strong> di email Anda.
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full h-12 bg-bumil-primary hover:bg-[#2E8281] active:scale-[0.99] text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Verifikasi & Aktifkan</span>
                </>
              )}
            </Button>

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#194668] py-1 cursor-pointer font-medium"
            >
              <ArrowLeft size={13} />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
