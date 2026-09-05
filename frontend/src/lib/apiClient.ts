import axios from 'axios';

const getBaseUrl = (): string => {
  // 1. Jika ada environment variable VITE_API_URL yang disetel eksplisit, gunakan itu
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Jika diakses dari browser pada domain lokal / loopback, gunakan backend lokal
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.'))
  ) {
    return 'http://localhost:5000/api';
  }

  // 3. Jika build production (seperti di Vercel) atau domain live lainnya, gunakan backend Render
  if (import.meta.env.PROD) {
    return 'https://bumilfit.onrender.com/api';
  }

  // 4. Fallback jika diakses dari hostname publik
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://bumilfit.onrender.com/api';
  }

  return 'http://localhost:5000/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  // Properti ini SANGAT PENTING agar browser mau menyimpan dan mengirim cookie sesi
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
