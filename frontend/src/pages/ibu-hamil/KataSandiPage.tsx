import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  KeyRound,
  Lock,
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Check,
  ChevronRight,
  Home,
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiClient } from '../../lib/apiClient';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useSubscription } from '../../context/SubscriptionContext';

// --- Komponen Toast Melayang (Konsisten dengan Halaman Profil) ---
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 sm:right-6 z-50 max-w-[calc(100vw-2rem)] px-5 sm:px-6 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
      type === 'success' ? 'bg-bumil-teal/10 border-bumil-teal/30 text-teal-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
};

export const KataSandiPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasActiveSubscription, planBadge } = useSubscription();

  // State profil pengguna
  const [profile, setProfile] = useState<{ namaIbu: string; email: string; fotoProfil: string | null }>({
    namaIbu: '',
    email: '',
    fotoProfil: null,
  });
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);

  // State nilai input formulir
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // State toggle visibilitas teks input
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // State status pengiriman & feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Ambil data profil untuk ditampilkan di Hero Card
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiClient.get('/auth/profile');
        const userData = res.data;
        setProfile({
          namaIbu: userData.profilIbu?.namaIbu || '',
          email: userData.email || '',
          fotoProfil: userData.profilIbu?.fotoProfil || null,
        });
      } catch (err) {
        console.error('Gagal memuat profil pengguna', err);
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Evaluasi aturan format kata sandi baru
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  // Kekuatan kata sandi (score 0-3)
  const strengthScore = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length;
  const getStrengthInfo = () => {
    if (newPassword.length === 0) return { label: '', barClass: 'bg-transparent', textClass: '' };
    if (strengthScore === 1) return { label: 'Lemah', barClass: 'bg-rose-500', textClass: 'text-rose-600' };
    if (strengthScore === 2) return { label: 'Sedang', barClass: 'bg-amber-500', textClass: 'text-amber-600' };
    return { label: 'Kuat', barClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
  };
  const strength = getStrengthInfo();

  // Validasi form sebelum submit
  const isFormValid = 
    oldPassword.trim().length > 0 &&
    hasMinLength &&
    hasLetter &&
    hasNumber &&
    isMatch;

  // Handler pengiriman form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.put('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      setToast({ 
        msg: response.data?.message || 'Kata sandi berhasil diperbarui!', 
        type: 'success' 
      });

      // Reset input form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memperbarui kata sandi. Pastikan kata sandi saat ini sudah benar.';
      setErrorMessage(msg);
      setToast({ msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton Loading saat data pertama kali dimuat
  if (isProfileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-3xl p-8 border border-slate-100 flex gap-8">
            <div className="w-24 h-24 bg-slate-200 rounded-full shrink-0"></div>
            <div className="flex-1 space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-100 h-72"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-bottom-pad space-y-6 sm:space-y-8 bg-bumil-bg min-h-screen relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Halaman & Navigasi Breadcrumb */}
      <div className="space-y-2">
        <nav 
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-500 font-medium"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-bumil-primary transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <Home size={14} />
            <span>Dashboard</span>
          </button>
          <ChevronRight size={13} className="text-slate-300 shrink-0" />
          <span className="text-bumil-navy font-semibold">Kata Sandi</span>
        </nav>
      </div>

      {/* HERO PROFILE CARD (Gaya Seragam dengan Profil) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 relative overflow-hidden">
        {/* Dekorasi Aksen Halus */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-50/50 via-transparent to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Sisi Kiri: Avatar & Identitas */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative group shrink-0">
              <UserAvatar
                size="2xl"
                src={profile.fotoProfil}
                name={profile.namaIbu || 'Bunda BumilFit'}
                className="shadow-sm ring-4 ring-offset-4 ring-slate-100"
              />
            </div>

            {/* Identitas & Info Kontak Ringkas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
                  {profile.namaIbu || 'Bunda BumilFit'}
                </h1>
                {hasActiveSubscription && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-bumil-primary to-[#75D5D4] text-white text-xs font-black shadow-2xs tracking-wider">
                    {planBadge}
                  </span>
                )}
              </div>
              {profile.email && (
                <p className="text-sm font-medium text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span>{profile.email}</span>
                </p>
              )}

              <div className="pt-1 flex items-center justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                  <ShieldCheck size={13} className="text-teal-600" />
                  <span>Keamanan & Autentikasi Akun</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Tombol Navigasi ke Profil */}
          <div className="shrink-0 w-full sm:w-auto flex sm:flex-col justify-center sm:justify-end gap-2.5">
            <Button 
              variant="outline"
              onClick={() => navigate('/profil')}
              className="w-full sm:w-auto border-slate-200 hover:border-bumil-primary/40 hover:bg-teal-50/50 text-bumil-navy flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <User size={15} /> Lihat Profil
            </Button>
          </div>
        </div>
      </div>

      {/* KARTU 1: Formulir Ubah Kata Sandi */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 transition-all">
        {/* Header Kartu */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-bumil-primary flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#194668]">Ubah Kata Sandi</h2>
              <p className="text-xs text-slate-400 font-medium">Perbarui kata sandi secara berkala untuk perlindungan keamanan akun Bunda</p>
            </div>
          </div>
        </div>

        {/* Notifikasi Error jika gagal */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Gagal Menyimpan</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
              aria-label="Tutup pesan error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bidang 1: Kata Sandi Saat Ini */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                <KeyRound size={14} />
              </div>
              <label htmlFor="old-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kata Sandi Saat Ini
              </label>
            </div>
            <div className="relative">
              <Input
                id="old-password"
                type={showOldPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi saat ini"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                required
                className="bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold pr-11"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-bumil-primary transition-colors p-1 cursor-pointer"
                aria-label={showOldPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Grid 2 Kolom: Sandi Baru & Konfirmasi Sandi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bidang 2: Kata Sandi Baru */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                    <Lock size={14} />
                  </div>
                  <label htmlFor="new-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kata Sandi Baru
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Buat kata sandi baru"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    className="bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-bumil-primary transition-colors p-1 cursor-pointer"
                    aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Indikator Kekuatan Sandi */}
              {newPassword.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Kekuatan Sandi:</span>
                    <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= 1 ? strength.barClass : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= 2 ? strength.barClass : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= 3 ? strength.barClass : 'bg-slate-200'}`} />
                  </div>
                </div>
              )}

              {/* Syarat Kata Sandi */}
              <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                <span className={`flex items-center gap-1 transition-colors ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} className={hasMinLength ? 'opacity-100' : 'opacity-40'} />
                  Min. 8 karakter
                </span>
                <span className={`flex items-center gap-1 transition-colors ${hasLetter ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} className={hasLetter ? 'opacity-100' : 'opacity-40'} />
                  Huruf (a-z)
                </span>
                <span className={`flex items-center gap-1 transition-colors ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} className={hasNumber ? 'opacity-100' : 'opacity-40'} />
                  Angka (0-9)
                </span>
              </div>
            </div>

            {/* Bidang 3: Konfirmasi Kata Sandi Baru */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                    <ShieldCheck size={14} />
                  </div>
                  <label htmlFor="confirm-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Konfirmasi Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ketik ulang kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    className={`bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold pr-11 ${
                      confirmPassword && !isMatch ? 'border-rose-300 focus-visible:ring-rose-400' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-bumil-primary transition-colors p-1 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi sandi' : 'Tampilkan konfirmasi sandi'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Indikator Status Kesesuaian */}
              <div className="pt-2 min-h-[22px]">
                {confirmPassword.length > 0 && (
                  <p className={`text-xs font-semibold flex items-center gap-1.5 ${isMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isMatch ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Kata sandi cocok dan siap disimpan</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} />
                        <span>Konfirmasi kata sandi belum sama</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Tombol Aksi */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrorMessage('');
              }}
              disabled={isLoading || (!oldPassword && !newPassword && !confirmPassword)}
              className="w-full sm:w-auto text-slate-600 font-bold hover:bg-slate-100 rounded-xl px-5 py-2.5 cursor-pointer"
            >
              Reset Formulir
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full sm:w-auto bg-bumil-primary hover:bg-[#2E8281] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl px-6 py-2.5 font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Simpan Kata Sandi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* KARTU 2: Tips & Panduan Keamanan Akun */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 transition-all text-left">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-bumil-primary flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#194668]">Tips Keamanan Akun Bunda</h2>
            <p className="text-xs text-slate-400 font-medium">Langkah praktis menjaga kerahasiaan dan keamanan data akun BumilFit</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-150 space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Kombinasi Karakter Kuat</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan minimal 8 karakter dengan perpaduan huruf besar, huruf kecil, dan angka. Hindari menggunakan tanggal lahir atau nama yang mudah ditebak.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-150 space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Jaga Kerahasiaan Sandi & OTP</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jangan pernah memberikan kata sandi atau kode verifikasi OTP kepada siapa pun. Tim BumilFit tidak akan pernah meminta kata sandi akun Bunda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
