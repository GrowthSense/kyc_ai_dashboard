export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'under_review' | 'needs_review';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DocumentType = 'id_front' | 'id_back' | 'selfie' | 'proof_of_address' | 'passport' | 'utility_bill';

export interface KYCDocument {
  id: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
  verified: boolean;
  aiScore: number;
}

export interface AIRiskEvaluation {
  overallScore: number;
  confidence: number;
  flags: {
    type: string;
    severity: RiskLevel;
    description: string;
  }[];
  recommendation: 'approve' | 'reject' | 'manual_review';
  documentQuality: number;
  faceMatchScore: number;
  watchlistHits: number;
}

export interface TimelineEvent {
  id: string;
  type: 'submitted' | 'ai_review' | 'manual_review' | 'approved' | 'rejected' | 'flagged' | 'note_added' | 'document_uploaded';
  description: string;
  timestamp: string;
  actor?: string;
}

export interface InternalNote {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface KYCCase {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  userJoinDate: string;
  status: KYCStatus;
  riskLevel: RiskLevel;
  aiResult: AIRiskEvaluation;
  submittedAt: string;
  lastUpdated: string;
  daysPending: number;
  documents: KYCDocument[];
  timeline: TimelineEvent[];
  notes: InternalNote[];
  country: string;
  phoneNumber: string;
  reviewReasons?: string[];
}

export interface AMLMatch {
  id: string;
  name: string;
  matchScore: number;
  riskLevel: RiskLevel;
  source: string;
  category: string;
  recommendation: string;
  details: string;
}

export interface AdverseMediaArticle {
  title: string;
  url: string;
  source: string;
  date: string;
  isAdverse: boolean;
  categories: string[];
  severity: 'low' | 'medium' | 'high';
  snippet: string;
}

export interface PepInfo {
  isPep: boolean;
  confidence: number;
  details: string;
  position?: string;
  country?: string;
  dbMatches?: AMLMatch[];
}

export interface AMLScreeningResult {
  userId: string;
  userName: string;
  screenedAt: string;
  totalMatches: number;
  matches: AMLMatch[];
  overallRisk: RiskLevel;
  riskScore: number | null;
  riskLevel: string | null;
  riskCategories: string[];
  aiSummary: string | null;
  pep: PepInfo | null;
  adverseMedia: {
    articles: AdverseMediaArticle[];
    totalFound: number;
    adverseCount: number;
    categories: string[];
    hasAdverseMedia: boolean;
  } | null;
}
