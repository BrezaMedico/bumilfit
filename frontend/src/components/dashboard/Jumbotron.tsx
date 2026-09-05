import { Mars, Venus, Calendar, Clock, Sparkles, Heart, Bell, Lightbulb } from 'lucide-react';
import { useRef, useEffect } from 'react';
import babyImg from '../../assets/bayi.jpg';
import { normalizeGender } from '../ui/GenderBadge';
import { calculateGestationalAge, getDailyNote } from '../../data/catatanHarian';
import { getFetalGrowthByWeek } from '../../data/fetalGrowthData';

interface JumbotronProps {
  profilIbu?: {
    namaIbu: string;
    namaAnak?: string | null;
    usiaKehamilanMinggu: number;
    usiaKehamilanHari: number;
    genderAnak?: string | null;
    usiaKehamilanUpdatedAt?: string | null;
  } | null;
}

/**
 * Format nama anak agar tidak terlalu panjang di header Jumbotron:
 * - Jika <= 2 kata: tampilkan utuh (misal: "Rayyan", "Muhammad Rayyan").
 * - Jika > 2 kata: 2 kata depan dipakai utuh, kata ke-3 dan seterusnya disingkat inisialnya
 *   (misal: "Muhammad Rayyan Al Fatih" -> "Muhammad Rayyan A. F.").
 */
const formatChildName = (rawName?: string | null): string => {
  if (!rawName || !rawName.trim()) return 'Si Kecil';

  const words = rawName.trim().split(/\s+/);
  if (words.length <= 2) {
    return rawName.trim();
  }

  const firstTwo = words.slice(0, 2).join(' ');
  const abbreviatedRest = words
    .slice(2)
    .map((w) => `${w.charAt(0).toUpperCase()}.`)
    .join(' ');

  return `${firstTwo} ${abbreviatedRest}`;
};

export const Jumbotron = ({ profilIbu }: JumbotronProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopBabyRef = useRef<HTMLDivElement>(null);
  const mobileBabyRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Hitung usia kehamilan secara dinamis
  const baseWeeks = typeof profilIbu?.usiaKehamilanMinggu === 'number' ? profilIbu.usiaKehamilanMinggu : 0;
  const baseDays = typeof profilIbu?.usiaKehamilanHari === 'number' ? profilIbu.usiaKehamilanHari : 0;
  const { weeks, days } = calculateGestationalAge(baseWeeks, baseDays, profilIbu?.usiaKehamilanUpdatedAt);
  
  const totalDays = weeks * 7 + days;
  const trimester = weeks <= 12 ? 1 : weeks <= 27 ? 2 : 3;

  // Hitung persentase perkembangan kehamilan keseluruhan (maksimal 40 minggu / 280 hari)
  const progressPercent = Math.min(100, Math.max(0, (totalDays / 280) * 100));

  // Hitung progress per-trimester (3 cluster terpisah tetapi dinamis berdasarkan tanggal kehamilan)
  // Trimester 1: Minggu 1-12 (0 - 84 hari)
  const t1Progress = Math.min(100, Math.max(0, (totalDays / 84) * 100));
  // Trimester 2: Minggu 13-27 (hari ke-84 sampai 189 = rentang 105 hari)
  const t2Progress = Math.min(100, Math.max(0, ((totalDays - 84) / 105) * 100));
  // Trimester 3: Minggu 28-40 (hari ke-189 sampai 280 = rentang 91 hari)
  const t3Progress = Math.min(100, Math.max(0, ((totalDays - 189) / 91) * 100));

  // Hitung Hari Perkiraan Lahir (HPL) dari tanggal saat ini
  const getHplDate = () => {
    const remainingDays = 280 - totalDays;
    const hpl = new Date();
    hpl.setDate(hpl.getDate() + remainingDays);
    return hpl.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const fetalGrowth = getFetalGrowthByWeek(weeks);

  // Bersihkan requestAnimationFrame saat unmount
  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Event handler mouse tracking berkinerja tinggi (0 React re-render, pure GPU transform)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalisasi koordinat terhadap pusat container (-1 sampai +1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
    const normY = Math.max(-1, Math.min(1, (y - centerY) / centerY));

    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    requestRef.current = requestAnimationFrame(() => {
      // 1. Spotlight effect pada latar belakang Jumbotron
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);

      // 2. Animasi interaktif foto bayi: translasi halus (max 12px) & 3D tilt subtle (max 5.5 deg)
      const transX = (normX * 12).toFixed(2);
      const transY = (normY * 9).toFixed(2);
      const rotY = (normX * 5.5).toFixed(2);
      const rotX = (-normY * 4.5).toFixed(2);

      const applyTransform = (el: HTMLDivElement | null) => {
        if (!el) return;
        el.style.transition = 'transform 0.12s ease-out';
        el.style.transform = `perspective(800px) translate3d(${transX}px, ${transY}px, 0px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      };

      applyTransform(desktopBabyRef.current);
      applyTransform(mobileBabyRef.current);
    });
  };

  const handleMouseEnter = () => {
    containerRef.current?.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    containerRef.current?.style.setProperty('--spotlight-opacity', '0');

    // Return perlahan & natural kembali ke posisi default (translate 0, rotate 0)
    const resetTransform = (el: HTMLDivElement | null) => {
      if (!el) return;
      el.style.transition = 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'perspective(800px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)';
    };

    resetTransform(desktopBabyRef.current);
    resetTransform(mobileBabyRef.current);
  };

  // Sub-komponen 1: Header Identitas Anak (Nama responsif tanpa terpotong)
  const renderHeader = () => {
    const rawName = profilIbu?.namaAnak;
    const fullName = rawName?.trim() || 'Si Kecil';
    const displayName = formatChildName(rawName);

    return (
      <div className="space-y-1 text-left relative z-10 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
          <h1 
            title={fullName !== displayName ? fullName : undefined}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight m-0 leading-tight break-words max-w-full sm:max-w-[360px] md:max-w-[420px] py-0.5"
          >
            {displayName}
          </h1>
          {profilIbu?.genderAnak && (normalizeGender(profilIbu.genderAnak) === 'LAKI_LAKI' || normalizeGender(profilIbu.genderAnak) === 'PEREMPUAN') && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-xs shrink-0 ${
              normalizeGender(profilIbu.genderAnak) === 'LAKI_LAKI'
                ? 'bg-[#E0F2FE] border-[#bae6fd] text-[#0369a1]'
                : 'bg-[#FCE7F3] border-[#fbcfe8] text-[#be185d]'
            }`}>
              {normalizeGender(profilIbu.genderAnak) === 'LAKI_LAKI' ? (
                <Mars size={16} className="stroke-[3]" />
              ) : (
                <Venus size={16} className="stroke-[3]" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sub-komponen 2: Kartu Visual Janin & Efek Parallax/3D Tilt
  const renderFetusCard = (targetRef: React.RefObject<HTMLDivElement | null>) => (
    <div className="bg-transparent border-0 shadow-none p-0 flex flex-col justify-between items-center w-full h-full text-left relative z-10">
      {/* Ilustrasi Utama dengan Animasi Cursor Subtle & 3D Tilt */}
      <div 
        className="flex-1 flex items-center justify-center p-2 bg-transparent border-0 shadow-none"
        style={{ perspective: 1000 }}
      >
        <div
          ref={targetRef}
          className="relative will-change-transform select-none"
          style={{
            transform: 'perspective(800px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <img 
            src={babyImg} 
            alt="Ilustrasi Janin" 
            className="w-40 h-40 xs:w-48 xs:h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 object-contain pointer-events-none select-none mix-blend-multiply drop-shadow-[0_10px_20px_rgba(25,70,104,0.06)]"
          />
        </div>
      </div>

      {/* Pill Komparasi Ukuran */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl p-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 border border-slate-100 shadow-xs mt-3 sm:mt-4 text-center">
        <span className="text-xs font-semibold text-slate-500">Bayi seukuran:</span>
        <span className="text-xs font-black text-slate-800 break-words">{fetalGrowth.analogy_item}</span>
        <span className="text-lg leading-none shrink-0" role="img" aria-label={fetalGrowth.analogy_item}>
          {fetalGrowth.emoji}
        </span>
      </div>
    </div>
  );

  // Sub-komponen 3: Statistik Metrik Usia Kehamilan / Umur Janin
  const renderMetricStats = () => (
    <div className="space-y-2 text-left relative z-10 w-full">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
        <span>Umur Janin & Usia Kehamilan</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {/* MINGGU */}
        <div className="bg-white/70 backdrop-blur-xs border border-slate-100/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] min-w-0">
          <div className="min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight mb-0.5">
              {weeks}
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              MINGGU
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs shrink-0">
            <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>
        {/* HARI */}
        <div className="bg-white/70 backdrop-blur-xs border border-slate-100/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] min-w-0">
          <div className="min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight mb-0.5">
              {days}
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              HARI
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs shrink-0">
            <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );

  // Sub-komponen 4: Visual Timeline 3 Bar Trimester & Estimasi HPL (Tanpa Keterangan Persen & Mgg)
  const renderProgressAndHpl = () => {
    const trimesterData = [
      {
        num: 1,
        title: 'Trimester 1',
        progress: t1Progress,
        isActive: trimester === 1,
        isCompleted: trimester > 1,
      },
      {
        num: 2,
        title: 'Trimester 2',
        progress: t2Progress,
        isActive: trimester === 2,
        isCompleted: trimester > 2,
      },
      {
        num: 3,
        title: 'Trimester 3',
        progress: t3Progress,
        isActive: trimester === 3,
        isCompleted: totalDays >= 280,
      },
    ];

    return (
      <div className="space-y-4 sm:space-y-5 text-left relative z-10 w-full">
        {/* Header Timeline & Progress Global */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-bold text-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-900 tracking-wider uppercase text-[10px] sm:text-[11px]">TIMELINE TRIMESTER</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#389D9C]/10 text-[#389D9C] text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#389D9C] animate-pulse" />
                Trimester {trimester}
              </span>
            </div>
            <span className="text-[#389D9C] font-extrabold">{Math.round(progressPercent)}% Total</span>
          </div>

          {/* 3 Bar / Cluster Trimester Berdampingan */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {trimesterData.map((t) => (
              <div key={t.num} className="flex flex-col gap-1.5">
                {/* Bar Progres Individual */}
                <div 
                  className={`relative h-2.5 sm:h-3 rounded-full overflow-hidden transition-all duration-300 ${
                    t.isActive
                      ? 'bg-slate-200/90 ring-2 ring-[#389D9C]/25 shadow-inner'
                      : t.isCompleted
                      ? 'bg-slate-200/60'
                      : 'bg-slate-100/90 border border-slate-200/60'
                  }`}
                >
                  {/* Progress Fill per Trimester */}
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      t.isCompleted
                        ? 'bg-[#389D9C]'
                        : t.isActive
                        ? 'bg-gradient-to-r from-[#389D9C] to-[#75D5D4]'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />

                  {/* Indicator Pip Khusus Trimester yang Sedang Berjalan */}
                  {t.isActive && t.progress > 0 && t.progress < 100 && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-xs ring-1.5 ring-[#389D9C] pointer-events-none"
                      style={{ left: `${Math.max(4, Math.min(96, t.progress))}%` }}
                    />
                  )}
                </div>

                {/* Label Trimester Tepat di Bawah Masing-Masing Bar (Hanya Judul Trimester) */}
                <div className="flex items-center justify-center text-center mt-0.5">
                  <span 
                    className={`text-[10px] sm:text-xs tracking-tight transition-colors ${
                      t.isActive 
                        ? 'text-[#389D9C] font-black' 
                        : t.isCompleted 
                        ? 'text-slate-700 font-bold' 
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {t.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimasi HPL */}
        <div className="bg-white/70 backdrop-blur-xs border border-slate-100/50 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFEDD5] text-[#D97706] flex items-center justify-center shrink-0">
            <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Estimasi Hari Lahir (HPL)
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
              {getHplDate()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Sub-komponen 5: Catatan Medis & Harian (Ukuran Teks Ditingkatkan agar Seimbang)
  const renderDailyNotes = () => {
    // Ambil catatan harian (petakan hari 0-6 menjadi hari ke 1-7)
    const dailyNote = getDailyNote(weeks, days + 1);

    let badgeClass = '';
    let badgeIcon = null;
    let badgeText = '';

    if (dailyNote.tipe === 'Support') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      badgeIcon = <Heart size={14} className="fill-emerald-500/20 text-emerald-600" />;
      badgeText = 'Dukungan Bunda';
    } else if (dailyNote.tipe === 'Reminder') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/60';
      badgeIcon = <Bell size={14} className="fill-amber-500/20 text-amber-600" />;
      badgeText = 'Pengingat Harian';
    } else {
      badgeClass = 'bg-sky-50 text-sky-700 border-sky-200/60';
      badgeIcon = <Lightbulb size={14} className="fill-sky-500/20 text-sky-600" />;
      badgeText = 'Info Janin';
    }

    return (
      <div className="h-full flex flex-col justify-between space-y-6 text-left relative z-10">
        <div className="space-y-4">
          {/* Header Catatan */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full border border-[#389D9C]/20 flex items-center justify-center text-[#389D9C] bg-[#389D9C]/5 flex-shrink-0 shadow-3xs">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Catatan
            </h3>
          </div>
          {/* Paragraf Catatan: Diperbesar proporsional untuk mengisi ruang kosong & meningkatkan readability */}
          <p className="text-[15px] sm:text-base lg:text-[16px] leading-[1.7] text-slate-700 font-medium">
            {dailyNote.teks}
          </p>
        </div>

        {/* Kategori Catatan */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Fase Kehamilan
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-extrabold text-slate-800 block">
              {dailyNote.fase}
            </span>
            <div className="flex items-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold shadow-2xs ${badgeClass}`}>
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        '--spotlight-opacity': '0',
      } as React.CSSProperties}
      className="relative bg-gradient-to-br from-[#FFFFFF] via-[#F0FAFA] to-[#FFF6F6] rounded-[1.75rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 border border-[#389D9C]/10 shadow-[0_20px_50px_rgba(25,70,104,0.03)] mt-6 transition-all overflow-hidden"
    >
      <style>{`
        @media (hover: none) {
          .spotlight-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Interactive mouse-tracking background spotlight overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out spotlight-overlay"
        style={{
          background: 'radial-gradient(circle 450px at var(--mouse-x) var(--mouse-y), rgba(56, 157, 156, 0.15) 0%, rgba(56, 157, 156, 0.05) 50%, transparent 100%)',
          opacity: 'var(--spotlight-opacity)',
        }}
      />
      
      {/* 1. TAMPILAN DESKTOP (Split 2 Kolom) */}
      <div className="hidden lg:flex gap-8 justify-between items-stretch">
        
        {/* Area Kiri (Pelacak & Visual Janin - 65% Lebar) */}
        <div className="w-[65%] flex gap-8">
          {/* Sub-Kolom 1: Data Metrik & Progres (60% lebar dari area kiri) */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {renderHeader()}
            {renderMetricStats()}
            {renderProgressAndHpl()}
          </div>
          
          {/* Sub-Kolom 2: Visual Janin & Komparasi Ukuran (40% lebar dari area kiri) */}
          <div className="w-[260px] flex-shrink-0">
            {renderFetusCard(desktopBabyRef)}
          </div>
        </div>

        {/* Pemisah Vertikal */}
        <div className="w-[1px] bg-gradient-to-b from-transparent via-slate-100 to-transparent flex-shrink-0" />

        {/* Area Kanan (Catatan Medis & Dokter - 35% Lebar) */}
        <div className="w-[35%] pl-2">
          {renderDailyNotes()}
        </div>

      </div>

      {/* 2. TAMPILAN MOBILE (Vertical Stack Order Khusus) */}
      <div className="lg:hidden flex flex-col gap-6">
        {/* Order 1: Sapaan & Nama Janin */}
        {renderHeader()}
        
        {/* Order 2: Kartu Visual Janin & Komparasi Ukuran */}
        <div className="w-full">
          {renderFetusCard(mobileBabyRef)}
        </div>

        {/* Order 3: Kotak Metrik Usia Kehamilan */}
        {renderMetricStats()}

        {/* Order 4: Progress Bar Trimester & HPL */}
        {renderProgressAndHpl()}

        {/* Pemisah Horisontal */}
        <div className="h-[1px] bg-slate-100 my-2" />

        {/* Order 5: Catatan Medis & Dokter */}
        {renderDailyNotes()}
      </div>

    </div>
  );
};

