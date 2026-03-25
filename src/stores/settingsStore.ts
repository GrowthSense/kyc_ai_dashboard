import { create } from 'zustand';
import api from '@/lib/api';

export interface ApiKey {
  id: string;
  label: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  active: boolean;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UserPreferences {
  notifications: {
    highRiskAlerts: boolean;
    newCases: boolean;
    caseUpdates: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: string;
  };
  display: {
    language: string;
    timezone: string;
    dateFormat: string;
    theme: string;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    highRiskAlerts: true,
    newCases: true,
    caseUpdates: false,
    dailyDigest: true,
    weeklyReport: true,
  },
  security: {
    twoFactor: false,
    sessionTimeout: '30',
  },
  display: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
  },
};

interface SettingsState {
  tenant: any;
  config: any;
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
  userProfile: any;
  preferences: UserPreferences;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  fetchTenant: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
  createApiKey: (data: { label: string; scopes: string[] }) => Promise<string | null>;
  fetchApiKeys: () => Promise<void>;
  revokeApiKey: (id: string) => Promise<void>;
  createWebhook: (data: { url: string; events: string[] }) => Promise<void>;
  fetchWebhooks: () => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  deleteUserData: (externalUserId: string) => Promise<boolean>;
  loadUserProfile: () => Promise<void>;
  saveUserProfile: (name: string) => Promise<void>;
  savePreferences: (prefs: UserPreferences) => Promise<void>;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  clearMessages: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  tenant: null,
  config: null,
  apiKeys: [],
  webhooks: [],
  userProfile: null,
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,
  isSaving: false,
  error: null,
  success: null,

  loadUserProfile: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data ?? res.data;
      const prefs = user?.preferences ?? {};
      set({
        userProfile: user,
        preferences: {
          notifications: { ...DEFAULT_PREFERENCES.notifications, ...(prefs.notifications ?? {}) },
          security: { ...DEFAULT_PREFERENCES.security, ...(prefs.security ?? {}) },
          display: { ...DEFAULT_PREFERENCES.display, ...(prefs.display ?? {}) },
        },
      });
    } catch { /* use defaults */ }
  },

  saveUserProfile: async (name: string) => {
    set({ isSaving: true, error: null, success: null });
    try {
      const res = await api.patch('/auth/me', { name });
      const user = res.data?.data ?? res.data;
      set({ userProfile: user, isSaving: false, success: 'Profile saved' });
      // Update localStorage so AuthContext reflects the name change
      const stored = localStorage.getItem('ch_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem('ch_user', JSON.stringify({ ...parsed, name }));
        } catch { /* ignore */ }
      }
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: any) {
      set({ isSaving: false, error: err.response?.data?.message || 'Failed to save profile' });
    }
  },

  savePreferences: async (prefs: UserPreferences) => {
    set({ isSaving: true, error: null, success: null });
    try {
      await api.patch('/auth/me', { preferences: prefs });
      set({ preferences: prefs, isSaving: false, success: 'Preferences saved' });
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: any) {
      set({ isSaving: false, error: err.response?.data?.message || 'Failed to save preferences' });
    }
  },

  setPreferences: (partial) => {
    const current = get().preferences;
    set({ preferences: { ...current, ...partial } });
  },

  fetchTenant: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tenants/me');
      set({ tenant: res.data?.data ?? res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load tenant', isLoading: false });
    }
  },

  fetchConfig: async () => {
    try {
      const res = await api.get('/tenants/me/config');
      set({ config: res.data?.data ?? res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load config' });
    }
  },

  updateConfig: async (config) => {
    set({ isSaving: true, error: null, success: null });
    try {
      const { autoApproveThreshold, reviewThreshold, checkWeights, requiredChecks, countryRules, riskThresholds, brandingSettings } = config;
      const dto = { autoApproveThreshold, reviewThreshold, checkWeights, requiredChecks, countryRules, riskThresholds, brandingSettings };
      const res = await api.put('/tenants/me/config', dto);
      set({ config: res.data?.data ?? res.data, isSaving: false, success: 'Configuration saved' });
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: any) {
      set({ isSaving: false, error: err.response?.data?.message || 'Failed to update config' });
    }
  },

  createApiKey: async (data) => {
    set({ error: null, success: null });
    try {
      const res = await api.post('/tenants/me/api-keys', data);
      const raw = res.data?.data ?? res.data;
      await get().fetchApiKeys();
      set({ success: 'API key created' });
      setTimeout(() => set({ success: null }), 3000);
      return raw.apiKey ?? raw.rawKey ?? raw.key ?? null;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create API key' });
      return null;
    }
  },

  fetchApiKeys: async () => {
    try {
      const res = await api.get('/tenants/me/api-keys');
      const data = res.data?.data ?? res.data;
      set({ apiKeys: data.keys ?? (Array.isArray(data) ? data : []) });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load API keys' });
    }
  },

  revokeApiKey: async (id) => {
    set({ error: null, success: null });
    try {
      await api.delete(`/tenants/me/api-keys/${id}`);
      set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== id), success: 'API key revoked' }));
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to revoke API key' });
    }
  },

  createWebhook: async (data) => {
    set({ error: null, success: null });
    try {
      await api.post('/webhooks', data);
      await get().fetchWebhooks();
      set({ success: 'Webhook registered' });
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create webhook' });
    }
  },

  fetchWebhooks: async () => {
    try {
      const res = await api.get('/webhooks');
      const data = res.data?.data ?? res.data;
      set({ webhooks: Array.isArray(data) ? data : (data.endpoints ?? []) });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load webhooks' });
    }
  },

  deleteWebhook: async (id) => {
    set({ error: null, success: null });
    try {
      await api.delete(`/webhooks/${id}`);
      set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== id), success: 'Webhook deleted' }));
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to delete webhook' });
    }
  },

  deleteUserData: async (externalUserId) => {
    set({ error: null, success: null });
    try {
      await api.delete(`/gdpr/users/${externalUserId}`);
      set({ success: 'User data deleted (GDPR)' });
      setTimeout(() => set({ success: null }), 3000);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'GDPR deletion failed' });
      return false;
    }
  },

  clearMessages: () => set({ error: null, success: null }),
}));
