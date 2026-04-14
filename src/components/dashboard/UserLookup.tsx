import React, { useState } from 'react';
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  FileSearch,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Eye
} from 'lucide-react';
import { KYCCase } from '@/types/kyc';
import { StatusBadge, RiskBadge } from './StatusBadge';
import Avatar from '../ui/Avatar';
import { useAmlStore } from '@/stores/amlStore';

interface UserLookupProps {
  cases: KYCCase[];
  onViewCase: (caseId: string) => void;
}

const UserLookup: React.FC<UserLookupProps> = ({ cases, onViewCase }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<KYCCase | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{ name: string; id: string }>>([]);
  const amlStore = useAmlStore();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setNotFound(false);

    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const found = cases.find(c =>
        c.userName.toLowerCase().includes(query) ||
        c.userEmail.toLowerCase() === query ||
        c.userId.toLowerCase() === query
      );

      if (found) {
        setSearchResult(found);
        setNotFound(false);
        if (!recentSearches.some((r) => r.id === found.userId)) {
          setRecentSearches(prev => [{ name: found.userName, id: found.userId }, ...prev.slice(0, 4)]);
        }
      } else {
        setSearchResult(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 400);
  };

  const handleQuickSearch = (userId: string) => {
    const found = cases.find(c => c.userId === userId);
    if (found) {
      setSearchQuery(found.userName);
      setSearchResult(found);
      setNotFound(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'flagged': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'needs_review': return <Eye className="w-5 h-5 text-violet-500" />;
      default: return <Clock className="w-5 h-5 text-amber-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 rounded-lg">
            <User className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">User KYC Lookup</h2>
            <p className="text-sm text-gray-500">Search for a user to view their KYC and AML status</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter full name, email, or User ID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Recent:</span>
            {recentSearches.map((r) => (
              <button
                key={r.id}
                onClick={() => handleQuickSearch(r.id)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Not Found State */}
      {notFound && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-500 mb-4">
            No user found matching "{searchQuery}". Please check the ID or email and try again.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setNotFound(false);
            }}
            className="text-amber-800 hover:text-amber-900 font-medium"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-8">
              <div className="flex items-center gap-4">
                <Avatar
                  name={searchResult.userName}
                  src={searchResult.userAvatar}
                  size={32}
                  className="flex-shrink-0"
                />
                <div className="text-white">
                  <h3 className="text-xl font-bold">{searchResult.userName}</h3>
                  <p className="text-amber-100">{searchResult.userId}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-900">{searchResult.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-gray-900">{searchResult.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-gray-900">{searchResult.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-gray-900">{new Date(searchResult.userJoinDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KYC Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-amber-800" />
                  <h4 className="font-semibold text-gray-900">KYC Status</h4>
                </div>
                <StatusBadge status={searchResult.status} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Case ID</span>
                  <span className="text-sm font-medium text-gray-900">{searchResult.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <RiskBadge level={searchResult.riskLevel} size="sm" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">AI Score</span>
                  <span className={`text-sm font-medium ${searchResult.aiResult.overallScore >= 80 ? 'text-emerald-600' :
                      searchResult.aiResult.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    {searchResult.aiResult.overallScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Submitted</span>
                  <span className="text-sm text-gray-900">{new Date(searchResult.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm text-gray-900">{searchResult.documents.length} uploaded</span>
                </div>
              </div>

              <button
                onClick={() => onViewCase(searchResult.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Case
              </button>
            </div>

            {/* AML Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">AML Status</h4>
                </div>
                {searchResult.aiResult.watchlistHits > 0 ? (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                    {searchResult.aiResult.watchlistHits} Hit(s)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                    Clear
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Sanctions Check</span>
                  <div className="flex items-center gap-1">
                    {searchResult.aiResult.watchlistHits > 0 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">Potential Match</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600">Clear</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">PEP Check</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600">Clear</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Adverse Media</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600">Clear</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Last Screened</span>
                  <span className="text-sm text-gray-900">{new Date(searchResult.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (searchResult) {
                    amlStore.runScreening(
                      searchResult.userName,
                      searchResult.country,
                      undefined,
                    );
                  }
                }}
                disabled={amlStore.isScreening}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {amlStore.isScreening ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Screening...</>
                ) : (
                  <><Shield className="w-4 h-4" /> Run New Screening</>
                )}
              </button>
              {amlStore.error && (
                <p className="mt-2 text-xs text-red-600 text-center">{amlStore.error}</p>
              )}
              {amlStore.currentResult && !amlStore.isScreening && (
                <p className="mt-2 text-xs text-emerald-600 text-center">
                  Screening complete — {amlStore.currentResult.totalMatches} match{amlStore.currentResult.totalMatches !== 1 ? 'es' : ''} found
                </p>
              )}
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
            <div className="space-y-3">
              {searchResult.timeline.slice(-3).reverse().map((event) => (
                <div key={event.id} className="flex items-center gap-3">
                  {getStatusIcon(event.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchResult && !notFound && !isSearching && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-amber-800" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for a User</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter a full name, email address, or User ID to view their KYC verification status, AML screening results, and case history.
          </p>

          {/* Sample User IDs */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {cases.slice(0, 5).map((c) => (
                <button
                  key={c.userId}
                  onClick={() => handleQuickSearch(c.userId)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                >
                  {c.userName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLookup;
