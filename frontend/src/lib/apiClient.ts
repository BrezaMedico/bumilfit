import axios from 'axios';

export const apiClient = axios.create({
  // URL ini mengarah ke server Express kita
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
