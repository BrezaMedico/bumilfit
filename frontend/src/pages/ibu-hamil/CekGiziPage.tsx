import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Upload, Sparkles, 
  CheckCircle2, Plus, Minus, 
  BookmarkCheck, Info, Flame, Target, Droplet, Wheat, Leaf,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { apiClient } from '../../lib/apiClient';

export const CekGiziPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // States untuk Kalkulator Gizi
  const [weeks, setWeeks] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [activity, setActivity] = useState<string>('light');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcError, setCalcError] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  // States untuk AI Scanner
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [portion, setPortion] = useState(1);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  // Perhitungan gizi makro berdasarkan porsi untuk AI Scanner
  const getCalculatedNutrition = () => {
    if (!aiResult?.nutrition) return null;
    const nut = aiResult.nutrition;
    return {
      kalori: Math.round(nut.kalori * portion),
      protein: Math.round(nut.protein * portion * 10) / 10,
      lemak: Math.round(nut.lemak * portion * 10) / 10,
      karbohidrat: Math.round(nut.karbohidrat * portion * 10) / 10,
      serat: Math.round(nut.serat * portion * 10) / 10,
    };
  };

  // Helper untuk mengubah File menjadi string Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handler untuk Kalkulator Gizi (Memanggil API Backend Proxy untuk Menu Rekomendasi AI)
  const handleCalculateGizi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeks || !weight || !height) return;

    setIsCalculating(true);
    setCalcError('');

    try {
      const response = await apiClient.post('/gizi/kalkulator', {
        weeks: parseInt(weeks),
        weight: parseFloat(weight),
        height: parseFloat(height),
        activity
      });

      setCalcResult(response.data);
    } catch (err: any) {
      console.error('Gagal menghitung gizi:', err);
      setCalcError(err.response?.data?.message || 'Gagal menghitung gizi. Silakan coba kembali.');

      // Fallback lokal jika server offline/bermasalah
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const wk = parseInt(weeks);
      const bmr = 655.1 + (9.563 * w) + (1.85 * h) - (4.676 * 28);
      
      let fa = 1.2;
      if (activity === 'light') fa = 1.375;
      else if (activity === 'moderate') fa = 1.55;
      else if (activity === 'active') fa = 1.725;

      const totalKalori = Math.round((bmr * fa) + (wk <= 12 ? 180 : 300));
      setCalcResult({
        kalori: totalKalori,
        protein: Math.round((totalKalori * 0.15) / 4),
        cairan: 2600,
        serat: 29,
        recommendations: [
          { name: "Bubur Kacang Hijau & Telur Rebus", benefit: "Kaya Asam Folat dan zat besi untuk mencegah cacat tabung saraf janin." },
          { name: "Salad Alpukat & Bayam", benefit: "Lemak sehat alpukat mendukung perkembangan awal otak janin." },
          { name: "Sup Ayam Jahe Hangat", benefit: "Membantu meredakan mual muntah (morning sickness) di trimester pertama." }
        ]
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handler Input File Makanan
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setScanComplete(false);
      setAiResult(null);
      setApiError('');
    }
  };

  // Handler Pemicu Scan Gizi AI (Memanggil Backend Proxy agar aman dari HTTP 404 & API key exposure)
  const handleStartScan = async () => {
    if (!selectedImage) {
      setApiError('Silakan ambil foto atau unggah gambar makanan terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setApiError('');
    setIsSaved(false);

    try {
      const base64Data = await fileToBase64(selectedImage);
      
      // Memanggil endpoint backend proxy Express
      const response = await apiClient.post('/gizi/scan', {
        image: base64Data,
        mimeType: selectedImage.type
      });

      setAiResult(response.data);
      setScanComplete(true);
    } catch (err: any) {
      console.error('Error memanggil API Gizi Scanner:', err);
      setApiError(err.response?.data?.message || 'Gagal memproses gambar. Pastikan gambar jelas dan coba kembali.');
    } finally {
      setIsScanning(false);
    }
  };

  // Simpan hasil pemindaian ke log makanan
  const handleSaveToLog = () => {
    const nutrition = getCalculatedNutrition();
    if (!aiResult || !nutrition) return;

    setIsSaved(true);
    const foodLog = JSON.parse(localStorage.getItem('food_log') || '[]');
    foodLog.push({
      id: Date.now(),
      tanggal: new Date().toISOString(),
      namaMakanan: aiResult.foodName,
      porsi: portion,
      nutrition
    });
    localStorage.setItem('food_log', JSON.stringify(foodLog));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-6xl mx-auto mt-6 space-y-6 text-[#1E293B] text-left animate-in fade-in duration-500">
      
      {/* HEADER HALAMAN */}
      <div className="flex items-center gap-3.5">
        <button 
          onClick={() => navigate('/')} 
          className="text-[#0D5C75] hover:bg-teal-50/50 p-2.5 rounded-2xl border border-teal-100/50 transition-colors bg-white shadow-3xs cursor-pointer"
          aria-label="Kembali ke Dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pantau Nutrisi Kehamilan
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
            Kalkulator & Pemeriksaan Gizi Ibu Hamil
          </h1>
        </div>
      </div>

      {/* GRID UTAMA (2 Kolom di Desktop, Stacked di Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* ====================================================
            KOLOM KIRI: KALKULATOR KEBUTUHAN GIZI MEDIS 
            ==================================================== */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Flame className="text-[#0D5C75]" size={22} />
            <h2 className="text-lg font-extrabold text-slate-900">
              Kalkulator Kebutuhan Gizi
            </h2>
          </div>

          <form onSubmit={handleCalculateGizi} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Usia Kehamilan (Minggu)
              </label>
              <input 
                type="number" 
                required
                min="1"
                max="42"
                placeholder="Masukkan usia kehamilan dalam minggu"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                className="w-full bg-[#F1F5F9] rounded-xl border-transparent focus:border-[#0D5C75] focus:bg-white focus:ring-1 focus:ring-[#0D5C75] p-3.5 text-sm transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Berat Badan (kg)
                </label>
                <input 
                  type="number" 
                  required
                  min="20"
                  max="200"
                  placeholder="Contoh: 60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#F1F5F9] rounded-xl border-transparent focus:border-[#0D5C75] focus:bg-white focus:ring-1 focus:ring-[#0D5C75] p-3.5 text-sm transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tinggi Badan (cm)
                </label>
                <input 
                  type="number" 
                  required
                  min="100"
                  max="250"
                  placeholder="Contoh: 160"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-[#F1F5F9] rounded-xl border-transparent focus:border-[#0D5C75] focus:bg-white focus:ring-1 focus:ring-[#0D5C75] p-3.5 text-sm transition-all outline-none"
                />
              </div>
            </div>

            {/* Dropdown Aktivitas Fisik */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Aktivitas Fisik Harian
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full bg-[#F1F5F9] rounded-xl border-transparent focus:border-[#0D5C75] focus:bg-white focus:ring-1 focus:ring-[#0D5C75] p-3.5 text-sm transition-all outline-none cursor-pointer"
              >
                <option value="sedentary">🪑 Lebih banyak duduk (istirahat total/bedrest)</option>
                <option value="light">🚶 Aktif ringan (pekerjaan rumah ringan/jalan santai)</option>
                <option value="moderate">🚶‍♀️ Aktif sedang (banyak berjalan, olahraga ringan-sedang)</option>
                <option value="active">🏃 Aktif tinggi (olahraga intens/pekerjaan fisik berat)</option>
              </select>
            </div>

            <Button 
              type="submit" 
              disabled={isCalculating}
              className="w-full bg-[#0D5C75] hover:bg-[#0A495C] text-white py-5 rounded-xl font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {isCalculating ? 'Menghitung Rekomendasi AI...' : 'Hitung Kebutuhan Gizi'}
            </Button>
          </form>

          {/* Error Kalkulator */}
          {calcError && (
            <div className="bg-red-50 border border-red-200 text-red-750 text-xs p-3.5 rounded-xl flex gap-2 items-start">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{calcError}</span>
            </div>
          )}

          {/* HASIL KALKULATOR GIZI */}
          {calcResult && (
            <div className="space-y-5 pt-4 border-t border-slate-100 animate-in fade-in duration-305 text-left">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Kebutuhan Harian Anda
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* KALORI */}
                <div className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wide uppercase">KALORI</span>
                  <span className="text-base font-black text-slate-800 block">
                    {calcResult.kalori} <span className="text-xs font-normal text-slate-455">kkal</span>
                  </span>
                </div>
                {/* PROTEIN */}
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wide uppercase">PROTEIN</span>
                  <span className="text-base font-black text-slate-800 block">
                    {calcResult.protein} <span className="text-xs font-normal text-slate-455">g</span>
                  </span>
                </div>
                {/* CAIRAN */}
                <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wide uppercase">AIR</span>
                  <span className="text-base font-black text-slate-800 block">
                    {(calcResult.cairan / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-455">L</span>
                  </span>
                </div>
                {/* SERAT */}
                <div className="bg-teal-50/50 border border-teal-100/50 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wide uppercase">SERAT</span>
                  <span className="text-base font-black text-slate-800 block">
                    {calcResult.serat} <span className="text-xs font-normal text-slate-455">g</span>
                  </span>
                </div>
              </div>

              {/* REKOMENDASI MAKANAN */}
              <div className="bg-teal-50/30 border border-teal-100/50 rounded-2xl p-5 space-y-3.5">
                <h4 className="font-extrabold text-[#0D5C75] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Menu Rekomendasi (Berdasarkan Google Gemini AI)
                </h4>
                <div className="space-y-3">
                  {calcResult.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-[#0D5C75]/10 text-[#0D5C75] flex items-center justify-center font-bold text-xs mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{rec.name}</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{rec.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================
            KOLOM KANAN: PEMERIKSAAN GIZI MAKANAN (AI SCANNER)
            ==================================================== */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Camera className="text-[#0D5C75]" size={22} />
            <h2 className="text-lg font-extrabold text-slate-900">
              Pemeriksaan Gizi Makanan (AI Scanner)
            </h2>
          </div>

          {/* Viewfinder Bingkai Kamera */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full max-w-[340px] aspect-[4/3] bg-slate-950 rounded-3xl border-[6px] border-slate-900 shadow-md overflow-hidden flex items-center justify-center">
              
              {/* Notifikasi Kamera */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-3.5 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950/80 mr-1" />
                <div className="w-1 h-1 rounded-full bg-[#111] border border-blue-900/30" />
              </div>

              {/* Image Preview / Icon Camera */}
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview Makanan" 
                  className="w-full h-full object-cover z-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2.5 text-slate-500 z-10 p-4">
                  <Camera size={44} className="text-[#0D5C75]/60 stroke-[1.5]" />
                  <p className="text-xs text-slate-400 max-w-[200px] text-center leading-relaxed">
                    Ambil foto atau unggah gambar makanan/minuman untuk pemeriksaan gizi otomatis.
                  </p>
                </div>
              )}

              {/* Viewfinder Corners (L Siku) */}
              {!scanComplete && (
                <div className="absolute inset-6 border border-white/20 rounded-2xl z-10 pointer-events-none">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-[#0D5C75] rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-[#0D5C75] rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-[#0D5C75] rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-[#0D5C75] rounded-br-md" />
                </div>
              )}

              {/* Laser Scanning Animation */}
              {isScanning && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-[#0D5C75] shadow-[0_0_15px_rgba(13,92,117,0.9)] absolute top-0 animate-scan" />
                </div>
              )}

              {/* Pill Status */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-20 flex items-center gap-1.5">
                {isScanning ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                    AI Menganalisis Nutrisi...
                  </>
                ) : scanComplete ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Analisis Selesai
                  </>
                ) : (
                  <>
                    <Info size={12} className="text-[#0D5C75]" />
                    Siap Memindai Foto
                  </>
                )}
              </div>
            </div>

            {/* Tombol Aksi Input (Hidden inputs + buttons) */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={cameraInputRef} 
              onChange={handleImageChange} 
            />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
            />

            <div className="w-full max-w-[340px] flex gap-3">
              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#0D5C75] font-bold text-xs py-3.5 rounded-xl transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera size={14} />
                Buka Kamera
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#0D5C75] font-bold text-xs py-3.5 rounded-xl transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} />
                Unggah Gambar
              </button>
            </div>

            {/* Pemicu Proses AI Scanner */}
            {selectedImage && !scanComplete && (
              <Button 
                onClick={handleStartScan} 
                disabled={isScanning}
                className="w-full max-w-[340px] bg-[#0D5C75] hover:bg-[#0A495C] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isScanning ? 'Memproses Gizi AI...' : 'Mulai Analisis Makanan'}
              </Button>
            )}

            {/* Error Message */}
            {apiError && (
              <div className="w-full max-w-[340px] bg-red-50 border border-red-200 text-red-750 text-xs p-3.5 rounded-xl flex gap-2 items-start mt-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}
          </div>

          {/* HASIL PEMINDAIAN GEMINI AI */}
          {scanComplete && aiResult && !isScanning && (
            <div className="space-y-5 pt-4 border-t border-slate-100 animate-in fade-in duration-505 text-left">
              
              {/* Kontrol Porsi Makanan */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                    Nama Makanan
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
                    {aiResult.foodName}
                  </h3>
                </div>

                <div className="bg-[#F1F8F6] border border-[#0D5C75]/10 rounded-xl p-1 flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => setPortion(Math.max(0.5, portion - 0.5))}
                    className="w-6.5 h-6.5 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-[#0D5C75] transition-colors border border-slate-100 shadow-3xs cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-black text-[#0D5C75] w-12 text-center">
                    {portion} Porsi
                  </span>
                  <button 
                    onClick={() => setPortion(portion + 0.5)}
                    className="w-6.5 h-6.5 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-[#0D5C75] transition-colors border border-slate-100 shadow-3xs cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Grid Nutrisi Makanan */}
              {(() => {
                const nut = getCalculatedNutrition();
                if (!nut) return null;
                return (
                  <div className="grid grid-cols-5 gap-2.5">
                    <div className="bg-orange-50/50 border border-orange-100/50 rounded-xl p-2.5 flex flex-col justify-between h-20">
                      <div className="w-5.5 h-5.5 rounded-lg bg-orange-100/60 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <Flame size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{nut.kalori}</span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wide uppercase">KALORI</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2.5 flex flex-col justify-between h-20">
                      <div className="w-5.5 h-5.5 rounded-lg bg-emerald-100/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Target size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{nut.protein}g</span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wide uppercase">PROTEIN</span>
                      </div>
                    </div>
                    <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-2.5 flex flex-col justify-between h-20">
                      <div className="w-5.5 h-5.5 rounded-lg bg-red-100/60 text-red-650 flex items-center justify-center flex-shrink-0">
                        <Droplet size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{nut.lemak}g</span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wide uppercase">LEMAK</span>
                      </div>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-2.5 flex flex-col justify-between h-20">
                      <div className="w-5.5 h-5.5 rounded-lg bg-blue-100/60 text-blue-650 flex items-center justify-center flex-shrink-0">
                        <Wheat size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{nut.karbohidrat}g</span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wide uppercase">KARBO</span>
                      </div>
                    </div>
                    <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-2.5 flex flex-col justify-between h-20">
                      <div className="w-5.5 h-5.5 rounded-lg bg-teal-100/60 text-teal-650 flex items-center justify-center flex-shrink-0">
                        <Leaf size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{nut.serat}g</span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wide uppercase">SERAT</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Status Keamanan & Rekomendasi Bumil */}
              <div className="bg-[#F1F8F6] border border-[#0D5C75]/15 rounded-2xl p-5 space-y-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-[#0D5C75]/10 pb-2">
                  <h4 className="font-extrabold text-[#0D5C75] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#0D5C75]" />
                    Analisis Keamanan Kehamilan
                  </h4>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-3xs ${
                    aiResult.safeForPregnancy 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
                      : 'bg-red-50 text-red-750 border border-red-250'
                  }`}>
                    {aiResult.safeForPregnancy ? '✓ Aman' : '⚠ Batasi / Hindari'}
                  </span>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed font-medium">
                  {aiResult.recommendation}
                </p>

                {/* Tombol Simpan Jurnal */}
                <div className="pt-2">
                  <Button 
                    onClick={handleSaveToLog}
                    disabled={isSaved}
                    className={`w-full py-4.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-3xs cursor-pointer ${
                      isSaved 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-500' 
                        : 'bg-[#0D5C75] hover:bg-[#0A495C] text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle2 size={14} />
                        Tersimpan di Jurnal Makanan
                      </>
                    ) : (
                      <>
                        <BookmarkCheck size={14} />
                        Simpan ke Jurnal Harian
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Style laser scan */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          animation: scan 2.5s infinite linear;
        }
      `}</style>

    </div>
  );
};
