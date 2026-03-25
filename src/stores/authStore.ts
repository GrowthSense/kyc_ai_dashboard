import { create } from 'zustand';
import api, { setUnauthorizedHandler } from '@/lib/api';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: AuthUser | null;
  apiKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, companyName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  restoreSession: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  apiKey: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, apiKey } = res.data?.data ?? res.data;
      localStorage.setItem('ch_api_key', apiKey);
      localStorage.setItem('ch_user', JSON.stringify(user));
      set({ user, apiKey, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || 'Login failed';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password, companyName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password, companyName });
      const { user, apiKey } = res.data?.data ?? res.data;
      localStorage.setItem('ch_api_key', apiKey);
      localStorage.setItem('ch_user', JSON.stringify(user));
      set({ user, apiKey, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || 'Registration failed';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('ch_api_key');
    localStorage.removeItem('ch_user');
    set({ user: null, apiKey: null, isAuthenticated: false, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),

  restoreSession: () => {
    const storedKey = localStorage.getItem('ch_api_key');
    const storedUser = localStorage.getItem('ch_user');
    if (storedKey && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ user, apiKey: storedKey, isAuthenticated: true, isLoading: false });
        return;
      } catch { /* fall through */ }
    }
    set({ isLoading: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data ?? res.data;
      localStorage.setItem('ch_user', JSON.stringify(user));
      set({ user });
    } catch { /* silently fail - user data from login is still valid */ }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  },
}));

// Register the 401 handler so API errors trigger React state logout
// instead of a hard page redirect. Must be called after store creation.
setUnauthorizedHandler(() => useAuthStore.getState().logout());
