import axios from 'axios';
import { KYCCase, KYCStatus, RiskLevel } from '@/types/kyc';

/**
 * Use /api proxy which routes to http://localhost:8002 via Vite dev server
 * This bypasses CORS issues in development
 */
const API_BASE = '/api';

/**
 * Create axios instance with proper headers
 */
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

interface BackendKYCCase {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  country: string;
  status: string;
  rejectionReason: string | null;
  aiScore: number;
  aiRiskLevel: string;
  aiApproved: boolean;
  needsManualReview: boolean;
  aiExtractedData: any;
  aiReasons: string[];
  documentsUpdatedAt: string;
  lastEvaluatedAt: string;
  aiHistory: any[];
  resubmittedAt: string | null;
  resubmissionCount: number;
  createdAt: string;
  updatedAt: string;
  documents: Array<{
    id: string;
    caseId: string;
    type: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    status: string;
    replacedAt: string | null;
    uploadedAt: string;
  }>;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

// Map backend status to KYCStatus
const mapStatus = (status: string): KYCStatus => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
      return 'pending';
    case 'UNDER_REVIEW':
      return 'under_review';
    default:
      return 'pending';
  }
};

// Map backend risk level to RiskLevel
const mapRiskLevel = (risk: string): RiskLevel => {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case 'critical':
      return 'critical';
    default:
      return 'medium';
  }
};

// Transform backend data to frontend KYCCase
const transformKYCCase = (backendCase: BackendKYCCase): KYCCase => {
  const riskLevel = mapRiskLevel(backendCase.aiRiskLevel);
  
  return {
    id: backendCase.id,
    userId: backendCase.userId,
    userName: `${backendCase.firstName} ${backendCase.lastName}`,
    userEmail: '', // Not provided by backend
    userAvatar: '', // Not provided by backend
    userJoinDate: backendCase.createdAt,
    status: mapStatus(backendCase.status),
    riskLevel,
    aiResult: {
      overallScore: backendCase.aiScore,
      confidence: backendCase.aiExtractedData?.matchConfidence || backendCase.aiScore,
      flags: backendCase.aiReasons.map((reason, idx) => ({
        type: reason,
        severity: riskLevel,
        description: reason,
      })),
      recommendation: backendCase.aiApproved ? 'approve' : backendCase.needsManualReview ? 'manual_review' : 'reject',
      documentQuality: backendCase.aiExtractedData?.frontBackConsistency?.frontBackConsistencyScore || 0,
      faceMatchScore: backendCase.aiExtractedData?.faceMatch?.faceMatchScore || 0,
      watchlistHits: 0,
    },
    submittedAt: backendCase.createdAt,
    lastUpdated: backendCase.updatedAt,
    daysPending: Math.floor((Date.now() - new Date(backendCase.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    documents: backendCase.documents.map(doc => ({
      id: doc.id,
      type: doc.type.toLowerCase().includes('passport') ? 'passport' : 'id_front',
      url: `/documents/${doc.id}`,
      uploadedAt: doc.uploadedAt,
      verified: backendCase.aiApproved,
      aiScore: backendCase.aiScore,
    })),
    timeline: [
      {
        id: backendCase.id,
        type: backendCase.aiApproved ? 'approved' : backendCase.needsManualReview ? 'manual_review' : 'rejected',
        description: `Case ${mapStatus(backendCase.status).toUpperCase()}`,
        timestamp: backendCase.lastEvaluatedAt,
      },
    ],
    notes: [],
    country: backendCase.country,
    phoneNumber: '', // Not provided by backend
  };
};

export const fetchKYCCases = async (): Promise<KYCCase[]> => {
  try {
    console.log("📡 API Call: GET", `${API_BASE}/kyc/cases`);
    
    const response = await axiosInstance.get<ApiResponse<BackendKYCCase[]>>(`/kyc/cases`);
    
    console.log("📡 API Response:", {
      status: response.data.status,
      count: response.data.data?.length || 0,
      statusCode: response.status
    });
    
    if (response.data.status === 'success' && Array.isArray(response.data.data)) {
      const transformed = response.data.data.map(transformKYCCase);
      console.log("✅ Transformed", transformed.length, "KYC cases");
      return transformed;
    }
    
    console.warn("⚠️ Invalid response format:", response.data);
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching KYC cases:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      data: error?.response?.data
    });
    throw error;
  }
};

export const fetchKYCCaseById = async (caseId: string): Promise<KYCCase | null> => {
  try {
    const response = await axiosInstance.get<ApiResponse<BackendKYCCase>>(`/kyc/cases/${caseId}`);
    
    if (response.data.status === 'success' && response.data.data) {
      return transformKYCCase(response.data.data);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching KYC case ${caseId}:`, error);
    throw error;
  }
};
