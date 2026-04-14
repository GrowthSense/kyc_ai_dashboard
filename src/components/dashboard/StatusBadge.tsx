import React from 'react';
import { KYCStatus, RiskLevel } from '@/types/kyc';
import { useTranslation } from '@/hooks/useTranslation';

interface StatusBadgeProps {
  status: KYCStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useTranslation();
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const statusConfig = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', labelKey: 'status_pending' as const, tooltip: '' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', labelKey: 'status_approved' as const, tooltip: '' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', labelKey: 'status_rejected' as const, tooltip: '' },
    flagged: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', labelKey: 'status_flagged' as const, tooltip: '' },
    under_review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-700', labelKey: 'status_under_review' as const, tooltip: '' },
    needs_review: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500 animate-pulse', labelKey: 'status_needs_review' as const, tooltip: 'AI could not auto-approve — a compliance officer must review this case' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${config.bg} ${config.text}`}
      title={config.tooltip || undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`}></span>
      {t(config.labelKey)}
    </span>
  );
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showIcon = true }) => {
  const { t } = useTranslation();
  const baseClasses = 'inline-flex items-center font-semibold rounded-md';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const riskConfig = {
    low: { bg: 'bg-emerald-100', text: 'text-emerald-800', labelKey: 'risk_low_label' as const },
    medium: { bg: 'bg-amber-100', text: 'text-amber-800', labelKey: 'risk_medium_label' as const },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', labelKey: 'risk_high_label' as const },
    critical: { bg: 'bg-red-100', text: 'text-red-800', labelKey: 'risk_critical_label' as const }
  };

  const config = riskConfig[level];

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${config.bg} ${config.text}`}>
      {showIcon && (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          {level === 'low' ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          ) : level === 'medium' ? (
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          )}
        </svg>
      )}
      {t(config.labelKey)}
    </span>
  );
};

interface ScoreBadgeProps {
  score: number;
  label?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, label }) => {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-md ${getColor()}`}>
      <span className="font-bold text-sm">{Math.round(score)}%</span>
      {label && <span className="ml-1 text-xs opacity-75">{label}</span>}
    </div>
  );
};
