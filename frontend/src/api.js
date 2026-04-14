import axios from 'axios';
import storage from './utils/storage';

// Forzamos rutas relativas para compatibilidad total con el Túnel de Cloudflare y desarrollo local
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yurbuster.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
  const token = storage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
