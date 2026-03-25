import { create } from 'zustand';
import api from '@/lib/api';

export interface KybVerification {
  id: string;
  tenantId: string;
  companyName: string;
  registrationNumber?: string;
  jurisdiction: string;
  status: string;
  riskLevel?: string;
  ubos: Ubo[];
  createdAt: string;
  updatedAt: string;
}

export interface Ubo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  ownershipPercentage?: number;
  kycVerified?: boolean;
  linkedVerificationCaseId?: string;
  createdAt: string;
}

interface KybState {
  verifications: KybVerification[];
  total: number;
  selected: KybVerification | null;
  isLoading: boolean;
  error: string | null;
  createVerification: (data: {
    companyName: string;
    registrationNumber: string;
    jurisdiction: string;
  }) => Promise<KybVerification | null>;
  fetchVerifications: (params?: { skip?: number; take?: number }) => Promise<void>;
  fetchVerification: (id: string) => Promise<void>;
  addUbo: (
    id: string,
    data: {
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      nationality?: string;
      ownershipPercentage?: number;
    },
  ) => Promise<void>;
  triggerUboKyc: (id: string, uboId: string) => Promise<void>;
  reviewVerification: (id: string, decision: string, rejectionReason?: string) => Promise<void>;
  clearSelected: () => void;
}

export const useKybStore = create<KybState>((set, get) => ({
  verifications: [],
  total: 0,
  selected: null,
  isLoading: false,
  error: null,

  createVerification: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/kyb/verifications', data);
      const v = res.data?.data ?? res.data;
      set((s) => ({
        verifications: [v, ...s.verifications],
        isLoading: false,
      }));
      return v;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to create KYB verification',
        isLoading: false,
      });
      return null;
    }
  },

  fetchVerifications: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/kyb/verifications', { params });
      const data = res.data?.data ?? res.data;
      const list = data.items ?? data.verifications ?? data ?? [];
      set({
        verifications: Array.isArray(list) ? list : [],
        total: data.total ?? list.length,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load KYB verifications',
        isLoading: false,
      });
    }
  },

  fetchVerification: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/kyb/verifications/${id}`);
      set({ selected: res.data?.data ?? res.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load KYB verification',
        isLoading: false,
      });
    }
  },

  addUbo: async (id, data) => {
    set({ error: null });
    try {
      await api.post(`/kyb/verifications/${id}/ubos`, data);
      await get().fetchVerification(id);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to add UBO' });
    }
  },

  triggerUboKyc: async (id, uboId) => {
    set({ error: null });
    try {
      await api.post(`/kyb/verifications/${id}/ubos/${uboId}/kyc`);
      await get().fetchVerification(id);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to trigger KYC for UBO' });
    }
  },

  reviewVerification: async (id, decision, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/kyb/verifications/${id}/review`, { decision, rejectionReason });
      await get().fetchVerification(id);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Review failed', isLoading: false });
    }
  },

  clearSelected: () => set({ selected: null }),
}));
