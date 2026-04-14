/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/dashboard/DashboardOverview.tsx

import React from 'react';
import {
  FileSearch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Shield,
  Eye
} from 'lucide-react';
import { KYCCase } from '@/types/kyc';
import { StatusBadge, RiskBadge } from './StatusBadge';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

interface DashboardOverviewProps {
  cases: KYCCase[];
  onViewCase: (caseId: string) => void;
  onViewAllCases: () => void;
  onNavigate?: (view: 'aml' | 'lookup' | 'analytics') => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ cases, onViewCase, onViewAllCases, onNavigate }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const getSalutation = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dash_welcome_morning');
    if (hour < 18) return t('dash_welcome_afternoon');
    return t('dash_welcome_evening');
  };

  const formatRoleFallback = (role?: string) => {
    if (!role) return 'User';
    return role
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // NOTE: adjust these property names if your AuthContext uses different fields.
  const roleValue = (user as any)?.role || (user as any)?.roleName || (user as any)?.userRole;
  const displayName =
    (user?.name && user.name.trim()) ||
    formatRoleFallback(roleValue) ||
    'User';

  const salutation = getSalutation();

  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'pending').length,
    approved: cases.filter(c => c.status === 'approved').length,
    rejected: cases.filter(c => c.status === 'rejected').length,
    flagged: cases.filter(c => c.status === 'flagged').length,
    underReview: cases.filter(c => c.status === 'under_review').length,
    needsReview: cases.filter(c => c.status === 'needs_review').length,
    highRisk: cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length,
  };

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  const urgentCases = cases
    .filter(c => (c.status === 'pending' || c.status === 'needs_review') && (c.riskLevel === 'high' || c.riskLevel === 'critical' || c.status === 'needs_review'))
    .slice(0, 5);

  const statCards = [
    {
      label: t('status_needs_review'),
      value: stats.needsReview,
      icon: Eye,
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
      change: '',
      trend: 'up'
    },
    {
      label: t('dash_pending_review'),
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      change: '+12%',
      trend: 'up'
    },
    {
      label: t('dash_approved'),
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      change: '+8%',
      trend: 'up'
    },
    {
      label: t('dash_rejected'),
      value: stats.rejected,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      change: '-5%',
      trend: 'down'
    },
    {
      label: t('risk_high_label'),
      value: stats.highRisk,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      change: '+3%',
      trend: 'up'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {salutation}, {displayName}
            </h2>
            <p className="text-amber-100">
              {stats.pending} {t('dash_pending_review').toLowerCase()} &middot; {stats.highRisk} {t('risk_high_label').toLowerCase()}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold">
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
              </p>
              <p className="text-amber-100 text-sm">{t('dash_approval_rate')}</p>
            </div>
            <div className="w-px h-12 bg-amber-400"></div>
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-amber-100 text-sm">{t('dash_total_cases')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{t('dash_recent_cases')}</h3>
            <button
              onClick={onViewAllCases}
              className="text-sm text-amber-800 hover:text-amber-900 font-medium"
            >
              {t('dash_view_all')}
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCases.map((kycCase) => (
              <div
                key={kycCase.id}
                onClick={() => onViewCase(kycCase.id)}
                className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    name={kycCase.userName}
                    src={kycCase.userAvatar || null}
                    size={32}
                    className="flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{kycCase.userName}</p>
                      <span className="text-xs text-gray-400">{kycCase.id}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{kycCase.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level={kycCase.riskLevel} size="sm" showIcon={false} />
                    <StatusBadge status={kycCase.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Cases */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">{t('risk_high_label')}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">{t('dash_activity')}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {urgentCases.length > 0 ? (
              urgentCases.map((kycCase) => (
                <div
                  key={kycCase.id}
                  onClick={() => onViewCase(kycCase.id)}
                  className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{kycCase.id}</span>
                    <RiskBadge level={kycCase.riskLevel} size="sm" />
                  </div>
                  <p className="text-sm text-gray-600 truncate">{kycCase.userName}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{kycCase.daysPending}d {t('dash_pending_review').toLowerCase()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('dash_no_cases')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">{t('nav_dashboard')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={onViewAllCases}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            <FileSearch className="w-6 h-6 text-amber-800" />
            <span className="text-sm font-medium text-gray-700">{t('nav_cases')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('aml')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            <Shield className="w-6 h-6 text-amber-800" />
            <span className="text-sm font-medium text-gray-700">{t('nav_aml')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('lookup')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            <Users className="w-6 h-6 text-amber-800" />
            <span className="text-sm font-medium text-gray-700">{t('nav_lookup')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('analytics')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            <TrendingUp className="w-6 h-6 text-amber-800" />
            <span className="text-sm font-medium text-gray-700">{t('nav_analytics')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
