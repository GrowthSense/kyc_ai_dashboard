import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  Shield,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  BarChart3,
  ScrollText,
  GitBranch,
  Building2,
  Plug,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types/auth';
import { useTranslation } from '@/hooks/useTranslation';

type View =
  | 'dashboard'
  | 'cases'
  | 'case-detail'
  | 'aml'
  | 'lookup'
  | 'analytics'
  | 'audit'
  | 'verifications'
  | 'kyb'
  | 'settings'
  | 'integrations';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingCount: number;
  flaggedCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  pendingCount,
  flaggedCount,
}) => {
  const { user, logout, hasPermission } = useAuth();
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: t('nav_dashboard'), badge: null, permission: 'view_dashboard' },
    { id: 'analytics' as View, icon: BarChart3, label: t('nav_analytics'), badge: null, permission: 'view_analytics' },
    { id: 'cases' as View, icon: FileSearch, label: t('nav_cases'), badge: pendingCount > 0 ? pendingCount : null, permission: 'view_cases' },
    { id: 'verifications' as View, icon: GitBranch, label: t('nav_verifications'), badge: null, permission: 'view_verifications' },
    { id: 'kyb' as View, icon: Building2, label: t('nav_kyb'), badge: null, permission: 'view_kyb' },
    { id: 'aml' as View, icon: Shield, label: t('nav_aml'), badge: flaggedCount > 0 ? flaggedCount : null, permission: 'run_aml_screening' },
    { id: 'audit' as View, icon: ScrollText, label: t('nav_audit'), badge: null, permission: 'view_audit_logs' },
    { id: 'lookup' as View, icon: Users, label: t('nav_lookup'), badge: null, permission: 'user_lookup' },
    { id: 'integrations' as View, icon: Plug, label: 'Integrations', badge: null, permission: 'view_dashboard' },
  ].filter((item) => hasPermission(item.permission));

  const bottomItems = [
    { id: 'settings' as View, icon: Settings, label: t('nav_settings'), permission: 'view_settings' },
  ].filter((item) => hasPermission(item.permission));

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6b3d18] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">ComplianceHub</span>
          </div>
        )}
        <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.id ||
            (item.id === 'cases' && currentView === 'case-detail');
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive ? 'bg-amber-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">{item.badge}</span>
                  )}
                </>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute left-10 top-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="py-4 px-2 border-t border-slate-700 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive ? 'bg-amber-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Help & Support</span>}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{t('nav_logout')}</span>}
        </button>
      </div>

      {!isCollapsed && user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center text-sm font-semibold">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>
      )}

      {isCollapsed && user && (
        <div className="p-3 border-t border-slate-700 flex justify-center">
          <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center text-sm font-semibold">
            {getUserInitials()}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
