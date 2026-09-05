import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  Calendar,
  Sparkles,
  Check,
  ArrowRight,
  RotateCcw,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Heart,
  Baby,
  Mars,
  Venus,
  HelpCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuroraBackground } from '../../components/ui/AuroraBackground';
import { ReCaptcha, type ReCaptchaRef } from '../../components/ui/ReCaptcha';
import { toast } from '../../store/useToastStore';
import logoBumilfit from '../../assets/logo-bumilfit.png';

// Evaluasi Kekuatan & Rating Keamanan Password
interface PasswordStrength {
  score: number;
  rating: string;
  color: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const evaluatePasswordStrength = (pwd: string): PasswordStrength => {
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  const checksPassed = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (!pwd) {
    return {
      score: 0,
      rating: '',
      color: 'bg-slate-200',
      hasLength: false,
      hasUpper: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  let rating = 'Sangat Lemah';
  let color = 'bg-rose-500';

  if (checksPassed === 1) {
    rating = 'Sangat Lemah';
    color = 'bg-rose-500';
  } else if (checksPassed === 2) {
    rating = 'Lemah';
    color = 'bg-orange-500';
  } else if (checksPassed === 3) {
    rating = 'Cukup Baik';
    color = 'bg-amber-500';
  } else if (checksPassed === 4) {
    rating = 'Sangat Kuat';
    color = 'bg-[#389D9C]';
  }

  return {
    score: checksPassed,
    rating,
    color,
    hasLength,
    hasUpper,
    hasNumber,
    hasSpecial,
  };
};

// Perhitungan Medis Usia Kehamilan & HPL berdasarkan Rumus Naegele
interface PregnancyCalculation {
  weeks: number;
  days: number;
  trimester: string;
  trimesterNum: 1 | 2 | 3;
  hplFormatted: string;
  isValid: boolean;
  message?: string;
}

const calculatePregnancy = (hphtStr: string): PregnancyCalculation | null => {
  if (!hphtStr) return null;
  const hpht = new Date(hphtStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(hpht.getTime())) return null;

  const diffMs = today.getTime() - hpht.getTime();
  if (diffMs < 0) {
    return {
      weeks: 0,
      days: 0,
      trimester: 'Tidak Valid',
      trimesterNum: 1,
      hplFormatted: '-',
      isValid: false,
      message: 'Tanggal HPHT tidak boleh di masa depan',
    };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;

  if (weeks > 42) {
    return {
      weeks,
      days,
      trimester: 'Melebihi 42 Minggu',
      trimesterNum: 3,
      hplFormatted: '-',
      isValid: false,
      message: 'Usia kehamilan melebihi 42 minggu. Mohon periksa kembali tanggal HPHT.',
    };
  }

  // HPL = HPHT + 280 hari (40 minggu)
  const hplDate = new Date(hpht.getTime() + 280 * 24 * 60 * 60 * 1000);
  const hplFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(hplDate);

  let trimester = 'Trimester 1';
  let trimesterNum: 1 | 2 | 3 = 1;
  if (weeks >= 28) {
    trimester = 'Trimester 3';
    trimesterNum = 3;
  } else if (weeks >= 14) {
    trimester = 'Trimester 2';
    trimesterNum = 2;
  }

  return {
    weeks,
    days,
    trimester,
    trimesterNum,
    hplFormatted,
    isValid: true,
  };
};

// Masking Email: contoh br***@gmail.com
const maskEmail = (emailStr: string) => {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [name, domain] = emailStr.split('@');
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

// Masking Nomor Telepon/WhatsApp: contoh 08******1234
const maskPhone = (phoneStr: string) => {
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length < 8) return phoneStr;
  const prefix = clean.slice(0, 2);
  const suffix = clean.slice(-4);
  const starCount = Math.max(4, clean.length - 6);
  return `${prefix}${'*'.repeat(starCount)}${suffix}`;
};

// Format Countdown Timer: 00:59 hingga 00:00
const formatCountdown = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Deteksi mode autentikasi Google dari LoginPage
  const locationState = (location.state || {}) as {
    authMethod?: string;
    googleEmail?: string;
    googleRegistrationToken?: string;
  };

  const [isGoogleAuth, setIsGoogleAuth] = useState(locationState.authMethod === 'google');
  const [googleEmail, setGoogleEmail] = useState(locationState.googleEmail || '');
  const [googleToken, setGoogleToken] = useState(locationState.googleRegistrationToken || '');

  // Multi-step State (1 = Akun, 2 = Verifikasi OTP, 3 = Profil)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Status & Error
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Form Step 1: Akun
  const [email, setEmail] = useState(locationState.googleEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [userId, setUserId] = useState('');

  // Password Security Strength Check
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const hphtInputRef = useRef<HTMLInputElement | null>(null);

  // reCAPTCHA
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef<ReCaptchaRef | null>(null);

  // Form Step 2: OTP
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');
  const [showChannelSwitch, setShowChannelSwitch] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form Step 3: Profil Ibu & Anak
  const [namaIbu, setNamaIbu] = useState('');
  const [hphtDate, setHphtDate] = useState('');
  const [namaAnak, setNamaAnak] = useState('');
  const [genderAnak, setGenderAnak] = useState<'LAKI_LAKI' | 'PEREMPUAN' | 'BELUM_DIKETAHUI'>('BELUM_DIKETAHUI');

  // Perhitungan live usia kehamilan
  const pregnancyData = useMemo(() => calculatePregnancy(hphtDate), [hphtDate]);

  // Batas tanggal HPHT: maksimal hari ini, minimal 42 minggu lalu (~294 hari)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const minHphtStr = useMemo(() => {
    const d = new Date(Date.now() - 42 * 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  }, []);

  // Timer countdown untuk OTP di Step 2 (60 detik)
  useEffect(() => {
    if (step === 2) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCanResend(true);
      }
    }
  }, [step, countdown]);

  // Auto-focus OTP input pertama saat masuk Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Normalisasi nomor HP ke format standar Indonesia 08...
  const normalizePhoneNumber = (input: string) => {
    let clean = input.replace(/\D/g, '');
    if (clean.startsWith('62')) {
      clean = '0' + clean.slice(2);
    } else if (clean && !clean.startsWith('0')) {
      clean = '0' + clean;
    }
    return clean;
  };

  // ==================== HANDLER STEP 1: REGISTRASI AKUN ====================
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recaptchaToken) {
      setErrorMsg('Harap selesaikan verifikasi reCAPTCHA terlebih dahulu');
      return;
    }

    const cleanWa = normalizePhoneNumber(nomorWhatsapp);
    if (!cleanWa || cleanWa.length < 10 || cleanWa.length > 15) {
      setErrorMsg('Masukkan nomor WhatsApp yang valid (10-15 digit)');
      return;
    }

    // ==========================================
    // ALUR PENDAFTARAN MENGGUNAKAN GOOGLE
    // ==========================================
    if (isGoogleAuth) {
      if (!googleToken) {
        setErrorMsg('Sesi autentikasi Google tidak ditemukan. Silakan kembali ke halaman login dan pilih akun Google.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.post('/auth/register', {
          email: googleEmail,
          googleRegistrationToken: googleToken,
          authMethod: 'google',
          role: 'IBU_HAMIL',
          nomorWhatsapp: cleanWa,
          recaptchaToken,
        });

        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }

        const newUserId = response.data.userId;
        setUserId(newUserId);
        setNomorWhatsapp(cleanWa);
        // Lewati verifikasi OTP karena email Google sudah terbukti valid, langsung isi profil (Step 3)!
        setStep(3);
        toast.success('Akun Google Berhasil Didaftarkan!', 'Silakan lengkapi profil kehamilan Anda.');
      } catch (err: any) {
        recaptchaRef.current?.reset();
        setRecaptchaToken('');
        setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan saat mendaftarkan akun Google');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // ALUR PENDAFTARAN EMAIL MANUAL (Tetap Utuh)
    // ==========================================
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Masukkan alamat email yang valid');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // Email adalah saluran pertama dan default sesuai spesifikasi!
      const response = await apiClient.post('/auth/register', {
        email: cleanEmail,
        password,
        role: 'IBU_HAMIL',
        nomorWhatsapp: cleanWa,
        channel: 'email',
        recaptchaToken,
      });

      const newUserId = response.data.userId;
      setUserId(newUserId);
      setNomorWhatsapp(cleanWa);
      setActiveChannel('email');
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setShowChannelSwitch(false);
      toast.info('Kode OTP telah dikirimkan ke Email Anda');
    } catch (err: any) {
      recaptchaRef.current?.reset();
      setRecaptchaToken('');
      setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan saat mendaftarkan akun');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== HANDLER STEP 2: VERIFIKASI OTP ====================
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

  const handleStep2Submit = async (e: React.FormEvent) => {
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
      setStep(3);
    } catch (err: any) {
      // Pada saat gagal, jangan hapus data pendaftaran; hanya kosongkan box OTP dan tampilkan pesan jelas
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setErrorMsg(err.response?.data?.message || 'Kode OTP salah atau telah kedaluwarsa. Silakan periksa kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async (channelToUse: 'email' | 'whatsapp' = activeChannel) => {
    if ((!canResend && channelToUse === activeChannel) || isResending) return;
    setIsResending(true);
    setErrorMsg('');

    try {
      await apiClient.post('/auth/resend-otp', { 
        userId,
        channel: channelToUse,
      });

      setActiveChannel(channelToUse);
      setShowChannelSwitch(false);
      toast.success(
        channelToUse === 'whatsapp'
          ? 'Kode OTP baru telah dikirim ke WhatsApp Anda'
          : 'Kode OTP baru telah dikirim ke Email Anda'
      );
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

  // ==================== HANDLER STEP 3: DATA IBU & BUAH HATI ====================
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedNama = namaIbu.trim();
    if (!trimmedNama || trimmedNama.length < 2) {
      setErrorMsg('Nama lengkap Ibu wajib diisi');
      return;
    }

    if (!hphtDate) {
      setErrorMsg('Tanggal HPHT (Hari Pertama Haid Terakhir) wajib diisi');
      return;
    }

    if (!pregnancyData || !pregnancyData.isValid) {
      setErrorMsg(pregnancyData?.message || 'Periksa kembali tanggal HPHT Anda');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.put('/auth/profile', {
        namaIbu: trimmedNama,
        nomorWhatsapp,
        usiaKehamilanMinggu: pregnancyData.weeks,
        usiaKehamilanHari: pregnancyData.days,
        namaAnak: namaAnak.trim() || null,
        genderAnak: genderAnak || null,
      });

      toast.success('Selamat Datang di BumilFit!', 'Profil kehamilan Anda berhasil disimpan.');
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan profil kehamilan');
    } finally {
      setIsLoading(false);
    }
  };

  // Label Header per Step
  const stepMeta = {
    1: {
      badge: isGoogleAuth ? 'Metode Akun Google' : 'Langkah 1 dari 3: Data Akun',
      icon: ShieldCheck,
      title: isGoogleAuth ? 'Lengkapi Akun Google' : 'Daftar Akun BumilFit',
      subtitle: isGoogleAuth 
        ? 'Email Google terhubung otomatis. Masukkan nomor telepon untuk melanjutkan' 
        : 'Mulai pantau kesehatan Anda dan calon buah hati',
    },
    2: {
      badge: `Langkah 2 dari 3: Verifikasi ${activeChannel === 'email' ? 'Email' : 'WhatsApp'}`,
      icon: activeChannel === 'email' ? Mail : Phone,
      title: 'Verifikasi Akun',
      subtitle: `Masukkan 6 digit kode OTP yang dikirim ke ${activeChannel === 'email' ? 'Email' : 'WhatsApp'}`,
    },
    3: {
      badge: isGoogleAuth ? 'Langkah Terakhir: Data Profil' : 'Langkah 3 dari 3: Data Profil',
      icon: Heart,
      title: 'Data Ibu & Kehamilan',
      subtitle: 'Sesuaikan panduan medis dan nutrisi secara akurat',
    },
  }[step];

  const StepBadgeIcon = stepMeta.icon;

  // Konfigurasi tahapan timeline (2 tahapan untuk Google, 3 tahapan untuk Email manual)
  const stepsConfig = isGoogleAuth
    ? [
        { num: 1, label: 'Akun Google' },
        { num: 3, label: 'Profil' },
      ]
    : [
        { num: 1, label: 'Akun' },
        { num: 2, label: 'Verifikasi' },
        { num: 3, label: 'Profil' },
      ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-start sm:justify-center items-center bg-[#F8FAFC] relative px-3 sm:px-4 py-6 sm:py-12 overflow-y-auto">
      {/* Background Aurora Hijau Interaktif dengan Performa Optimal */}
      <AuroraBackground />

      {/* Container / Card Utama Form Registrasi */}
      <div 
        className="w-full max-w-[460px] bg-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-9 shadow-[0_15px_40px_rgba(25,70,104,0.06)] border border-slate-100 relative z-10 my-auto"
        style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
      >
        {/* Logo BUMILFIT Ringan & Terpusat */}
        <div className="flex justify-center mb-5">
          <img 
            src={logoBumilfit} 
            alt="BUMILFIT" 
            className="h-8 sm:h-9 w-auto object-contain select-none" 
            loading="eager"
          />
        </div>

        {/* Timeline Tahapan Pendaftaran (Presisi, Terkunci Antar-Lingkaran, Bebas Overlap) */}
        <div className="mb-9 select-none max-w-[320px] mx-auto px-2">
          <div className="flex items-center">
            {stepsConfig.map((s, idx) => {
              const isCompleted = step > s.num;
              const isActive = step === s.num;

              return (
                <React.Fragment key={s.num}>
                  {/* Lingkaran Step & Label Terpusat */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#389D9C] text-white shadow-sm ring-4 ring-[#389D9C]/15'
                          : isActive
                          ? 'bg-[#194668] text-white shadow-md ring-4 ring-[#194668]/15 scale-105'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                    </div>

                    {/* Label presisi di bawah lingkaran */}
                    <span
                      className={`absolute top-9.5 left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-tight whitespace-nowrap transition-colors ${
                        isActive ? 'text-[#194668]' : isCompleted ? 'text-[#389D9C]' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Garis Penghubung (HANYA berada di antara lingkaran) */}
                  {idx < stepsConfig.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#389D9C] transition-all duration-500 ease-out"
                        style={{ width: step > s.num ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Header Konten */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#389D9C]/10 text-[#389D9C] text-xs font-semibold mb-2.5">
            <StepBadgeIcon size={13} />
            <span>{stepMeta.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
            {stepMeta.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {stepMeta.subtitle}
          </p>
        </div>

        {/* Notifikasi Kesalahan */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* LANGKAH 1: DATA AKUN                                     */}
        {/* ======================================================== */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 animate-in fade-in duration-300">
            {/* Input Email */}
            {isGoogleAuth ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                    Email Akun Google
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <Check size={12} strokeWidth={2.5} />
                    <span>Terhubung Google</span>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <Input
                    type="email"
                    value={googleEmail}
                    readOnly
                    disabled
                    className="pl-10 h-12 rounded-xl bg-slate-100/90 border-slate-200 text-slate-700 font-medium text-sm cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Email otomatis dari akun Google yang Anda pilih. Tidak perlu diketik ulang.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    required
                    className="pl-10 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C]"
                  />
                </div>
              </div>
            )}

            {/* Input Password (DIHILANGKAN JIKA METODE GOOGLE) */}
            {!isGoogleAuth && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    required
                    className="pl-10 pr-11 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#389D9C] transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Indikator & Rating Keamanan Password */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-2 animate-in fade-in duration-200 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 text-[11px] font-medium">Rating Keamanan:</span>
                      <span className={`text-[11px] font-bold ${
                        passwordStrength.score <= 1 ? 'text-rose-600' :
                        passwordStrength.score === 2 ? 'text-orange-600' :
                        passwordStrength.score === 3 ? 'text-amber-600' :
                        'text-[#389D9C]'
                      }`}>
                        {passwordStrength.rating}
                      </span>
                    </div>

                    {/* 4-segment progress bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= seg
                              ? passwordStrength.color
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Checklist Kriteria Keamanan */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                      <div className={`flex items-center gap-1.5 ${passwordStrength.hasLength ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordStrength.hasLength ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                          {passwordStrength.hasLength ? '✓' : '•'}
                        </div>
                        <span>Min. 8 Karakter</span>
                      </div>

                      <div className={`flex items-center gap-1.5 ${passwordStrength.hasUpper ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordStrength.hasUpper ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                          {passwordStrength.hasUpper ? '✓' : '•'}
                        </div>
                        <span>Huruf Kapital (A-Z)</span>
                      </div>

                      <div className={`flex items-center gap-1.5 ${passwordStrength.hasNumber ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordStrength.hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                          {passwordStrength.hasNumber ? '✓' : '•'}
                        </div>
                        <span>Angka (0-9)</span>
                      </div>

                      <div className={`flex items-center gap-1.5 ${passwordStrength.hasSpecial ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordStrength.hasSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                          {passwordStrength.hasSpecial ? '✓' : '•'}
                        </div>
                        <span>Simbol Unik (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input WhatsApp (Tetap Wajib) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 font-semibold text-xs border-r border-slate-200 pr-2 pointer-events-none">
                  <Phone size={14} className="text-[#389D9C]" />
                  <span>+62</span>
                </div>
                <Input
                  type="tel"
                  value={nomorWhatsapp}
                  onChange={(e) => setNomorWhatsapp(e.target.value)}
                  placeholder="812-3456-7890"
                  autoComplete="tel"
                  required
                  className="pl-18 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C]"
                />
              </div>
            </div>

            {/* Google reCAPTCHA v2 */}
            <div className="py-1 flex justify-center">
              <ReCaptcha
                ref={recaptchaRef}
                onVerify={(token) => {
                  setRecaptchaToken(token);
                  setErrorMsg('');
                }}
                onExpire={() => setRecaptchaToken('')}
              />
            </div>

            {/* Tombol Lanjut */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || !recaptchaToken}
                className="w-full h-12 bg-bumil-primary hover:bg-[#2E8281] active:scale-[0.99] text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{isGoogleAuth ? 'Menyimpan Akun Google...' : 'Mempersiapkan OTP...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isGoogleAuth ? 'Lanjut ke Pengisian Profil' : 'Lanjut ke Verifikasi'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>

            {/* Opsi Switch jika sedang mode Google */}
            {isGoogleAuth && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsGoogleAuth(false);
                    setEmail('');
                    setPassword('');
                    setGoogleEmail('');
                    setGoogleToken('');
                  }}
                  className="text-xs text-[#389D9C] hover:underline font-medium cursor-pointer"
                >
                  Ingin mendaftar dengan email manual dan kata sandi? Klik di sini
                </button>
              </div>
            )}
          </form>
        )}

        {/* ======================================================== */}
        {/* LANGKAH 2: VERIFIKASI OTP (EMAIL DEFAULT & WA ALTERNATIF) */}
        {/* ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-5 animate-in fade-in duration-300">
            {/* Informasi Pengiriman Ter-masking */}
            <div className="text-center p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-xs text-gray-500 block">
                Kode verifikasi telah dikirim ke:
              </span>
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-[#194668]">
                {activeChannel === 'email' ? (
                  <>
                    <Mail size={15} className="text-[#389D9C]" />
                    <span>{maskEmail(email)}</span>
                  </>
                ) : (
                  <>
                    <Phone size={15} className="text-[#389D9C]" />
                    <span>{maskPhone(nomorWhatsapp)}</span>
                  </>
                )}
              </div>
            </div>

            {/* 6 Input Boxes untuk OTP */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block text-center">
                Kode Verifikasi 6 Digit
              </label>
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
            </div>

            {/* Countdown Timer (00:59 sampai 00:00) & Tombol Kirim Ulang */}
            <div className="text-center text-xs text-gray-500 pt-1">
              {countdown > 0 ? (
                <span className="text-slate-500">
                  Kirim ulang kode dalam <strong className="text-[#194668] font-mono font-bold">{formatCountdown(countdown)}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleResendOtp(activeChannel)}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-[#389D9C] font-semibold hover:underline cursor-pointer"
                >
                  <RotateCcw size={13} className={isResending ? 'animate-spin' : ''} />
                  <span>Kirim ulang kode</span>
                </button>
              )}
            </div>

            {/* Opsi Ganti Metode Verifikasi */}
            <div className="text-center border-t border-slate-100 pt-3">
              <p className="text-xs text-gray-500">
                Tidak menerima kode?{' '}
                <button
                  type="button"
                  onClick={() => setShowChannelSwitch(!showChannelSwitch)}
                  className="text-[#389D9C] font-semibold hover:underline cursor-pointer"
                >
                  Ganti metode verifikasi
                </button>
              </p>

              {showChannelSwitch && (
                <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-left space-y-2 animate-in fade-in duration-200">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Pilih saluran pengiriman kode:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opsi Email (Utama) */}
                    <button
                      type="button"
                      onClick={() => handleResendOtp('email')}
                      disabled={isResending}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        activeChannel === 'email'
                          ? 'border-[#389D9C] bg-[#389D9C]/10 text-[#194668] ring-1 ring-[#389D9C]'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <Mail size={16} className="text-[#389D9C] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block">Email</span>
                        <span className="text-[11px] text-gray-500 truncate block">{maskEmail(email)}</span>
                      </div>
                    </button>

                    {/* Opsi WhatsApp (Alternatif) */}
                    <button
                      type="button"
                      onClick={() => handleResendOtp('whatsapp')}
                      disabled={isResending}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        activeChannel === 'whatsapp'
                          ? 'border-[#389D9C] bg-[#389D9C]/10 text-[#194668] ring-1 ring-[#389D9C]'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <Phone size={16} className="text-[#389D9C] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block">Nomor WhatsApp</span>
                        <span className="text-[11px] text-gray-500 truncate block">{maskPhone(nomorWhatsapp)}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi Verifikasi */}
            <div className="space-y-2 pt-2">
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
                    <span>Verifikasi & Aktifkan Akun</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-gray-500 hover:text-[#194668] py-1 cursor-pointer text-center font-medium"
              >
                Ganti data pendaftaran
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* LANGKAH 3: DATA IBU & BUAH HATI                           */}
        {/* ======================================================== */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4 animate-in fade-in duration-300">
            {/* Nama Ibu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                Nama Lengkap Ibu
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <User size={18} />
                </div>
                <Input
                  type="text"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  placeholder="Contoh: Rahmawati Putri"
                  required
                  className="pl-10 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C]"
                />
              </div>
            </div>

            {/* Tanggal HPHT */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                Hari Pertama Haid Terakhir (HPHT)
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={hphtInputRef}
                    type="date"
                    value={hphtDate}
                    max={todayStr}
                    min={minHphtStr}
                    onChange={(e) => setHphtDate(e.target.value)}
                    required
                    className="h-12 px-3.5 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C] w-full [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none cursor-text"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (hphtInputRef.current) {
                      if (typeof hphtInputRef.current.showPicker === 'function') {
                        hphtInputRef.current.showPicker();
                      } else {
                        hphtInputRef.current.focus();
                      }
                    }
                  }}
                  title="Pilih tanggal dari kalender"
                  aria-label="Pilih tanggal dari kalender"
                  className="h-12 px-3.5 rounded-xl bg-[#389D9C]/10 hover:bg-[#389D9C]/20 text-[#389D9C] border border-[#389D9C]/25 hover:border-[#389D9C]/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-medium text-xs active:scale-95 shrink-0"
                >
                  <Calendar size={18} />
                  <span className="hidden sm:inline">Pilih Kalender</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-400">
                Ketik tanggal langsung pada form atau tekan tombol kalender di samping untuk memilih.
              </p>
            </div>

            {/* Live Calculation Feedback Card */}
            {pregnancyData && pregnancyData.isValid && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#389D9C]/10 via-emerald-50/50 to-teal-50 border border-[#389D9C]/20 text-[#194668] space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#389D9C]" />
                    <span>Kalkulasi Medis Kehamilan</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#389D9C] text-white">
                    {pregnancyData.trimester}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#389D9C]/15">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                      Usia Kehamilan
                    </span>
                    <span className="text-sm font-extrabold text-[#194668]">
                      {pregnancyData.weeks} Minggu {pregnancyData.days} Hari
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                      Hari Perkiraan Lahir (HPL)
                    </span>
                    <span className="text-xs font-bold text-[#389D9C]">
                      {pregnancyData.hplFormatted}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Nama Anak (Opsional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                Nama Buah Hati <span className="text-gray-400 font-normal lowercase">(opsional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Baby size={18} />
                </div>
                <Input
                  type="text"
                  value={namaAnak}
                  onChange={(e) => setNamaAnak(e.target.value)}
                  placeholder="Contoh: Calon Buah Hati"
                  className="pl-10 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C]"
                />
              </div>
            </div>

            {/* Jenis Kelamin Anak (Opsional - 3 Card Pilihan) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                Perkiraan Jenis Kelamin <span className="text-gray-400 font-normal lowercase">(opsional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {/* Laki-laki */}
                <button
                  type="button"
                  onClick={() => setGenderAnak('LAKI_LAKI')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    genderAnak === 'LAKI_LAKI'
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-400/20'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${genderAnak === 'LAKI_LAKI' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Mars size={14} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-bold">Laki-laki</span>
                </button>

                {/* Perempuan */}
                <button
                  type="button"
                  onClick={() => setGenderAnak('PEREMPUAN')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    genderAnak === 'PEREMPUAN'
                      ? 'bg-pink-50/90 border-pink-400 text-pink-900 shadow-xs ring-2 ring-pink-400/20'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${genderAnak === 'PEREMPUAN' ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Venus size={14} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-bold">Perempuan</span>
                </button>

                {/* Belum Diketahui */}
                <button
                  type="button"
                  onClick={() => setGenderAnak('BELUM_DIKETAHUI')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    genderAnak === 'BELUM_DIKETAHUI'
                      ? 'bg-teal-50/90 border-[#389D9C] text-teal-900 shadow-xs ring-2 ring-[#389D9C]/20'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${genderAnak === 'BELUM_DIKETAHUI' ? 'bg-[#389D9C] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <HelpCircle size={14} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-bold">Belum Tahu</span>
                </button>
              </div>
            </div>

            {/* Tombol Simpan & Selesai */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-bumil-primary hover:bg-[#2E8281] active:scale-[0.99] text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Menyimpan Profil...</span>
                  </>
                ) : (
                  <>
                    <span>Selesaikan Pendaftaran</span>
                    <Sparkles size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Footer Tautan Masuk (Hanya tampil di Step 1) */}
        {step === 1 && (
          <div className="mt-7 text-center text-xs sm:text-sm text-gray-500 border-t border-slate-100 pt-5">
            Sudah memiliki akun?{' '}
            <Link
              to="/login"
              className="text-[#389D9C] font-semibold hover:underline cursor-pointer"
            >
              Masuk sekarang
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};
