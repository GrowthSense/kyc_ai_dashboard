import api from '@/lib/api';
import { KYCDocument, DocumentType } from '@/types/kyc';

interface BackendDoc {
  id: string;
  type: string;
  mimeType?: string;
  originalName: string;
  status: string;
  uploadedAt: string;
}

function mapDocType(backendType: string): DocumentType {
  const map: Record<string, DocumentType> = {
    PASSPORT_FRONT: 'passport',
    PASSPORT_BACK: 'passport',
    NATIONAL_ID_FRONT: 'id_front',
    NATIONAL_ID_BACK: 'id_back',
    DRIVERS_LICENSE_FRONT: 'id_front',
    DRIVERS_LICENSE_BACK: 'id_back',
    SELFIE: 'selfie',
    FACE: 'selfie',
    PORTRAIT: 'selfie',
    PROOF_OF_ADDRESS: 'proof_of_address',
    OTHER: 'id_front',
  };
  return map[backendType] ?? 'id_front';
}

export async function fetchVerificationDocuments(caseId: string): Promise<KYCDocument[]> {
  const res = await api.get(`/verifications/${caseId}/documents`);
  // API may return the array directly or wrapped in { data: [...] }
  const raw = res.data?.data ?? res.data;
  const docs: BackendDoc[] = Array.isArray(raw) ? raw : [];

  const results = await Promise.all(
    docs.map(async (doc): Promise<KYCDocument> => {
      let url = '';
      try {
        const resp = await api.get(`/verifications/${caseId}/documents/${doc.id}/content`, {
          responseType: 'blob',
        });
        url = URL.createObjectURL(resp.data as Blob);
      } catch (err: any) {
        console.error(
          `[kycDocuments] Failed to fetch content for doc ${doc.id} (case ${caseId}):`,
          err?.response?.status,
          err?.response?.data,
          err?.message,
        );
      }

      return {
        id: doc.id,
        type: mapDocType(doc.type),
        url,
        uploadedAt: doc.uploadedAt,
        verified: doc.status === 'ACTIVE',
        aiScore: 0,
      };
    }),
  );

  return results;
}
