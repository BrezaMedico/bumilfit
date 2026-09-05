import axios from 'axios';

const getBaseUrl = (): string => {
  let url = import.meta.env.VITE_API_URL;

  // Jika tidak ada environment variable VITE_API_URL
  if (!url) {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.'))
    ) {
      return 'http://localhost:5000/api';
    }
    return 'https://bumilfit.onrender.com/api';
  }

  // Normalisasi: jika pengguna hanya mengisi domain (misal: 'https://bumilfit.onrender.com'), otomatis tambahkan '/api'
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
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
