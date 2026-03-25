import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Check,
  AlertTriangle,
  Key,
  Webhook,
  Trash2,
  Plus,
  Copy,
  Loader2,
  Building2,
  Eye,
  EyeOff,
  UserX,
  ScanFace,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types/auth';
import { useSettingsStore, UserPreferences } from '@/stores/settingsStore';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from '@/hooks/useTranslation';

/* ── helpers ─────────────────────────────────────── */
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-800" />
  </label>
);

const Slider: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, min = 0, max = 1, step = 0.01, format, onChange }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="font-semibold text-amber-800">{format ? format(value) : `${Math.round(value * 100)}%`}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
    />
    <div className="flex justify-between text-xs text-gray-400">
      <span>{format ? format(min) : `${Math.round(min * 100)}%`}</span>
      <span>{format ? format(max) : `${Math.round(max * 100)}%`}</span>
    </div>
  </div>
);

/* ── main component ───────────────────────────────── */
const Settings: React.FC = () => {
  const { user } = useAuth();
  const store = useSettingsStore();
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('profile');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['ADMIN']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [gdprUserId, setGdprUserId] = useState('');
  const [gdprConfirm, setGdprConfirm] = useState(false);

  // Editable local state for profile
  const [profileName, setProfileName] = useState(user?.name || '');

  // Local state for org config edits
  const [localConfig, setLocalConfig] = useState<any>(null);

  useEffect(() => {
    store.loadUserProfile();
    store.fetchTenant();
    store.fetchConfig();
    store.fetchApiKeys();
    store.fetchWebhooks();
  }, []);

  // Sync profile name when user profile loads
  useEffect(() => {
    if (store.userProfile?.name) setProfileName(store.userProfile.name);
  }, [store.userProfile?.name]);

  // Sync local config when store config loads
  useEffect(() => {
    if (store.config && !localConfig) {
      setLocalConfig({
        autoApproveThreshold: store.config.autoApproveThreshold ?? 0.8,
        reviewThreshold: store.config.reviewThreshold ?? 0.5,
        checkWeights: {
          documentAuthenticity: 0.25,
          faceMatch: 0.25,
          liveness: 0.15,
          fraudDetection: 0.15,
          ocrExtraction: 0.10,
          frontBackConsistency: 0.05,
          addressVerification: 0.05,
          ...(store.config.checkWeights ?? {}),
        },
        requiredChecks: {
          liveness: false,
          faceMatch: true,
          documentAuthenticity: true,
          addressVerification: false,
          ...(store.config.requiredChecks ?? {}),
        },
      });
    }
  }, [store.config]);

  const prefs = store.preferences;

  const updateNotification = (key: keyof UserPreferences['notifications'], val: boolean) =>
    store.setPreferences({ notifications: { ...prefs.notifications, [key]: val } });

  const updateSecurity = (key: keyof UserPreferences['security'], val: string | boolean) =>
    store.setPreferences({ security: { ...prefs.security, [key]: val } });

  const updateDisplay = (key: keyof UserPreferences['display'], val: string) => {
    store.setPreferences({ display: { ...prefs.display, [key]: val } });
    // Apply theme change immediately
    if (key === 'theme') {
      setTheme(val as 'light' | 'dark' | 'system');
    }
  };

  const handleSave = async () => {
    if (activeTab === 'profile') {
      await store.saveUserProfile(profileName);
    } else if (activeTab === 'notifications' || activeTab === 'security' || activeTab === 'preferences') {
      await store.savePreferences(prefs);
    } else if (activeTab === 'verification') {
      if (localConfig) await store.updateConfig(localConfig);
    }
    // org/apikeys/webhooks/gdpr don't use the bottom save button
  };

  const showSaveButton = ['profile', 'notifications', 'security', 'preferences', 'verification'].includes(activeTab);

  const handleCreateApiKey = async () => {
    if (!newKeyName) return;
    const key = await store.createApiKey({ label: newKeyName, scopes: newKeyScopes });
    if (key) {
      setCreatedKey(key);
      setNewKeyName('');
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl || webhookEvents.length === 0) return;
    await store.createWebhook({ url: webhookUrl, events: webhookEvents });
    setWebhookUrl('');
    setWebhookEvents([]);
  };

  const handleGdprDelete = async () => {
    if (!gdprUserId || !gdprConfirm) return;
    const ok = await store.deleteUserData(gdprUserId);
    if (ok) { setGdprUserId(''); setGdprConfirm(false); }
  };

  const getUserInitials = () => {
    const name = store.userProfile?.name || user?.name || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const allEvents = [
    'verification.created', 'verification.completed', 'verification.approved', 'verification.rejected',
    'screening.completed', 'screening.match', 'kyb.completed', 'document.uploaded',
  ];

  const tabs = [
    { id: 'profile',       label: 'Profile',        icon: User },
    { id: 'notifications', label: 'Notifications',   icon: Bell },
    { id: 'security',      label: 'Security',        icon: Shield },
    { id: 'preferences',   label: 'Preferences',     icon: Palette },
    { id: 'verification',  label: 'Verification',    icon: ScanFace },
    { id: 'tenant',        label: 'Organization',    icon: Building2 },
    { id: 'apikeys',       label: 'API Keys',        icon: Key },
    { id: 'webhooks',      label: 'Webhooks',        icon: Webhook },
    { id: 'gdpr',          label: 'GDPR',            icon: UserX },
  ];

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); store.clearMessages(); }}
                  className={`flex items-center gap-2 px-5 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-amber-800 text-amber-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Banner */}
          {(store.error || store.success) && (
            <div className={`mb-5 p-3 rounded-lg text-sm flex items-center gap-2 ${
              store.error
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {store.error ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
              {store.error || store.success}
            </div>
          )}

          {/* ── Profile ────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-amber-800 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {getUserInitials()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{store.userProfile?.name || user?.name}</p>
                  <p className="text-sm text-gray-500">{store.userProfile?.email || user?.email}</p>
                  <span className="mt-1 inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    {store.userProfile?.role ? ROLE_LABELS[store.userProfile.role as keyof typeof ROLE_LABELS] : 'User'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={store.userProfile?.email || user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input type="text" value={store.userProfile?.role ? ROLE_LABELS[store.userProfile.role as keyof typeof ROLE_LABELS] : 'User'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={store.userProfile?.department || 'N/A'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ──────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
              {([
                { key: 'highRiskAlerts' as const, label: 'High Risk Alerts', desc: 'Immediate alert when a high-risk case is detected' },
                { key: 'newCases' as const, label: 'New Cases', desc: 'Notify when new KYC cases are submitted' },
                { key: 'caseUpdates' as const, label: 'Case Updates', desc: 'Notify when cases you manage are updated' },
                { key: 'dailyDigest' as const, label: 'Daily Digest', desc: 'Daily summary of pending cases and alerts' },
                { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Weekly compliance report with key metrics' },
              ]).map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle checked={prefs.notifications[item.key]} onChange={(v) => updateNotification(item.key, v)} />
                </div>
              ))}
            </div>
          )}

          {/* ── Security ───────────────────────────── */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Toggle checked={prefs.security.twoFactor} onChange={(v) => updateSecurity('twoFactor', v)} />
              </div>
              <div className="py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900 mb-2">Session Timeout</p>
                <p className="text-sm text-gray-500 mb-3">Automatically log out after a period of inactivity</p>
                <select
                  value={prefs.security.sessionTimeout}
                  onChange={(e) => updateSecurity('sessionTimeout', e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Preferences ────────────────────────── */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Display Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: 'language' as const, label: 'Language', options: [{ v: 'en', l: 'English' }, { v: 'es', l: 'Spanish' }, { v: 'fr', l: 'French' }, { v: 'de', l: 'German' }, { v: 'pt', l: 'Portuguese' }] },
                  { key: 'timezone' as const, label: 'Timezone', options: [{ v: 'UTC', l: 'UTC' }, { v: 'America/New_York', l: 'Eastern (EST)' }, { v: 'America/Los_Angeles', l: 'Pacific (PST)' }, { v: 'Europe/London', l: 'London (GMT)' }, { v: 'Europe/Paris', l: 'Paris (CET)' }, { v: 'Asia/Dubai', l: 'Dubai (GST)' }, { v: 'Asia/Singapore', l: 'Singapore (SGT)' }] },
                  { key: 'dateFormat' as const, label: 'Date Format', options: [{ v: 'MM/DD/YYYY', l: 'MM/DD/YYYY' }, { v: 'DD/MM/YYYY', l: 'DD/MM/YYYY' }, { v: 'YYYY-MM-DD', l: 'YYYY-MM-DD (ISO)' }] },
                  { key: 'theme' as const, label: 'Theme', options: [{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }, { v: 'system', l: 'System default' }] },
                ] as const).map((item) => (
                  <div key={item.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    <select
                      value={prefs.display[item.key]}
                      onChange={(e) => updateDisplay(item.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                    >
                      {item.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Verification Config (Liveness + Thresholds) ── */}
          {activeTab === 'verification' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-amber-800" /> Verification Settings
              </h3>

              {!localConfig ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-800" />
                </div>
              ) : (
                <>
                  {/* Liveness Detection */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ScanFace className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-base">Liveness Detection</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Require real-time face liveness checks during identity verification to prevent spoofing with photos or videos.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {['Spoof prevention', 'Photo attack detection', 'Video replay protection'].map((tag) => (
                              <span key={tag} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Toggle
                        checked={localConfig.requiredChecks?.liveness ?? false}
                        onChange={(v) => setLocalConfig((c: any) => ({ ...c, requiredChecks: { ...c.requiredChecks, liveness: v } }))}
                      />
                    </div>
                    {localConfig.requiredChecks?.liveness && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Liveness detection is <strong>active</strong> — all new verifications will require a live selfie check.
                      </div>
                    )}
                  </div>

                  {/* Required Checks */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-800" /> Required Checks
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        { key: 'documentAuthenticity', label: 'Document Authenticity', desc: 'Verify documents are genuine and unaltered' },
                        { key: 'faceMatch', label: 'Face Match', desc: 'Match selfie to document photo' },
                        { key: 'liveness', label: 'Liveness', desc: 'Ensure applicant is a real person' },
                        { key: 'addressVerification', label: 'Address Verification', desc: 'Verify proof of address document' },
                      ] as const).map((check) => (
                        <div key={check.key} className="flex items-start justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{check.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{check.desc}</p>
                          </div>
                          <Toggle
                            checked={localConfig.requiredChecks?.[check.key] ?? false}
                            onChange={(v) => setLocalConfig((c: any) => ({ ...c, requiredChecks: { ...c.requiredChecks, [check.key]: v } }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Thresholds */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-800" /> Decision Thresholds
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-sm font-semibold text-gray-800">Auto-Approve Threshold</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Cases with a score above this threshold are automatically approved</p>
                        <Slider
                          label=""
                          value={localConfig.autoApproveThreshold}
                          onChange={(v) => setLocalConfig((c: any) => ({ ...c, autoApproveThreshold: v }))}
                        />
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-sm font-semibold text-gray-800">Manual Review Threshold</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Cases between this and the auto-approve threshold are sent for manual review</p>
                        <Slider
                          label=""
                          value={localConfig.reviewThreshold}
                          onChange={(v) => setLocalConfig((c: any) => ({ ...c, reviewThreshold: v }))}
                        />
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Score ≥ <strong>{Math.round(localConfig.autoApproveThreshold * 100)}%</strong> → Auto-approved</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span>Score <strong>{Math.round(localConfig.reviewThreshold * 100)}%</strong>–<strong>{Math.round(localConfig.autoApproveThreshold * 100)}%</strong> → Manual review</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span>Score &lt; <strong>{Math.round(localConfig.reviewThreshold * 100)}%</strong> → Auto-rejected</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Check Weights */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-800" /> Check Weights
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">Adjust how much each check contributes to the overall verification score</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
                      {Object.entries(localConfig.checkWeights ?? {}).map(([key, val]) => (
                        <Slider
                          key={key}
                          label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          value={val as number}
                          onChange={(v) => setLocalConfig((c: any) => ({ ...c, checkWeights: { ...c.checkWeights, [key]: v } }))}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Organization ───────────────────────── */}
          {activeTab === 'tenant' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-800" /> Organization Details
              </h3>
              {store.isLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-800" /></div>
              ) : store.tenant ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Company Name', value: store.tenant.name },
                    { label: 'Tenant ID', value: store.tenant.id, mono: true, small: true },
                    { label: 'Billing Email', value: store.tenant.billingEmail },
                    { label: 'Plan', value: store.tenant.plan?.toUpperCase() },
                    { label: 'Status', value: store.tenant.active ? 'Active' : 'Inactive' },
                    { label: 'Created', value: store.tenant.createdAt ? new Date(store.tenant.createdAt).toLocaleDateString() : '' },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                      <div className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 ${f.mono ? 'font-mono' : ''} ${f.small ? 'text-xs' : 'text-sm'} flex items-center justify-between`}>
                        <span className="truncate">{f.value ?? '—'}</span>
                        {f.mono && (
                          <button onClick={() => navigator.clipboard.writeText(f.value ?? '')} className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Organization details not available</p>
              )}
            </div>
          )}

          {/* ── API Keys ───────────────────────────── */}
          {activeTab === 'apikeys' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Key className="w-5 h-5 text-amber-800" /> API Keys</h3>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Create New API Key</h4>
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Key Name</label>
                    <input type="text" placeholder="e.g. Mobile App" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Scope</label>
                    <select value={newKeyScopes[0]} onChange={(e) => setNewKeyScopes([e.target.value])} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700">
                      <option value="ADMIN">Admin</option>
                      <option value="VERIFICATION_READ,VERIFICATION_WRITE">Verification</option>
                      <option value="SCREENING_READ,SCREENING_WRITE">Screening</option>
                      <option value="VERIFICATION_READ">Read Only</option>
                    </select>
                  </div>
                  <button onClick={handleCreateApiKey} disabled={!newKeyName} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm">
                    <Plus className="w-4 h-4" /> Create
                  </button>
                </div>
                {createdKey && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs font-medium text-emerald-800 mb-1">New API Key — copy now, it won't be shown again:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border font-mono break-all">{showKey ? createdKey : '•'.repeat(40)}</code>
                      <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-gray-500 hover:text-gray-700 flex-shrink-0">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      <button onClick={() => navigator.clipboard.writeText(createdKey)} className="p-1.5 text-gray-500 hover:text-gray-700 flex-shrink-0"><Copy className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {store.apiKeys.length > 0 ? store.apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{key.label}</p>
                      <p className="text-xs text-gray-500 truncate">
                        <code className="font-mono">{key.keyPrefix}...</code>
                        {' · '}{key.scopes?.join(', ')}
                        {' · '}Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button onClick={() => store.revokeApiKey(key.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex-shrink-0">
                      <Trash2 className="w-3 h-3" /> Revoke
                    </button>
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-4">No API keys created yet</p>}
              </div>
            </div>
          )}

          {/* ── Webhooks ───────────────────────────── */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Webhook className="w-5 h-5 text-amber-800" /> Webhook Endpoints</h3>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Register New Webhook</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Endpoint URL</label>
                    <input type="url" placeholder="https://your-app.com/webhooks/kyc" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Events to subscribe</label>
                    <div className="flex flex-wrap gap-2">
                      {allEvents.map((ev) => (
                        <label key={ev} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:border-amber-400">
                          <input type="checkbox" checked={webhookEvents.includes(ev)} onChange={(e) => setWebhookEvents(e.target.checked ? [...webhookEvents, ev] : webhookEvents.filter((x) => x !== ev))} className="rounded border-gray-300 text-amber-800 focus:ring-amber-700" />
                          {ev}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleCreateWebhook} disabled={!webhookUrl || webhookEvents.length === 0} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm">
                    <Plus className="w-4 h-4" /> Register Webhook
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {store.webhooks.length > 0 ? store.webhooks.map((wh) => (
                  <div key={wh.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 font-mono truncate">{wh.url}</p>
                      <p className="text-xs text-gray-500">{wh.events?.join(', ')} · {wh.isActive ? 'Active' : 'Inactive'} · Created {new Date(wh.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => store.deleteWebhook(wh.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex-shrink-0">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-4">No webhooks registered yet</p>}
              </div>
            </div>
          )}

          {/* ── GDPR ───────────────────────────────── */}
          {activeTab === 'gdpr' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><UserX className="w-5 h-5 text-amber-800" /> GDPR Data Deletion</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Irreversible Action</p>
                  <p className="text-sm text-amber-700 mt-1">Permanently removes all verification cases, documents, screening results, and audit entries for the user.</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External User ID</label>
                  <input type="text" placeholder="Enter the user's external ID" value={gdprUserId} onChange={(e) => setGdprUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-sm" />
                </div>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={gdprConfirm} onChange={(e) => setGdprConfirm(e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-500 mt-0.5" />
                  <span className="text-gray-700">I confirm this is irreversible and all data for this user will be permanently deleted.</span>
                </label>
                <button onClick={handleGdprDelete} disabled={!gdprUserId || !gdprConfirm} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
                  <Trash2 className="w-4 h-4" /> Delete User Data
                </button>
              </div>
            </div>
          )}

          {/* ── Save Button ────────────────────────── */}
          {showSaveButton && (
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={store.isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 disabled:opacity-60 transition-colors"
              >
                {store.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {store.isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
