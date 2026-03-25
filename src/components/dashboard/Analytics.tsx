import React, { useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Users,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useCasesStore } from '@/stores/casesStore';

const Analytics: React.FC = () => {
  const { analytics, isLoading, error, fetchAnalytics } = useCasesStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900">
          Retry
        </button>
      </div>
    );
  }

  const stats = analytics ?? {
    totalCases: 0,
    pendingCases: 0,
    approvedCases: 0,
    rejectedCases: 0,
    flaggedCases: 0,
    averageProcessingTime: 0,
    approvalRate: 0,
    riskDistribution: {},
    casesByCountry: {},
    recentActivity: [],
  };

  const kpiCards = [
    { label: 'Total Cases', value: stats.totalCases, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: stats.pendingCases, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: stats.approvedCases, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: stats.rejectedCases, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Flagged', value: stats.flaggedCases, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Avg Processing (hrs)', value: typeof stats.averageProcessingTime === 'number' ? stats.averageProcessingTime.toFixed(1) : '\u2014', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const riskDist = stats.riskDistribution ?? {};
  const riskTotal = Object.values(riskDist).reduce((a: number, b: any) => a + (Number(b) || 0), 0);

  const riskColors: Record<string, string> = {
    LOW: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-500',
  };

  const countryEntries = Object.entries(stats.casesByCountry ?? {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics & Reporting</h2>
          <p className="text-sm text-gray-500">Key performance indicators from backend</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-800" />
            Approval Rate
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="10"
                  strokeDasharray={`${((stats.approvalRate ?? 0) / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{stats.approvalRate ?? 0}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Approved</span>
                <span className="font-medium text-emerald-600">{stats.approvedCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rejected</span>
                <span className="font-medium text-red-600">{stats.rejectedCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pending</span>
                <span className="font-medium text-amber-600">{stats.pendingCases}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-800" />
            Risk Distribution
          </h3>
          {riskTotal > 0 ? (
            <div className="space-y-3">
              {Object.entries(riskDist).map(([level, count]: [string, any]) => {
                const pct = riskTotal > 0 ? ((Number(count) / riskTotal) * 100).toFixed(1) : '0';
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 capitalize">{level.toLowerCase()}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${riskColors[level] ?? 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No risk data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-800" />
          Cases by Country (Top 10)
        </h3>
        {countryEntries.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {countryEntries.map(([country, count]: [string, any]) => (
              <div key={country} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{country}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No country data available</p>
        )}
      </div>

      {Array.isArray(stats.recentActivity) && stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 10).map((act: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-gray-700 flex-1">{act.description ?? act.action ?? JSON.stringify(act)}</span>
                <span className="text-gray-400 text-xs">{act.timestamp ? new Date(act.timestamp).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
