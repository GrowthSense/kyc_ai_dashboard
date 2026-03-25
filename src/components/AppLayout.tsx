import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { KYCCase } from '@/types/kyc';
import { useCasesStore } from '@/stores/casesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from '@/hooks/useTranslation';

import LoginPage from './auth/LoginPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';

import Sidebar from './dashboard/Sidebar';
import Header from './dashboard/Header';
import DashboardOverview from './dashboard/DashboardOverview';
import CaseList from './dashboard/CaseList';
import CaseDetail from './dashboard/CaseDetail';
import AMLScreening from './dashboard/AMLScreening';
import UserLookup from './dashboard/UserLookup';
import Settings from './dashboard/Settings';
import Analytics from './dashboard/Analytics';
import AuditTrail from './dashboard/AuditTrail';
import VerificationPipeline from './dashboard/VerificationPipeline';
import KYBVerificationPage from './dashboard/KYBVerification';
import NotificationsPage from './dashboard/NotificationsPage';
import IntegrationHub from './dashboard/IntegrationHub';

type View =
  | 'dashboard'
  | 'cases'
  | 'case-detail'
  | 'aml'
  | 'lookup'
  | 'settings'
  | 'analytics'
  | 'audit'
  | 'verifications'
  | 'kyb'
  | 'notifications'
  | 'integrations';

type AuthView = 'login' | 'forgot-password';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const isMobile = useIsMobile();
  const { setTheme } = useTheme();
  const settingsStore = useSettingsStore();

  const { cases, fetchCases, isLoading: casesLoading } = useCasesStore();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCases();
      // Load user preferences from server and apply them
      settingsStore.loadUserProfile().then(() => {
        const theme = settingsStore.preferences.display.theme;
        if (theme) setTheme(theme as 'light' | 'dark' | 'system');
      });
    }
  }, [isAuthenticated]);

  const pendingCount = cases.filter((c) => c.status !== 'approved' && c.status !== 'rejected').length;
  const flaggedCount = cases.filter((c) => c.status === 'flagged').length;

  const selectedCase = selectedCaseId ? cases.find((c) => c.id === selectedCaseId) : null;

  const handleViewCase = (caseId: string) => {
    if (!hasPermission('view_case_detail')) return;
    setSelectedCaseId(caseId);
    setCurrentView('case-detail');
  };

  const handleBackFromCase = () => {
    setSelectedCaseId(null);
    setCurrentView('cases');
  };

  const handleViewChange = (view: View) => {
    const viewPermissions: Record<View, string> = {
      dashboard: 'view_dashboard',
      cases: 'view_cases',
      'case-detail': 'view_case_detail',
      aml: 'run_aml_screening',
      lookup: 'user_lookup',
      settings: 'view_settings',
      analytics: 'view_analytics',
      audit: 'view_audit_logs',
      verifications: 'view_verifications',
      kyb: 'view_kyb',
      notifications: 'view_dashboard',
      integrations: 'view_dashboard',
    };
    if (!hasPermission(viewPermissions[view])) return;
    if (view !== 'case-detail') setSelectedCaseId(null);
    setCurrentView(view);
  };

  const handleUpdateCase = (_caseId: string, _updates: Partial<KYCCase>) => {
    fetchCases();
  };

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: t('nav_dashboard'), subtitle: t('sub_dashboard') };
      case 'cases':
        return { title: t('nav_cases'), subtitle: `${cases.length} total cases` };
      case 'case-detail':
        return { title: 'Case Details', subtitle: selectedCase?.id || '' };
      case 'aml':
        return { title: t('nav_aml'), subtitle: t('sub_aml') };
      case 'lookup':
        return { title: t('nav_lookup'), subtitle: t('sub_lookup') };
      case 'settings':
        return { title: t('nav_settings'), subtitle: t('sub_settings') };
      case 'analytics':
        return { title: t('nav_analytics'), subtitle: t('sub_analytics') };
      case 'audit':
        return { title: t('nav_audit'), subtitle: t('sub_audit') };
      case 'verifications':
        return { title: t('nav_verifications'), subtitle: t('sub_verifications') };
      case 'kyb':
        return { title: t('nav_kyb'), subtitle: t('sub_kyb') };
      case 'notifications':
        return { title: 'Notifications', subtitle: '' };
      case 'integrations':
        return { title: 'Integration Hub', subtitle: 'API keys, webhooks, and developer resources' };
      default:
        return { title: t('nav_dashboard'), subtitle: '' };
    }
  };

  const { t } = useTranslation();

  const headerInfo = getHeaderInfo();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'forgot-password') {
      return <ForgotPasswordPage onBackToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onForgotPassword={() => setAuthView('forgot-password')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        pendingCount={pendingCount}
        flaggedCount={flaggedCount}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onViewAllNotifications={() => setCurrentView('notifications')}
          onNavigate={(view) => handleViewChange(view as any)}
        />
        <main className="p-6">
          {currentView === 'dashboard' && (
            <DashboardOverview
              cases={cases}
              onViewCase={handleViewCase}
              onViewAllCases={() => handleViewChange('cases')}
              onNavigate={(view) => handleViewChange(view)}
            />
          )}
          {currentView === 'analytics' && hasPermission('view_analytics') && <Analytics />}
          {currentView === 'cases' && <CaseList cases={cases} onViewCase={handleViewCase} />}
          {currentView === 'case-detail' && selectedCase && (
            <CaseDetail kycCase={selectedCase} onBack={handleBackFromCase} onUpdateCase={handleUpdateCase} />
          )}
          {currentView === 'verifications' && hasPermission('view_verifications') && <VerificationPipeline />}
          {currentView === 'kyb' && hasPermission('view_kyb') && <KYBVerificationPage />}
          {currentView === 'aml' && hasPermission('run_aml_screening') && <AMLScreening />}
          {currentView === 'audit' && hasPermission('view_audit_logs') && <AuditTrail />}
          {currentView === 'lookup' && <UserLookup cases={cases} onViewCase={handleViewCase} />}
          {currentView === 'notifications' && (
            <NotificationsPage onBack={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'integrations' && <ErrorBoundary><IntegrationHub /></ErrorBoundary>}
          {currentView === 'settings' && <Settings />}
          {currentView === 'aml' && !hasPermission('run_aml_screening') && (
            <AccessDenied message="You don't have permission to access AML Screening." />
          )}
          {currentView === 'analytics' && !hasPermission('view_analytics') && (
            <AccessDenied message="You don't have permission to view Analytics." />
          )}
          {currentView === 'verifications' && !hasPermission('view_verifications') && (
            <AccessDenied message="You don't have permission to view Verifications." />
          )}
          {currentView === 'kyb' && !hasPermission('view_kyb') && (
            <AccessDenied message="You don't have permission to view KYB." />
          )}
          {currentView === 'audit' && !hasPermission('view_audit_logs') && (
            <AccessDenied message="You don't have permission to view the Audit Trail." />
          )}
        </main>
      </div>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
      )}
    </div>
  );
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 text-sm">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-amber-800 text-white text-sm font-medium rounded-lg hover:bg-amber-900"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default AppLayout;
