import { create } from 'zustand';
import api from '@/lib/api';
import { AMLScreeningResult, AMLMatch, RiskLevel } from '@/types/kyc';

const mapRisk = (score: number): RiskLevel => {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'medium';
  return 'low';
};

const transformScreening = (s: any): AMLScreeningResult => {
  const rawMatches = s.matches?.matches || s.matches || [];
  const matches: AMLMatch[] = rawMatches.map((m: any, i: number) => ({
    id: m.entryId ?? m.id ?? `match-${i}`,
    name: m.fullName ?? m.name ?? s.fullName,
    matchScore: Math.round((m.matchScore ?? m.score ?? 0) * 100),
    riskLevel: mapRisk(m.matchScore ?? m.score ?? 0),
    source: m.source ?? 'Sanctions',
    category: m.matchType ?? m.category ?? 'Sanctions',
    recommendation:
      (m.matchScore ?? 0) >= 0.95
        ? 'Immediate Review Required'
        : (m.matchScore ?? 0) >= 0.8
          ? 'Manual Review Required'
          : 'Low Priority Review',
    details:
      m.reason ?? m.details ?? `Match confidence: ${Math.round((m.matchScore ?? 0) * 100)}%`,
  }));

  const riskScore = s.riskScore ?? null;
  const overallRisk: RiskLevel =
    s.result === 'CLEAR'
      ? 'low'
      : s.result === 'MATCH'
        ? 'critical'
        : s.result === 'REVIEW'
          ? 'high'
          : riskScore != null
            ? mapRisk(riskScore)
            : matches.length > 0
              ? 'medium'
              : 'low';

  return {
    userId: s.id,
    userName: s.fullName,
    screenedAt: s.screenedAt ?? s.createdAt,
    totalMatches: matches.length,
    matches,
    overallRisk,
    riskScore,
    riskLevel: s.riskLevel ?? null,
    riskCategories: s.riskCategories ?? [],
    aiSummary: s.aiSummary ?? null,
    pep: s.pepResult ?? null,
    adverseMedia: s.adverseMediaResult ?? null,
  };
};

interface MonitoredEntry {
  id: string;
  fullName: string;
  country?: string;
  lastScreenedAt: string;
  status: string;
}

interface SanctionsStats {
  totalEntries: number;
  sources: Record<string, number>;
  lastRefreshed: string;
}

interface AmlState {
  screenings: AMLScreeningResult[];
  total: number;
  currentResult: AMLScreeningResult | null;
  monitored: MonitoredEntry[];
  sanctionsStats: SanctionsStats | null;
  isLoading: boolean;
  isScreening: boolean;
  isRefreshing: boolean;
  error: string | null;
  fetchScreenings: (skip?: number, take?: number) => Promise<void>;
  runScreening: (fullName: string, country?: string, dateOfBirth?: string) => Promise<void>;
  clearResult: () => void;
  enrollMonitoring: (screeningId: string) => Promise<void>;
  removeMonitoring: (screeningId: string) => Promise<void>;
  fetchMonitored: () => Promise<void>;
  refreshSanctions: () => Promise<void>;
  fetchSanctionsStats: () => Promise<void>;
}

export const useAmlStore = create<AmlState>((set, get) => ({
  screenings: [],
  total: 0,
  currentResult: null,
  monitored: [],
  sanctionsStats: null,
  isLoading: false,
  isScreening: false,
  isRefreshing: false,
  error: null,

  fetchScreenings: async (skip = 0, take = 50) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/aml/screenings', { params: { skip, take } });
      const data = res.data?.data ?? res.data;
      const raw = data.screenings ?? data ?? [];
      set({
        screenings: raw.map(transformScreening),
        total: data.total ?? raw.length,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load screenings',
        isLoading: false,
      });
    }
  },

  runScreening: async (fullName, country, dateOfBirth) => {
    set({ isScreening: true, error: null, currentResult: null });
    try {
      const res = await api.post('/aml/screen', { fullName, country, dateOfBirth });
      const data = res.data?.data ?? res.data;
      const result = transformScreening(data);
      set((state) => ({
        currentResult: result,
        screenings: [result, ...state.screenings],
        isScreening: false,
      }));
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Screening failed',
        isScreening: false,
      });
    }
  },

  clearResult: () => set({ currentResult: null }),

  enrollMonitoring: async (screeningId) => {
    set({ error: null });
    try {
      await api.post(`/aml/monitor/${screeningId}`);
      await get().fetchMonitored();
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to enroll monitoring' });
    }
  },

  removeMonitoring: async (screeningId) => {
    set({ error: null });
    try {
      await api.delete(`/aml/monitor/${screeningId}`);
      set((s) => ({ monitored: s.monitored.filter((m) => m.id !== screeningId) }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to remove monitoring' });
    }
  },

  fetchMonitored: async () => {
    try {
      const res = await api.get('/aml/monitor');
      const data = res.data?.data ?? res.data;
      set({ monitored: data.entries ?? data ?? [] });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load monitored entries' });
    }
  },

  refreshSanctions: async () => {
    set({ isRefreshing: true, error: null });
    try {
      await api.post('/aml/sanctions/refresh');
      await get().fetchSanctionsStats();
      set({ isRefreshing: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Sanctions refresh failed', isRefreshing: false });
    }
  },

  fetchSanctionsStats: async () => {
    try {
      const res = await api.get('/aml/sanctions/stats');
      set({ sanctionsStats: res.data?.data ?? res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load sanctions stats' });
    }
  },
}));
