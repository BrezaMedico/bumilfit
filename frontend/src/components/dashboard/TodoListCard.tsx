import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, Circle, ArrowRight, ArrowLeft, Activity, ShieldAlert, CheckCircle, ChevronDown } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';


const SYMPTOMS_LIST = [
  { id: 'morning_sickness', name: 'Mual dan Muntah (Morning Sickness)', desc: 'Sensasi mual/muntah harian' },
  { id: 'back_pain', name: 'Nyeri Punggung dan Pinggang', desc: 'Pegal/kencang pada tulang belakang' },
  { id: 'fatigue', name: 'Kelelahan dan Rasa Lemas Ekstrem', desc: 'Penurunan stamina/kelelahan berat' },
  { id: 'dizziness', name: 'Pusing atau Sensasi Melayang', desc: 'Nyeri kepala/sensasi kliyengan' },
  { id: 'cramps', name: 'Kram Perut Bawah atau Otot Kaki', desc: 'Kencang rahim/kram kaki malam hari' }
];

interface TodoListCardProps {
  userId?: string;
  profilIbu?: any;
}

export const TodoListCard = (_props: TodoListCardProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard Steps State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Symptoms Survey State
  const [symptomsState, setSymptomsState] = useState<Record<string, string>>({
    morning_sickness: 'Tidak Ada',
    back_pain: 'Tidak Ada',
    fatigue: 'Tidak Ada',
    dizziness: 'Tidak Ada',
    cramps: 'Tidak Ada'
  });

  // Symptoms Scroll Indicators State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTopFade, setShowScrollTopFade] = useState(false);
  const [showScrollBottomFade, setShowScrollBottomFade] = useState(true);

  // Measure Step 1 (To-Do List) natural height so Step 2 exactly follows it
  const step1Ref = useRef<HTMLDivElement>(null);
  const [todoListHeight, setTodoListHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!step1Ref.current) return;
    const updateHeight = () => {
      if (step1Ref.current) {
        const h = step1Ref.current.offsetHeight;
        setTodoListHeight((prev) => (prev !== h ? h : prev));
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(step1Ref.current);
    return () => observer.disconnect();
  }, [data?.tasks]);

  const handleSymptomsScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const nextTopFade = scrollTop > 10;
    const nextBottomFade = scrollTop + clientHeight < scrollHeight - 20;
    setShowScrollTopFade((prev) => (prev !== nextTopFade ? nextTopFade : prev));
    setShowScrollBottomFade((prev) => (prev !== nextBottomFade ? nextBottomFade : prev));
  };

  useEffect(() => {
    if (currentStep === 2) {
      const timer = setTimeout(() => {
        handleSymptomsScroll();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // AI Recommendation & Scoring State
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isRedFlag, setIsRedFlag] = useState<boolean>(false);
  const [, setSymptomScore] = useState<number>(0);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  // Perhitungan Skor Skrining: Tidak Ada/Baik = 0, Ringan = 1, Berat = 2
  const calculateScore = (state: Record<string, string>) => {
    let score = 0;
    Object.values(state).forEach((val) => {
      if (val.includes('Berat')) score += 2;
      else if (val.includes('Ringan')) score += 1;
    });
    return score;
  };

  const fetchDailyTodos = async () => {
    try {
      const response = await apiClient.get('/todo/daily');
      setData(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil data to-do harian:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTodos();
  }, []);

  const handleToggleTask = async (masterTodoId: string, currentlyCompleted: boolean) => {
    const nextCompleted = !currentlyCompleted;

    // Optimistic update for instant UI feedback
    setData((prev: any) => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map((t: any) =>
        t.masterTodoId === masterTodoId ? { ...t, isCompleted: nextCompleted } : t
      );
      const completedCount = updatedTasks.filter((t: any) => t.isCompleted).length;
      const totalCount = updatedTasks.length;
      return {
        ...prev,
        progress: {
          ...prev.progress,
          completedTasks: completedCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        },
        tasks: updatedTasks
      };
    });

    try {
      await apiClient.post('/todo/complete', {
        masterTodoId,
        isCompleted: nextCompleted
      });
      await fetchDailyTodos();
    } catch (err) {
      console.error("Gagal mengubah status tugas:", err);
      await fetchDailyTodos();
    }
  };

  const handleSendAnalysis = async () => {
    setLoadingAI(true);
    setCurrentStep(3); // Slide ke step 3

    const localScore = calculateScore(symptomsState);
    setSymptomScore(localScore);
    const hasLocalSevere = Object.values(symptomsState).some(val => val.includes('Berat'));
    setIsRedFlag(localScore >= 4 || hasLocalSevere);
    
    try {
      const formattedSymptoms = SYMPTOMS_LIST.map(sym => ({
        name: sym.name,
        severity: symptomsState[sym.id]
      }));

      const completedTasksText = data?.tasks
        .filter((t: any) => t.isCompleted)
        .map((t: any) => t.tugasHarian) || [];

      const uncompletedTasksText = data?.tasks
        .filter((t: any) => !t.isCompleted)
        .map((t: any) => t.tugasHarian) || [];

      const response = await apiClient.post('/todo/evaluate', {
        completedTasks: completedTasksText,
        uncompletedTasks: uncompletedTasksText,
        symptoms: formattedSymptoms,
        score: localScore
      });

      setAiAdvice(response.data.data.advice);
      setIsRedFlag(response.data.data.isRedFlag);
      if (typeof response.data.data.totalScore === 'number') {
        setSymptomScore(response.data.data.totalScore);
      }
    } catch (err) {
      console.error("Gagal mengirim analisis AI:", err);
      setAiAdvice("Maaf, gagal memproses saran kesehatan Bunda saat ini. Pastikan jaringan internet Anda stabil.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleResetWizard = () => {
    setSymptomsState({
      morning_sickness: 'Tidak Ada',
      back_pain: 'Tidak Ada',
      fatigue: 'Tidak Ada',
      dizziness: 'Tidak Ada',
      cramps: 'Tidak Ada'
    });
    setAiAdvice('');
    setIsRedFlag(false);
    setSymptomScore(0);
    setCurrentStep(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_15px_45px_rgba(0,0,0,0.02)] animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.tasks.length) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 text-center text-gray-500 shadow-[0_15px_45px_rgba(0,0,0,0.02)]">
        Gagal memuat tugas harian Bunda. Silakan segarkan halaman dashboard.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-[0_15px_45px_rgba(25,70,104,0.04)] p-4 sm:p-5 lg:p-7 text-left overflow-hidden relative text-slate-800 transform-gpu">
      {/* Background Subtle Mint Radial Accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(56,157,156,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(56,157,156,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3.5 mb-3.5 relative z-10">
        <div className="flex-1 min-w-0">
          <span className="bg-teal-50 text-[#1A7775] text-xs font-extrabold px-3.5 py-1 rounded-full border border-teal-200/60 shadow-2xs inline-block">
            Langkah {currentStep} dari 3
          </span>
          <h3 className="text-lg sm:text-2xl font-extrabold text-[#194668] mt-1.5 sm:mt-2 tracking-tight">
            Buku Harian Kesehatan Bunda
          </h3>
        </div>

        {/* Circular Progress */}
        {currentStep === 1 && (
          <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none shrink-0">
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TUGAS HARI INI</p>
              <p className="text-base sm:text-lg font-black text-slate-800">{data.progress.percentage}% Selesai</p>
            </div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-0.5 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="21" className="stroke-slate-100" strokeWidth="4.5" fill="transparent" />
                <circle cx="24" cy="24" r="21" className="stroke-[#389D9C] transition-all duration-500 ease-out" 
                        strokeWidth="4.5" fill="transparent"
                        strokeDasharray={2 * Math.PI * 21}
                        strokeDashoffset={2 * Math.PI * 21 * (1 - data.progress.percentage / 100)} />
              </svg>
              <span className="absolute text-xs font-black text-slate-700">
                {data.progress.completedTasks}/{data.progress.totalTasks}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Slide Carousel Container */}
      <div 
        className="relative w-full overflow-hidden"
        style={{ minHeight: '380px', height: todoListHeight ? `${Math.max(380, todoListHeight)}px` : undefined }}
      >
        <div 
          className="flex items-start transition-transform duration-300 ease-out w-full" 
          style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
        >
          {/* [STEP 1: Checklist Tugas Harian] */}
          <div className="w-full flex-shrink-0 relative z-10">
            {/* Container Daftar Tugas */}
            <div 
              ref={step1Ref}
              className="w-full bg-slate-50/60 border border-slate-100 rounded-2xl p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 shadow-inner"
            >
              {data.tasks.map((task: any) => (
                <div
                  key={task.masterTodoId}
                  onClick={() => handleToggleTask(task.masterTodoId, task.isCompleted)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleTask(task.masterTodoId, task.isCompleted);
                    }
                  }}
                  className={`group cursor-pointer w-full flex items-start gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-xl border transition-colors duration-150 select-none ${
                    task.isCompleted
                      ? 'bg-slate-100/70 border-slate-200/50 text-slate-400 shadow-none'
                      : 'bg-white hover:bg-teal-50/30 border border-slate-200/90 hover:border-[#389D9C]/50 shadow-xs text-slate-800'
                  }`}
                >
                  {/* Checkbox Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-hover:text-[#389D9C] transition-colors" />
                    )}
                  </div>

                  {/* Hierarki Informasi: Kategori -> Judul/Detail Tugas */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                    <span className={`text-xs sm:text-[13px] font-black tracking-wider uppercase ${
                      task.isCompleted ? 'text-slate-400' : 'text-[#389D9C]'
                    }`}>
                      {task.kategoriAktivitas}
                    </span>
                    <p className={`text-sm sm:text-[15px] leading-relaxed transition-colors ${
                      task.isCompleted
                        ? 'line-through text-slate-400 font-normal'
                        : 'text-slate-800 font-semibold'
                    }`}>
                      {task.tugasHarian}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* [STEP 2: Form Keluhan Harian] */}
          <div 
            className="w-full flex-shrink-0 relative z-10 h-full"
            style={{ height: todoListHeight ? `${todoListHeight}px` : undefined }}
          >
            {/* Kontainer Dalam Skrining */}
            <div 
              className="w-full h-full bg-slate-50/60 border border-slate-100 rounded-2xl p-3 sm:p-3.5 shadow-inner relative flex flex-col overflow-hidden"
              style={{ height: todoListHeight ? `${todoListHeight}px` : undefined }}
            >
              {/* Panduan Ramah */}
              <div className="pb-2.5 mb-1 px-1 border-b border-slate-200/60 relative z-30">
                <p className="text-xs sm:text-[13px] text-slate-500 font-medium">
                  Pilih kondisi fisik yang Bunda rasakan hari ini untuk disimpulkan bersama agenda harian.
                </p>
              </div>

              {/* Top Fade Gradient */}
              <div 
                className={`pointer-events-none absolute top-10 left-0 right-0 h-8 bg-gradient-to-b from-slate-50 to-transparent z-20 transition-opacity duration-200 ${
                  showScrollTopFade ? 'opacity-100' : 'opacity-0'
                }`} 
              />

              {/* Scrollable Symptoms List */}
              <div 
                ref={scrollContainerRef}
                onScroll={handleSymptomsScroll}
                className="w-full flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-1.5 space-y-2.5 pb-10 bumil-scrollbar overscroll-contain"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(100, 116, 139, 0.25) transparent'
                }}
              >
                {SYMPTOMS_LIST.map((symptom) => (
                  <div 
                    key={symptom.id} 
                    className="bg-white hover:bg-slate-50/60 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 space-y-2.5 shadow-xs transition-colors duration-150"
                  >
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug">
                        {symptom.name}
                      </span>
                      <span className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed">
                        {symptom.desc}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                      {['Tidak Ada', 'Ringan', 'Berat'].map((level) => {
                        const valueMap: Record<string, string> = {
                          'Tidak Ada': 'Tidak Ada',
                          'Ringan': 'Ringan / Sesekali',
                          'Berat': 'Berat / Sangat Mengganggu'
                        };
                        const actualVal = valueMap[level];
                        const isSelected = symptomsState[symptom.id] === actualVal;
                        
                        let activeStyle = '';
                        if (isSelected) {
                          if (level === 'Tidak Ada') activeStyle = 'bg-emerald-500 text-white font-extrabold border border-emerald-600 shadow-xs';
                          else if (level === 'Ringan') activeStyle = 'bg-amber-400 text-amber-950 font-extrabold border border-amber-500 shadow-xs';
                          else if (level === 'Berat') activeStyle = 'bg-rose-500 text-white font-extrabold border border-rose-600 shadow-xs';
                        } else {
                          activeStyle = 'bg-slate-100 hover:bg-slate-200/60 text-slate-600 border border-slate-200/60 font-extrabold';
                        }

                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSymptomsState({ ...symptomsState, [symptom.id]: actualVal })}
                            className={`py-2 sm:py-3 px-1 sm:px-2 text-[11px] sm:text-sm font-extrabold rounded-xl border text-center transition-colors duration-150 cursor-pointer ${activeStyle}`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Fade Gradient & Dynamic Scroll Indicator */}
              <div 
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent z-20 transition-opacity duration-200 rounded-b-2xl flex items-end justify-center pb-2 ${
                  showScrollBottomFade ? 'opacity-100' : 'opacity-0'
                }`} 
              >
                {showScrollBottomFade && (
                  <button
                    type="button"
                    onClick={() => {
                      scrollContainerRef.current?.scrollBy({ top: 140, behavior: 'smooth' });
                    }}
                    className="pointer-events-auto bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-extrabold px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs transition-all cursor-pointer select-none mb-0.5"
                    title="Klik untuk melihat keluhan di bawah"
                  >
                    <span>Scroll ke bawah</span>
                    <ChevronDown className="w-3.5 h-3.5 animate-bounce text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* [STEP 3: Evaluasi AI Gemini & Kesimpulan Terpadu] */}
          <div 
            className="w-full flex-shrink-0 relative z-10 h-full"
            style={{ height: todoListHeight ? `${todoListHeight}px` : undefined }}
          >
            <div className="w-full h-full bg-slate-50/60 border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-inner relative flex flex-col overflow-y-auto bumil-scrollbar">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#389D9C]" />
                  Kesimpulan & Evaluasi Terpadu AI
                </span>
                {isRedFlag ? (
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">
                    Perlu Konsultasi Dokter
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Kondisi Terpantau Stabil
                  </span>
                )}
              </div>

              {loadingAI ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-[#389D9C] rounded-full animate-spin"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Menganalisis data harian & keluhan fisik Bunda...</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Kami sedang merumuskan evaluasi terpadu untuk kondisi kesehatan Bunda hari ini.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* Kartu Rekomendasi Terpadu AI */}
                  <div className="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 border border-teal-200/70 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-xs text-left">
                    <div className="absolute top-3 right-3 opacity-15">
                      <Sparkles className="w-10 h-10 text-[#389D9C]" />
                    </div>
                    
                    <p className="text-xs font-bold text-[#389D9C] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#389D9C]" />
                      Rekomendasi Terpadu (Agenda Harian & Keluhan Fisik)
                    </p>
                    <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                      {aiAdvice}
                    </p>
                  </div>

                  {/* Kartu Status Evaluasi (Wajib Lapor Dokter vs Stabil) */}
                  {isRedFlag ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900 shadow-xs">
                      <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                          Peringatan Medis • Wajib Lapor Dokter
                        </p>
                        <p className="text-xs font-medium leading-relaxed text-red-600/90">
                          Terdapat keluhan fisik yang memerlukan evaluasi medis langsung dari dokter spesialis kandungan. Kami sangat menyarankan Bunda segera berkonsultasi melalui tombol di bawah.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 shadow-xs">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                          Kondisi Terpantau Stabil & Aman
                        </p>
                        <p className="text-xs font-medium leading-relaxed text-emerald-700/90">
                          Kondisi fisik Bunda terpantau stabil tanpa tanda bahaya. Tetap jaga pola makan bergizi, penuhi kebutuhan cairan, dan utamakan istirahat ya, Bun!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Static Footer Navigation Bar */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
        {/* Tombol Kembali di Sisi Kiri Bawah */}
        <div>
          {currentStep > 1 && (currentStep !== 3 || (!loadingAI && !isRedFlag)) && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3.5 sm:px-5 rounded-2xl font-bold flex items-center gap-1.5 transition-colors text-xs sm:text-sm shadow-xs cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              Kembali
            </button>
          )}
        </div>

        {/* Tombol Utama (Next / Kirim / Selesai) di Sisi Kanan Bawah */}
        <div>
          {currentStep === 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="bg-[#1A7775] hover:bg-[#145E5C] text-white py-2.5 sm:py-3 px-3.5 sm:px-6 rounded-2xl font-extrabold flex items-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-colors text-xs sm:text-sm cursor-pointer min-h-[44px]"
            >
              <span className="hidden xs:inline">Lanjut ke Skrining Keluhan</span>
              <span className="xs:hidden">Skrining Keluhan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleSendAnalysis}
              className="bg-[#1A7775] hover:bg-[#145E5C] text-white py-2.5 sm:py-3 px-3.5 sm:px-6 rounded-2xl font-extrabold flex items-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-colors text-xs sm:text-sm cursor-pointer min-h-[44px]"
            >
              <span className="hidden xs:inline">Kirim & Analisis Kondisi</span>
              <span className="xs:hidden">Analisis</span>
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          )}

          {currentStep === 3 && !loadingAI && (
            isRedFlag ? (
              <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleResetWizard}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 sm:py-3 px-3.5 sm:px-5 rounded-2xl font-bold transition-colors text-xs sm:text-sm cursor-pointer shadow-xs min-h-[44px]"
                >
                  Tutup
                </button>
                <a
                  href="/chat"
                  className="bg-red-500 hover:bg-red-600 text-white py-2.5 sm:py-3 px-3.5 sm:px-6 rounded-2xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-colors text-xs sm:text-sm text-center min-h-[44px]"
                >
                  <span>Hubungi Dokter</span>
                  <span className="hidden sm:inline">Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResetWizard}
                className="bg-[#1A7775] hover:bg-[#145E5C] text-white py-2.5 sm:py-3 px-5 sm:px-6 rounded-2xl font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-colors text-xs sm:text-sm cursor-pointer min-h-[44px]"
              >
                Selesai
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
