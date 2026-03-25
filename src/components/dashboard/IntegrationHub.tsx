import React, { useEffect, useState, useCallback } from 'react';
import {
  Key,
  Webhook,
  BookOpen,
  Zap,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Code2,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  keyPrefix: string;
  label: string;
  scopes: string[];
  isTestKey: boolean;
  active: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  description?: string;
  createdAt: string;
}

interface DeliveryAttempt {
  id: string;
  event: string;
  httpStatus?: number;
  success: boolean;
  attemptNumber: number;
  durationMs?: number;
  errorMessage?: string;
  attemptedAt: string;
}

// ─── Event catalog ────────────────────────────────────────────────────────────

const EVENTS = [
  { event: 'verification.created', description: 'A new KYC verification case has been created.', category: 'Verification' },
  { event: 'verification.document_uploaded', description: 'A document has been uploaded to a case.', category: 'Verification' },
  { event: 'verification.submitted', description: 'A case has been queued for AI processing.', category: 'Verification' },
  { event: 'verification.processing', description: 'The AI verification pipeline has started.', category: 'Verification' },
  { event: 'verification.approved', description: 'The case was approved (auto or manual).', category: 'Verification' },
  { event: 'verification.rejected', description: 'The case was rejected.', category: 'Verification' },
  { event: 'verification.awaiting_review', description: 'The case requires manual reviewer decision.', category: 'Verification' },
  { event: 'case.resubmitted', description: 'The applicant resubmitted after rejection.', category: 'Verification' },
  { event: 'aml.screening_completed', description: 'AML/sanctions screening completed — no match.', category: 'AML' },
  { event: 'aml.match_found', description: 'AML screening found a potential sanctions or PEP match.', category: 'AML' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Verification: 'bg-blue-50 text-blue-700 border-blue-100',
  AML: 'bg-purple-50 text-purple-700 border-purple-100',
};

// ─── Code snippets ────────────────────────────────────────────────────────────

const SNIPPETS = {
  nodejs: `const axios = require('axios');

const client = axios.create({
  baseURL: 'https://your-api.example.com/api/v1',
  headers: { 'x-api-key': 'gs_live_YOUR_API_KEY' },
});

// 1. Create a verification case
const { data: kCase } = await client.post('/verifications', {
  externalUserId: 'user_123',
  firstName: 'Jane',
  lastName: 'Doe',
  country: 'GB',
  dateOfBirth: '1990-05-15',
});

// 2. Upload documents
const form = new FormData();
form.append('file', fs.createReadStream('./passport.jpg'));
form.append('type', 'passport');
await client.post(\`/verifications/\${kCase.id}/documents\`, form);

// 3. Submit for AI verification
await client.post(\`/verifications/\${kCase.id}/submit\`);

// Status updates arrive via webhooks automatically`,
  python: `import requests

BASE = 'https://your-api.example.com/api/v1'
HEADERS = {'x-api-key': 'gs_live_YOUR_API_KEY'}

# 1. Create a verification case
case = requests.post(f'{BASE}/verifications', json={
    'externalUserId': 'user_123',
    'firstName': 'Jane',
    'lastName': 'Doe',
    'country': 'GB',
    'dateOfBirth': '1990-05-15',
}, headers=HEADERS).json()

# 2. Upload document
with open('passport.jpg', 'rb') as f:
    requests.post(
        f'{BASE}/verifications/{case["id"]}/documents',
        files={'file': f},
        data={'type': 'passport'},
        headers=HEADERS
    )

# 3. Submit for AI verification
requests.post(f'{BASE}/verifications/{case["id"]}/submit', headers=HEADERS)`,
  webhook: `// Verify the webhook signature in your receiver
const crypto = require('crypto');

app.post('/webhooks/kyc', (req, res) => {
  const sig = req.headers['x-webhook-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (sig !== expected) return res.status(401).send('Invalid signature');

  const { event, data, timestamp } = req.body;

  switch (event) {
    case 'verification.approved':
      // Grant the user access in your system
      await grantUserAccess(data.externalUserId);
      break;
    case 'verification.rejected':
      // Notify the user
      await notifyUser(data.externalUserId, data.rejectionReason);
      break;
    case 'aml.match_found':
      // Flag for compliance review
      await flagForReview(data.caseId, data.result);
      break;
  }

  res.json({ received: true });
});`,
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);
  return { copied, copy };
}

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {text}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'apikeys' | 'webhooks' | 'quickstart' | 'events';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'apikeys', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" /> },
  { id: 'quickstart', label: 'Quick Start', icon: <Code2 className="w-4 h-4" /> },
  { id: 'events', label: 'Event Catalog', icon: <BookOpen className="w-4 h-4" /> },
];

// ─── API Keys tab ─────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { copied, copy } = useCopy();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/me/api-keys');
      const data = res.data?.data ?? res.data;
      setKeys(Array.isArray(data) ? data : []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/tenants/me/api-keys', {
        label: newLabel,
        scopes: ['VERIFICATION_READ', 'VERIFICATION_WRITE'],
      });
      const payload = res.data?.data ?? res.data;
      setNewKey(payload.apiKey);
      setNewLabel('');
      setShowForm(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await api.delete(`/tenants/me/api-keys/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Save your API key — it won't be shown again</p>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-200">
                <code className="text-sm font-mono flex-1 truncate text-gray-800">{newKey}</code>
                <button onClick={() => copy(newKey, 'newkey')} className="text-emerald-600 hover:text-emerald-700">
                  {copied === 'newkey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewKey(null)} className="text-emerald-400 hover:text-emerald-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{keys.length} key{keys.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white text-sm font-medium rounded-lg hover:bg-amber-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Key label</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Production integration"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
          </div>
          <button
            onClick={create}
            disabled={creating || !newLabel.trim()}
            className="px-4 py-2 bg-amber-800 text-white text-sm font-medium rounded-lg hover:bg-amber-900 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">
          <div className="w-6 h-6 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading…
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {keys.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No API keys</div>
          ) : keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{k.label}</span>
                  {k.isTestKey && <Badge text="Test" className="bg-yellow-50 text-yellow-700 border-yellow-100" />}
                  {!k.active && <Badge text="Revoked" className="bg-red-50 text-red-600 border-red-100" />}
                </div>
                <div className="flex items-center gap-3">
                  <code className="text-xs font-mono text-gray-500">{k.keyPrefix}•••</code>
                  <span className="text-xs text-gray-400">
                    {k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copy(k.keyPrefix, k.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Copy prefix"
                >
                  {copied === k.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                {k.active && (
                  <button
                    onClick={() => revoke(k.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    title="Revoke key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Webhooks tab ─────────────────────────────────────────────────────────────

function WebhooksTab() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['*']);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; httpStatus?: number; durationMs: number } | null>(null);
  const [deliveries, setDeliveries] = useState<{ id: string; items: DeliveryAttempt[] } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/webhooks');
      const data = res.data?.data ?? res.data;
      setEndpoints(Array.isArray(data) ? data : []);
    } catch {
      setEndpoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newUrl.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/webhooks', {
        url: newUrl,
        events: selectedEvents,
        description: newDesc || undefined,
      });
      const payload = res.data?.data ?? res.data;
      setNewSecret(payload.secret);
      setNewUrl('');
      setNewDesc('');
      setSelectedEvents(['*']);
      setShowForm(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    await api.delete(`/webhooks/${id}`);
    load();
  };

  const test = async (id: string) => {
    setTesting(id);
    try {
      const res = await api.post(`/webhooks/${id}/test`);
      const payload = res.data?.data ?? res.data;
      setTestResult({ id, ...payload });
    } finally {
      setTesting(null);
    }
  };

  const loadDeliveries = async (id: string) => {
    if (deliveries?.id === id) { setDeliveries(null); return; }
    const res = await api.get(`/webhooks/${id}/deliveries`);
    const data = res.data?.data ?? res.data;
    setDeliveries({ id, items: Array.isArray(data) ? data : [] });
  };

  const toggleEvent = (event: string) => {
    if (event === '*') { setSelectedEvents(['*']); return; }
    const without = selectedEvents.filter((e) => e !== '*');
    setSelectedEvents(
      without.includes(event) ? without.filter((e) => e !== event) : [...without, event],
    );
  };

  return (
    <div className="space-y-4">
      {newSecret && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Save your webhook signing secret — shown once</p>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-200">
                <code className="text-sm font-mono flex-1 truncate">{newSecret}</code>
                <button onClick={() => copy(newSecret, 'newsecret')}>
                  {copied === 'newsecret' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewSecret(null)} className="text-emerald-400 hover:text-emerald-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white text-sm font-medium rounded-lg hover:bg-amber-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Endpoint
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Endpoint URL *</label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-system.com/webhooks/kyc"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Production receiver"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Events to receive</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleEvent('*')}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  selectedEvents.includes('*')
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                }`}
              >
                All events (*)
              </button>
              {EVENTS.map((e) => (
                <button
                  key={e.event}
                  onClick={() => toggleEvent(e.event)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-mono transition-colors ${
                    selectedEvents.includes(e.event) && !selectedEvents.includes('*')
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {e.event}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={create}
              disabled={creating || !newUrl.trim()}
              className="px-4 py-2 bg-amber-800 text-white text-sm font-medium rounded-lg hover:bg-amber-900 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : 'Create Endpoint'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">
          <div className="w-6 h-6 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading…
        </div>
      ) : endpoints.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
          <Globe className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No webhook endpoints</p>
          <p className="text-xs text-gray-400 mt-1">Add an endpoint to receive real-time status updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${ep.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <code className="text-sm font-mono text-gray-800 truncate">{ep.url}</code>
                  </div>
                  {ep.description && <p className="text-xs text-gray-400 mb-1">{ep.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ep.events.map((e) => (
                      <span key={e} className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => test(ep.id)}
                    disabled={testing === ep.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testing === ep.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    Test
                  </button>
                  <button
                    onClick={() => loadDeliveries(ep.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    History
                  </button>
                  <button
                    onClick={() => remove(ep.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {testResult?.id === ep.id && (
                <div className={`px-5 py-3 border-t text-sm flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {testResult.success
                    ? <CheckCircle className="w-4 h-4" />
                    : <XCircle className="w-4 h-4" />}
                  {testResult.success
                    ? `Delivered successfully (HTTP ${testResult.httpStatus}, ${testResult.durationMs}ms)`
                    : `Failed (HTTP ${testResult.httpStatus ?? 'timeout'}, ${testResult.durationMs}ms)`}
                </div>
              )}

              {deliveries?.id === ep.id && (
                <div className="border-t border-gray-100">
                  {deliveries.items.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-gray-400 text-center">No deliveries yet</div>
                  ) : (
                    <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {deliveries.items.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                          {d.success
                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                          <span className="text-xs font-mono text-gray-600 flex-1">{d.event}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            d.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {d.httpStatus ?? '—'}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                            {d.durationMs}ms
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(d.attemptedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick Start tab ──────────────────────────────────────────────────────────

type Lang = 'nodejs' | 'python' | 'webhook';

function QuickStartTab() {
  const [lang, setLang] = useState<Lang>('nodejs');
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Integration flow:</strong> Create a case → Upload documents → Submit → Receive real-time status webhooks.
        Your system never needs to poll — every status change fires a webhook.
      </div>

      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
        {(['nodejs', 'python', 'webhook'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              lang === l ? 'bg-amber-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {l === 'nodejs' ? 'Node.js' : l === 'python' ? 'Python' : 'Webhook receiver'}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-5 text-xs overflow-x-auto leading-relaxed">
          <code>{SNIPPETS[lang]}</code>
        </pre>
        <button
          onClick={() => copy(SNIPPETS[lang], 'snippet')}
          className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          {copied === 'snippet'
            ? <Check className="w-4 h-4 text-emerald-400" />
            : <Copy className="w-4 h-4 text-gray-300" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Key className="w-5 h-5 text-amber-700" />, title: 'API Key auth', desc: 'Pass your key via x-api-key header on every request.' },
          { icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, title: 'Signed webhooks', desc: 'Verify X-Webhook-Signature (HMAC-SHA256) on all incoming events.' },
          { icon: <RefreshCw className="w-5 h-5 text-blue-600" />, title: 'Auto retries', desc: 'Failed webhooks retry up to 5× with exponential backoff.' },
        ].map((c) => (
          <div key={c.title} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="mb-2">{c.icon}</div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{c.title}</p>
            <p className="text-xs text-gray-500">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Events tab ───────────────────────────────────────────────────────────────

function EventsTab() {
  const categories = [...new Set(EVENTS.map((e) => e.category))];
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{cat}</h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {EVENTS.filter((e) => e.category === cat).map((e) => (
              <div key={e.event} className="flex items-start gap-4 px-5 py-3.5">
                <code
                  className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-lg flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => copy(e.event, e.event)}
                  title="Copy event name"
                >
                  {e.event}
                  {copied === e.event && <Check className="inline w-3 h-3 ml-1 text-emerald-500" />}
                </code>
                <p className="text-sm text-gray-600 pt-0.5">{e.description}</p>
                <Badge text={e.category} className={CATEGORY_COLORS[e.category]} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">All events share this payload shape:</p>
        <pre className="text-xs font-mono text-gray-700 leading-relaxed">{`{
  "event": "verification.approved",
  "apiVersion": "2024-01",
  "data": { ... event-specific fields ... },
  "timestamp": "2026-03-21T10:00:00.000Z"
}`}</pre>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const IntegrationHub: React.FC = () => {
  const [tab, setTab] = useState<Tab>('apikeys');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Integration Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your systems using the REST API and receive real-time status updates via webhooks.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'apikeys' && <ApiKeysTab />}
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'quickstart' && <QuickStartTab />}
      {tab === 'events' && <EventsTab />}
    </div>
  );
};

export default IntegrationHub;
