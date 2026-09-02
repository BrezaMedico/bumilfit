import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  User, Phone, Baby, Calendar, 
  Activity, Edit3, ImagePlus, CheckCircle2, AlertCircle, X, Shield, Eye, EyeOff, Loader2,
  Plus, Minus
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiClient } from '../../lib/apiClient';
import Cropper from 'react-easy-crop';

// --- Komponen Toast ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 ${type === 'success' ? 'bg-bumil-teal/10 border-bumil-teal/30 text-teal-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {message}
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

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
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
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
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

  const StepperInput = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max 
  }: { 
    label: string, 
    value: number, 
    onChange: (val: number) => void, 
    min: number, 
    max: number 
  }) => {
    const handleIncrement = () => {
      if (value < max) onChange(value + 1);
    };

    const handleDecrement = () => {
      if (value > min) onChange(value - 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val)) {
        if (val >= min && val <= max) {
          onChange(val);
        }
      } else if (e.target.value === '') {
        onChange(min);
      }
    };

    return (
      <div className="flex flex-col space-y-1">
        <span className="text-[11px] font-semibold text-[#194668]">{label}</span>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs w-full max-w-[120px]">
          <button
            type="button"
            onClick={handleDecrement}
            className="p-2 hover:bg-slate-50 text-slate-500 transition-colors border-r border-gray-150"
            disabled={value <= min}
          >
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            className="w-full text-center text-sm font-bold text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={handleIncrement}
            className="p-2 hover:bg-slate-50 text-slate-500 transition-colors border-l border-gray-150"
            disabled={value >= max}
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  };
  
  // Status dan Umpan Balik
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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Keamanan Akun
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const showCroppedImage = async () => {
    try {
      if (!imageSrc) return;
      setIsProcessingImage(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0,
        flip
      );
      setProfileImage(croppedImage);
      setImageSrc(null);
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImageSrc(compressedDataUrl);
          setFlip({ horizontal: false, vertical: false });
          setZoom(1);
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
    setData(originalData); // Revert bug fix
    setProfileImage(originalProfileImage);
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
      setOriginalData(data); // Perbarui snapshot
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ msg: 'Konfirmasi password baru tidak cocok.', type: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setToast({ msg: 'Password baru minimal 6 karakter.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.put('/auth/change-password', passwordData);
      setToast({ msg: 'Password berhasil diperbarui!', type: 'success' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword({ old: false, new: false, confirm: false });
    } catch (error: any) {
      setToast({ msg: error.response?.data?.message || 'Gagal mengubah password.', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Render States
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white rounded-[2rem] p-8 border border-bumil-depth flex gap-8">
            <div className="w-32 h-32 bg-zinc-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-4">
              <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
              <div className="h-10 bg-zinc-200 rounded w-full"></div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-8 border border-bumil-depth h-64"></div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bumil-depth space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-[#194668] font-medium">{fetchError}</p>
        <Button onClick={fetchProfile} className="bg-bumil-primary hover:bg-[#2b7c7b] text-white">Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 bg-bumil-bg min-h-screen relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header Halaman */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-bumil-primary">Profil Saya</h1>
        {!isEditing ? (
          <Button 
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="text-bumil-navy flex items-center gap-2 font-semibold hover:bg-bumil-teal/10"
          >
            <Edit3 size={16} /> Edit Profil
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={handleCancelEdit} 
              disabled={isSaving}
              className="text-[#194668] font-semibold hover:bg-zinc-100"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-bumil-primary hover:bg-[#2b7c7b] text-white flex items-center gap-2 font-bold shadow-md transition-all active:scale-95"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </div>
        )}
      </div>

      {/* MODAL CROP GAMBAR */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          <button 
            onClick={() => setImageSrc(null)}
            aria-label="Tutup Editor Foto"
            className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-full max-w-md h-[50vh] bg-black rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-2xl">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              // Catatan: Rotasi & scale dikelola murni oleh react-easy-crop internal untuk UI preview, 
              // transform flip disengaja dihilangkan agar mencegah visual bug. Flip diaplikasikan di canvas ekspor.
            />
          </div>
          
          <div className="w-full max-w-md bg-white p-6 rounded-3xl space-y-6 shadow-xl">
            <div>
              <label htmlFor="zoom-slider" className="text-xs font-semibold text-[#194668] mb-2 block uppercase tracking-wider">Perbesar (Zoom)</label>
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
                onClick={() => setFlip({ ...flip, horizontal: !flip.horizontal })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${flip.horizontal ? 'bg-bumil-teal/10 text-bumil-navy border border-bumil-teal/30' : 'bg-bumil-depth text-[#194668] hover:bg-zinc-100 border border-transparent'}`}
              >
                Balik Horizontal
              </button>
              <button
                onClick={() => setFlip({ ...flip, vertical: !flip.vertical })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${flip.vertical ? 'bg-bumil-teal/10 text-bumil-navy border border-bumil-teal/30' : 'bg-bumil-depth text-[#194668] hover:bg-zinc-100 border border-transparent'}`}
              >
                Balik Vertikal
              </button>
            </div>
            
            <Button
              onClick={showCroppedImage}
              disabled={isProcessingImage}
              className="w-full py-6 text-base font-bold text-white bg-bumil-primary hover:bg-[#2b7c7b] rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isProcessingImage ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              {isProcessingImage ? 'Memproses...' : 'Terapkan Foto'}
            </Button>
          </div>
        </div>
      )}

      {/* KARTU 1: Data Pribadi & Info Dasar */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-bumil-depth p-8 transition-all relative overflow-hidden">
        <h2 className="text-xl font-bold text-bumil-primary mb-8 flex items-center gap-2">
           Data Pribadi Ibu
        </h2>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
          {/* Foto Profil */}
          <div className="relative group flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-bumil-depth flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt="Foto Profil" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-[#F8F8F8]" />
              )}
            </div>
            {isEditing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                aria-label="Ubah Foto Profil"
                className="absolute bottom-0 right-0 bg-bumil-primary p-2.5 rounded-full text-white shadow-lg hover:bg-bumil-primary/90 transition-transform active:scale-95"
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

          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="namaIbu" className="text-sm font-medium text-[#194668] mb-1 block">Nama Lengkap</label>
                {isEditing ? (
                  <Input id="namaIbu" value={data.namaIbu} onChange={e => setData({...data, namaIbu: e.target.value})} className="rounded-xl border-bumil-depth focus-visible:ring-[#389D9C]" />
                ) : (
                  <p className="text-base font-bold text-bumil-navy">{data.namaIbu}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-[#194668] mb-1 block">Alamat Email</label>
                <p className="text-base font-bold text-bumil-navy">{data.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-zinc-50">
          <div className="flex gap-4 items-start">
            <div className="bg-blue-50/50 p-3 rounded-2xl">
              <Phone className="text-bumil-navy w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="nomorWhatsapp" className="text-sm font-medium text-[#194668] mb-1 block">Nomor WhatsApp</label>
              {isEditing ? (
                <Input id="nomorWhatsapp" type="tel" pattern="[0-9]*" value={data.nomorWhatsapp} onChange={e => setData({...data, nomorWhatsapp: e.target.value.replace(/\D/g, '')})} className="rounded-xl focus-visible:ring-[#389D9C]" placeholder="Contoh: 08123456789" />
              ) : (
                <p className="text-base font-semibold text-bumil-navy">{data.nomorWhatsapp || <span className="text-[#194668] italic">Belum diisi</span>}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="bg-blue-50/50 p-3 rounded-2xl">
              <Activity className="text-bumil-navy w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="golonganDarah" className="text-sm font-medium text-[#194668] mb-1 block">Golongan Darah</label>
              {isEditing ? (
                <select 
                  id="golonganDarah"
                  value={data.golonganDarah} 
                  onChange={e => setData({...data, golonganDarah: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#389D9C] focus-visible:ring-offset-2"
                >
                  <option value="">Pilih Golongan Darah...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              ) : (
                <p className="text-base font-semibold text-bumil-navy">{data.golonganDarah || <span className="text-[#194668] italic">Belum diisi</span>}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KARTU 2: Profil Si Kecil */}
      <div ref={anakSectionRef} className="bg-white rounded-[2rem] shadow-sm border border-bumil-depth p-8 transition-all relative overflow-hidden">
        <h2 className="text-xl font-bold text-bumil-primary mb-8 flex items-center gap-2">Profil Si Kecil</h2>
        
        {!data.namaAnak && !isEditing && (
          <div className="mb-8 bg-bumil-teal/10 border border-bumil-teal/20 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="text-bumil-navy w-6 h-6 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-base text-bumil-navy font-bold">Data Si Kecil belum lengkap nih.</p>
              <p className="text-sm text-[#194668] mt-1 mb-4 leading-relaxed">Lengkapi datanya agar BumilFit bisa memberikan edukasi kehamilan dan rekomendasi yang lebih personal untuk Paduka!</p>
              <Button 
                onClick={() => {
                  setIsEditing(true);
                  setTimeout(() => anakSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                }} 
                className="bg-white text-bumil-navy hover:bg-teal-100 hover:text-[#2b7c7b] border border-bumil-teal/30 font-bold shadow-sm"
              >
                Lengkapi Sekarang
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex gap-4 items-start">
            <div className="bg-blue-50/50 p-3 rounded-2xl">
              <Baby className="text-bumil-navy w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="namaAnak" className="text-sm font-medium text-[#194668] mb-1 block">Nama Panggilan Anak</label>
              {isEditing ? (
                <Input id="namaAnak" value={data.namaAnak} onChange={e => setData({...data, namaAnak: e.target.value})} placeholder="Misal: Dedek Bayi" className="rounded-xl focus-visible:ring-[#389D9C]" />
              ) : (
                <p className="text-base font-semibold text-bumil-navy">{data.namaAnak || <span className="text-[#194668] italic">Belum diisi</span>}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-blue-50/50 p-3 rounded-2xl">
              <User className="text-bumil-navy w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-[#194668] mb-1 block">Jenis Kelamin</label>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setData({ ...data, genderAnak: 'Laki-laki' })}
                    className={`flex-1 py-2.5 px-3 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      data.genderAnak === 'Laki-laki' ? 'border-[#389D9C] bg-bumil-teal/10 text-bumil-navy shadow-sm' : 'border-bumil-depth text-[#194668] hover:bg-bumil-depth'
                    }`}
                  >
                    👦 Laki-laki
                  </button>
                  <button
                    onClick={() => setData({ ...data, genderAnak: 'Perempuan' })}
                    className={`flex-1 py-2.5 px-3 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      data.genderAnak === 'Perempuan' ? 'border-[#389D9C] bg-bumil-teal/10 text-bumil-navy shadow-sm' : 'border-bumil-depth text-[#194668] hover:bg-bumil-depth'
                    }`}
                  >
                    👧 Perempuan
                  </button>
                </div>
              ) : (
                <p className="text-base font-semibold text-bumil-navy">{data.genderAnak || <span className="text-[#194668] italic">Belum diketahui</span>}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 items-start sm:col-span-2">
            <div className="bg-blue-50/50 p-3 rounded-2xl">
              <Calendar className="text-bumil-navy w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-[#194668] mb-2 block">Usia Kehamilan</label>
              {isEditing ? (
                <div className="flex gap-4">
                  <StepperInput 
                    label="Minggu"
                    value={data.usiaKehamilanMinggu}
                    min={1}
                    max={42}
                    onChange={(val) => setData({...data, usiaKehamilanMinggu: val})}
                  />
                  <StepperInput 
                    label="Hari"
                    value={data.usiaKehamilanHari}
                    min={0}
                    max={6}
                    onChange={(val) => setData({...data, usiaKehamilanHari: val})}
                  />
                </div>
              ) : (
                <p className="text-base font-semibold text-bumil-navy">
                  {data.usiaKehamilanMinggu} Minggu {data.usiaKehamilanHari} Hari
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KARTU 3: Keamanan Akun */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-bumil-depth p-8 transition-all">
        <h2 className="text-xl font-bold text-bumil-primary mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Keamanan Akun
        </h2>
        <p className="text-sm text-[#194668] mb-6">Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun.</p>
        
        <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
          <div>
            <label htmlFor="oldPassword" className="text-sm font-medium text-[#194668] block mb-1">Password Lama</label>
            <div className="relative">
              <Input 
                id="oldPassword"
                type={showPassword.old ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan sandi lama" 
                value={passwordData.oldPassword} 
                onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} 
                className="rounded-xl bg-bumil-depth border-bumil-depth pr-10 focus-visible:ring-[#389D9C]" 
                required
              />
              <button type="button" onClick={() => setShowPassword({...showPassword, old: !showPassword.old})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#194668] hover:opacity-70">
                {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="newPassword" className="text-sm font-medium text-[#194668] block mb-1">Password Baru</label>
            <div className="relative">
              <Input 
                id="newPassword"
                type={showPassword.new ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter" 
                value={passwordData.newPassword} 
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                className="rounded-xl bg-bumil-depth border-bumil-depth pr-10 focus-visible:ring-[#389D9C]"
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPassword({...showPassword, new: !showPassword.new})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#194668] hover:opacity-70">
                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[#194668] block mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <Input 
                id="confirmPassword"
                type={showPassword.confirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ketik ulang sandi baru" 
                value={passwordData.confirmPassword} 
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                className={`rounded-xl bg-bumil-depth pr-10 focus-visible:ring-[#389D9C] ${passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword ? 'border-red-300 focus-visible:ring-red-400' : 'border-bumil-depth'}`}
                required
              />
              <button type="button" onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#194668] hover:opacity-70">
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword && (
              <p className="text-xs text-red-500 mt-1">Konfirmasi password tidak cocok.</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isChangingPassword || !passwordData.oldPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
            className="w-full bg-bumil-primary hover:bg-[#2b7c7b] text-white rounded-xl py-6 font-bold shadow-md transition-all active:scale-95"
          >
            {isChangingPassword ? <Loader2 size={18} className="animate-spin mr-2" /> : <Shield size={18} className="mr-2" />}
            {isChangingPassword ? 'Memperbarui Keamanan...' : 'Perbarui Password'}
          </Button>
        </form>
      </div>

    </div>
  );
};