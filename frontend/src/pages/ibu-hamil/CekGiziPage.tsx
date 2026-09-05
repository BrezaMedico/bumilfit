import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Upload, Sparkles, 
  CheckCircle2, Plus, Minus, 
  BookmarkCheck, Flame, Lock, Crown, X,
  AlertTriangle, Loader2, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { apiClient } from '../../lib/apiClient';
import { useSubscription } from '../../context/SubscriptionContext';
import { CustomDropdown } from '../../components/ui/CustomDropdown';

export const CekGiziPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // States untuk Kalkulator Gizi
  const [weeks, setWeeks] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [activity, setActivity] = useState<string>('light');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcError, setCalcError] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  // States untuk AI Scanner & Kamera
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [portion, setPortion] = useState(1);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Tampilan Hasil Terpadu: 'calc' | 'camera' | null
  const [activeResultView, setActiveResultView] = useState<'calc' | 'camera' | null>(null);

  // Status langganan
  const { canAccessCameraScan } = useSubscription();

  // Bersihkan stream kamera saat unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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

  // Handler Kamera Asli (getUserMedia)
  const startCamera = async () => {
    if (!canAccessCameraScan) {
      navigate('/pricing');
      return;
    }

    setApiError('');
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback jika facingMode environment tidak tersedia (misal di PC / webcam)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setImagePreview(null);
      setSelectedImage(null);

      // Pastikan video element terhubung
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }
      }, 100);
    } catch (err: any) {
      console.error('Kamera gagal diakses:', err);
      setApiError('Tidak dapat membuka kamera. Pastikan izin kamera telah diizinkan pada browser Anda.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `food_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedImage(file);
        }
      }, 'image/jpeg', 0.9);

      stopCamera();
    }
  };

  // Handler Input File Gambar Manual
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setScanComplete(false);
      setAiResult(null);
      setApiError('');
      stopCamera();
    }
  };

  const handleUploadClick = () => {
    if (!canAccessCameraScan) {
      navigate('/pricing');
      return;
    }
    fileInputRef.current?.click();
  };

  // Handler Kalkulator Gizi Medis
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
        activity,
      });

      setCalcResult(response.data);
      setActiveResultView('calc');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.warn('Gagal menghubungi backend kalkulator gizi, beralih ke kalkulasi lokal medis:', err);

      // Fallback lokal jika backend offline
      try {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const wk = parseInt(weeks);
        const bmr = 655.1 + (9.563 * w) + (1.85 * h) - (4.676 * 28);
        
        let fa = 1.2;
        if (activity === 'light') fa = 1.375;
        else if (activity === 'moderate') fa = 1.55;
        else if (activity === 'active') fa = 1.725;

        const totalKalori = Math.round((bmr * fa) + (wk <= 12 ? 180 : 300));
        const fallback = {
          kalori: totalKalori,
          protein: Math.round((totalKalori * 0.15) / 4),
          cairan: wk <= 12 ? 2400 : wk <= 28 ? 2600 : 2800,
          serat: 29,
          recommendations: [
            { 
              name: 'Bubur Kacang Hijau Santan Encer & Telur Rebus',
              mealTime: 'Sarapan',
              protein: '• 1 Butir Telur Rebus (~6g protein)\n• Bubur Kacang Hijau 1 mangkuk (~8g protein)\n• Total Estimasi: ~14g protein',
              nutrients: '• Asam Folat (pencegah kelainan saraf janin)\n• Zat Besi & Serat Alami',
              benefit: 'Kaya Asam Folat dan zat besi untuk mencegah cacat tabung saraf janin pada awal kehamilan.' 
            },
            { 
              name: 'Sup Ayam Jahe Hangat dengan Wortel & Labu',
              mealTime: 'Makan Siang',
              protein: '• Dada Ayam Kampung 80g (~22g protein)\n• Tahu Sutra Halus (~6g protein)\n• Total Estimasi: ~28g protein',
              nutrients: '• Protein Hewani Mudah Cerna\n• Gingerol Alami Pereda Mual\n• Vitamin A & Beta Karoten',
              benefit: 'Jahe alami meredakan morning sickness serta protein ayam mendukung pembentukan sel janin.' 
            },
            { 
              name: 'Pepes Ikan Mas & Sayur Bening Bayam',
              mealTime: 'Makan Malam',
              protein: '• Ikan Mas Bumbu Kuning (~20g protein)\n• Tempe Kukus 1 potong (~5g protein)\n• Total Estimasi: ~25g protein',
              nutrients: '• Karbohidrat Kompleks Nasi Merah\n• Omega-3 & Zat Besi',
              benefit: 'Mendukung suplai oksigen dan kestabilan energi bagi Bunda dan buah hati.' 
            },
          ],
        };
        setCalcResult(fallback);
        setCalcError('');
        setActiveResultView('calc');
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } catch (calcFallbackErr) {
        setCalcError('Gagal menghitung gizi. Pastikan data yang dimasukkan sudah benar dan coba kembali.');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Handler Pemicu Scan Gizi AI
  const handleStartScan = async () => {
    if (!canAccessCameraScan) {
      navigate('/pricing');
      return;
    }

    if (!selectedImage) {
      setApiError('Silakan ambil foto atau unggah gambar makanan terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setApiError('');
    setIsSaved(false);

    try {
      const base64Data = await fileToBase64(selectedImage);
      
      const response = await apiClient.post('/gizi/scan', {
        image: base64Data,
        mimeType: selectedImage.type || 'image/jpeg',
      });

      setAiResult(response.data);
      setScanComplete(true);
      setActiveResultView('camera');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.error('Error memanggil API Gizi Scanner:', err);
      if (err.response?.status === 403) {
        navigate('/pricing');
        return;
      }
      setApiError(err.response?.data?.message || 'Gagal memproses gambar. Pastikan foto makanan terlihat jelas dan coba kembali.');
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
      nutrition,
    });
    localStorage.setItem('food_log', JSON.stringify(foodLog));
  };

  // Helper pemformat teks poin-poin (Protein, Nutrisi Kunci, dll) agar mudah dibaca
  const renderFormattedList = (
    content: string | string[], 
    colorType: 'protein' | 'nutrients' | 'benefit' = 'protein'
  ) => {
    if (!content) return null;
    let items: string[] = [];

    if (Array.isArray(content)) {
      items = content.map(c => String(c).trim()).filter(Boolean);
    } else if (typeof content === 'string') {
      if (content.includes('\n')) {
        items = content.split('\n').map(s => s.trim()).filter(Boolean);
      } else if (content.includes('•')) {
        items = content.split('•').map(s => s.trim()).filter(Boolean);
      } else if (content.includes(' - ')) {
        items = content.split(' - ').map(s => s.trim()).filter(Boolean);
      } else if (content.includes(' & ')) {
        items = content.split(' & ').map(s => s.trim()).filter(Boolean);
      } else {
        items = [content];
      }
    }

    const bulletColor = 
      colorType === 'protein' ? 'text-amber-500' : 
      colorType === 'nutrients' ? 'text-teal-600' : 'text-slate-400';

    return (
      <div className="space-y-1.5 mt-1.5 pl-0.5">
        {items.map((item, i) => {
          const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
          if (!cleanItem) return null;
          return (
            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 leading-snug">
              <span className={`${bulletColor} font-black text-xs shrink-0 select-none mt-0.5`}>•</span>
              <span className={colorType === 'protein' ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}>
                {cleanItem}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24 mobile-bottom-pad max-w-6xl mx-auto mt-6 space-y-8 text-[#1E293B] text-left animate-in fade-in duration-500">
      
      {/* HEADER HALAMAN */}
      <div className="flex items-center gap-3.5">
        <button 
          onClick={() => navigate('/')} 
          className="text-[#194668] hover:bg-teal-50/50 p-2.5 rounded-2xl border border-slate-200 transition-colors bg-white shadow-3xs cursor-pointer"
          aria-label="Kembali ke Dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pantau Nutrisi Kehamilan
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#194668] mt-0.5 leading-tight sm:leading-none">
            Kalkulator & Pemeriksaan Gizi Ibu Hamil
          </h1>
        </div>
      </div>

      {/* GRID UTAMA: 2 KOLOM SEJAJAR (INPUT FORM & SCANNER KAMERA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        
        {/* ====================================================
            KOLOM KIRI: KALKULATOR KEBUTUHAN GIZI MEDIS 
            ==================================================== */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#389D9C]/10 text-[#389D9C] flex items-center justify-center">
                <Flame size={20} />
              </div>
              <h2 className="text-lg font-extrabold text-[#194668]">
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
                  className="w-full bg-[#F8FAFC] rounded-xl border border-slate-200/80 focus:border-[#389D9C] focus:bg-white focus:ring-2 focus:ring-[#389D9C]/20 p-3.5 text-sm transition-all outline-none"
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
                    className="w-full bg-[#F8FAFC] rounded-xl border border-slate-200/80 focus:border-[#389D9C] focus:bg-white focus:ring-2 focus:ring-[#389D9C]/20 p-3.5 text-sm transition-all outline-none"
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
                    className="w-full bg-[#F8FAFC] rounded-xl border border-slate-200/80 focus:border-[#389D9C] focus:bg-white focus:ring-2 focus:ring-[#389D9C]/20 p-3.5 text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Dropdown Aktivitas Fisik */}
              <div>
                <CustomDropdown
                  label="Aktivitas Fisik Harian"
                  value={activity}
                  onChange={(val) => setActivity(val)}
                  options={[
                    {
                      value: 'sedentary',
                      label: 'Lebih banyak duduk',
                      description: 'Istirahat total / bedrest',
                    },
                    {
                      value: 'light',
                      label: 'Aktif ringan',
                      description: 'Pekerjaan rumah ringan / jalan santai',
                    },
                    {
                      value: 'moderate',
                      label: 'Aktif sedang',
                      description: 'Banyak berjalan, olahraga ringan-sedang',
                    },
                    {
                      value: 'active',
                      label: 'Aktif tinggi',
                      description: 'Olahraga intens / pekerjaan fisik berat',
                    },
                  ]}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isCalculating}
                className="w-full bg-[#389D9C] hover:bg-[#2E8281] text-white py-4.5 rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isCalculating ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-teal-100" />
                    <span>Menghitung Rekomendasi Gizi...</span>
                  </>
                ) : (
                  <span>Hitung Kebutuhan Gizi</span>
                )}
              </Button>
            </form>

            {/* Pesan Error Kalkulator */}
            {calcError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex gap-2 items-start mt-3">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{calcError}</span>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            KOLOM KANAN: PEMERIKSAAN GIZI MAKANAN (AI SCANNER)
            ==================================================== */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 text-left relative flex flex-col justify-between">
          <div>
            {/* Header Kolom Kanan: Tulisan 'Tersedia di Premium' Dihapus */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#389D9C]/10 text-[#389D9C] flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <h2 className="text-lg font-extrabold text-[#194668]">
                  Pemeriksaan Gizi Makanan (AI Scanner)
                </h2>
              </div>
            </div>

            {/* Viewfinder Kamera Tanpa Bingkai Mengganggu */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-full max-w-[340px] aspect-[4/3] bg-slate-950 rounded-2xl border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center">
                
                {/* OVERLAY BELUM BERLANGGANAN (LANGSUNG KE HALAMAN PRICING, TANPA POPUP) */}
                {!canAccessCameraScan && (
                  <div 
                    onClick={() => navigate('/pricing')}
                    className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer group transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#389D9C]/20 text-[#389D9C] border border-[#389D9C]/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Lock size={22} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#75D5D4] uppercase tracking-wider block">
                        Fitur Khusus Berlangganan
                      </span>
                      <p className="text-[11px] text-slate-300 max-w-[210px] leading-relaxed">
                        Scan kamera nutrisi AI hanya tersedia untuk member berlangganan BUMILFIT.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/pricing');
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#194668] to-[#389D9C] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Crown size={13} className="text-amber-300" />
                      <span>Langganan Sekarang</span>
                    </button>
                  </div>
                )}

                {/* 1. Live Camera Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />

                {/* 2. Image Preview jika foto sudah diambil atau diunggah */}
                {!isCameraActive && imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview Makanan" 
                    className="w-full h-full object-cover"
                  />
                )}

                {/* 3. Placeholder jika kamera mati dan belum ada foto */}
                {!isCameraActive && !imagePreview && (
                  <div className="flex flex-col items-center justify-center space-y-2.5 text-slate-500 p-4">
                    <Camera size={40} className="text-[#389D9C]/50 stroke-[1.5]" />
                    <p className="text-xs text-slate-400 max-w-[220px] text-center leading-relaxed">
                      Ambil foto langsung atau unggah gambar makanan untuk deteksi nutrisi otomatis.
                    </p>
                  </div>
                )}

                {/* Animasi Garis Laser Biru-Teal Naik Turun (HANYA GARIS SCAN, TANPA BINGKAI SUDUT) */}
                {(isScanning || isCameraActive) && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#389D9C] to-transparent shadow-[0_0_15px_#389D9C,0_0_8px_#75D5D4] absolute animate-scan-laser" />
                  </div>
                )}

                {/* Status Indicator Bar */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-3 py-1 rounded-full z-20 flex items-center gap-1.5">
                  {isScanning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                      <span>Menganalisis Makanan...</span>
                    </>
                  ) : isCameraActive ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>Kamera Aktif</span>
                    </>
                  ) : scanComplete ? (
                    <>
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>Pemeriksaan Selesai</span>
                    </>
                  ) : (
                    <span>Siap Mengambil Foto</span>
                  )}
                </div>
              </div>

              {/* Input file tersembunyi untuk Unggah Gambar */}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
              />

              {/* KONTROL TOMBOL: 
                  Jika belum langganan: TIDAK ADA TOMBOL BUKA KAMERA & UNGGAH GAMBAR (Gantinya tombol langganan)
                  Jika sudah langganan: Tersedia tombol Buka Kamera & Unggah Gambar */}
              {canAccessCameraScan && (
                <div className="w-full max-w-[340px] space-y-2">
                  {!isCameraActive ? (
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={startCamera}
                        disabled={isScanning}
                        className="flex-1 bg-[#389D9C] hover:bg-[#2E8281] text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Camera size={15} />
                        <span>Buka Kamera</span>
                      </button>
                      <button 
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isScanning}
                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#194668] font-bold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload size={15} />
                        <span>Unggah Gambar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 bg-[#389D9C] hover:bg-[#2E8281] text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera size={15} />
                        <span>Ambil Foto</span>
                      </button>
                      <button 
                        type="button"
                        onClick={stopCamera}
                        className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X size={15} />
                        <span>Tutup</span>
                      </button>
                    </div>
                  )}

                  {/* Tombol Jalankan Analisis AI saat gambar sudah ada */}
                  {selectedImage && !scanComplete && !isCameraActive && (
                    <Button 
                      onClick={handleStartScan} 
                      disabled={isScanning}
                      className="w-full bg-[#194668] hover:bg-[#143752] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-teal-200" />
                          <span>Menganalisis Makanan dengan AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="text-teal-300" />
                          <span>Mulai Analisis Makanan</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Pesan Error Scanner */}
              {apiError && (
                <div className="w-full max-w-[340px] bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex gap-2 items-start mt-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ====================================================
          BAGIAN HASIL BERSAMA (LANGSUNG DI BAWAH TENGAH MEMANJANG)
          Jika menggunakan kalkulator -> keluar hasil kalkulator
          Jika menggunakan kamera -> berganti isi menjadi hasil scan kamera
          Jika menggunakan keduanya -> dapat beralih secara bergantian
          ==================================================== */}
      {(calcResult || (scanComplete && aiResult)) && (
        <div 
          ref={resultRef}
          className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 text-left"
        >
          {/* Header Hasil & Tab Peralihan Bergantian */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#389D9C]/10 text-[#389D9C] flex items-center justify-center font-bold shrink-0">
                {activeResultView === 'calc' ? <Flame size={22} /> : <Sparkles size={22} />}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hasil Analisis Terpadu
                </span>
                <h3 className="text-xl font-extrabold text-[#194668]">
                  {activeResultView === 'calc' 
                    ? 'Kebutuhan Harian & Rekomendasi Gizi' 
                    : `Pemeriksaan Nutrisi: ${aiResult?.foodName || 'Makanan'}`}
                </h3>
              </div>
            </div>

            {/* Tab Switcher jika kedua hasil sudah tersedia */}
            {calcResult && scanComplete && aiResult && (
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/70 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveResultView('calc')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeResultView === 'calc'
                      ? 'bg-white text-[#194668] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Flame size={14} className={activeResultView === 'calc' ? 'text-[#389D9C]' : ''} />
                  <span>Kalkulator Gizi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultView('camera')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeResultView === 'camera'
                      ? 'bg-white text-[#194668] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Camera size={14} className={activeResultView === 'camera' ? 'text-[#389D9C]' : ''} />
                  <span>Scan Kamera</span>
                </button>
              </div>
            )}
          </div>

          {/* 1. KONTEN HASIL KALKULATOR GIZI */}
          {activeResultView === 'calc' && calcResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {calcResult.bmi && (
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold">Indeks Massa Tubuh (IMT):</span>
                    <span className="font-black text-[#194668]">{calcResult.bmi} kg/m²</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-[#389D9C]">{calcResult.statusBmi}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Menu rekomendasi disesuaikan spesifik dengan kebutuhan trimester & berat badan Bunda
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* KALORI */}
                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] font-bold text-orange-600 block tracking-wider uppercase">
                    TARGET KALORI
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{calcResult.kalori}</span>
                    <span className="text-xs font-semibold text-slate-400">kkal / hari</span>
                  </div>
                </div>

                {/* PROTEIN */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] font-bold text-emerald-600 block tracking-wider uppercase">
                    TARGET PROTEIN
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{calcResult.protein}</span>
                    <span className="text-xs font-semibold text-slate-400">g / hari</span>
                  </div>
                </div>

                {/* AIR */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] font-bold text-blue-600 block tracking-wider uppercase">
                    KEBUTUHAN CAIRAN
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{(calcResult.cairan / 1000).toFixed(1)}</span>
                    <span className="text-xs font-semibold text-slate-400">Liter / hari</span>
                  </div>
                </div>

                {/* SERAT */}
                <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] font-bold text-teal-600 block tracking-wider uppercase">
                    TARGET SERAT
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{calcResult.serat}</span>
                    <span className="text-xs font-semibold text-slate-400">g / hari</span>
                  </div>
                </div>
              </div>

              {/* REKOMENDASI MENU GEMINI AI */}
              {calcResult.recommendations && calcResult.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-teal-50/40 via-white to-slate-50 border border-teal-100 rounded-3xl p-5 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-teal-100/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#389D9C]/10 text-[#389D9C] flex items-center justify-center">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#194668] text-sm uppercase tracking-wider">
                          Menu Rekomendasi Medis (Google Gemini AI)
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Disesuaikan secara personal dengan usia kehamilan, berat badan, dan target kalori Bunda
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                    {calcResult.recommendations.map((rec: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-2xl p-5 border border-teal-100/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
                      >
                        {/* Header: Waktu Makan + Nomor */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#389D9C]/10 text-[#194668] border border-[#389D9C]/20">
                              <Clock size={11} className="text-[#389D9C]" />
                              {rec.mealTime || (idx === 0 ? 'Sarapan' : idx === 1 ? 'Makan Siang' : 'Makan Malam')}
                            </span>
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </span>
                          </div>

                          <h5 className="text-sm font-black text-slate-900 leading-snug">
                            {rec.name}
                          </h5>
                        </div>

                        {/* Format Rincian Gizi: Protein, Nutrisi Kunci, & Manfaat */}
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs flex-1 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            {rec.protein && (
                              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                  <span>🥩</span> Protein :
                                </span>
                                {renderFormattedList(rec.protein, 'protein')}
                              </div>
                            )}

                            {rec.nutrients && (
                              <div className="bg-teal-50/60 border border-teal-200/60 rounded-xl p-3">
                                <span className="text-[11px] font-black uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                  <span>🥗</span> Nutrisi Kunci :
                                </span>
                                {renderFormattedList(rec.nutrients, 'nutrients')}
                              </div>
                            )}
                          </div>

                          {rec.benefit && (
                            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <span>✨</span> Manfaat :
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                                {rec.benefit}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. KONTEN HASIL SCAN NUTRISI KAMERA AI */}
          {activeResultView === 'camera' && scanComplete && aiResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Makanan & Porsi */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-slate-200/70">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                    Makanan yang Dideteksi
                  </span>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <h4 className="text-lg font-black text-[#194668]">
                      {aiResult.foodName}
                    </h4>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      aiResult.safeForPregnancy 
                        ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-300' 
                        : 'bg-red-100/70 text-red-800 border border-red-300'
                    }`}>
                      {aiResult.safeForPregnancy ? '✓ Aman untuk Ibu Hamil' : '⚠ Batasi / Hindari'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                  <button 
                    type="button"
                    onClick={() => setPortion(Math.max(0.5, portion - 0.5))}
                    className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#194668] transition-colors border border-slate-200 cursor-pointer font-bold"
                    aria-label="Kurangi porsi"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-xs font-black text-[#194668] w-14 text-center">
                    {portion} Porsi
                  </span>
                  <button 
                    type="button"
                    onClick={() => setPortion(portion + 0.5)}
                    className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#194668] transition-colors border border-slate-200 cursor-pointer font-bold"
                    aria-label="Tambah porsi"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Grid 5 Makronutrisi Makanan */}
              {(() => {
                const nut = getCalculatedNutrition();
                if (!nut) return null;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                      <span className="text-[10px] font-bold text-orange-600 block uppercase tracking-wide">KALORI</span>
                      <span className="text-lg font-black text-slate-800">{nut.kalori} <span className="text-xs font-normal text-slate-400">kkal</span></span>
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                      <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wide">PROTEIN</span>
                      <span className="text-lg font-black text-slate-800">{nut.protein} <span className="text-xs font-normal text-slate-400">g</span></span>
                    </div>
                    <div className="bg-red-50/60 border border-red-100 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                      <span className="text-[10px] font-bold text-red-600 block uppercase tracking-wide">LEMAK</span>
                      <span className="text-lg font-black text-slate-800">{nut.lemak} <span className="text-xs font-normal text-slate-400">g</span></span>
                    </div>
                    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex flex-col justify-between h-20">
                      <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wide">KARBO</span>
                      <span className="text-lg font-black text-slate-800">{nut.karbohidrat} <span className="text-xs font-normal text-slate-400">g</span></span>
                    </div>
                    <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 flex flex-col justify-between h-20 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-teal-600 block uppercase tracking-wide">SERAT</span>
                      <span className="text-lg font-black text-slate-800">{nut.serat} <span className="text-xs font-normal text-slate-400">g</span></span>
                    </div>
                  </div>
                );
              })()}

              {/* Analisis Medis Kehamilan & Simpan ke Jurnal */}
              <div className="bg-gradient-to-br from-teal-50/30 via-white to-slate-50 border border-teal-100 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#389D9C]" />
                  <h4 className="font-extrabold text-[#194668] text-xs uppercase tracking-wider">
                    Saran Medis & Panduan Konsumsi
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {aiResult.recommendation}
                </p>

                <div className="pt-2 flex justify-stretch sm:justify-end">
                  <Button 
                    onClick={handleSaveToLog}
                    disabled={isSaved}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer ${
                      isSaved 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#194668] hover:bg-[#143752] text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle2 size={15} />
                        Tersimpan di Jurnal Makanan
                      </>
                    ) : (
                      <>
                        <BookmarkCheck size={15} />
                        Simpan ke Jurnal Harian
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Style Animasi Garis Laser Naik-Turun */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 2%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 2%; opacity: 0.8; }
        }
        .animate-scan-laser {
          animation: scanLaser 2.2s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
};

export default CekGiziPage;
