import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  ArrowLeft,
  Check,
  Filter,
} from 'lucide-react';
import { useNotificationStore, AppNotification } from '@/stores/notificationStore';

interface NotificationsPageProps {
  onBack: () => void;
}

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  HIGH_RISK_ALERT: {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'High Risk',
    color: 'text-red-500 bg-red-50 border-red-100',
  },
  AML_MATCH: {
    icon: <Shield className="w-5 h-5" />,
    label: 'AML Match',
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  VERIFICATION_COMPLETED: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Verification',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  CASE_UPDATE: {
    icon: <Clock className="w-5 h-5" />,
    label: 'Case Update',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  NEW_CASE: {
    icon: <Bell className="w-5 h-5" />,
    label: 'New Case',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'HIGH_RISK_ALERT', label: 'High Risk' },
  { id: 'AML_MATCH', label: 'AML' },
  { id: 'VERIFICATION_COMPLETED', label: 'Verifications' },
  { id: 'CASE_UPDATE', label: 'Case Updates' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack }) => {
  const { notifications, unreadCount, isLoading, fetch, markRead, markAllRead } =
    useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetch();
  }, []);

  const filtered = notifications.filter((n: AppNotification) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-800 hover:text-amber-900 hover:bg-amber-50 border border-amber-200 rounded-lg font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === 'all'
              ? notifications.length
              : tab.id === 'unread'
              ? unreadCount
              : notifications.filter((n) => n.type === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-amber-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.id
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading && notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeFilter === 'unread'
                ? 'All caught up!'
                : 'Notifications will appear here when cases are processed.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((n: AppNotification) => {
              const meta = TYPE_META[n.type] ?? {
                icon: <Bell className="w-5 h-5" />,
                label: n.type,
                color: 'text-gray-500 bg-gray-50 border-gray-100',
              };

              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                    !n.read ? 'bg-amber-50/40' : ''
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center ${meta.color}`}
                  >
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color} mr-2`}
                        >
                          {meta.label}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            !n.read ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {n.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && (
                          <span className="w-2 h-2 bg-amber-800 rounded-full" />
                        )}
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">{n.message}</p>

                    {n.caseId && (
                      <p className="text-xs text-gray-400 mt-1.5 font-mono">
                        Case: {n.caseId}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-center text-gray-400">
          Showing {filtered.length} of {notifications.length} notifications
        </p>
      )}
    </div>
  );
};

export default NotificationsPage;
