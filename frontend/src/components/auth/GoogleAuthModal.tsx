import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2, ShieldCheck, Mail, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string) => Promise<void>;
  isLoading?: boolean;
  initialEmail?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isLoading = false,
  initialEmail = '',
}) => {
  const [googleEmail, setGoogleEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [detectedAccount, setDetectedAccount] = useState<string | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Deteksi akun Google dari input login atau riwayat browser saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const cleanInitial = initialEmail?.trim().toLowerCase();
      const isValidInitial = cleanInitial && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInitial);

      const saved = localStorage.getItem('bumilfit_last_google_email')?.trim().toLowerCase();
      const isValidSaved = saved && saved !== 'bumilfit@gmail.com' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved);

      if (isValidInitial) {
        setDetectedAccount(cleanInitial);
        setGoogleEmail(cleanInitial);
        setIsManualInput(false);
      } else if (isValidSaved) {
        setDetectedAccount(saved);
        setGoogleEmail(saved);
        setIsManualInput(false);
      } else {
        setDetectedAccount(null);
        setGoogleEmail('');
        setIsManualInput(true);
      }
    }
  }, [isOpen, initialEmail]);

  // Auto-focus ke input jika beralih ke mode manual
  useEffect(() => {
    if (isOpen && isManualInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isManualInput]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = googleEmail.trim().toLowerCase();

    if (!clean) {
      setErrorMsg('Masukkan atau pilih alamat email Google Anda');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrorMsg('Format email tidak valid. Pastikan penulisan email sudah benar.');
      return;
    }

    setErrorMsg('');
    try {
      localStorage.setItem('bumilfit_last_google_email', clean);
      await onSelectAccount(clean);
    } catch {
      // Error ditangani oleh parent component
    }
  };

  const handleSelectDetected = async (email: string) => {
    setGoogleEmail(email);
    setErrorMsg('');
    try {
      localStorage.setItem('bumilfit_last_google_email', email);
      await onSelectAccount(email);
    } catch {
      // Error ditangani oleh parent component
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      maxWidth="md"
      showCloseButton={!isLoading}
      className="p-0 overflow-hidden"
    >
      <div className="p-6 sm:p-7">
        {/* Header Bersih dengan Identitas Google */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-100 mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
          </div>
          <h2 className="text-xl font-bold text-[#194668] tracking-tight">
            Pilih Akun Google Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lanjutkan ke <span className="font-semibold text-[#194668]">BUMILFIT</span> dengan akun Google pribadi Anda
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="py-4 space-y-4">
          {/* Tampilan Akun Terdeteksi Otomatis (Jika Ada) */}
          {detectedAccount && !isManualInput ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Akun Terdeteksi Otomatis
              </label>

              {/* Kartu Akun Google Utama */}
              <div
                onClick={() => !isLoading && handleSelectDetected(detectedAccount)}
                className="group relative p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/30 hover:from-emerald-50/50 hover:to-emerald-100/40 border-2 border-emerald-500/30 hover:border-emerald-500 transition-all cursor-pointer shadow-xs hover:shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#194668] to-[#389D9C] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    {detectedAccount[0].toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#194668] truncate block group-hover:text-[#389D9C] transition-colors">
                        {detectedAccount}
                      </span>
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium block">
                      Akun Google aktif di browser
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#389D9C] group-hover:bg-[#2E8281] text-white text-xs font-bold shadow-xs transition-all">
                    <span>Lanjut</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {/* Tombol Gunakan Akun Lain */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsManualInput(true)}
                  disabled={isLoading}
                  className="text-xs text-slate-500 hover:text-[#389D9C] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Gunakan alamat email Google lain</span>
                </button>
              </div>
            </div>
          ) : (
            /* Form Input Akun Google dengan Dukungan Autofill Browser */
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#194668] uppercase tracking-wider block">
                    Alamat Email Google Anda
                  </label>
                  {detectedAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualInput(false);
                        setGoogleEmail(detectedAccount);
                      }}
                      className="text-[11px] text-[#389D9C] hover:underline font-medium cursor-pointer"
                    >
                      Pilih Akun Terdeteksi
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail size={18} />
                  </div>
                  <Input
                    ref={inputRef}
                    type="email"
                    name="email"
                    id="google_auth_email_input"
                    placeholder="nama.anda@gmail.com"
                    value={googleEmail}
                    onChange={(e) => {
                      setGoogleEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    autoComplete="email webauthn"
                    autoFocus
                    required
                    className="pl-10 h-12 rounded-xl bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-[#389D9C] focus-visible:border-[#389D9C]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                  Ketik atau pilih dari rekomendasi autofill browser Google Anda.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto h-11 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer order-2 sm:order-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !googleEmail}
                  className="w-full sm:w-auto h-11 px-5 bg-bumil-primary hover:bg-[#2E8281] text-white font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjutkan dengan Google</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Kotak Info Ringkasan Alur Otomatis */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-[#194668]">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Autentikasi Aman & Otomatis:</span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Jika akun sudah ada, Anda akan <strong>langsung masuk</strong>. Jika akun baru, form pendaftaran akan <strong>otomatis terisi</strong> dengan email Anda tanpa perlu kata sandi.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
