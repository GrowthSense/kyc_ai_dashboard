import { create } from 'zustand';
import api from '@/lib/api';
import { useSettingsStore } from './settingsStore';

export interface AppNotification {
  id: string;
  type: string; // HIGH_RISK_ALERT | NEW_CASE | CASE_UPDATE | AML_MATCH | VERIFICATION_COMPLETED
  title: string;
  message: string;
  read: boolean;
  caseId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/** Maps backend notification type → user preference key */
const TYPE_TO_PREF: Record<string, keyof import('./settingsStore').UserPreferences['notifications']> = {
  HIGH_RISK_ALERT: 'highRiskAlerts',
  AML_MATCH: 'highRiskAlerts',
  NEW_CASE: 'newCases',
  CASE_UPDATE: 'caseUpdates',
  VERIFICATION_COMPLETED: 'caseUpdates',
};

function filterByPreferences(
  notifications: AppNotification[],
  prefs: import('./settingsStore').UserPreferences['notifications'],
): AppNotification[] {
  return notifications.filter((n) => {
    const prefKey = TYPE_TO_PREF[n.type];
    if (!prefKey) return true; // unknown types always show
    return prefs[prefKey] !== false;
  });
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  pollingInterval: ReturnType<typeof setInterval> | null;

  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  /** Filtered notifications based on user preferences */
  getVisible: () => AppNotification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pollingInterval: null,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications?take=30');
      const data = res.data?.data ?? res.data;
      const items: AppNotification[] = data.items ?? [];
      const prefs = useSettingsStore.getState().preferences.notifications;
      const visible = filterByPreferences(items, prefs);
      const unreadCount = visible.filter((n) => !n.read).length;
      set({ notifications: visible, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch { /* ignore */ }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch { /* ignore */ }
  },

  startPolling: () => {
    const { pollingInterval, fetch } = get();
    if (pollingInterval) return; // already polling
    fetch(); // immediate first fetch
    const interval = setInterval(() => fetch(), 30_000); // every 30s
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  getVisible: () => {
    const { notifications } = get();
    const prefs = useSettingsStore.getState().preferences.notifications;
    return filterByPreferences(notifications, prefs);
  },
}));
