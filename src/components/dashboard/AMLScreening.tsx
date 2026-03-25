import React, { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  User,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Globe,
  Calendar,
  Brain,
  Newspaper,
  Crown,
  TrendingUp,
  Tag,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
  Trash2,
} from 'lucide-react';
import { RiskLevel, AMLScreeningResult } from '@/types/kyc';
import { useAmlStore } from '@/stores/amlStore';
import { COUNTRIES } from '@/lib/countries';
import { RiskBadge } from './StatusBadge';
import { useAuth } from '@/contexts/AuthContext';

const AMLScreening: React.FC = () => {
  const { hasPermission } = useAuth();
  const {
    screenings,
    currentResult,
    isScreening,
    isLoading,
    monitored,
    sanctionsStats,
    isRefreshing,
    fetchScreenings,
    runScreening,
    clearResult,
    enrollMonitoring,
    removeMonitoring,
    fetchMonitored,
    refreshSanctions,
    fetchSanctionsStats,
  } = useAmlStore();

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sanctions' | 'pep' | 'media'>('sanctions');
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [showSanctionsAdmin, setShowSanctionsAdmin] = useState(false);

  useEffect(() => {
    fetchScreenings();
    if (hasPermission('view_monitoring')) fetchMonitored();
    if (hasPermission('manage_sanctions')) fetchSanctionsStats();
  }, []);

  const handleSearch = () => {
    if (!fullName.trim()) return;
    setActiveTab('sanctions');
    runScreening(fullName.trim(), country || undefined, dateOfBirth || undefined);
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'text-red-600';
    if (score >= 51) return 'text-orange-600';
    if (score >= 26) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 76) return 'stroke-red-500';
    if (score >= 51) return 'stroke-orange-500';
    if (score >= 26) return 'stroke-amber-500';
    return 'stroke-emerald-500';
  };

  const getScoreBgGlow = (score: number) => {
    if (score >= 76) return 'shadow-red-100';
    if (score >= 51) return 'shadow-orange-100';
    if (score >= 26) return 'shadow-amber-100';
    return 'shadow-emerald-100';
  };

  const sr = currentResult;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 rounded-lg">
            <Shield className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              AI-Powered AML Screening
            </h2>
            <p className="text-sm text-gray-500">
              Screen against global sanctions, PEP databases, and adverse media
              with AI risk analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Full name (required)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all appearance-none"
            >
              <option value="">Country (optional)</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              placeholder="Date of birth (YYYY-MM-DD)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isScreening || !fullName.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isScreening ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Screening (AI analysis in progress)...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Run Comprehensive Screening
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Searches OFAC, UN, EU, UK sanctions lists + PEP database + adverse
          media (GDELT) + AI risk scoring
        </p>
      </div>

      {/* Enhanced Results */}
      {sr && (
        <>
          {/* Risk Score + AI Summary Header */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div
              className={`px-6 py-4 border-b ${
                sr.overallRisk === 'critical' || sr.overallRisk === 'high'
                  ? 'bg-red-50 border-red-100'
                  : sr.overallRisk === 'medium'
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sr.overallRisk === 'low' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle
                      className={`w-6 h-6 ${
                        sr.overallRisk === 'critical' || sr.overallRisk === 'high'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Screening Results for {sr.userName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sr.riskLevel
                        ? `Risk Level: ${sr.riskLevel}`
                        : sr.totalMatches === 0
                          ? 'No matches found'
                          : `${sr.totalMatches} potential match(es)`}
                    </p>
                  </div>
                </div>
                <RiskBadge level={sr.overallRisk} size="lg" />
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Risk Score Gauge */}
                {sr.riskScore != null && (
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`relative w-32 h-32 rounded-full shadow-lg ${getScoreBgGlow(sr.riskScore)}`}>
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none" stroke="#e5e7eb" strokeWidth="10"
                        />
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none"
                          className={getScoreRingColor(sr.riskScore)}
                          strokeWidth="10"
                          strokeDasharray={`${(sr.riskScore / 100) * 314} 314`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(sr.riskScore)}`}>
                          {sr.riskScore}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">/ 100</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-700">Risk Score</p>
                  </div>
                )}

                {/* AI Summary + Categories */}
                <div className="flex-1 space-y-4">
                  {sr.aiSummary && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          AI Risk Assessment
                        </h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {sr.aiSummary}
                      </p>
                    </div>
                  )}

                  {sr.riskCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sr.riskCategories.map((cat) => (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            cat.includes('sanctions')
                              ? 'bg-red-100 text-red-700'
                              : cat.includes('pep')
                                ? 'bg-purple-100 text-purple-700'
                                : cat.includes('adverse')
                                  ? 'bg-orange-100 text-orange-700'
                                  : cat.includes('high_risk')
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          {cat.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {sr.totalMatches}
                      </p>
                      <p className="text-xs text-gray-500">Sanctions Hits</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {sr.pep?.isPep ? 'Yes' : 'No'}
                      </p>
                      <p className="text-xs text-gray-500">PEP Status</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {sr.adverseMedia?.adverseCount ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Adverse Media</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Details */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <TabButton
                active={activeTab === 'sanctions'}
                onClick={() => setActiveTab('sanctions')}
                icon={<Shield className="w-4 h-4" />}
                label="Sanctions"
                count={sr.totalMatches}
              />
              <TabButton
                active={activeTab === 'pep'}
                onClick={() => setActiveTab('pep')}
                icon={<Crown className="w-4 h-4" />}
                label="PEP"
                count={sr.pep?.isPep ? 1 : 0}
              />
              <TabButton
                active={activeTab === 'media'}
                onClick={() => setActiveTab('media')}
                icon={<Newspaper className="w-4 h-4" />}
                label="Adverse Media"
                count={sr.adverseMedia?.adverseCount ?? 0}
              />
            </div>

            <div className="p-4">
              {/* Sanctions Tab */}
              {activeTab === 'sanctions' && (
                <>
                  {sr.matches.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {sr.matches.map((match) => (
                        <div key={match.id} className="py-3">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() =>
                              setExpandedMatch(
                                expandedMatch === match.id ? null : match.id,
                              )
                            }
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRiskColor(match.riskLevel)}`}
                              >
                                <span
                                  className={`text-lg font-bold ${getScoreColor(match.matchScore)}`}
                                >
                                  {match.matchScore}%
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {match.name}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>{match.source}</span>
                                  <span>·</span>
                                  <span className="capitalize">
                                    {match.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <RiskBadge level={match.riskLevel} size="sm" />
                              {expandedMatch === match.id ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {expandedMatch === match.id && (
                            <div className="mt-3 pl-16 space-y-2">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  {match.details}
                                </p>
                              </div>
                              <div
                                className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getRiskColor(match.riskLevel)}`}
                              >
                                {match.recommendation}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      }
                      title="No Sanctions Matches"
                      description="No matches found in OFAC, UN, EU, or UK sanctions databases."
                    />
                  )}
                </>
              )}

              {/* PEP Tab */}
              {activeTab === 'pep' && (
                <>
                  {sr.pep?.isPep ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <Crown className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900">
                            Politically Exposed Person Identified
                          </h4>
                          {sr.pep.position && (
                            <p className="text-sm text-purple-800 mt-1">
                              <span className="font-medium">Position:</span>{' '}
                              {sr.pep.position}
                            </p>
                          )}
                          {sr.pep.country && (
                            <p className="text-sm text-purple-800">
                              <span className="font-medium">Country:</span>{' '}
                              {sr.pep.country}
                            </p>
                          )}
                          <p className="text-sm text-purple-700 mt-2">
                            {sr.pep.details}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">
                              Confidence:{' '}
                              {Math.round(sr.pep.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      }
                      title="Not a PEP"
                      description="This individual has not been identified as a Politically Exposed Person."
                    />
                  )}
                </>
              )}

              {/* Adverse Media Tab */}
              {activeTab === 'media' && (
                <>
                  {sr.adverseMedia &&
                  sr.adverseMedia.articles.length > 0 ? (
                    <div className="space-y-3">
                      {sr.adverseMedia.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100">
                          {sr.adverseMedia.categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium capitalize"
                            >
                              {cat.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                      {sr.adverseMedia.articles.map((article, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            article.isAdverse
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {article.isAdverse && (
                                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                )}
                                {article.url ? (
                                  <a
                                    href={article.url.startsWith('http') ? article.url : `https://${article.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-gray-900 hover:text-amber-800 hover:underline line-clamp-2"
                                  >
                                    {article.title}
                                  </a>
                                ) : (
                                  <h5 className="text-sm font-medium text-gray-900 line-clamp-2">
                                    {article.title}
                                  </h5>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>{article.source}</span>
                                <span>·</span>
                                <span>{article.date}</span>
                                {article.isAdverse && (
                                  <>
                                    <span>·</span>
                                    <span
                                      className={`font-medium ${
                                        article.severity === 'high'
                                          ? 'text-red-600'
                                          : article.severity === 'medium'
                                            ? 'text-orange-600'
                                            : 'text-amber-600'
                                      }`}
                                    >
                                      {article.severity} severity
                                    </span>
                                  </>
                                )}
                              </div>
                              {article.snippet && (
                                <p className="text-xs text-gray-600 mt-1.5">
                                  {article.snippet}
                                </p>
                              )}
                              {article.categories.length > 0 && (
                                <div className="flex gap-1.5 mt-2">
                                  {article.categories.map((c) => (
                                    <span
                                      key={c}
                                      className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200 capitalize"
                                    >
                                      {c.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {article.url && (
                                <a
                                  href={article.url.startsWith('http') ? article.url : `https://${article.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 hover:text-amber-900 font-medium"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Read article
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      }
                      title="No Adverse Media"
                      description="No adverse media coverage found for this individual."
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Recent Screenings */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Recent Screenings</h3>
          </div>
        </div>
        {isLoading ? (
          <div className="px-6 py-8 text-center">
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading screenings...</p>
          </div>
        ) : screenings.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              No screenings yet. Run your first screening above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {screenings.slice(0, 10).map((s, index) => (
              <div
                key={`${s.userId}-${index}`}
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  clearResult();
                  setTimeout(() => {
                    useAmlStore.setState({ currentResult: s });
                    setActiveTab('sanctions');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 50);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        s.overallRisk === 'low'
                          ? 'bg-emerald-100'
                          : s.overallRisk === 'critical' || s.overallRisk === 'high'
                            ? 'bg-red-100'
                            : 'bg-amber-100'
                      }`}
                    >
                      {s.overallRisk === 'low' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            s.overallRisk === 'critical' || s.overallRisk === 'high'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{s.userName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {s.riskScore != null && (
                          <>
                            <span className={`font-semibold ${getScoreColor(s.riskScore)}`}>
                              Score: {s.riskScore}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span>
                          {s.totalMatches} sanctions ·{' '}
                          {s.pep?.isPep ? 'PEP' : 'Not PEP'} ·{' '}
                          {s.adverseMedia?.adverseCount ?? 0} media
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(s.screenedAt).toLocaleString()}
                      </p>
                    </div>
                    <RiskBadge level={s.overallRisk} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-5 h-5 text-amber-800" />
            </div>
            <h4 className="font-semibold text-gray-900">Sanctions</h4>
          </div>
          <p className="text-sm text-gray-600">
            OFAC, UN, EU & UK sanctions lists updated daily from government
            sources.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">PEP Database</h4>
          </div>
          <p className="text-sm text-gray-600">
            50K+ politically exposed persons from OpenSanctions + AI
            identification.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Newspaper className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Adverse Media</h4>
          </div>
          <p className="text-sm text-gray-600">
            GDELT global news analysis with AI classification for financial
            crime coverage.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900">AI Risk Engine</h4>
          </div>
          <p className="text-sm text-gray-600">
            GPT-powered risk scoring, PEP identification, and compliance
            narrative generation.
          </p>
        </div>
      </div>

      {/* Ongoing Monitoring */}
      {hasPermission('view_monitoring') && (
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowMonitoring(!showMonitoring)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-800" />
              <h3 className="font-semibold text-gray-900">Ongoing Monitoring</h3>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{monitored.length}</span>
            </div>
            {showMonitoring ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {showMonitoring && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              {monitored.length > 0 ? (
                <div className="space-y-2">
                  {monitored.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {entry.country && `${entry.country} \u00b7 `}
                          Last screened: {entry.lastScreenedAt ? new Date(entry.lastScreenedAt).toLocaleDateString() : 'Never'}
                          {entry.status && ` \u00b7 ${entry.status}`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeMonitoring(entry.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <EyeOff className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No subjects under ongoing monitoring</p>
                  <p className="text-xs text-gray-400 mt-1">Enroll screenings for continuous monitoring from the screening results</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enroll Monitoring Button (shown in current result) */}
      {sr && hasPermission('view_monitoring') && (
        <div className="flex justify-center">
          <button
            onClick={() => enrollMonitoring(sr.userId)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Eye className="w-4 h-4" /> Enroll in Ongoing Monitoring
          </button>
        </div>
      )}

      {/* Sanctions Admin */}
      {hasPermission('manage_sanctions') && (
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowSanctionsAdmin(!showSanctionsAdmin)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-800" />
              <h3 className="font-semibold text-gray-900">Sanctions Database Admin</h3>
            </div>
            {showSanctionsAdmin ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {showSanctionsAdmin && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              {sanctionsStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{sanctionsStats.totalEntries?.toLocaleString() ?? 0}</p>
                      <p className="text-xs text-gray-500">Total Entries</p>
                    </div>
                    {sanctionsStats.sources && Object.entries(sanctionsStats.sources).map(([source, count]: [string, any]) => (
                      <div key={source} className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{Number(count).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{source}</p>
                      </div>
                    ))}
                  </div>
                  {sanctionsStats.lastRefreshed && (
                    <p className="text-xs text-gray-400">Last refreshed: {new Date(sanctionsStats.lastRefreshed).toLocaleString()}</p>
                  )}
                  <button
                    onClick={refreshSanctions}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh All Sanctions Lists'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Database className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading sanctions statistics...</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Small reusable sub-components                                      */
/* ------------------------------------------------------------------ */
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-amber-700 text-amber-800'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
            active
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-3 w-fit">{icon}</div>
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  );
}

export default AMLScreening;
