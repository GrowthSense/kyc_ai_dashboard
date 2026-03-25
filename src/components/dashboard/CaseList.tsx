/* eslint-disable no-case-declarations */
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreVertical,
  Download,
  RefreshCw,
  Calendar,
  X
} from 'lucide-react';
import { KYCCase, KYCStatus, RiskLevel } from '@/types/kyc';
import { StatusBadge, RiskBadge, ScoreBadge } from './StatusBadge';
import Avatar from '../ui/Avatar';
import { useTranslation } from '@/hooks/useTranslation';
import { useCasesStore } from '@/stores/casesStore';

interface CaseListProps {
  cases: KYCCase[];
  onViewCase: (caseId: string) => void;
}

type SortField = 'id' | 'userName' | 'status' | 'riskLevel' | 'submittedAt' | 'daysPending' | 'aiScore';
type SortDirection = 'asc' | 'desc';

const CaseList: React.FC<CaseListProps> = ({ cases, onViewCase }) => {
  const { t } = useTranslation();
  const { fetchCases, isLoading: refreshing } = useCasesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<KYCStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleExport = () => {
    const exportData = filteredAndSortedCases.length > 0 ? filteredAndSortedCases : cases;
    const headers = ['ID', 'Name', 'Status', 'Risk Level', 'AI Score', 'Country', 'Submitted At'];
    const rows = exportData.map(c => [
      c.id,
      c.userName,
      c.status,
      c.riskLevel,
      `${c.aiResult.overallScore}%`,
      c.country,
      new Date(c.submittedAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAndSortedCases = useMemo(() => {
    let result = [...cases];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(query) ||
        c.userId.toLowerCase().includes(query) ||
        c.userName.toLowerCase().includes(query) ||
        c.userEmail.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      result = result.filter(c => c.riskLevel === riskFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'riskLevel':
          const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
        case 'submittedAt':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'daysPending':
          comparison = a.daysPending - b.daysPending;
          break;
        case 'aiScore':
          comparison = a.aiResult.overallScore - b.aiResult.overallScore;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [cases, searchQuery, statusFilter, riskFilter, sortField, sortDirection]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCases.slice(start, start + itemsPerPage);
  }, [filteredAndSortedCases, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCases.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedCases.length === paginatedCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(paginatedCases.map(c => c.id));
    }
  };

  const toggleSelectCase = (caseId: string) => {
    setSelectedCases(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRiskFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || riskFilter !== 'all';

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-300" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-amber-800" />
      : <ChevronDown className="w-4 h-4 text-amber-800" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('cases_search_placeholder')}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all"
            />
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all ${showFilters || hasActiveFilters
                  ? 'border-amber-700 bg-amber-50 text-amber-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">{t('cases_filter')}</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-amber-800 text-white text-xs rounded-full flex items-center justify-center">
                  {(statusFilter !== 'all' ? 1 : 0) + (riskFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 text-gray-700 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">{t('cases_export')}</span>
            </button>

            <button
              onClick={() => fetchCases()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 text-gray-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium hidden sm:inline">{t('refresh')}</span>
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">{t('cases_status')}:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as KYCStatus | 'all');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                >
                  <option value="all">{t('cases_all_statuses')}</option>
                  <option value="pending">{t('status_pending')}</option>
                  <option value="under_review">{t('status_under_review')}</option>
                  <option value="approved">{t('status_approved')}</option>
                  <option value="rejected">{t('status_rejected')}</option>
                  <option value="flagged">{t('status_flagged')}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">{t('cases_risk')}:</label>
                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value as RiskLevel | 'all');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                >
                  <option value="all">{t('cases_all_risks')}</option>
                  <option value="low">{t('risk_low')}</option>
                  <option value="medium">{t('risk_medium')}</option>
                  <option value="high">{t('risk_high')}</option>
                  <option value="critical">{t('risk_critical')}</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                  {t('cases_filter')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>
          {t('cases_showing')} <span className="font-medium text-gray-900">{paginatedCases.length}</span> {t('cases_page_of')}{' '}
          <span className="font-medium text-gray-900">{filteredAndSortedCases.length}</span>
        </p>
        {selectedCases.length > 0 && (
          <p className="text-amber-800 font-medium">{selectedCases.length} {t('cases_selected')}</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCases.length === paginatedCases.length && paginatedCases.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-700"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    {t('lookup_case_id')}
                    <SortIcon field="id" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center gap-1">
                    {t('cases_applicant')}
                    <SortIcon field="userName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    {t('cases_status')}
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('riskLevel')}
                >
                  <div className="flex items-center gap-1">
                    {t('cases_risk')}
                    <SortIcon field="riskLevel" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('aiScore')}
                >
                  <div className="flex items-center gap-1">
                    {t('cases_score')}
                    <SortIcon field="aiScore" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('submittedAt')}
                >
                  <div className="flex items-center gap-1">
                    {t('cases_submitted')}
                    <SortIcon field="submittedAt" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('daysPending')}
                >
                  <div className="flex items-center gap-1">
                    {t('cases_days_pending')}
                    <SortIcon field="daysPending" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('cases_actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCases.map((kycCase) => (
                <tr
                  key={kycCase.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCases.includes(kycCase.id)}
                      onChange={() => toggleSelectCase(kycCase.id)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-900">{kycCase.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={kycCase.userName}
                        src={kycCase.userAvatar}
                        size={32}
                        className="flex-shrink-0"
                      />

                      <div>
                        <p className="text-sm font-medium text-gray-900">{kycCase.userName}</p>
                        <p className="text-xs text-gray-500">{kycCase.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={kycCase.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={kycCase.riskLevel} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={kycCase.aiResult.overallScore} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(kycCase.submittedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${kycCase.daysPending > 7 ? 'text-red-600' :
                        kycCase.daysPending > 3 ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                      {kycCase.daysPending}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onViewCase(kycCase.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      {t('view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedCases.length === 0 && (
          <div className="px-4 py-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('cases_no_results')}</h3>
            <p className="text-gray-500">{t('cases_no_results_sub')}</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm font-medium text-amber-800 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-all"
              >
                {t('cases_filter')}
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('back')}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm font-medium rounded-lg transition-all ${currentPage === page
                        ? 'bg-amber-800 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseList;
