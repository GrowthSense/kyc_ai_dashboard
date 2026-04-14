/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Activity,
  Brain,
  CheckCircle,
  XCircle,
  Flag,
  AlertTriangle,
  Eye,
  Send,
  Lock
} from 'lucide-react';
import { KYCCase, DocumentType, KYCDocument } from '@/types/kyc';
import { StatusBadge, RiskBadge } from './StatusBadge';
import DocumentViewer from './DocumentViewer';
import ActionModal from './ActionModal';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import { fetchVerificationDocuments } from '@/redux/api/kycDocuments';
import { useCasesStore } from '@/stores/casesStore';
import { toast } from '@/hooks/use-toast';

interface CaseDetailProps {
  kycCase: KYCCase;
  onBack: () => void;
  onUpdateCase: (caseId: string, updates: Partial<KYCCase>) => void;
}

const documentTypeLabels: Record<DocumentType, string> = {
  id_front: 'ID Front',
  id_back: 'ID Back',
  selfie: 'Selfie',
  proof_of_address: 'Proof of Address',
  passport: 'Passport',
  utility_bill: 'Utility Bill'
};

type TabType = 'documents' | 'timeline' | 'ai' | 'notes';

const CaseDetail: React.FC<CaseDetailProps> = ({ kycCase, onBack, onUpdateCase }) => {
  const { user, hasPermission } = useAuth();
  const { fetchCaseDetail, selectedCase: detailCase, reviewCase } = useCasesStore();

  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'flag'>('approve');
  const [newNote, setNewNote] = useState('');

  // Document loading state
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Fetch full case detail (includes checks with real documentQuality/faceMatchScore)
  useEffect(() => {
    fetchCaseDetail(kycCase.id);
  }, [kycCase.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use the detailed case from the store if available (it has checks); fall back to prop
  const caseData = (detailCase?.id === kycCase.id ? detailCase : null) ?? kycCase;
  const aiResult = caseData.aiResult;

  // Fetch documents from the API endpoint
  useEffect(() => {
    let cancelled = false;

    async function loadDocs() {
      if (!kycCase?.id) return;

      setDocsLoading(true);
      setDocsError(null);

      try {
        const docs = await fetchVerificationDocuments(kycCase.id);
        if (!cancelled) {
          setDocuments(docs);
        }
      } catch (error: any) {
        if (!cancelled) {
          setDocsError(error?.message || 'Failed to load documents');
          console.error('Document fetch error:', error);
        }
      } finally {
        if (!cancelled) {
          setDocsLoading(false);
        }
      }
    }

    loadDocs();

    return () => {
      cancelled = true;
    };
  }, [kycCase?.id]);

  // Permission checks
  const canApprove = hasPermission('approve_case');
  const canReject = hasPermission('reject_case');
  const canFlag = hasPermission('flag_case');
  const canAddNotes = hasPermission('add_notes');

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openDocumentViewer = (index: number) => {
    setSelectedDocIndex(index);
    setDocumentViewerOpen(true);
  };

  const openActionModal = (type: 'approve' | 'reject' | 'flag') => {
    if (type === 'approve' && !canApprove) return;
    if (type === 'reject' && !canReject) return;
    if (type === 'flag' && !canFlag) return;
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleAction = async (action: 'approve' | 'reject' | 'flag', reason: string, notes: string) => {
    if (action === 'approve' || action === 'reject') {
      const backendStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      try {
        await reviewCase(
          kycCase.id,
          backendStatus,
          action === 'reject' ? reason : undefined,
          notes || undefined,
        );
        toast({
          title: action === 'approve' ? 'Case approved' : 'Case rejected',
          description: `${kycCase.userName}'s KYC case has been ${action}d.`,
        });
      } catch (err: any) {
        toast({
          title: 'Action failed',
          description: err?.message || 'Failed to update case status.',
          variant: 'destructive',
        });
        return;
      }
    }

    onUpdateCase(kycCase.id, {
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged',
    });
    setActionModalOpen(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !canAddNotes) return;

    onUpdateCase(kycCase.id, {
      notes: [
        ...kycCase.notes,
        {
          id: `note-${Date.now()}`,
          author: user?.name || 'Unknown',
          content: newNote,
          timestamp: new Date().toISOString()
        }
      ],
      timeline: [
        ...kycCase.timeline,
        {
          id: `tl-${Date.now()}`,
          type: 'note_added',
          description: 'Internal note added',
          timestamp: new Date().toISOString(),
          actor: user?.name || 'Unknown'
        }
      ]
    });

    setNewNote('');
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'submitted': return <FileText className="w-4 h-4" />;
      case 'document_uploaded': return <FileText className="w-4 h-4" />;
      case 'ai_review': return <Brain className="w-4 h-4" />;
      case 'manual_review': return <Eye className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'flagged': return <Flag className="w-4 h-4" />;
      case 'note_added': return <MessageSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'approved': return 'bg-emerald-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'flagged': return 'bg-orange-500 text-white';
      case 'ai_review': return 'bg-purple-500 text-white';
      default: return 'bg-amber-800 text-white';
    }
  };

  const tabs = useMemo(() => ([
    { id: 'documents' as TabType, label: 'Documents', icon: FileText, count: documents.length },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Activity, count: kycCase.timeline.length },
    { id: 'ai' as TabType, label: 'AI Analysis', icon: Brain, count: null },
    { id: 'notes' as TabType, label: 'Notes', icon: MessageSquare, count: kycCase.notes.length },
  ]), [documents.length, kycCase.timeline.length, kycCase.notes.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">{kycCase.id}</h1>
              <StatusBadge status={kycCase.status} />
              <RiskBadge level={kycCase.riskLevel} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Submitted {new Date(kycCase.submittedAt).toLocaleDateString()} • {kycCase.daysPending} days pending
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {kycCase.status === 'pending' || kycCase.status === 'under_review' || kycCase.status === 'needs_review' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => openActionModal('flag')}
              className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors"
            >
              <Flag className="w-4 h-4" />
              Flag
            </button>
            <button
              onClick={() => openActionModal('reject')}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => openActionModal('approve')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Case {kycCase.status} on {new Date(kycCase.lastUpdated).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Needs Review Banner */}
      {caseData.status === 'needs_review' && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-800">Manual Review Required</p>
              <p className="text-sm text-violet-600 mt-0.5">
                The AI verification could not auto-approve this case. A compliance officer must review and decide.
              </p>
              {caseData.reviewReasons && caseData.reviewReasons.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {caseData.reviewReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-violet-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - User Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar name={kycCase.userName} src={kycCase.userAvatar || null} size={80} className="mb-3" />
              <h3 className="font-semibold text-gray-900">{kycCase.userName}</h3>
              <p className="text-sm text-gray-500">{kycCase.userId}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 truncate">{kycCase.userEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{kycCase.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{kycCase.country}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Joined {new Date(kycCase.userJoinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Risk Summary Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="font-semibold text-gray-900 mb-4">Risk Summary</h4>

            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke={
                      aiResult.overallScore >= 80
                        ? '#10b981'
                        : aiResult.overallScore >= 60
                          ? '#f59e0b'
                          : aiResult.overallScore >= 40
                            ? '#f97316'
                            : '#ef4444'
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${aiResult.overallScore * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{aiResult.overallScore}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Document Quality</span>
                  <span className="font-medium">{Math.round(aiResult.documentQuality)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-800 rounded-full" style={{ width: `${aiResult.documentQuality}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Face Match</span>
                  <span className="font-medium">{Math.round(aiResult.faceMatchScore)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${aiResult.faceMatchScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">AI Confidence</span>
                  <span className="font-medium">{Math.round(aiResult.confidence)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${aiResult.confidence}%` }} />
                </div>
              </div>
            </div>

            {aiResult.watchlistHits > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{aiResult.watchlistHits} Watchlist Hit(s)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-amber-800 text-amber-800'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count !== null && (
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            activeTab === tab.id ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-5">
              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-3">
                  {docsLoading && <p className="text-sm text-gray-500">Loading documents…</p>}
                  {docsError && <p className="text-sm text-red-600">{docsError}</p>}

                  {!docsLoading && !docsError && documents.length === 0 && (
                    <p className="text-sm text-gray-500">No documents found for this user.</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {documents.map((doc, index) => {
                      return (
                        <div
                          key={doc.id}
                          onClick={() => openDocumentViewer(index)}
                          className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-amber-700 transition-colors"
                        >
                          {doc.url ? (
                            <img
                              src={doc.url}
                              alt={documentTypeLabels[doc.type]}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('[DOC THUMB ERROR]', doc.type, doc.url);
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                (e.currentTarget.parentElement as HTMLElement)
                                  ?.querySelector('.doc-placeholder')
                                  ?.classList.remove('hidden');
                              }}
                            />
                          ) : null}

                          <div className={`doc-placeholder absolute inset-0 flex flex-col items-center justify-center bg-gray-50 ${doc.url ? 'hidden' : ''}`}>
                            <FileText className="w-8 h-8 text-gray-300 mb-1" />
                            <span className="text-xs text-gray-400">Preview unavailable</span>
                          </div>

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs font-medium">
                              {documentTypeLabels[doc.type] || doc.type}
                            </p>
                          </div>

                          {doc.verified && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-6">
                    {[...kycCase.timeline].reverse().map((event) => (
                      <div key={event.id} className="relative flex gap-4 pl-10">
                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getTimelineColor(event.type)}`}>
                          {getTimelineIcon(event.type)}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm font-medium text-gray-900">{event.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                            {event.actor && (
                              <>
                                <span>•</span>
                                <span>{event.actor}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div
                    className={`p-4 rounded-lg border ${
                      aiResult.recommendation === 'approve'
                        ? 'bg-emerald-50 border-emerald-200'
                        : aiResult.recommendation === 'reject'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {aiResult.recommendation === 'approve' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : aiResult.recommendation === 'reject' ? (
                        <XCircle className="w-6 h-6 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      )}
                      <div>
                        <p
                          className={`font-semibold ${
                            aiResult.recommendation === 'approve'
                              ? 'text-emerald-800'
                              : aiResult.recommendation === 'reject'
                                ? 'text-red-800'
                                : 'text-amber-800'
                          }`}
                        >
                          AI Recommendation:{' '}
                          {aiResult.recommendation === 'approve'
                            ? 'Approve'
                            : aiResult.recommendation === 'reject'
                              ? 'Reject'
                              : 'Manual Review Required'}
                        </p>
                        <p
                          className={`text-sm ${
                            aiResult.recommendation === 'approve'
                              ? 'text-emerald-600'
                              : aiResult.recommendation === 'reject'
                                ? 'text-red-600'
                                : 'text-amber-600'
                          }`}
                        >
                          Confidence: {Math.round(aiResult.confidence)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {aiResult.flags.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <p className="text-gray-600">No flags detected by AI analysis</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {canAddNotes ? (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-amber-800 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add an internal note..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-gray-500">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">You don't have permission to add notes</span>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    {[...kycCase.notes].reverse().map((note) => (
                      <div key={note.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
                          {note.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{note.author}</span>
                            <span className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-600">{note.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal (IMPORTANT: use loaded documents, not kycCase.documents) */}
      <DocumentViewer
        documents={documents}
        initialIndex={selectedDocIndex}
        isOpen={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
      />

      <ActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleAction}
        actionType={actionType}
        kycCase={kycCase}
      />
    </div>
  );
};

export default CaseDetail;