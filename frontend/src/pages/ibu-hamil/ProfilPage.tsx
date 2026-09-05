import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  User, Phone, Baby, Calendar, 
  Activity, Edit3, ImagePlus, CheckCircle2, AlertCircle, X, Loader2,
  Crown, Home, ChevronRight, Mail, Heart, Trash2, AlertTriangle, ShieldAlert,
  FlipHorizontal, FlipVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiClient } from '../../lib/apiClient';
import Cropper from 'react-easy-crop';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useSubscription } from '../../context/SubscriptionContext';
import { CustomDropdown } from '../../components/ui/CustomDropdown';

// --- Komponen Toast ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 sm:right-6 z-50 max-w-[calc(100vw-2rem)] px-5 sm:px-6 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 ${type === 'success' ? 'bg-bumil-teal/10 border-bumil-teal/30 text-teal-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
};

// --- Helper Potong Gambar ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const flipImageSrc = async (src: string, flipH: boolean, flipV: boolean): Promise<string> => {
  if (!flipH && !flipV) return src;
  const img = await createImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85);
};

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: any,
  rotation = 0
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(
    safeArea / 2 - image.width / 2 + pixelCrop.x,
    safeArea / 2 - image.height / 2 + pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  const finalCanvas = document.createElement('canvas');
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return '';
  finalCanvas.width = pixelCrop.width;
  finalCanvas.height = pixelCrop.height;
  finalCtx.putImageData(data, 0, 0);

  const compressedCanvas = document.createElement('canvas');
  const compressedCtx = compressedCanvas.getContext('2d');
  
  let scale = 1;
  if (pixelCrop.width > 500 || pixelCrop.height > 500) {
    scale = Math.min(500 / pixelCrop.width, 500 / pixelCrop.height);
  }
  
  compressedCanvas.width = Math.round(pixelCrop.width * scale);
  compressedCanvas.height = Math.round(pixelCrop.height * scale);
  
  if (compressedCtx) {
    compressedCtx.drawImage(finalCanvas, 0, 0, compressedCanvas.width, compressedCanvas.height);
  }

  return compressedCanvas.toDataURL('image/jpeg', 0.8);
};

const formatDateToYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const getTrimesterInfo = (weeks: number) => {
  if (weeks <= 0) {
    return { name: 'Belum Diatur', desc: 'Atur usia kehamilan untuk melihat fase trimester' };
  }
  if (weeks <= 13) {
    return { name: 'Trimester 1', desc: 'Minggu 1 – 13 • Pembentukan organ vital si Kecil' };
  }
  if (weeks <= 27) {
    return { name: 'Trimester 2', desc: 'Minggu 14 – 27 • Janin makin aktif bergerak' };
  }
  return { name: 'Trimester 3', desc: 'Minggu 28 – 42 • Pematangan akhir persiapan persalinan' };
};

const getEstimatedHpl = (weeks: number, days: number): { hplDateStr: string; formatted: string; daysLeft: number } | null => {
  if (weeks <= 0 && days <= 0) return null;
  const totalDays = (weeks * 7) + (days || 0);
  const remainingDays = Math.max(0, 280 - totalDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hplDate = new Date(today.getTime() + remainingDays * 86400000);
  const hplDateStr = formatDateToYMD(hplDate);
  return {
    hplDateStr,
    formatted: formatDateIndo(hplDateStr),
    daysLeft: remainingDays,
  };
};

const getInitialHphtFromWeeks = (weeks: number, days: number): string => {
  if (!weeks && !days) return '';
  const totalDays = (weeks * 7) + (days || 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hphtTime = today.getTime() - (totalDays * 86400000);
  return formatDateToYMD(new Date(hphtTime));
};

interface ProfileData {
  namaIbu: string;
  email: string;
  nomorWhatsapp: string;
  namaAnak: string;
  genderAnak: string;
  usiaKehamilanMinggu: number;
  usiaKehamilanHari: number;
  golonganDarah: string;
}

const emptyData: ProfileData = {
  namaIbu: '',
  email: '',
  nomorWhatsapp: '',
  namaAnak: '',
  genderAnak: '',
  usiaKehamilanMinggu: 0,
  usiaKehamilanHari: 0,
  golonganDarah: '',
};

export const ProfilPage = () => {
  const [data, setData] = useState<ProfileData>(emptyData);
  const [originalData, setOriginalData] = useState<ProfileData>(emptyData);

  // Status dan Umpan Balik
  const navigate = useNavigate();
  const { hasActiveSubscription, planBadge, activePlanName, endDateFormatted, daysRemaining } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Foto Profil
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cropper States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Usia Kehamilan States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // Batas tanggal HPHT: Maksimal hari ini, Minimal 42 minggu lalu
  const { minHphtStr, maxHphtStr } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minHpht = new Date(today.getTime() - 42 * 7 * 86400000);

    return {
      minHphtStr: formatDateToYMD(minHpht),
      maxHphtStr: formatDateToYMD(today),
    };
  }, []);

  const estimatedHpl = useMemo(() => {
    return getEstimatedHpl(data.usiaKehamilanMinggu, data.usiaKehamilanHari);
  }, [data.usiaKehamilanMinggu, data.usiaKehamilanHari]);

  // Handler tanggal HPHT sederhana
  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr);
    if (!newDateStr) return;
    const picked = new Date(newDateStr + 'T00:00:00');
    if (isNaN(picked.getTime())) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - picked.getTime();
    if (diffMs >= 0) {
      const totalDays = Math.floor(diffMs / 86400000);
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      const clampedWeeks = Math.min(42, Math.max(0, weeks));
      setData(prev => ({
        ...prev,
        usiaKehamilanMinggu: clampedWeeks,
        usiaKehamilanHari: days,
      }));
    }
  };

  // State Hapus Akun & OTP
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'choose-channel' | 'enter-otp'>('choose-channel');
  const [deleteChannel, setDeleteChannel] = useState<'email' | 'whatsapp'>('email');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteTimer, setDeleteTimer] = useState(0);
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Timer countdown untuk kirim ulang OTP
  useEffect(() => {
    let timer: any;
    if (deleteTimer > 0) {
      timer = setInterval(() => {
        setDeleteTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [deleteTimer]);

  const handleOpenDeleteModal = () => {
    setDeleteStep('choose-channel');
    setDeleteChannel('email');
    setDeleteOtp('');
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSendDeleteOtp = async () => {
    if (deleteChannel === 'whatsapp' && !data.nomorWhatsapp) {
      setDeleteError('Nomor WhatsApp belum terdaftar di profil Anda. Silakan pilih metode Email.');
      return;
    }

    setIsSendingDeleteOtp(true);
    setDeleteError(null);
    try {
      const response = await apiClient.post('/auth/request-delete-account-otp', {
        channel: deleteChannel
      });
      setDeleteStep('enter-otp');
      setDeleteTimer(60);
      setToast({ msg: response.data.message || 'Kode OTP verifikasi telah dikirim!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Gagal mengirim kode OTP. Silakan coba lagi.');
    } finally {
      setIsSendingDeleteOtp(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteOtp || deleteOtp.trim().length !== 6) {
      setDeleteError('Silakan masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.post('/auth/confirm-delete-account', {
        kode: deleteOtp.trim()
      });
      
      localStorage.clear();
      setIsDeleteModalOpen(false);
      alert('Akun Anda beserta seluruh data terkait telah berhasil dihapus secara permanen.');
      window.location.href = '/login';
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Kode OTP tidak valid atau telah kedaluwarsa.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Refs untuk UX Flow
  const anakSectionRef = useRef<HTMLDivElement>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get('/auth/profile');
      const userData = response.data;
      const profil = userData.profilIbu;
      
      const loadedData = {
        namaIbu: profil?.namaIbu || '',
        email: userData.email || '',
        nomorWhatsapp: profil?.nomorWhatsapp || '',
        namaAnak: profil?.namaAnak || '',
        genderAnak: profil?.genderAnak || '',
        usiaKehamilanMinggu: profil?.usiaKehamilanMinggu || 0,
        usiaKehamilanHari: profil?.usiaKehamilanHari || 0,
        golonganDarah: profil?.golonganDarah || '',
      };
      
      setData(loadedData);
      setOriginalData(loadedData);

      const initDate = getInitialHphtFromWeeks(loadedData.usiaKehamilanMinggu, loadedData.usiaKehamilanHari);
      setSelectedDate(initDate);
      
      if (profil?.fotoProfil) {
        setProfileImage(profil.fotoProfil);
        setOriginalProfileImage(profil.fotoProfil);
      }
    } catch (error) {
      console.error("Gagal mengambil data profil", error);
      setFetchError("Gagal memuat data profil. Silakan periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleToggleFlip = async (type: 'horizontal' | 'vertical') => {
    if (!rawImageSrc) return;
    const nextFlip = {
      ...flip,
      [type]: !flip[type],
    };
    setFlip(nextFlip);
    const flipped = await flipImageSrc(rawImageSrc, nextFlip.horizontal, nextFlip.vertical);
    setImageSrc(flipped);
  };

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      setIsProcessingImage(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      setProfileImage(croppedImage);
      setImageSrc(null);
      setRawImageSrc(null);
      setFlip({ horizontal: false, vertical: false });
    } catch (e) {
      console.error(e);
      setToast({ msg: "Gagal memproses gambar.", type: "error" });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validasi ukuran (maks 10MB) dan tipe
      if (file.size > 10 * 1024 * 1024) {
        setToast({ msg: "Ukuran file terlalu besar (Maks 10MB).", type: "error" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setToast({ msg: "File harus berupa gambar.", type: "error" });
        return;
      }

      setIsProcessingImage(true);
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height *= MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width *= MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setRawImageSrc(compressedDataUrl);
          setImageSrc(compressedDataUrl);
          setFlip({ horizontal: false, vertical: false });
          setZoom(1);
          setCrop({ x: 0, y: 0 });
        }
        setIsProcessingImage(false);
      };
      
      img.onerror = () => {
        setToast({ msg: "Gagal membaca file gambar.", type: "error" });
        setIsProcessingImage(false);
      };
      
      img.src = objectUrl;
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelEdit = () => {
    setData(originalData);
    setProfileImage(originalProfileImage);
    const initDate = getInitialHphtFromWeeks(originalData.usiaKehamilanMinggu, originalData.usiaKehamilanHari);
    setSelectedDate(initDate);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validasi Nomor WhatsApp (hanya angka)
    const phoneRegex = /^[0-9]+$/;
    if (data.nomorWhatsapp && !phoneRegex.test(data.nomorWhatsapp)) {
      setToast({ msg: "Nomor WhatsApp hanya boleh berisi angka.", type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put('/auth/profile', { ...data, fotoProfil: profileImage });
      setOriginalData(data);
      setOriginalProfileImage(profileImage);
      setIsEditing(false);
      setToast({ msg: "Profil berhasil diperbarui!", type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ msg: "Gagal memperbarui profil. Silakan coba lagi.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Render States
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white rounded-3xl p-8 border border-slate-100 flex gap-8">
            <div className="w-32 h-32 bg-zinc-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-4">
              <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
              <div className="h-10 bg-zinc-200 rounded w-full"></div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-100 h-64"></div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bumil-depth space-y-4 px-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-bumil-navy font-medium text-center">{fetchError}</p>
        <Button onClick={fetchProfile} className="bg-bumil-primary hover:bg-[#2E8281] text-white">Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-8 mobile-bottom-pad space-y-6 sm:space-y-8 bg-bumil-bg min-h-screen relative">
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
          <span className="text-bumil-navy font-semibold">Profil Saya</span>
        </nav>
      </div>

      {/* MODAL CROP GAMBAR */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          <button 
            type="button"
            onClick={() => {
              setImageSrc(null);
              setRawImageSrc(null);
              setFlip({ horizontal: false, vertical: false });
            }}
            aria-label="Tutup Editor Foto"
            className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-full max-w-md h-[42vh] sm:h-[50vh] bg-black rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-2xl">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="w-full max-w-md bg-white p-6 rounded-3xl space-y-6 shadow-xl">
            <div>
              <label htmlFor="zoom-slider" className="text-xs font-semibold text-bumil-navy mb-2 block uppercase tracking-wider">Perbesar (Zoom)</label>
              <input
                id="zoom-slider"
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#389D9C]"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleFlip('horizontal')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  flip.horizontal 
                    ? 'bg-[#389D9C]/15 text-[#194668] border border-[#389D9C]/40 ring-1 ring-[#389D9C]/30 shadow-2xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                }`}
              >
                <FlipHorizontal size={16} className={flip.horizontal ? 'text-[#389D9C]' : 'text-slate-500'} />
                <span>Balik Horizontal</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleFlip('vertical')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  flip.vertical 
                    ? 'bg-[#389D9C]/15 text-[#194668] border border-[#389D9C]/40 ring-1 ring-[#389D9C]/30 shadow-2xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                }`}
              >
                <FlipVertical size={16} className={flip.vertical ? 'text-[#389D9C]' : 'text-slate-500'} />
                <span>Balik Vertikal</span>
              </button>
            </div>
            
            <Button
              onClick={showCroppedImage}
              disabled={isProcessingImage}
              className="w-full py-6 text-base font-bold text-white bg-bumil-primary hover:bg-[#2E8281] rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isProcessingImage ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              {isProcessingImage ? 'Memproses...' : 'Terapkan Foto'}
            </Button>
          </div>
        </div>
      )}

      {/* HERO PROFILE CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 relative overflow-hidden">
        {/* Dekorasi Aksen Halus */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-50/50 via-transparent to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Sisi Kiri: Avatar & Identitas */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative group shrink-0">
              <UserAvatar
                size="2xl"
                src={profileImage}
                name={data.namaIbu}
                className="shadow-sm ring-4 ring-offset-4 ring-slate-100"
              />
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Ubah Foto Profil"
                  className="absolute -bottom-1 -right-1 bg-bumil-primary p-3 rounded-full text-white shadow-md hover:bg-[#2E8281] transition-transform active:scale-95 cursor-pointer z-10"
                >
                  <ImagePlus size={18} />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp"
                onChange={onFileChange}
              />
            </div>

            {/* Identitas & Info Kontak Ringkas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight">
                  {data.namaIbu || 'Bunda BumilFit'}
                </h1>
                {hasActiveSubscription && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-bumil-primary to-[#75D5D4] text-white text-xs font-black shadow-2xs tracking-wider">
                    {planBadge}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span>{data.email}</span>
              </p>

              {data.golonganDarah && (
                <div className="pt-1 flex items-center justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70 shadow-2xs">
                    <Activity size={13} className="text-rose-600" />
                    <span>Gol. Darah {data.golonganDarah}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Tombol Aksi */}
          <div className="shrink-0 w-full sm:w-auto flex sm:flex-col justify-center sm:justify-end gap-2.5">
            {!isEditing ? (
              <Button 
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto border-slate-200 hover:border-bumil-primary/40 hover:bg-teal-50/50 text-bumil-navy flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 size={15} /> Edit Profil
              </Button>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  onClick={handleCancelEdit} 
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial text-slate-600 font-bold hover:bg-slate-100 rounded-xl px-4 py-2.5 cursor-pointer"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial bg-bumil-primary hover:bg-[#2E8281] text-white flex items-center justify-center gap-2 font-bold shadow-sm hover:shadow-md px-5 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KARTU 1: Informasi Pribadi & Kontak */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 transition-all">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-bumil-primary flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#194668]">Informasi Pribadi & Kontak</h2>
              <p className="text-xs text-slate-400 font-medium">Kelola identitas utama dan nomor kontak aktif Bunda</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Nama Lengkap */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                <User size={14} />
              </div>
              <label htmlFor="namaIbu" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nama Lengkap
              </label>
            </div>
            {isEditing ? (
              <Input 
                id="namaIbu" 
                value={data.namaIbu} 
                onChange={e => setData({...data, namaIbu: e.target.value})} 
                className="bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold"
                placeholder="Masukkan nama lengkap Bunda"
              />
            ) : (
              <p className="text-base font-bold text-slate-800 py-1">{data.namaIbu || '-'}</p>
            )}
          </div>

          {/* 2. Alamat Email */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                  <Mail size={14} />
                </div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Alamat Email
                </label>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-150">
                Akun Utama
              </span>
            </div>
            <p className="text-base font-bold text-slate-800 py-1 truncate" title={data.email}>
              {data.email}
            </p>
          </div>

          {/* 3. Nomor WhatsApp */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                <Phone size={14} />
              </div>
              <label htmlFor="nomorWhatsapp" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nomor WhatsApp
              </label>
            </div>
            {isEditing ? (
              <Input 
                id="nomorWhatsapp" 
                type="tel" 
                pattern="[0-9]*" 
                value={data.nomorWhatsapp} 
                onChange={e => setData({...data, nomorWhatsapp: e.target.value.replace(/\D/g, '')})} 
                className="bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold" 
                placeholder="Contoh: 08123456789" 
              />
            ) : (
              <p className="text-base font-bold text-slate-800 py-1">
                {data.nomorWhatsapp ? (
                  <span className="font-mono font-bold tracking-tight">{data.nomorWhatsapp}</span>
                ) : (
                  <span className="text-slate-400 italic font-normal text-sm">Belum diisi</span>
                )}
              </p>
            )}
          </div>

          {/* 4. Golongan Darah */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                <Activity size={14} />
              </div>
              <label htmlFor="golonganDarah" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Golongan Darah
              </label>
            </div>
            {isEditing ? (
              <CustomDropdown 
                id="golonganDarah"
                value={data.golonganDarah} 
                onChange={val => setData({...data, golonganDarah: val})}
                options={[
                  { value: 'A+', label: 'Golongan Darah A+' },
                  { value: 'A-', label: 'Golongan Darah A-' },
                  { value: 'B+', label: 'Golongan Darah B+' },
                  { value: 'B-', label: 'Golongan Darah B-' },
                  { value: 'AB+', label: 'Golongan Darah AB+' },
                  { value: 'AB-', label: 'Golongan Darah AB-' },
                  { value: 'O+', label: 'Golongan Darah O+' },
                  { value: 'O-', label: 'Golongan Darah O-' },
                ]}
                placeholder="Pilih Golongan Darah..."
                buttonClassName="bg-white rounded-xl border-slate-200 h-11 font-semibold"
              />
            ) : (
              <div className="py-1">
                {data.golonganDarah ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Golongan Darah {data.golonganDarah}
                  </span>
                ) : (
                  <span className="text-slate-400 italic font-normal text-sm">Belum diisi</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KARTU 2: Data Kehamilan & Si Kecil */}
      <div ref={anakSectionRef} className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 transition-all text-left">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-bumil-primary flex items-center justify-center shrink-0">
              <Baby size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#194668]">Data Kehamilan & Calon Buah Hati</h2>
              <p className="text-xs text-slate-400 font-medium">Data tumbuh kembang si Kecil untuk panduan kesehatan terarah</p>
            </div>
          </div>
        </div>
        
        {!data.namaAnak && !isEditing && (
          <div className="mb-6 bg-gradient-to-r from-teal-50/80 via-sky-50/60 to-teal-50/80 border border-teal-200/60 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-800 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-sm text-bumil-navy font-bold">Data Si Kecil belum lengkap nih!</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Lengkapi datanya agar BumilFit bisa memberikan edukasi kehamilan dan rekomendasi gizi yang tepat.
                </p>
              </div>
            </div>
            <Button 
              type="button"
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => anakSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
              }} 
              className="bg-white text-bumil-primary hover:bg-teal-50 hover:text-[#2E8281] border border-teal-200/80 font-bold text-xs shadow-2xs shrink-0 cursor-pointer"
            >
              Lengkapi Sekarang
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* Baris 1: Nama & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Panggilan Anak */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                  <Baby size={14} />
                </div>
                <label htmlFor="namaAnak" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nama Panggilan Calon Bayi
                </label>
              </div>
              {isEditing ? (
                <Input 
                  id="namaAnak" 
                  value={data.namaAnak} 
                  onChange={e => setData({...data, namaAnak: e.target.value})} 
                  placeholder="Misal: Dedek Bayi, Keanu, Kirana" 
                  className="bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold" 
                />
              ) : (
                <p className="text-base font-bold text-slate-800 py-1">
                  {data.namaAnak || <span className="text-slate-400 italic font-normal text-sm">Belum diisi</span>}
                </p>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                  <Heart size={14} />
                </div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Jenis Kelamin Calon Bayi
                </label>
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, genderAnak: 'Laki-laki' })}
                    className={`h-11 px-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      data.genderAnak === 'Laki-laki' 
                        ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👦 Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, genderAnak: 'Perempuan' })}
                    className={`h-11 px-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      data.genderAnak === 'Perempuan' 
                        ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👧 Perempuan
                  </button>
                </div>
              ) : (
                <div className="py-1">
                  {data.genderAnak ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {data.genderAnak === 'Laki-laki' ? '👦 Laki-laki' : '👧 Perempuan'}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic font-normal text-sm">Belum diketahui</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Baris 2: Usia Kehamilan Sederhana & Nyaman Dibaca */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-150 flex items-center justify-center text-slate-500">
                  <Calendar size={14} />
                </div>
                <label htmlFor="pregnancyDateInput" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isEditing ? 'Hari Pertama Haid Terakhir (HPHT)' : 'Usia Kehamilan Saat Ini'}
                </label>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
                {getTrimesterInfo(data.usiaKehamilanMinggu).name}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2.5">
                <div className="relative flex items-center">
                  <Input
                    id="pregnancyDateInput"
                    ref={dateInputRef}
                    type="date"
                    value={selectedDate}
                    max={maxHphtStr}
                    min={minHphtStr}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-white rounded-xl border-slate-200 focus-visible:ring-bumil-primary h-11 text-sm font-semibold pr-10 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
                        dateInputRef.current.showPicker();
                      } else {
                        dateInputRef.current?.focus();
                      }
                    }}
                    className="absolute right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-bumil-primary transition-colors cursor-pointer"
                    title="Buka Kalender"
                  >
                    <Calendar size={16} />
                  </button>
                </div>

                {data.usiaKehamilanMinggu > 0 ? (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-teal-50/80 border border-teal-200/70 text-xs font-bold text-teal-800">
                    <span>✨ Usia Kehamilan Terhitung: {data.usiaKehamilanMinggu} Minggu {data.usiaKehamilanHari} Hari</span>
                    {estimatedHpl && (
                      <span className="text-[11px] font-semibold text-teal-700 hidden sm:inline">
                        HPL: {estimatedHpl.formatted}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Pilih tanggal haid terakhir Bunda di atas untuk menghitung otomatis.</p>
                )}
              </div>
            ) : (
              <div className="py-1">
                <p className="text-base sm:text-lg font-black text-bumil-navy">
                  {data.usiaKehamilanMinggu} Minggu {data.usiaKehamilanHari} Hari
                </p>
                {estimatedHpl ? (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Taksiran Lahir (HPL): <strong className="text-slate-700">{estimatedHpl.formatted}</strong> ({estimatedHpl.daysLeft} hari lagi)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5 italic">Belum dihitung dari tanggal HPHT</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KARTU 3: Status Langganan & Keanggotaan */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 transition-all text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-bumil-primary flex items-center justify-center shrink-0">
              <Crown size={22} className="text-bumil-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#194668]">Status Langganan & Keanggotaan</h2>
              <p className="text-xs text-slate-400 font-medium">Informasi paket langganan dan akses fitur eksklusif Bunda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-bumil-navy to-bumil-primary hover:from-[#143752] hover:to-[#2E8281] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <span>{hasActiveSubscription ? 'Perpanjang / Ganti Paket' : 'Pilih Paket Langganan'}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-150 space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Paket Keanggotaan</span>
            <div className="flex items-center gap-2.5 pt-0.5">
              <span className="text-base sm:text-lg font-black text-slate-800">
                {hasActiveSubscription ? (activePlanName || planBadge) : 'Belum Ada Langganan'}
              </span>
              {hasActiveSubscription ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                  Aktif
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-wider">
                  Standar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {hasActiveSubscription 
                ? 'Nikmati konsultasi bidan 24/7, rekomendasi nutrisi lengkap, dan pendampingan AI cerdas.'
                : 'Akses fitur dasar BumilFit. Tingkatkan keanggotaan untuk akses tak terbatas.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-150 space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Masa Aktif Paket</span>
            <div className="pt-0.5">
              {hasActiveSubscription ? (
                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-black text-slate-800">
                    Berlaku s.d. {endDateFormatted}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {daysRemaining} hari tersisa
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-600">Masa aktif tidak tersedia</p>
                  <p className="text-xs text-slate-400 mt-1">Aktifkan paket untuk mendapatkan masa aktif keanggotaan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KARTU 4: Zona Bahaya - Hapus Akun */}
      <div className="bg-white rounded-3xl shadow-xs border border-red-150 p-6 sm:p-8 transition-all text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">Hapus Akun</h2>
              <p className="text-xs text-slate-400 font-medium">Hapus akun Bunda dan seluruh riwayat data secara permanen</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleOpenDeleteModal}
            className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 font-bold px-5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Trash2 size={15} />
            <span>Hapus Akun Saya</span>
          </Button>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-red-50/40 border border-red-100 flex items-start gap-3.5 text-xs text-slate-600 leading-relaxed">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Perhatian Sebelum Menghapus Akun:</p>
            <p className="mt-0.5 text-slate-500">
              Setelah akun dihapus, seluruh data profil, riwayat konsultasi bidan, catatan kehamilan, dan paket langganan aktif Bunda akan dihapus permanen dari sistem database kami. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI & VERIFIKASI OTP HAPUS AKUN */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-6 animate-in zoom-in-95 duration-200">
            {/* Tombol Tutup */}
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSendingDeleteOtp || isDeleting}
              aria-label="Tutup Modal"
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Hapus Akun Permanen</h3>
                <p className="text-xs text-slate-400">Verifikasi OTP keamanan diperlukan</p>
              </div>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Step 1: Pilih Metode Pengiriman OTP */}
            {deleteStep === 'choose-channel' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                  Pilih ke mana kami harus mengirimkan 6 digit kode OTP untuk mengonfirmasi bahwa ini benar-benar permintaan Bunda.
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Pilih Metode Pengiriman:
                  </label>

                  {/* Radio Email */}
                  <div
                    onClick={() => setDeleteChannel('email')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      deleteChannel === 'email'
                        ? 'border-bumil-primary bg-teal-50/50 shadow-xs ring-1 ring-bumil-primary/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-bumil-primary flex items-center justify-center shrink-0">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Kirim via Email</p>
                        <p className="text-[11px] text-slate-500">{data.email}</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${deleteChannel === 'email' ? 'border-bumil-primary bg-bumil-primary' : 'border-slate-300'}`}>
                      {deleteChannel === 'email' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Radio WhatsApp */}
                  <div
                    onClick={() => {
                      if (data.nomorWhatsapp) setDeleteChannel('whatsapp');
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      !data.nomorWhatsapp
                        ? 'border-slate-150 bg-slate-50 opacity-60 cursor-not-allowed'
                        : deleteChannel === 'whatsapp'
                        ? 'border-bumil-primary bg-teal-50/50 shadow-xs ring-1 ring-bumil-primary/20 cursor-pointer'
                        : 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Kirim via WhatsApp</p>
                        <p className="text-[11px] text-slate-500">
                          {data.nomorWhatsapp ? `+${data.nomorWhatsapp}` : 'Nomor WhatsApp belum terdaftar'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${deleteChannel === 'whatsapp' ? 'border-bumil-primary bg-bumil-primary' : 'border-slate-300'}`}>
                      {deleteChannel === 'whatsapp' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isSendingDeleteOtp}
                    className="flex-1 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendDeleteOtp}
                    disabled={isSendingDeleteOtp}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSendingDeleteOtp ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>{isSendingDeleteOtp ? 'Mengirim OTP...' : 'Kirim Kode OTP'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Masukkan Kode OTP & Konfirmasi Hapus */}
            {deleteStep === 'enter-otp' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masukkan 6 digit kode OTP verifikasi yang telah kami kirimkan ke <strong>{deleteChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}</strong> Anda:
                </p>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl font-black h-14 rounded-2xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleSendDeleteOtp}
                    disabled={deleteTimer > 0 || isSendingDeleteOtp}
                    className="font-bold text-bumil-primary hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                  >
                    {deleteTimer > 0 ? `Kirim ulang OTP (${deleteTimer}s)` : 'Kirim Ulang Kode OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep('choose-channel')}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Ganti metode
                  </button>
                </div>

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmDeleteAccount}
                    disabled={isDeleting || deleteOtp.length !== 6}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    <span>{isDeleting ? 'Menghapus Akun...' : 'Hapus Permanen'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};