import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check
} from 'lucide-react';
import { skriningQuestions, calculateRisk } from '../../data/skriningData';
import { Button } from '../../components/ui/button';
import { apiClient } from '../../lib/apiClient';

export const SkriningAwalPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQuestion = skriningQuestions[currentStep];
  const totalQuestions = skriningQuestions.length;

  const handleSelectOption = (score: number) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: score
    });
  };

  const handleSaveResult = async () => {
    try {
      const totalScore = Object.values(answers).reduce((acc, curr) => acc + curr, 0);
      const result = calculateRisk(totalScore);
      
      // Mengambil data profil untuk mendapatkan User ID yang unik agar terhindar dari state leakage
      const profileResponse = await apiClient.get('/auth/profile');
      const userId = profileResponse.data.profilIbu?.userId || profileResponse.data.id;
      
      // Menyimpan hasil skrining di localStorage terisolasi per akun
      localStorage.setItem(`skrining_selesai_${userId}`, 'true');
      localStorage.setItem(`skrining_score_${userId}`, totalScore.toString());
      localStorage.setItem(`skrining_risiko_${userId}`, result.category);
      
      // Menyimpan ke key umum untuk fallback & kompatibilitas
      localStorage.setItem('skrining_selesai', 'true');
      localStorage.setItem('skrining_risiko', result.category);

      // Integrasi opsional ke backend (jika endpoint update profil didukung)
      try {
        await apiClient.put('/auth/profile', {
          sudahSkrining: true,
          skorSkrining: totalScore,
          kategoriSkrining: result.category
        });
      } catch (backendErr) {
        console.warn('Backend update profil untuk skrining opsional/belum terintegrasi:', backendErr);
      }

      // Langsung diarahkan ke halaman utama/dashboard tanpa perantara
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Gagal memproses hasil skrining:', err);
      // Fallback ke penyimpanan lokal standar jika API profil offline/gagal
      const totalScore = Object.values(answers).reduce((acc, curr) => acc + curr, 0);
      const result = calculateRisk(totalScore);
      localStorage.setItem('skrining_selesai', 'true');
      localStorage.setItem('skrining_risiko', result.category);
      navigate('/', { replace: true });
    }
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSaveResult();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectedScore = answers[currentQuestion?.id];
  const progressPercentage = ((currentStep + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F9] via-[#F0FAFA] to-[#FFF6F6] flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
      
      {/* Header Wizard (Progress & Step) */}
      <header className="max-w-3xl mx-auto w-full pt-4 md:pt-8 text-center space-y-4">
        <div className="flex items-center justify-between text-slate-400 px-1">
          <span className="text-xs sm:text-sm font-extrabold text-[#389D9C] tracking-widest uppercase">Skrining Awal Kehamilan</span>
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            Pertanyaan <strong className="text-[#194668] font-black">{currentStep + 1}</strong> dari <strong className="text-slate-500 font-bold">{totalQuestions}</strong>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2.5 bg-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#75D5D4] to-[#389D9C] rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Wizard Content (Question & Answer Cards) */}
      <main className="max-w-3xl mx-auto w-full my-auto py-8 sm:py-12 flex flex-col justify-center flex-1">
        <div 
          key={currentQuestion.id} 
          className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500"
        >
          {/* Parameter & Question Text */}
          <div className="text-center space-y-3 px-2">
            <span className="text-xs font-bold tracking-widest text-[#389D9C] uppercase bg-[#389D9C]/5 px-3.5 py-1.5 rounded-full inline-block">
              {currentQuestion.parameter}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#194668] tracking-tight leading-snug">
              {currentQuestion.questionText}
            </h1>
          </div>

          {/* Cards Selection */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 px-1">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedScore === option.score;
              const cardSelectedStyle = 'border-[#389D9C] bg-[#FFF9F9] shadow-[0_15px_30px_rgba(56,157,156,0.08)]';

              return (
                <button
                  key={option.level}
                  onClick={() => handleSelectOption(option.score)}
                  className={`relative text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 ease-out cursor-pointer flex gap-4 sm:gap-5 items-center select-none outline-none group hover:scale-[1.01] ${
                    isSelected 
                      ? `${cardSelectedStyle} border-2`
                      : 'border-slate-200/80 bg-white hover:border-slate-350 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_20px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {/* Option Bullet / Radio Circle */}
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-[#75D5D4] to-[#389D9C] border-transparent text-white scale-110'
                      : 'border-slate-300 text-transparent bg-slate-50 group-hover:border-slate-450'
                  }`}>
                    <Check size={14} strokeWidth={3} />
                  </div>

                  {/* Option Content: Tampil bersih bebas dari bias tingkat risiko/poin */}
                  <div className="flex-1 pr-2">
                    <p className={`text-sm sm:text-base font-semibold leading-relaxed transition-colors ${
                      isSelected ? 'text-[#194668]' : 'text-slate-650'
                    }`}>
                      {option.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="max-w-3xl mx-auto w-full pb-4 md:pb-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 px-1">
        {/* Tombol Kembali */}
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 text-sm font-bold transition-all px-5 py-3 rounded-full cursor-pointer border ${
            currentStep === 0
              ? 'border-transparent text-slate-300 cursor-not-allowed opacity-0'
              : 'border-slate-200 text-slate-550 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Kembali
        </button>

        {/* Tombol Lanjut */}
        <Button
          onClick={handleNext}
          disabled={!selectedScore}
          className={`px-8 py-3.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 group cursor-pointer ${
            selectedScore 
              ? 'bg-[#389D9C] hover:bg-[#2C8584] text-white' 
              : 'bg-slate-250 text-slate-400 cursor-not-allowed border border-slate-100 shadow-none'
          }`}
        >
          {currentStep === totalQuestions - 1 ? 'Kirim Jawaban' : 'Lanjut'}
          <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
            selectedScore ? 'group-hover:translate-x-1' : ''
          }`} />
        </Button>
      </footer>
    </div>
  );
};
