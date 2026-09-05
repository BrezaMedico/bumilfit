import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuroraBackground } from '../../components/ui/AuroraBackground';
import { ReCaptcha, type ReCaptchaRef } from '../../components/ui/ReCaptcha';
import { GoogleAuthModal } from '../../components/auth/GoogleAuthModal';
import logoBumilfit from '../../assets/logo-bumilfit.png';
import { useLoadingStore } from '../../store/useLoadingStore';

// Skema validasi Zod untuk sisi client
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const showLoginLoader = useLoadingStore((state) => state.showLoginLoader);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef<ReCaptchaRef | null>(null);

  const [unverifiedData, setUnverifiedData] = useState<{ userId: string; email: string } | null>(null);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    if (!recaptchaToken) {
      setErrorMsg('Harap selesaikan verifikasi reCAPTCHA terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setUnverifiedData(null);
    try {
      const response = await apiClient.post('/auth/login', {
        ...data,
        recaptchaToken,
      });
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      // Tampilkan animasi loading fullscreen saat berhasil login
      showLoginLoader();

      // Karena JWT disimpan aman di cookie oleh backend, kita cukup mengarahkan user
      if (response.data.role === 'WHATSAPP_ADMIN') {
        navigate('/whatsapp-gateway');
      } else if (response.data.role === 'IBU_HAMIL') {
        navigate('/');
      } else {
        navigate('/dokter/dashboard');
      }
    } catch (err: any) {
      recaptchaRef.current?.reset();
      setRecaptchaToken('');
      if (err.response?.data?.isUnverified) {
        setUnverifiedData({ userId: err.response.data.userId, email: data.email });
      }
      setErrorMsg(err.response?.data?.message || 'Email atau kata sandi yang Anda masukkan salah');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk respon token credential resmi dari Google Identity Services
  const handleGoogleCredentialResponse = async (credential: string) => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const response = await apiClient.post('/auth/google', { credential });
      if (!response.data.isNewUser) {
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        setIsGoogleModalOpen(false);
        showLoginLoader();
        if (response.data.role === 'WHATSAPP_ADMIN') {
          navigate('/whatsapp-gateway');
        } else if (response.data.role === 'IBU_HAMIL') {
          navigate('/');
        } else {
          navigate('/dokter/dashboard');
        }
      } else {
        setIsGoogleModalOpen(false);
        navigate('/register', {
          state: {
            authMethod: 'google',
            googleEmail: response.data.email,
            googleRegistrationToken: response.data.googleRegistrationToken,
          },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal melakukan autentikasi dengan akun Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Inisialisasi SDK Google Identity Services jika VITE_GOOGLE_CLIENT_ID dikonfigurasi
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const timer = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(timer);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (res: any) => {
              if (res.credential) {
                handleGoogleCredentialResponse(res.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('GSI init failed:', e);
        }
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleGoogleButtonClick = () => {
    // 1. Jika pengguna sudah mengetikkan email di form login, gunakan secara otomatis tanpa perlu membuka modal
    const currentFormEmail = getValues('email')?.trim();
    if (currentFormEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFormEmail)) {
      handleGoogleAccountSelect(currentFormEmail);
      return;
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 2. Jika SDK Google OAuth2 tersedia, buka popup resmi Google Account Chooser
    if (googleClientId && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenRes: any) => {
            if (tokenRes.error) {
              console.warn('Google OAuth error:', tokenRes);
              setIsGoogleModalOpen(true);
              return;
            }
            if (tokenRes.access_token) {
              setIsGoogleLoading(true);
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenRes.access_token}` },
                });
                const userData = await userRes.json();
                if (userData.email) {
                  await handleGoogleAccountSelect(userData.email);
                }
              } catch (e) {
                console.error('Gagal mengambil data profil Google:', e);
                setIsGoogleModalOpen(true);
              } finally {
                setIsGoogleLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('OAuth2 requestAccessToken failed, fallback to modal:', e);
      }
    }

    // 3. Fallback: Buka modal pemilihan akun Google
    setIsGoogleModalOpen(true);
  };

  const handleGoogleAccountSelect = async (email: string) => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const response = await apiClient.post('/auth/google', { email });

      // Jika user sudah terdaftar di database, langsung login ke aplikasi
      if (!response.data.isNewUser) {
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        setIsGoogleModalOpen(false);
        showLoginLoader();
        if (response.data.role === 'WHATSAPP_ADMIN') {
          navigate('/whatsapp-gateway');
        } else if (response.data.role === 'IBU_HAMIL') {
          navigate('/');
        } else {
          navigate('/dokter/dashboard');
        }
      } else {
        // Jika user baru, tutup modal dan arahkan ke halaman pendaftaran dengan data Google
        setIsGoogleModalOpen(false);
        navigate('/register', {
          state: {
            authMethod: 'google',
            googleEmail: response.data.email,
            googleRegistrationToken: response.data.googleRegistrationToken,
          },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal melakukan autentikasi Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F8FAFC] relative px-4 py-8 sm:py-12">
      {/* Background Aurora Hijau Interaktif dengan Fisika Kursor */}
      <AuroraBackground />

      {/* Container / Card Utama Form Login */}
      <div 
        className="w-full max-w-[420px] bg-white rounded-[2rem] p-7 sm:p-9 shadow-[0_15px_40px_rgba(25,70,104,0.06)] border border-slate-100 relative z-10 my-auto"
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
        
        {/* Header Container */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gunakan email terdaftar untuk mengakses BumilFit
          </p>
        </div>

        {/* Notifikasi Kesalahan */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span className="flex-1">{errorMsg}</span>
            </div>
            {unverifiedData && (
              <button
                type="button"
                onClick={() => navigate('/verify-otp', { state: unverifiedData })}
                className="mt-1 self-start px-3 py-1.5 rounded-lg bg-[#389D9C] hover:bg-[#2E8281] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Verifikasi Kode OTP Sekarang →
              </button>
            )}
          </div>
        )}

        {/* Formulir Login */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bidang Input Email */}
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
                placeholder="nama@email.com" 
                autoComplete="email"
                {...register('email')} 
                className={`pl-10 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C] ${
                  errors.email ? 'border-rose-400 focus-visible:ring-rose-400' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Bidang Input Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Lock size={18} />
              </div>
              <Input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                autoComplete="current-password"
                {...register('password')} 
                className={`pl-10 pr-11 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C] ${
                  errors.password ? 'border-rose-400 focus-visible:ring-rose-400' : ''
                }`}
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
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>
            )}
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

          {/* Tombol Aksi Masuk */}
          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={isLoading || isGoogleLoading || !recaptchaToken} 
              className="w-full h-12 bg-bumil-primary hover:bg-[#2E8281] active:scale-[0.99] text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </Button>
          </div>

          {/* Pemisah 'atau' */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-gray-400 font-medium select-none uppercase tracking-wider">
              atau
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Tombol Opsi 'Pakai Google' */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleButtonClick}
              disabled={isLoading || isGoogleLoading}
              className="w-full h-12 bg-white hover:bg-slate-50/80 active:scale-[0.99] text-[#194668] font-bold rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 text-sm disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-[#389D9C]" />
                  <span>Menghubungkan Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Tautan Pendaftaran */}
        <div className="mt-7 text-center text-xs sm:text-sm text-gray-500 border-t border-slate-100 pt-5">
          Belum punya akun?{' '}
          <Link 
            to="/register" 
            className="text-[#389D9C] font-semibold hover:underline cursor-pointer"
          >
            Daftar sekarang
          </Link>
        </div>

      </div>

      {/* Modal Pemilihan Akun Google */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleAccountSelect}
        isLoading={isGoogleLoading}
        initialEmail={getValues('email')}
      />
    </div>
  );
};

