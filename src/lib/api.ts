import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL
  ? `${(import.meta as any).env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('ch_api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// Registered by authStore to handle 401s without a hard page redirect.
let _unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  _unauthorizedHandler = fn;
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ch_api_key');
      localStorage.removeItem('ch_user');
      if (_unauthorizedHandler) {
        _unauthorizedHandler();
      } else {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
