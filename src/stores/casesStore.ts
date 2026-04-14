import { create } from 'zustand';
import api from '@/lib/api';
import { KYCCase, KYCStatus, RiskLevel } from '@/types/kyc';

interface BackendCase {
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
  documents?: any[];
  checks?: any[];
  auditTrail?: any[];
  needsManualReview?: boolean;
  aiReasons?: string[];
  aiExtractedData?: any;
}

interface AuditEntry {
  id: string;
  action: string;
  actorType: string;
  actorId?: string;
  caseId?: string;
  description?: string;
  before?: any;
  after?: any;
  createdAt: string;
}

const mapStatus = (s: string): KYCStatus => {
  const m: Record<string, KYCStatus> = {
    CREATED: 'pending', PENDING: 'pending', SUBMITTED: 'pending', DOCUMENTS_UPLOADED: 'pending',
    PROCESSING: 'under_review', IN_REVIEW: 'under_review',
    AWAITING_REVIEW: 'needs_review',
    APPROVED: 'approved', REJECTED: 'rejected', FLAGGED: 'flagged', EXPIRED: 'pending',
  };
  return m[s?.toUpperCase()] ?? 'pending';
};

/** Scores from the backend should be 0–1. If stored incorrectly as 0–100, normalise. */
const toDecimal = (v: number): number => (v > 1 ? v / 100 : v);

const mapRisk = (r: string): RiskLevel => {
  const m: Record<string, RiskLevel> = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };
  return m[r?.toUpperCase()] ?? 'medium';
};

const getCheckScore = (checks: any[], ...types: string[]): number | null => {
  const check = checks.find((ch: any) => types.includes((ch.checkType ?? '').toUpperCase()));
  return check?.score != null ? Math.round(toDecimal(check.score) * 100) : null;
};

const buildReviewReasons = (c: BackendCase): string[] => {
  const reasons: string[] = [];
  if (c.aiReasons?.length) return c.aiReasons;
  const ai = c.aiExtractedData;
  if (!ai) return reasons;
  if (ai.liveness?.livenessScore === 0 || ai.liveness?.isLive === false)
    reasons.push('Liveness check failed — face may be obscured or photo is unclear');
  if (ai.faceMatch?.faceMatchScore === 0 || ai.faceMatch?.isSamePerson === false)
    reasons.push('Face match could not be verified — selfie does not match document');
  if (ai.documentFraud?.docFraudScore > 30)
    reasons.push('Possible document tampering detected');
  if (ai.perCountryRisk?.perCountryRiskLevel === 'HIGH')
    reasons.push('High country risk — additional verification required');
  if (ai.overallRiskScore > 50)
    reasons.push(`Elevated risk score (${ai.overallRiskScore}/100)`);
  if (reasons.length === 0 && c.needsManualReview)
    reasons.push('AI confidence is below the auto-approval threshold');
  return reasons;
};

const transformCase = (c: BackendCase): KYCCase => {
  const risk = mapRisk(c.overallRiskLevel);
  const score = toDecimal(c.overallScore ?? 0);
  const checks = c.checks ?? [];

  // Extract real check scores when available (present on detail responses)
  const documentQuality =
    getCheckScore(checks, 'DOCUMENT_AUTHENTICITY', 'DOCUMENT_QUALITY') ??
    getCheckScore(checks, 'OCR_EXTRACTION', 'FRONT_BACK_CONSISTENCY') ??
    0;
  const faceMatchScore =
    getCheckScore(checks, 'FACE_MATCH') ??
    getCheckScore(checks, 'LIVENESS') ??
    0;
  const fraudFlags = checks.filter(
    (ch: any) => ch.checkType === 'FRAUD_DETECTION' && ch.status === 'FAILED',
  ).length;

  return {
    id: c.id,
    userId: c.externalUserId ?? c.id,
    userName: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Unknown',
    userEmail: '',
    userAvatar: '',
    userJoinDate: c.createdAt,
    status: mapStatus(c.status),
    riskLevel: risk,
    aiResult: {
      overallScore: Math.round(score * 100),
      confidence: Math.round(score * 100),
      flags: [],
      recommendation: score >= 0.8 ? 'approve' : score >= 0.5 ? 'manual_review' : 'reject',
      documentQuality,
      faceMatchScore,
      watchlistHits: fraudFlags,
    },
    submittedAt: c.submittedAt ?? c.createdAt,
    lastUpdated: c.updatedAt,
    daysPending: Math.max(0, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000)),
    documents: (c.documents || []).map((d: any) => ({
      id: d.id,
      type: d.type?.toLowerCase()?.includes('passport') ? 'passport' as const : 'id_front' as const,
      url: `/api/v1/verifications/${c.id}/documents/${d.id}/url`,
      uploadedAt: d.createdAt ?? c.createdAt,
      verified: c.status === 'APPROVED',
      aiScore: Math.round(score * 100),
    })),
    timeline: [],
    notes: c.reviewerNotes ? [{ id: '1', author: 'Reviewer', content: c.reviewerNotes, timestamp: c.updatedAt }] : [],
    country: c.country ?? '',
    phoneNumber: '',
    reviewReasons: buildReviewReasons(c),
  };
};

interface AnalyticsData {
  totalCases: number;
  pendingCases: number;
  approvedCases: number;
  rejectedCases: number;
  flaggedCases: number;
  averageProcessingTime: number;
  approvalRate: number;
  riskDistribution: Record<string, number>;
  casesByCountry: Record<string, number>;
  recentActivity: any[];
}

interface CasesState {
  cases: KYCCase[];
  total: number;
  isLoading: boolean;
  error: string | null;
  selectedCase: KYCCase | null;
  auditTrail: AuditEntry[];
  analytics: AnalyticsData | null;
  globalAuditTrail: AuditEntry[];
  globalAuditTotal: number;
  fetchCases: (status?: string, skip?: number, take?: number) => Promise<void>;
  fetchCaseDetail: (id: string) => Promise<void>;
  reviewCase: (id: string, status: string, rejectionReason?: string, reviewerNotes?: string) => Promise<void>;
  clearSelected: () => void;
  fetchAnalytics: () => Promise<void>;
  fetchGlobalAuditTrail: (skip?: number, take?: number) => Promise<void>;
}

export const useCasesStore = create<CasesState>((set) => ({
  cases: [],
  total: 0,
  isLoading: false,
  error: null,
  selectedCase: null,
  auditTrail: [],
  analytics: null,
  globalAuditTrail: [],
  globalAuditTotal: 0,

  fetchCases: async (status, skip = 0, take = 50) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { skip, take };
      if (status && status !== 'all') params.status = status.toUpperCase();
      const res = await api.get('/dashboard/cases', { params });
      const data = res.data?.data ?? res.data;
      const rawCases = data.cases ?? data ?? [];
      set({
        cases: rawCases.map(transformCase),
        total: data.total ?? rawCases.length,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load cases', isLoading: false });
    }
  },

  fetchCaseDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/dashboard/cases/${id}`);
      const data = res.data?.data ?? res.data;
      const raw = data.case ?? data;
      const trail = data.auditTrail ?? [];
      set({
        selectedCase: transformCase(raw),
        auditTrail: trail,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load case', isLoading: false });
    }
  },

  reviewCase: async (id, status, rejectionReason, reviewerNotes) => {
    try {
      await api.patch(`/dashboard/cases/${id}/review`, { status, rejectionReason, reviewerNotes });
      const res = await api.get(`/dashboard/cases/${id}`);
      const data = res.data?.data ?? res.data;
      const raw = data.case ?? data;
      set({ selectedCase: transformCase(raw) });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Review failed';
      set({ error: message });
      throw new Error(message);
    }
  },

  clearSelected: () => set({ selectedCase: null, auditTrail: [] }),

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/dashboard/analytics');
      set({ analytics: res.data?.data ?? res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load analytics', isLoading: false });
    }
  },

  fetchGlobalAuditTrail: async (skip = 0, take = 50) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/dashboard/audit-trail', { params: { skip, take } });
      const data = res.data?.data ?? res.data;
      const entries = data.logs ?? data.entries ?? data.trail ?? data ?? [];
      set({
        globalAuditTrail: entries,
        globalAuditTotal: data.total ?? entries.length,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load audit trail', isLoading: false });
    }
  },
}));
