import React, { useEffect, useState } from 'react';
import {
  Plus,
  Building2,
  Users,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useKybStore, KybVerification, Ubo } from '@/stores/kybStore';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES } from '@/lib/countries';

type SubView = 'list' | 'create' | 'detail';

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-amber-100 text-amber-800',
  DOCUMENTS_UPLOADED: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  AWAITING_REVIEW: 'bg-teal-100 text-teal-800',
  IN_REVIEW: 'bg-teal-100 text-teal-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const riskColors: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const KYBVerificationPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const store = useKybStore();
  const [subView, setSubView] = useState<SubView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ companyName: '', registrationNumber: '', jurisdiction: '' });
  const [uboForm, setUboForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', nationality: '', ownershipPercentage: 0 });
  const [showUboForm, setShowUboForm] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    store.fetchVerifications();
  }, []);

  const handleCreate = async () => {
    if (!form.companyName || !form.jurisdiction) return;
    const result = await store.createVerification(form);
    if (result) {
      setForm({ companyName: '', registrationNumber: '', jurisdiction: '' });
      setSubView('list');
    }
  };

  const handleViewDetail = async (v: KybVerification) => {
    await store.fetchVerification(v.id);
    setSubView('detail');
  };

  const handleAddUbo = async () => {
    if (!store.selected || !uboForm.firstName || !uboForm.lastName) return;
    await store.addUbo(store.selected.id, {
      firstName: uboForm.firstName,
      lastName: uboForm.lastName,
      dateOfBirth: uboForm.dateOfBirth || undefined,
      nationality: uboForm.nationality || undefined,
      ownershipPercentage: uboForm.ownershipPercentage || undefined,
    });
    setUboForm({ firstName: '', lastName: '', dateOfBirth: '', nationality: '', ownershipPercentage: 0 });
    setShowUboForm(false);
  };

  const handleTriggerKyc = async (uboId: string) => {
    if (!store.selected) return;
    await store.triggerUboKyc(store.selected.id, uboId);
  };

  const handleReview = async () => {
    if (!store.selected || !reviewDecision) return;
    await store.reviewVerification(store.selected.id, reviewDecision, reviewNotes || undefined);
    setReviewDecision('');
    setReviewNotes('');
  };

  const filtered = store.verifications.filter((v) => {
    return !searchTerm || v.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (subView === 'create') {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setSubView('list')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-800" />
            New Business Verification (KYB)
          </h2>
          {store.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{store.error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input type="text" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction *</label>
              <select value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none">
                <option value="">Select jurisdiction...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setSubView('list')} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={store.isLoading || !form.companyName || !form.jurisdiction} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50">
              {store.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'detail' && store.selected) {
    const v = store.selected;
    const ubos: Ubo[] = v.ubos ?? [];
    return (
      <div className="space-y-6">
        <button onClick={() => { store.clearSelected(); setSubView('list'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>
        {store.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{store.error}</div>
        )}

        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{v.companyName}</h2>
                <p className="text-sm text-gray-500">Reg: {v.registrationNumber || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[v.status] ?? 'bg-gray-100 text-gray-700'}`}>{v.status}</span>
              {v.riskLevel && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskColors[v.riskLevel] ?? 'bg-gray-100 text-gray-700'}`}>{v.riskLevel}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Jurisdiction:</span> <span className="text-gray-900 ml-1">{v.jurisdiction}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="text-gray-900 ml-1">{new Date(v.createdAt).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">Updated:</span> <span className="text-gray-900 ml-1">{new Date(v.updatedAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* UBOs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-800" />
              Ultimate Beneficial Owners ({ubos.length})
            </h3>
            {hasPermission('create_kyb') && (
              <button onClick={() => setShowUboForm(!showUboForm)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-800 text-white rounded-lg hover:bg-amber-900">
                <UserPlus className="w-4 h-4" /> Add UBO
              </button>
            )}
          </div>

          {showUboForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={uboForm.firstName} onChange={(e) => setUboForm({ ...uboForm, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" value={uboForm.lastName} onChange={(e) => setUboForm({ ...uboForm, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ownership %</label>
                  <input type="number" min={0} max={100} value={uboForm.ownershipPercentage} onChange={(e) => setUboForm({ ...uboForm, ownershipPercentage: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={uboForm.dateOfBirth} onChange={(e) => setUboForm({ ...uboForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nationality</label>
                  <input type="text" value={uboForm.nationality} onChange={(e) => setUboForm({ ...uboForm, nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setShowUboForm(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button onClick={handleAddUbo} disabled={!uboForm.firstName || !uboForm.lastName} className="px-3 py-1.5 text-sm bg-amber-800 text-white rounded-lg disabled:opacity-50">Add UBO</button>
              </div>
            </div>
          )}

          {ubos.length > 0 ? (
            <div className="space-y-2">
              {ubos.map((ubo) => (
                <div key={ubo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs font-bold">
                      {ubo.firstName?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ubo.firstName} {ubo.lastName}</p>
                      <p className="text-xs text-gray-500">
                        {ubo.ownershipPercentage != null ? `${ubo.ownershipPercentage}% ownership` : ''}
                        {ubo.nationality ? ` · ${ubo.nationality}` : ''}
                        {ubo.kycVerified ? ' · KYC: Verified' : ''}
                      </p>
                    </div>
                  </div>
                  {hasPermission('create_kyb') && !ubo.kycVerified && (
                    <button onClick={() => handleTriggerKyc(ubo.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Shield className="w-3 h-3" /> Trigger KYC
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No UBOs added yet</p>
          )}
        </div>

        {/* Review */}
        {hasPermission('review_kyb') && (v.status === 'CREATED' || v.status === 'AWAITING_REVIEW' || v.status === 'IN_REVIEW') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Review Business Verification</h3>
            <div className="flex items-end gap-3">
              <select value={reviewDecision} onChange={(e) => setReviewDecision(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Select decision...</option>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>
              <input type="text" placeholder="Rejection reason (optional)" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
              <button onClick={handleReview} disabled={!reviewDecision || store.isLoading} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm">
                {store.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Submit Review
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-800" />
            KYB - Business Verification
          </h2>
          <p className="text-sm text-gray-500">{store.total} total verifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => store.fetchVerifications()} disabled={store.isLoading} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${store.isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('create_kyb') && (
            <button onClick={() => setSubView('create')} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 text-sm">
              <Plus className="w-4 h-4" /> New KYB
            </button>
          )}
        </div>
      </div>

      {store.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {store.error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by company name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none text-sm" />
      </div>

      {store.isLoading && filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reg. Number</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Jurisdiction</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">UBOs</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetail(v)}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{v.companyName}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{v.registrationNumber || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{v.jurisdiction}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{v.ubos?.length ?? 0}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[v.status] ?? 'bg-gray-100 text-gray-700'}`}>{v.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    {v.riskLevel ? <span className={`text-xs font-medium px-2 py-1 rounded-full ${riskColors[v.riskLevel] ?? 'bg-gray-100 text-gray-700'}`}>{v.riskLevel}</span> : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-amber-800 hover:text-amber-900" onClick={(e) => { e.stopPropagation(); handleViewDetail(v); }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No business verifications found</p>
          {hasPermission('create_kyb') && (
            <button onClick={() => setSubView('create')} className="mt-4 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 text-sm">
              Create First KYB
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KYBVerificationPage;
