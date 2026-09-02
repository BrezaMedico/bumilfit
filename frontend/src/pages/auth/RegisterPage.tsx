import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { GenderBadge } from '../../components/ui/GenderBadge';
import { Plus, Minus } from 'lucide-react';

// Skema Zod untuk frontend
const registerSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['IBU_HAMIL', 'DOKTER']),
  // Kolom opsional (akan divalidasi bergantung pada kondisi role nanti jika diperlukan lebih jauh)
  namaIbu: z.string().optional(),
  usiaKehamilanMinggu: z.string().optional(), // Diubah ke string dulu saat input form
  usiaKehamilanHari: z.string().optional(), // Diubah ke string dulu saat input form
  nomorWhatsapp: z.string().optional(),
  namaAnak: z.string().optional(),
  genderAnak: z.string().optional(),
  namaDokter: z.string().optional(),
  noSTR: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      role: 'IBU_HAMIL', 
      genderAnak: '',
      usiaKehamilanMinggu: '24',
      usiaKehamilanHari: '0'
    }
  });

  const selectedRole = watch('role');
  const genderAnakValue = watch('genderAnak');
  const weeksValStr = watch('usiaKehamilanMinggu') || '24';
  const daysValStr = watch('usiaKehamilanHari') !== undefined ? watch('usiaKehamilanHari') : '0';

  const weeksValue = parseInt(weeksValStr || '24') || 24;
  const daysValue = daysValStr !== undefined && !isNaN(parseInt(daysValStr)) ? parseInt(daysValStr) : 0;

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Menyesuaikan tipe data angka sebelum dikirim
      const payload = {
        ...data,
        usiaKehamilanMinggu: data.usiaKehamilanMinggu ? parseInt(data.usiaKehamilanMinggu) : undefined,
        usiaKehamilanHari: data.usiaKehamilanHari ? parseInt(data.usiaKehamilanHari) : undefined
      };

      const response = await apiClient.post('/auth/register', payload);
      
      // Mengarahkan pengguna ke halaman OTP setelah sukses mendaftar
      navigate('/verify-otp', { state: { userId: response.data.userId, email: data.email } });
      
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan saat pendaftaran');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex flex-col space-y-1.5 flex-1 text-left">
        <label className="block text-xs font-semibold text-[#2D3748] mb-0.5">{label}</label>
        <div className="flex items-center bg-white border border-gray-250 rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={handleDecrement}
            className="p-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-r border-gray-150"
            disabled={value <= min}
          >
            <Minus size={14} strokeWidth={2.5} />
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
            className="p-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-l border-gray-150"
            disabled={value >= max}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-gray-100">
        <h1 className="text-2xl font-bold text-[#194668] mb-2 text-center">Bergabung dengan BumilFit</h1>
        <p className="text-[#2D3748] text-center mb-6">Pilih peran Anda dan lengkapi data</p>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Pilihan Peran */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-2">Saya mendaftar sebagai:</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input type="radio" value="IBU_HAMIL" {...register('role')} className="text-[#389D9C] focus:ring-[#389D9C]"/>
                <span className="text-sm text-[#2D3748]">Ibu Hamil</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="DOKTER" {...register('role')} className="text-[#389D9C] focus:ring-[#389D9C]"/>
                <span className="text-sm text-[#2D3748]">Dokter</span>
              </label>
            </div>
          </div>

          <hr className="my-4" />

          {/* Kolom Umum */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-1">Email</label>
            <Input type="email" placeholder="nama@email.com" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-1">Password</label>
            <Input type="password" placeholder="Minimal 6 karakter" {...register('password')} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Form Dinamis Berdasarkan Peran */}
          {selectedRole === 'IBU_HAMIL' && (
            <div className="space-y-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-1">Nama Ibu</label>
                <Input type="text" placeholder="Masukkan nama Anda" {...register('namaIbu')} />
              </div>
              <div className="flex gap-4">
                <StepperInput 
                  label="Minggu Kehamilan"
                  value={weeksValue}
                  min={1}
                  max={42}
                  onChange={(val) => setValue('usiaKehamilanMinggu', val.toString())}
                />
                <StepperInput 
                  label="Hari Kehamilan"
                  value={daysValue}
                  min={0}
                  max={6}
                  onChange={(val) => setValue('usiaKehamilanHari', val.toString())}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-1">Nomor WhatsApp Aktif</label>
                <Input type="tel" placeholder="08xxxxxxxxxx" {...register('nomorWhatsapp')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-1">Nama Anak (Opsional)</label>
                <Input type="text" placeholder="Contoh: Si Kecil" {...register('namaAnak')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-2">Jenis Kelamin Anak (Opsional)</label>
                <div className="grid grid-cols-3 gap-2">
                  <GenderBadge
                    gender="LAKI_LAKI"
                    isInteractive={true}
                    isSelected={genderAnakValue === 'LAKI_LAKI'}
                    onClick={() => setValue('genderAnak', 'LAKI_LAKI')}
                  />
                  <GenderBadge
                    gender="PEREMPUAN"
                    isInteractive={true}
                    isSelected={genderAnakValue === 'PEREMPUAN'}
                    onClick={() => setValue('genderAnak', 'PEREMPUAN')}
                  />
                  <GenderBadge
                    gender="LAINNYA"
                    isInteractive={true}
                    isSelected={genderAnakValue === 'LAINNYA'}
                    onClick={() => setValue('genderAnak', 'LAINNYA')}
                  />
                </div>
                <input type="hidden" {...register('genderAnak')} />
              </div>
            </div>
          )}

          {selectedRole === 'DOKTER' && (
            <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-1">Nama Lengkap & Gelar</label>
                <Input type="text" placeholder="dr. Nama Anda, Sp.OG" {...register('namaDokter')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-1">Nomor STR Aktif</label>
                <Input type="text" placeholder="Untuk verifikasi legalitas" {...register('noSTR')} />
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full bg-[#194668] hover:bg-[#194668]/90 mt-6">
            {isLoading ? 'Memproses...' : 'Daftar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[#2D3748]">
          Sudah punya akun? <Link to="/login" className="text-[#389D9C] font-semibold hover:underline">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
};
