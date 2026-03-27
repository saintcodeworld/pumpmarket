'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

interface Listing {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  pinned?: boolean;
  pinnedAt?: Date;
}

function ListingsPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideMyListings, setHideMyListings] = useState(true);
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (mounted) {
      fetchListings();
    }
  }, [mounted]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/listings');
      setListings(response.data.listings || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const categories = [
    { id: 'all', label: 'All Listings', icon: '🛍️', count: listings.length },
    { id: 'Trading Bot', label: 'Trading Bots', icon: '🤖', count: listings.filter(l => l.category === 'Trading Bot').length },
    { id: 'API Tool', label: 'API Tools', icon: '🔌', count: listings.filter(l => l.category === 'API Tool').length },
    { id: 'Script', label: 'Scripts', icon: '📜', count: listings.filter(l => l.category === 'Script').length },
    { id: 'Jobs/Services', label: 'Jobs & Services', icon: '💼', count: listings.filter(l => l.category === 'Jobs/Services').length },
    { id: 'Music', label: 'Music', icon: '🎵', count: listings.filter(l => l.category === 'Music').length },
    { id: 'Games', label: 'Games', icon: '🎮', count: listings.filter(l => l.category === 'Games').length },
    { id: 'Mods', label: 'Mods', icon: '🔧', count: listings.filter(l => l.category === 'Mods').length },
    { id: 'Private Access', label: 'Private Access', icon: '🔐', count: listings.filter(l => l.category === 'Private Access').length },
    { id: 'Call Groups', label: 'Call Groups', icon: '📞', count: listings.filter(l => l.category === 'Call Groups').length },
    { id: 'Raid Services', label: 'Raid Services', icon: '⚔️', count: listings.filter(l => l.category === 'Raid Services').length },
    { id: 'Telegram Groups', label: 'Telegram Groups', icon: '✈️', count: listings.filter(l => l.category === 'Telegram Groups').length },
    { id: 'Discord Services', label: 'Discord Services', icon: '💬', count: listings.filter(l => l.category === 'Discord Services').length },
    { id: 'Art & Design', label: 'Art & Design', icon: '🎨', count: listings.filter(l => l.category === 'Art & Design').length },
    { id: 'Video Content', label: 'Video Content', icon: '🎬', count: listings.filter(l => l.category === 'Video Content').length },
    { id: 'Courses & Tutorials', label: 'Courses & Tutorials', icon: '📚', count: listings.filter(l => l.category === 'Courses & Tutorials').length },
    { id: 'Data & Analytics', label: 'Data & Analytics', icon: '📊', count: listings.filter(l => l.category === 'Data & Analytics').length },
    { id: 'Marketing Tools', label: 'Marketing Tools', icon: '📈', count: listings.filter(l => l.category === 'Marketing Tools').length },
    { id: 'Social Media', label: 'Social Media', icon: '📱', count: listings.filter(l => l.category === 'Social Media').length },
    { id: 'NFT Tools', label: 'NFT Tools', icon: '🖼️', count: listings.filter(l => l.category === 'NFT Tools').length },
    { id: 'Custom', label: 'Custom', icon: '⚡', count: listings.filter(l => l.category === 'Custom').length },
  ];

  // Filter by category
  let filteredListings = selectedCategory === 'all'
    ? listings
    : listings.filter(l => l.category === selectedCategory);

  // Filter out user's own listings if toggle is enabled
  if (hideMyListings && publicKey) {
    filteredListings = filteredListings.filter(l => l.wallet !== publicKey.toBase58());
  }

  // Filter by wallet search
  if (walletSearch.trim()) {
    filteredListings = filteredListings.filter(l =>
      l.wallet.toLowerCase().includes(walletSearch.toLowerCase().trim())
    );
  }

  // Utility to truncate wallet address
  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f14] py-6 px-4 relative">
      <div className="mx-auto max-w-[1600px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛍️ Browse Marketplace
          </h1>
          <p className="text-sm text-white/50">
            Discover software, services, content, and more
          </p>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-4 rounded-lg border border-purple-900/40 bg-purple-950/20 p-3">
            <p className="text-sm text-purple-300">
              <strong>👀 Browse Mode:</strong> Connect your wallet to purchase or create listings.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-4 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-3">
            <p className="text-sm text-yellow-400">
              <strong>⚠️ Action Required:</strong> Accept TOS to interact with the marketplace.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-4 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-3">
            <p className="text-sm text-yellow-400">
              <strong>👀 Browse Mode:</strong> Need 50,000 $PumpMarket tokens to purchase/create.
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
                      ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black shadow-md'
                      : 'bg-white/5 text-white/70 border border-purple-900/30'
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
            <div className="sticky top-4 rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100vh-8rem)]">
              {/* Sidebar Header */}
              <div className="border-b border-purple-900/30 p-3 flex items-center justify-between flex-shrink-0">
                {sidebarOpen && (
                  <h3 className="font-semibold text-sm text-white">
                    Categories
                  </h3>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
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
                            ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black shadow-md'
                            : 'text-white/70 hover:bg-white/10'
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
                    placeholder="🔍 Search by vendor wallet..."
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                  />
                </div>

                {/* Right: View & Hide toggles */}
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border border-purple-900/30 bg-black/40 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black'
                          : 'text-white/50 hover:text-white'
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
                          ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black'
                          : 'text-white/50 hover:text-white'
                      }`}
                      title="List view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Hide My Listings Toggle */}
                  {publicKey && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideMyListings}
                        onChange={(e) => setHideMyListings(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9945FF]/30 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9945FF] relative"></div>
                      <span className="ms-2 text-xs font-medium text-white/50 whitespace-nowrap hidden sm:inline">
                        Hide mine
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-3 pt-3 border-t border-purple-900/30">
                <p className="text-sm text-white/50">
                  <span className="font-semibold text-white">{filteredListings.length}</span> {filteredListings.length === 1 ? 'listing' : 'listings'} found
                  {selectedCategory !== 'all' && <span> in <strong>{categories.find(c => c.id === selectedCategory)?.label}</strong></span>}
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

            {/* Listings Display */}
            {!loading && !error && (
              <>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50">No listings found in this category</p>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="group overflow-hidden rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-white/5">
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {listing.riskLevel === 'high-risk' && (
                        <div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                          High Risk
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-white line-clamp-2">
                          {listing.title}
                        </h3>
                      </div>

                      <p className="mb-4 text-sm text-white/50 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-white/40">Price</span>
                          <p className="text-lg font-bold text-white">
                            ${listing.price.toFixed(2)} USDC
                          </p>
                        </div>

                        <Link
                          href={`/listings/${listing._id}`}
                          className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                        >
                          View Details
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-purple-900/30 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70">
                          {listing.category}
                        </span>
                        <span className="text-xs text-white/40 font-mono">
                          {truncateWallet(listing.wallet)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View - Forum Style
              <div className="space-y-1">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing._id}
                    href={`/listings/${listing._id}`}
                    className="group block"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-purple-900/30 bg-white/5 px-4 py-2 transition-all hover:bg-white/10 max-h-[50px]">
                      {/* Status Badge */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {listing.riskLevel === 'high-risk' && (
                          <span className="text-sm" title="High Risk">⚠️</span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#9945FF]">
                          {listing.title}
                        </h3>
                      </div>

                      {/* Category */}
                      <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70 flex-shrink-0">
                        {listing.category}
                      </span>

                      {/* Vendor */}
                      <span className="hidden md:block text-xs text-white/40 font-mono flex-shrink-0">
                        {truncateWallet(listing.wallet)}
                      </span>

                      {/* Price */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          ${listing.price.toFixed(2)}
                        </span>
                        <svg className="w-4 h-4 text-white/40 group-hover:text-[#9945FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default function ListingsPage() {
  return <ListingsPageContent />;
}

