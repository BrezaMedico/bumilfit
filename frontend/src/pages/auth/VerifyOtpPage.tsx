import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useCountdownOTP } from '../../hooks/useCountdownOTP';

const otpSchema = z.object({
  kode: z.string().length(6, 'Kode OTP harus tepat 6 digit angka').regex(/^\d+$/, 'Hanya boleh berisi angka'),
});

type OtpForm = z.infer<typeof otpSchema>;

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seconds, canResend, resetCountdown } = useCountdownOTP(60);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ambil state dari halaman registrasi
  const userId = location.state?.userId;
  const email = location.state?.email;

  const { register, handleSubmit, formState: { errors } } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  // Proteksi: Jika tidak ada userId (akses langsung via URL), kembalikan ke register
  if (!userId) {
    return <Navigate to="/register" replace />;
  }

  const onSubmit = async (data: OtpForm) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await apiClient.post('/auth/verify-otp', {
        userId,
        kode: data.kode
      });
      
      // Jika berhasil, arahkan ke login agar pengguna bisa mendapatkan JWT
      navigate('/login', { replace: true });
      
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Kode OTP tidak valid atau kedaluwarsa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    // Logika kirim ulang (membutuhkan endpoint khusus di backend nantinya)
    resetCountdown();
    // await apiClient.post('/auth/resend-otp', { userId }); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-gray-100 text-center">
        <h1 className="text-2xl font-bold text-[#194668] mb-2">Verifikasi Email</h1>
        <p className="text-[#2D3748] mb-6">
          Masukkan 6 digit kode OTP yang telah dikirimkan ke email <br/>
          <span className="font-semibold text-[#389D9C]">{email}</span>
        </p>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input 
              type="text" 
              maxLength={6}
              placeholder="000000" 
              className={`text-center text-2xl tracking-[0.5em] font-semibold h-14 ${errors.kode ? 'border-red-500' : ''}`}
              {...register('kode')} 
            />
            {errors.kode && <p className="text-red-500 text-xs mt-2 text-left">{errors.kode.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-[#194668] hover:bg-[#194668]/90">
            {isLoading ? 'Memverifikasi...' : 'Verifikasi Akun'}
          </Button>
        </form>

        <div className="mt-6 text-sm text-[#2D3748]">
          Belum menerima kode?{' '}
          {canResend ? (
            <button onClick={handleResendOtp} className="text-[#389D9C] font-semibold hover:underline">
              Kirim Ulang
            </button>
          ) : (
            <span className="text-gray-400 cursor-not-allowed">
              Kirim ulang dalam {seconds} detik
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
