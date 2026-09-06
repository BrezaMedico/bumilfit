import React from 'react';
import logoBumilfit from '../../assets/logo-bumilfit.png';
import { useLoadingStore } from '../../store/useLoadingStore';

export const FullscreenLoginLoader: React.FC = () => {
  const { isLoginLoading, hideLoginLoader } = useLoadingStore();

  React.useEffect(() => {
    if (isLoginLoading) {
      const timer = setTimeout(() => {
        hideLoginLoader();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLoginLoading, hideLoginLoader]);

  if (!isLoginLoading) return null;

  return (
    <div 
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-300"
    >
      {/* Aksen Latar Belakang Lingkaran Cahaya Lembut */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-teal-100/40 via-sky-100/30 to-transparent blur-3xl pointer-events-none -translate-y-6" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm mx-auto">
        {/* Logo BUMILFIT dengan Denyut Melayang Lembut */}
        <div className="mb-8 relative group">
          <img 
            src={logoBumilfit} 
            alt="BUMILFIT" 
            className="h-16 sm:h-20 w-auto object-contain [animation:logoFloatPulse_2.5s_ease-in-out_infinite]" 
          />
        </div>

        {/* Kotak-kotak Persegi yang Berjalan Bergantian ke Arah Kanan */}
        <div className="flex items-center justify-center gap-2.5 mb-6 py-2" aria-label="Memuat...">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md [animation:squareWave_1.4s_ease-in-out_infinite]"
              style={{
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>

        {/* Keterangan Status */}
        <div className="space-y-1.5 animate-in fade-in duration-300">
          <h3 className="text-base sm:text-lg font-black text-[#194668] tracking-tight">
            Memasuki Akun Bunda...
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
            Menyiapkan data kehamilan dan ruang pendampingan kesehatan Bunda
          </p>
        </div>
      </div>
    </div>
  );
};
