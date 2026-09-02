import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// Skema validasi Zod untuk sisi client
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiClient.post('/auth/login', data);
      
      // Karena JWT disimpan aman di cookie oleh backend, kita cukup mengarahkan user
      if (response.data.role === 'IBU_HAMIL') {
        navigate('/');
      } else {
        navigate('/dokter/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-gray-100">
        <h1 className="text-2xl font-bold text-[#194668] mb-2 text-center">Masuk ke BumilFit</h1>
        <p className="text-[#2D3748] text-center mb-6">Pantau kehamilanmu dengan mudah</p>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-1">Email</label>
            <Input 
              type="email" 
              placeholder="nama@email.com" 
              {...register('email')} 
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-1">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              {...register('password')} 
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-[#194668] hover:bg-[#194668]/90">
            {isLoading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[#2D3748]">
          Belum punya akun? <Link to="/register" className="text-[#389D9C] font-semibold hover:underline">Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
};
