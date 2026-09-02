import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, Trophy, ArrowRight, ArrowLeft, Activity, ShieldAlert, CheckCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

const CATEGORY_COLORS: Record<string, string> = {
  'Nutrisi & Hidrasi': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Vitamin & Obat': 'bg-blue-50 text-blue-700 border-blue-100',
  'Aktivitas & Istirahat': 'bg-amber-50 text-amber-700 border-amber-100',
  'Higienitas & Self-Care': 'bg-rose-50 text-rose-700 border-rose-100',
  'Persiapan Praktis': 'bg-purple-50 text-purple-700 border-purple-100'
};

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

export const TodoListCard = ({ userId }: TodoListCardProps) => {
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

  // AI Recommendation State
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isRedFlag, setIsRedFlag] = useState<boolean>(false);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

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
    if (currentlyCompleted) return;
    try {
      await apiClient.post('/todo/complete', { masterTodoId });
      await fetchDailyTodos();
    } catch (err) {
      console.error("Gagal menandai tugas selesai:", err);
    }
  };

  const handleSendAnalysis = async () => {
    setLoadingAI(true);
    setCurrentStep(3); // Slide ke step 3
    
    try {
      const formattedSymptoms = SYMPTOMS_LIST.map(sym => ({
        name: sym.name,
        severity: symptomsState[sym.id]
      }));

      const completedTasksText = data?.tasks
        .filter((t: any) => t.isCompleted)
        .map((t: any) => t.tugasHarian) || [];

      const response = await apiClient.post('/todo/evaluate', {
        completedTasks: completedTasksText,
        symptoms: formattedSymptoms
      });

      setAiAdvice(response.data.data.advice);
      setIsRedFlag(response.data.data.isRedFlag);
    } catch (err) {
      console.error("Gagal mengirim analisis AI:", err);
      setAiAdvice("Maaf, gagal memproses saran kesehatan Bunda saat ini. Pastikan jaringan internet Anda stabil.");
      const hasLocalHeavy = Object.values(symptomsState).some(val => val.includes('Berat'));
      setIsRedFlag(hasLocalHeavy);
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

  // Cek apakah seluruh 5 tugas telah diselesaikan
  const isAllTasksCompleted = data?.tasks?.length > 0 && data.tasks.every((t: any) => t.isCompleted);

  return (
    <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] text-left overflow-hidden relative">
      
      {/* Header Panel (UI Cleanup: Badges dan Metadata ditiadakan) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <span className="text-slate-400 text-xs font-bold px-3 py-1 rounded-full bg-slate-100">
            Langkah {currentStep} dari 3
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#194668] mt-2">
            Buku Harian Kesehatan Bunda
          </h3>
        </div>

        {/* Circular Progress (Disesuaikan dengan viewBox & padding utuh agar tidak terpotong) */}
        {currentStep === 1 && (
          <div className="flex items-center gap-4 self-start md:self-center">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TUGAS HARI INI</p>
              <p className="text-lg font-black text-[#194668]">{data.progress.percentage}% Selesai</p>
            </div>
            <div className="relative w-14 h-14 flex items-center justify-center p-0.5">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="21" className="stroke-slate-100" strokeWidth="4.5" fill="transparent" />
                <circle cx="24" cy="24" r="21" className="stroke-[#389D9C] transition-all duration-500 ease-out" 
                        strokeWidth="4.5" fill="transparent"
                        strokeDasharray={2 * Math.PI * 21}
                        strokeDashoffset={2 * Math.PI * 21 * (1 - data.progress.percentage / 100)} />
              </svg>
              <span className="absolute text-xs font-black text-[#389D9C]">
                {data.progress.completedTasks}/{data.progress.totalTasks}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Slide Carousel Container */}
      <div className="relative w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out" 
          style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
        >
          {/* [STEP 1: Checklist Tugas Harian - Simpler UI] */}
          <div className="w-full flex-shrink-0 space-y-4 pr-2">
            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto pr-1">
              {data.tasks.map((task: any) => (
                <button
                  key={task.masterTodoId}
                  onClick={() => handleToggleTask(task.masterTodoId, task.isCompleted)}
                  disabled={task.isCompleted}
                  className={`w-full flex items-center gap-3 py-3 text-left transition-all ${
                    task.isCompleted ? 'opacity-50 cursor-default' : 'hover:bg-slate-50/50 px-2 rounded-xl'
                  }`}
                >
                  <span className="flex-shrink-0">
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#389D9C]" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-[#389D9C]" />
                    )}
                  </span>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className={`text-xs sm:text-sm leading-relaxed ${task.isCompleted ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-700'}`}>
                      {task.tugasHarian}
                    </p>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0 w-fit ${
                      CATEGORY_COLORS[task.kategoriAktivitas] || 'bg-slate-50 text-slate-600'
                    }`}>
                      {task.kategoriAktivitas}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* [STEP 2: Form Keluhan Harian] */}
          <div className="w-full flex-shrink-0 space-y-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#194668] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500" />
                Skrining Keluhan Fisik
              </span>
            </div>

            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
              {SYMPTOMS_LIST.map((symptom) => (
                <div key={symptom.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-[#194668]">{symptom.name}</span>
                    <span className="text-[10px] text-slate-400">{symptom.desc}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
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
                        if (level === 'Tidak Ada') activeStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-sm';
                        else if (level === 'Ringan') activeStyle = 'bg-amber-500 text-white border-amber-500 shadow-sm';
                        else if (level === 'Berat') activeStyle = 'bg-rose-500 text-white border-rose-500 shadow-sm';
                      } else {
                        activeStyle = 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/50';
                      }

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSymptomsState({ ...symptomsState, [symptom.id]: actualVal })}
                          className={`py-2 px-1 text-[10px] font-bold rounded-xl border text-center transition-all ${activeStyle}`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* [STEP 3: Evaluasi AI Gemini & Kesimpulan] */}
          <div className="w-full flex-shrink-0 space-y-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#194668] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#389D9C]" />
                Kesimpulan & Evaluasi AI
              </span>
            </div>

            {loadingAI ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-[#389D9C] rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#194668]">Menganalisis kondisi Bunda...</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Kami sedang menghubungi Google Gemini AI untuk merumuskan rekomendasi praktis.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gradient-to-br from-teal-50/30 to-emerald-50/10 border border-teal-100/70 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-15">
                    <Sparkles className="w-10 h-10 text-[#389D9C]" />
                  </div>
                  
                  <p className="text-xs font-bold text-[#389D9C] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Rekomendasi Medis BumilFit
                  </p>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                    {aiAdvice}
                  </p>
                </div>

                {isRedFlag ? (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-900">
                    <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-red-700">Peringatan Medis</p>
                      <p className="text-xs font-medium mt-1 leading-relaxed">
                        Kami mendeteksi terdapat keluhan berstatus <strong>Berat / Sangat Mengganggu</strong>. Sangat disarankan untuk segera menghubungi dokter guna berkonsultasi secara profesional.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-900">
                    <CheckCircle className="w-5 h-5 text-[#389D9C] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Kondisi Stabil</p>
                      <p className="text-xs font-medium mt-1 leading-relaxed">
                        Keluhan Bunda hari ini terpantau ringan atau tidak ada. Tetap terapkan pola hidup sehat dan cukup istirahat ya, Bun!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Static Footer Navigation Bar (Tombol navigasi diletakkan di luar slider agar posisinya tetap/statis) */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
        {/* Tombol Kembali di Sisi Kiri Bawah */}
        <div>
          {currentStep > 1 && (currentStep !== 3 || (!loadingAI && !isRedFlag)) && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="border border-slate-200 text-slate-500 py-2.5 px-5 rounded-2xl font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all text-sm"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              Kembali
            </button>
          )}
        </div>

        {/* Tombol Utama (Next / Kirim / Selesai) di Sisi Kanan Bawah */}
        <div>
          {currentStep === 1 && (
            <button
              type="button"
              onClick={() => isAllTasksCompleted && setCurrentStep(2)}
              disabled={!isAllTasksCompleted}
              className={`py-3 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all text-sm ${
                isAllTasksCompleted
                  ? 'bg-[#389D9C] hover:bg-[#2C7E7D] text-white shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              Lanjut ke Skrining Keluhan
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleSendAnalysis}
              className="bg-[#389D9C] hover:bg-[#2C7E7D] text-white py-3 px-6 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all text-sm"
            >
              Kirim & Analisis Kondisi
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && !loadingAI && (
            isRedFlag ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetWizard}
                  className="border border-slate-200 text-slate-500 py-3 px-5 rounded-2xl font-bold hover:bg-slate-50 transition-all text-xs sm:text-sm"
                >
                  Tutup
                </button>
                <a
                  href="/dokter"
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-5 sm:px-6 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all text-xs sm:text-sm animate-pulse text-center"
                >
                  Hubungi Dokter Sekarang
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResetWizard}
                className="bg-[#389D9C] hover:bg-[#2C7E7D] text-white py-3 px-6 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all text-sm"
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
