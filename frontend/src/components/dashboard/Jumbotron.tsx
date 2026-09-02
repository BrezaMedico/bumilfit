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

export const Jumbotron = ({ profilIbu }: JumbotronProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hitung usia kehamilan secara dinamis
  const baseWeeks = profilIbu?.usiaKehamilanMinggu || 24;
  const baseDays = profilIbu?.usiaKehamilanHari !== undefined ? profilIbu.usiaKehamilanHari : 3;
  const { weeks, days } = calculateGestationalAge(baseWeeks, baseDays, profilIbu?.usiaKehamilanUpdatedAt);
  
  const totalDays = weeks * 7 + days;
  const trimester = weeks <= 12 ? 1 : weeks <= 27 ? 2 : 3;

  // Hitung persentase perkembangan kehamilan (maksimal 40 minggu / 280 hari)
  const progressPercent = Math.min(100, Math.max(0, (totalDays / 280) * 100));

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
  const requestRef = useRef<number | null>(null);

  // Bersihkan requestAnimationFrame saat unmount
  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Event handler untuk pelacakan mouse (performa tinggi via CSS Custom Properties + requestAnimationFrame)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Jangan jalankan jika device tidak mendukung hover (layar sentuh / mobile / tablet)
    if (!window.matchMedia('(hover: hover)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    requestRef.current = requestAnimationFrame(() => {
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    });
  };

  const handleMouseEnter = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    containerRef.current?.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    containerRef.current?.style.setProperty('--spotlight-opacity', '0');
  };

  // Sub-komponen render untuk menghindari pengulangan kode di desktop & mobile
  const renderHeader = () => (
    <div className="space-y-1.5 text-left relative z-10">
      <span className="text-sm font-semibold text-slate-400">Halo,</span>
      <div className="flex items-center gap-3.5 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight m-0 leading-none">
          {profilIbu?.namaAnak || 'Si Kecil'}
        </h1>
        {profilIbu?.genderAnak && (normalizeGender(profilIbu.genderAnak) === 'LAKI_LAKI' || normalizeGender(profilIbu.genderAnak) === 'PEREMPUAN') && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-xs ${
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

  const renderFetusCard = () => (
    <div className="bg-transparent border-0 shadow-none p-0 flex flex-col justify-between items-center w-full h-full text-left relative z-10">
      {/* Ilustrasi Utama (Bebas dari frame, menyatu dengan background, diperbesar 20-25% secara proporsional) */}
      <div className="flex-1 flex items-center justify-center p-2 bg-transparent border-0 shadow-none">
        <img 
          src={babyImg} 
          alt="Ilustrasi Janin" 
          className="w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 object-contain hover:scale-105 transition-transform duration-300 ease-out mix-blend-multiply"
        />
      </div>
      {/* Pill Komparasi Ukuran */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl p-2.5 flex items-center justify-center gap-2 border border-slate-100 shadow-xs mt-4">
        <span className="text-xs font-semibold text-slate-500">Bayi seukuran:</span>
        <span className="text-xs font-black text-slate-800">{fetalGrowth.analogy_item}</span>
        <span className="text-lg leading-none" role="img" aria-label={fetalGrowth.analogy_item}>
          {fetalGrowth.emoji}
        </span>
      </div>
    </div>
  );

  const renderMetricStats = () => (
    <div className="grid grid-cols-2 gap-4 text-left relative z-10">
      {/* MINGGU */}
      <div className="bg-white/70 backdrop-blur-xs border border-slate-100/50 rounded-2xl p-4 flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
        <div>
          <span className="text-3xl font-black text-slate-900 block leading-none mb-1">
            {weeks}
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            MINGGU
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs">
          <Calendar size={18} />
        </div>
      </div>
      {/* HARI */}
      <div className="bg-white/70 backdrop-blur-xs border border-slate-100/50 rounded-2xl p-4 flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
        <div>
          <span className="text-3xl font-black text-slate-900 block leading-none mb-1">
            {days}
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            HARI
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
          <Clock size={18} />
        </div>
      </div>
    </div>
  );

  const renderProgressAndHpl = () => (
    <div className="space-y-5 text-left relative z-10">
      {/* Progress Trimester */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
          <span>TRIMESTER {trimester}</span>
          <span className="text-[#0D9488]">{Math.round(progressPercent)}%</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="relative w-full h-3 bg-slate-200 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.08)] rounded-full">
          {/* Progress fill */}
          <div 
            className="h-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-full transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Milestone Markers */}
          {/* Trimester 1 Marker (0% - 12 weeks is ~30% of progress bar) */}
          <div 
            className={`absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all ${
              trimester === 1 
                ? 'w-4.5 h-4.5 bg-[#0D9488] ring-4 ring-[#0D9488]/20 animate-pulse z-10' 
                : 'w-3 h-3 bg-[#0D9488]'
            }`}
          />
          {/* Trimester 2 Marker (13 - 27 weeks is ~68% of progress bar) */}
          <div 
            className={`absolute top-1/2 left-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all ${
              trimester === 2 
                ? 'w-4.5 h-4.5 bg-[#0D9488] ring-4 ring-[#0D9488]/20 animate-pulse z-10' 
                : trimester > 2 
                  ? 'w-3 h-3 bg-[#0D9488]' 
                  : 'w-3 h-3 bg-slate-300'
            }`}
          />
          {/* Trimester 3 Marker (28 - 40 weeks is ~98% of progress bar) */}
          <div 
            className={`absolute top-1/2 left-[98%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all ${
              trimester === 3 
                ? 'w-4.5 h-4.5 bg-[#0D9488] ring-4 ring-[#0D9488]/20 animate-pulse z-10' 
                : 'w-3 h-3 bg-slate-300'
            }`}
          />
        </div>
        
        {/* Milestone Labels */}
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span className={trimester === 1 ? 'text-[#0D9488] font-black' : trimester > 1 ? 'text-slate-600' : 'text-slate-400 font-medium'}>Trimester 1</span>
          <span className={trimester === 2 ? 'text-[#0D9488] font-black' : trimester > 2 ? 'text-slate-600' : 'text-slate-400 font-medium'}>Trimester 2</span>
          <span className={trimester === 3 ? 'text-[#0D9488] font-black' : 'text-slate-400 font-medium'}>Trimester 3</span>
        </div>
      </div>

      {/* Estimasi HPL */}
      <div className="bg-white/70 backdrop-blur-xs border border-slate-100/50 rounded-2xl p-4 flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-full bg-[#FFEDD5] text-[#D97706] flex items-center justify-center flex-shrink-0">
          <Calendar size={18} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Estimasi Hari Lahir (HPL)
          </span>
          <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
            {getHplDate()}
          </span>
        </div>
      </div>
    </div>
  );

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
            <h3 className="font-extrabold text-slate-900 text-base">
              Catatan
            </h3>
          </div>
          {/* Paragraf Catatan */}
          <p className="text-sm md:text-[15px] leading-relaxed text-slate-600 font-medium tracking-wide">
            {dailyNote.teks}
          </p>
        </div>

        {/* Kategori Catatan */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Fase Kehamilan
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold text-slate-800 block">
              {dailyNote.fase}
            </span>
            <div className="flex items-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold shadow-2xs ${badgeClass}`}>
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
      className="relative bg-gradient-to-br from-[#FFFFFF] via-[#F0FAFA] to-[#FFF6F6] rounded-[2.5rem] p-6 md:p-8 border border-[#389D9C]/10 shadow-[0_20px_50px_rgba(25,70,104,0.03)] mt-6 transition-all overflow-hidden"
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
            {renderFetusCard()}
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
          {renderFetusCard()}
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

