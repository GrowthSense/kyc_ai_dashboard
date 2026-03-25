import { create } from 'zustand';
import api from '@/lib/api';

export interface Verification {
  id: string;
  tenantId: string;
  externalUserId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  country: string;
  type: string;
  status: string;
  overallScore: number;
  overallRiskLevel: string;
  rejectionReason?: string;
  reviewerNotes?: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationCheck {
  id: string;
  checkType: string;
  status: string;
  score: number;
  details: any;
  createdAt: string;
}

export interface VerificationDocument {
  id: string;
  type: string;
  originalName: string;
  mimeType: string;
  status: string;
  createdAt: string;
}

interface VerificationState {
  verifications: Verification[];
  total: number;
  selected: Verification | null;
  checks: VerificationCheck[];
  documents: VerificationDocument[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  createVerification: (data: {
    externalUserId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    dateOfBirth?: string;
    country: string;
    type?: string;
  }) => Promise<Verification | null>;
  fetchVerifications: (params?: { status?: string; country?: string; skip?: number; take?: number }) => Promise<void>;
  fetchVerification: (id: string) => Promise<void>;
  fetchChecks: (id: string) => Promise<void>;
  uploadDocument: (id: string, file: File, documentType: string) => Promise<void>;
  fetchDocuments: (id: string) => Promise<void>;
  getDocumentUrl: (caseId: string, docId: string) => string;
  submitVerification: (id: string) => Promise<void>;
  reviewVerification: (id: string, status: string, rejectionReason?: string, reviewerNotes?: string) => Promise<void>;
  resubmitVerification: (id: string) => Promise<void>;
  clearSelected: () => void;
}

export const useVerificationStore = create<VerificationState>((set, get) => ({
  verifications: [],
  total: 0,
  selected: null,
  checks: [],
  documents: [],
  isLoading: false,
  isUploading: false,
  error: null,

  createVerification: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        externalUserId: data.externalUserId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        dateOfBirth: data.dateOfBirth,
        type: data.type,
      };
      const res = await api.post('/verifications', payload);
      const v = res.data?.data ?? res.data;
      set((s) => ({ verifications: [v, ...s.verifications], isLoading: false }));
      return v;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create verification', isLoading: false });
      return null;
    }
  },

  fetchVerifications: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/verifications', { params });
      const data = res.data?.data ?? res.data;
      const list = data.cases ?? data.verifications ?? data ?? [];
      set({ verifications: Array.isArray(list) ? list : [], total: data.total ?? list.length, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load verifications', isLoading: false });
    }
  },

  fetchVerification: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/verifications/${id}`);
      const data = res.data?.data ?? res.data;
      set({ selected: data.case ?? data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load verification', isLoading: false });
    }
  },

  fetchChecks: async (id) => {
    try {
      const res = await api.get(`/verifications/${id}/checks`);
      const data = res.data?.data ?? res.data;
      set({ checks: data.checks ?? data ?? [] });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load checks' });
    }
  },

  uploadDocument: async (id, file, documentType) => {
    set({ isUploading: true, error: null });
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', documentType);
      await api.post(`/verifications/${id}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await get().fetchDocuments(id);
      set({ isUploading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Upload failed', isUploading: false });
    }
  },

  fetchDocuments: async (id) => {
    try {
      const res = await api.get(`/verifications/${id}/documents`);
      const data = res.data?.data ?? res.data;
      set({ documents: data.documents ?? data ?? [] });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load documents' });
    }
  },

  getDocumentUrl: (caseId, docId) => `/api/v1/verifications/${caseId}/documents/${docId}/url`,

  submitVerification: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/verifications/${id}/submit`);
      await get().fetchVerification(id);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Submit failed', isLoading: false });
    }
  },

  reviewVerification: async (id, status, rejectionReason, reviewerNotes) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/verifications/${id}/review`, { status, rejectionReason, reviewerNotes });
      await get().fetchVerification(id);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Review failed', isLoading: false });
    }
  },

  resubmitVerification: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/verifications/${id}/resubmit`);
      await get().fetchVerification(id);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Resubmit failed', isLoading: false });
    }
  },

  clearSelected: () => set({ selected: null, checks: [], documents: [] }),
}));
