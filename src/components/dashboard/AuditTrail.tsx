import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Clock,
  User,
  Bot,
  Shield,
  FileCheck,
  Key,
  Trash2,
  LogIn,
  Eye,
  Activity,
} from 'lucide-react';
import { useCasesStore } from '@/stores/casesStore';
import { useFormatDate } from '@/lib/formatDate';
import { useTranslation } from '@/hooks/useTranslation';

const ACTION_LABELS: Record<string, string> = {
  CASE_CREATED: 'Case Created',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  DOCUMENT_DELETED: 'Document Deleted',
  VERIFICATION_STARTED: 'Verification Started',
  VERIFICATION_COMPLETED: 'Verification Completed',
  MANUAL_APPROVE: 'Manually Approved',
  MANUAL_REJECT: 'Manually Rejected',
  STATUS_CHANGED: 'Status Changed',
  AML_SCREENED: 'AML Screening Run',
  CASE_RESUBMITTED: 'Case Resubmitted',
  CASE_EXPIRED: 'Case Expired',
  API_KEY_CREATED: 'API Key Created',
  API_KEY_REVOKED: 'API Key Revoked',
  WEBHOOK_CREATED: 'Webhook Registered',
  WEBHOOK_DELETED: 'Webhook Deleted',
  GDPR_DELETE: 'GDPR Data Deletion',
  CONFIG_UPDATED: 'Configuration Updated',
  RISK_OVERRIDE: 'Risk Level Overridden',
  NOTE_ADDED: 'Note Added',
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  PASSWORD_CHANGED: 'Password Changed',
  LIVENESS_CHECK: 'Liveness Check',
};

const ACTION_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  CASE_CREATED: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <FileCheck className="w-4 h-4" /> },
  MANUAL_APPROVE: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Shield className="w-4 h-4" /> },
  MANUAL_REJECT: { color: 'bg-red-100 text-red-800 border-red-200', icon: <Shield className="w-4 h-4" /> },
  VERIFICATION_COMPLETED: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <Activity className="w-4 h-4" /> },
  VERIFICATION_STARTED: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: <Activity className="w-4 h-4" /> },
  AML_SCREENED: { color: 'bg-violet-100 text-violet-800 border-violet-200', icon: <Shield className="w-4 h-4" /> },
  API_KEY_CREATED: { color: 'bg-teal-100 text-teal-800 border-teal-200', icon: <Key className="w-4 h-4" /> },
  API_KEY_REVOKED: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <Key className="w-4 h-4" /> },
  DOCUMENT_UPLOADED: { color: 'bg-sky-100 text-sky-800 border-sky-200', icon: <FileCheck className="w-4 h-4" /> },
  DOCUMENT_DELETED: { color: 'bg-red-100 text-red-800 border-red-200', icon: <Trash2 className="w-4 h-4" /> },
  GDPR_DELETE: { color: 'bg-red-100 text-red-800 border-red-200', icon: <Trash2 className="w-4 h-4" /> },
  LOGIN: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <LogIn className="w-4 h-4" /> },
  CONFIG_UPDATED: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Eye className="w-4 h-4" /> },
};

const getActionStyle = (action: string) =>
  ACTION_STYLES[action] ?? { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <ScrollText className="w-4 h-4" /> };

const getLabel = (action: string) => ACTION_LABELS[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Renders a JSON object as readable key-value rows */
const DiffBlock: React.FC<{ data: any; variant: 'before' | 'after'; beforeLabel: string; afterLabel: string }> = ({ data, variant, beforeLabel, afterLabel }) => {
  if (!data) return null;
  const isBefore = variant === 'before';
  const bg = isBefore ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100';
  const label = isBefore ? beforeLabel : afterLabel;
  const labelColor = isBefore ? 'text-red-700' : 'text-emerald-700';
  const valueColor = isBefore ? 'text-red-900' : 'text-emerald-900';
  const keyColor = isBefore ? 'text-red-500' : 'text-emerald-600';

  const entries = typeof data === 'object' && data !== null ? Object.entries(data) : [['value', data]];

  return (
    <div className={`rounded-lg border p-2.5 ${bg}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${labelColor}`}>{label}</p>
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className={`font-medium min-w-[80px] ${keyColor}`}>{k}</span>
            <span className={`break-all ${valueColor}`}>
              {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuditTrail: React.FC = () => {
  const { globalAuditTrail, globalAuditTotal, isLoading, error, fetchGlobalAuditTrail } = useCasesStore();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const formatDate = useFormatDate();
  const { t } = useTranslation();
  const pageSize = 25;

  useEffect(() => {
    fetchGlobalAuditTrail(page * pageSize, pageSize);
  }, [page]);

  const filtered = searchTerm
    ? globalAuditTrail.filter((e) => {
        const term = searchTerm.toLowerCase();
        return (
          getLabel(e.action).toLowerCase().includes(term) ||
          e.action?.toLowerCase().includes(term) ||
          e.caseId?.toLowerCase().includes(term) ||
          e.actorId?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term)
        );
      })
    : globalAuditTrail;

  const totalPages = Math.ceil(globalAuditTotal / pageSize);

  if (isLoading && globalAuditTrail.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-amber-800" />
            {t('audit_title')}
          </h2>
          <p className="text-sm text-gray-500">{globalAuditTotal} {t('audit_total')}</p>
        </div>
        <button
          onClick={() => fetchGlobalAuditTrail(page * pageSize, pageSize)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('audit_search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[2.75rem] top-0 bottom-0 w-px bg-gray-100" />
            <div className="divide-y divide-gray-50">
              {filtered.map((entry, i) => {
                const style = getActionStyle(entry.action);
                const isExpanded = expandedId === (entry.id ?? String(i));
                const hasDiff = entry.before || entry.after;

                return (
                  <div
                    key={entry.id ?? i}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Actor icon */}
                      <div className="flex-shrink-0 z-10">
                        {entry.actorType === 'SYSTEM' ? (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm">
                            <Bot className="w-4 h-4 text-slate-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center shadow-sm">
                            <User className="w-4 h-4 text-amber-700" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Action label + badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.color}`}>
                            {style.icon}
                            {getLabel(entry.action)}
                          </span>
                          {entry.caseId && (
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              #{entry.caseId.slice(0, 8)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {entry.actorType === 'SYSTEM' ? t('audit_system') : entry.actorType?.replace('_', ' ')}
                            {entry.actorId ? ` · ${entry.actorId.slice(0, 8)}` : ''}
                          </span>
                        </div>

                        {/* Description */}
                        {entry.description && (
                          <p className="text-sm text-gray-700 mt-1">{entry.description}</p>
                        )}

                        {/* Before/After diff (expandable) */}
                        {hasDiff && (
                          <div className="mt-2">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : (entry.id ?? String(i)))}
                              className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? `▾ ${t('audit_hide_changes')}` : `▸ ${t('audit_show_changes')}`}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {entry.before && <DiffBlock data={entry.before} variant="before" beforeLabel={t('audit_before')} afterLabel={t('audit_after')} />}
                                {entry.after && <DiffBlock data={entry.after} variant="after" beforeLabel={t('audit_before')} afterLabel={t('audit_after')} />}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.createdAt, { includeTime: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('audit_no_entries')}</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
