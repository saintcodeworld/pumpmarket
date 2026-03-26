'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

interface Fundraiser {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  goalAmount?: number;
  raisedAmount?: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  pinned?: boolean;
  pinnedAt?: Date;
  views?: number;
}

function FundraisersPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const searchParams = useSearchParams();

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideMyFundraisers, setHideMyFundraisers] = useState(false);
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Pre-fill wallet search from URL params
  useEffect(() => {
    const walletParam = searchParams.get('wallet');
    if (walletParam) {
      setWalletSearch(walletParam);
      setHideMyFundraisers(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mounted) {
      fetchFundraisers();
    }
  }, [mounted]);

  const fetchFundraisers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/fundraisers');
      setFundraisers(response.data.fundraisers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load fundraisers');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const categories = [
    { id: 'all', label: 'All Fundraisers', icon: '💝', count: fundraisers.length },
    { id: 'Medical', label: 'Medical', icon: '🏥', count: fundraisers.filter(f => f.category === 'Medical').length },
    { id: 'Education', label: 'Education', icon: '📚', count: fundraisers.filter(f => f.category === 'Education').length },
    { id: 'Community', label: 'Community', icon: '🤝', count: fundraisers.filter(f => f.category === 'Community').length },
    { id: 'Emergency', label: 'Emergency', icon: '🚨', count: fundraisers.filter(f => f.category === 'Emergency').length },
    { id: 'Animal Welfare', label: 'Animal Welfare', icon: '🐾', count: fundraisers.filter(f => f.category === 'Animal Welfare').length },
    { id: 'Environmental', label: 'Environmental', icon: '🌍', count: fundraisers.filter(f => f.category === 'Environmental').length },
    { id: 'Arts & Culture', label: 'Arts & Culture', icon: '🎭', count: fundraisers.filter(f => f.category === 'Arts & Culture').length },
    { id: 'Technology', label: 'Technology', icon: '💻', count: fundraisers.filter(f => f.category === 'Technology').length },
    { id: 'Sports', label: 'Sports', icon: '⚽', count: fundraisers.filter(f => f.category === 'Sports').length },
    { id: 'Religious', label: 'Religious', icon: '🙏', count: fundraisers.filter(f => f.category === 'Religious').length },
    { id: 'Memorial', label: 'Memorial', icon: '🕯️', count: fundraisers.filter(f => f.category === 'Memorial').length },
    { id: 'Business', label: 'Business', icon: '💼', count: fundraisers.filter(f => f.category === 'Business').length },
    { id: 'Personal', label: 'Personal', icon: '👤', count: fundraisers.filter(f => f.category === 'Personal').length },
    { id: 'Other', label: 'Other', icon: '⚡', count: fundraisers.filter(f => f.category === 'Other').length },
  ];

  // Filter by category
  let filteredFundraisers = selectedCategory === 'all'
    ? fundraisers
    : fundraisers.filter(f => f.category === selectedCategory);

  // Filter out user's own fundraisers if toggle is enabled
  if (hideMyFundraisers && publicKey) {
    filteredFundraisers = filteredFundraisers.filter(f => f.wallet !== publicKey.toBase58());
  }

  // Filter by wallet search
  if (walletSearch.trim()) {
    filteredFundraisers = filteredFundraisers.filter(f =>
      f.wallet.toLowerCase().includes(walletSearch.toLowerCase().trim())
    );
  }

  // Utility to truncate wallet address
  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const getFundedPct = (f: Fundraiser) =>
    Math.min(((f.raisedAmount || 0) / (f.goalAmount || f.price)) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0f0f14] py-6 px-4 pb-20 relative">
      <div className="mx-auto max-w-[1600px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            💝 Browse Fundraisers
          </h1>
          <p className="text-sm text-white/50">
            Support anonymous fundraising campaigns using crypto
          </p>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-4 rounded-lg border border-purple-900/40 bg-purple-950/20 p-3">
            <p className="text-sm text-purple-300">
              <strong>👀 Browse Mode:</strong> Connect your wallet to donate or create fundraisers.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-4 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-3">
            <p className="text-sm text-yellow-400">
              <strong>⚠️ Action Required:</strong> Accept TOS to interact with fundraisers.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-4 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-3">
            <p className="text-sm text-yellow-400">
              <strong>👀 Browse Mode:</strong> Need 50,000 $PumpMarket tokens to donate/create.
            </p>
          </div>
        ) : null}

        {/* Mobile Category Filter - Horizontal Scroll */}
        <div className="mb-4 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#9945FF] text-white shadow-md shadow-purple-900/30'
                      : 'bg-white/5 text-white/70 border border-purple-900/30 hover:bg-white/10'
                  }`}
                >
                  <span>{category.icon}</span>
                  {sidebarOpen && <span>{category.label}</span>}
                  {category.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      {category.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex gap-6 pb-20">
          {/* Sidebar - Desktop Only */}
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-16'}`}>
            <div className="sticky top-4 rounded-lg border border-purple-900/30 bg-[#0f0f14]/95 backdrop-blur-sm overflow-hidden max-h-[calc(100vh-8rem)]">
              {/* Sidebar Header */}
              <div className="border-b border-purple-900/30 p-3 flex items-center justify-between flex-shrink-0">
                {sidebarOpen && (
                  <h3 className="font-semibold text-sm text-white/80">
                    Categories
                  </h3>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarOpen ? (
                    <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Category Menu */}
              <div className="overflow-y-auto p-2 flex-1" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
                <nav className="space-y-1">
                  {categories.map((category) => {
                    const isActive = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? 'bg-[#9945FF] text-white shadow-sm shadow-purple-900/30'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{category.icon}</span>
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-sm font-medium truncate">
                              {category.label}
                            </span>
                            {category.count > 0 && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                isActive ? 'bg-white/20' : 'bg-white/10'
                              }`}>
                                {category.count}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full lg:w-auto">
            {/* Toolbar */}
            <div className="mb-4 rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Left: Search */}
                <div className="flex-1 w-full md:max-w-md">
                  <input
                    type="text"
                    placeholder="🔍 Search by organizer wallet..."
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                  />
                </div>

                {/* Right: View & Hide toggles */}
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border border-purple-900/30 bg-black/30 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-[#9945FF] text-white'
                          : 'text-white/40 hover:text-white/80'
                      }`}
                      title="Grid view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-[#9945FF] text-white'
                          : 'text-white/40 hover:text-white/80'
                      }`}
                      title="List view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Hide My Fundraisers Toggle */}
                  {publicKey && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideMyFundraisers}
                        onChange={(e) => setHideMyFundraisers(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9945FF]/20 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9945FF] relative"></div>
                      <span className="ms-2 text-xs font-medium text-white/60 whitespace-nowrap hidden sm:inline">
                        Hide mine
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-3 pt-3 border-t border-purple-900/30">
                <p className="text-sm text-white/50">
                  <span className="font-semibold text-white">{filteredFundraisers.length}</span> {filteredFundraisers.length === 1 ? 'fundraiser' : 'fundraisers'} found
                  {selectedCategory !== 'all' && <span> in <strong className="text-white/70">{categories.find(c => c.id === selectedCategory)?.label}</strong></span>}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
                <p className="text-sm text-red-400">⚠️ {error}</p>
              </div>
            )}

            {/* Fundraisers Display */}
            {!loading && !error && (
              <>
            {filteredFundraisers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 text-6xl">💝</div>
                <p className="text-white/50 mb-4">No fundraisers found in this category</p>
                {isTokenGated && (
                  <Link
                    href="/fundraisers/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                  >
                    <span>💝</span>
                    Be the first to create a fundraiser here!
                  </Link>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFundraisers.map((fundraiser) => (
                  <div
                    key={fundraiser._id}
                    className="group overflow-hidden rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm transition-all hover:border-purple-600/50 hover:bg-white/[0.08]"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-white/5">
                      <Image
                        src={fundraiser.imageUrl}
                        alt={fundraiser.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {fundraiser.pinned === true && (
                        <div className="absolute top-2 left-2 rounded-full bg-yellow-500 px-3 py-1 text-xs font-medium text-white shadow-lg animate-pulse">
                          📌 Featured
                        </div>
                      )}
                      {fundraiser.riskLevel === 'high-risk' && (
                        <div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                          High Risk
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-white line-clamp-2">
                          {fundraiser.title}
                        </h3>
                      </div>

                      <p className="mb-4 text-sm text-white/50 line-clamp-2">
                        {fundraiser.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                          <span className="font-medium text-[#14F195]">${(fundraiser.raisedAmount || 0).toFixed(2)} raised</span>
                          <span>of ${(fundraiser.goalAmount || fundraiser.price).toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] transition-all duration-500"
                            style={{ width: `${getFundedPct(fundraiser)}%` }}
                          />
                        </div>
                        <div className="text-xs text-[#9945FF] mt-1 font-medium">
                          {Math.round(getFundedPct(fundraiser))}% funded
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Link
                          href={`/fundraisers/${fundraiser._id}`}
                          className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                        >
                          💝 Donate Now
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-purple-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70">
                            {fundraiser.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            👁️ {fundraiser.views || 0}
                          </span>
                        </div>
                        <span className="text-xs text-white/40 font-mono">
                          {truncateWallet(fundraiser.wallet)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-1">
                {filteredFundraisers.map((fundraiser) => (
                  <Link
                    key={fundraiser._id}
                    href={`/fundraisers/${fundraiser._id}`}
                    className="group block"
                  >
                    <div className="relative flex items-center gap-3 rounded-lg border border-purple-900/30 bg-white/5 px-4 py-2 transition-all hover:border-[#9945FF]/60 hover:bg-purple-950/20 overflow-hidden">
                      {/* Bottom progress bar indicator */}
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#9945FF] to-[#14F195] transition-all duration-500"
                        style={{ width: `${getFundedPct(fundraiser)}%` }}
                      />

                      {/* Status Badges */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {fundraiser.pinned === true && (
                          <span className="text-sm" title="Featured">📌</span>
                        )}
                        {fundraiser.riskLevel === 'high-risk' && (
                          <span className="text-sm" title="High Risk">⚠️</span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#9945FF]">
                          {fundraiser.title}
                        </h3>
                      </div>

                      {/* Progress Amount */}
                      <div className="flex items-center gap-1 text-xs text-[#14F195] font-medium flex-shrink-0">
                        <span className="hidden sm:inline">${(fundraiser.raisedAmount || 0).toFixed(0)}</span>
                        <span className="hidden sm:inline text-white/30">/</span>
                        <span className="hidden sm:inline text-white/50">${(fundraiser.goalAmount || fundraiser.price).toFixed(0)}</span>
                      </div>

                      {/* Category */}
                      <span className="hidden md:inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/60 flex-shrink-0">
                        {fundraiser.category}
                      </span>

                      {/* Organizer */}
                      <span className="hidden lg:block text-xs text-white/40 font-mono flex-shrink-0">
                        {truncateWallet(fundraiser.wallet)}
                      </span>

                      {/* Views */}
                      <span className="hidden xl:flex items-center gap-1 text-xs text-white/40 flex-shrink-0">
                        👁️ {fundraiser.views || 0}
                      </span>

                      {/* Percentage */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#9945FF] font-bold">
                          {Math.round(getFundedPct(fundraiser))}%
                        </span>
                        <svg className="w-4 h-4 text-white/20 group-hover:text-[#9945FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FundraisersPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14] relative">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white/50">Loading...</p>
        </div>
      </div>
    }>
      <FundraisersPageContent />
    </Suspense>
  );
}

