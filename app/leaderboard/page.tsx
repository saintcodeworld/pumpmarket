'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';

interface LeaderboardEntry {
  wallet: string;
  totalRevenue: number;
  salesCount: number;
  activeListings: number;
}

function LeaderboardPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted) {
      fetchLeaderboard();
    }
  }, [mounted]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leaderboard?limit=20');
      setLeaderboard(response.data.leaderboard);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const isCurrentUser = (wallet: string) => {
    return publicKey?.toBase58() === wallet;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f14] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
            🏆 Top Sellers Leaderboard
          </h1>
          <p className="text-lg text-white/50">
            The highest earning vendors on SOLk Road
          </p>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-6 rounded-lg border border-purple-900/40 bg-purple-950/20 p-4">
            <p className="text-sm text-purple-300">
              <strong>👀 Browse Mode:</strong> You're viewing the leaderboard. Connect your wallet to create listings and make purchases.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-6 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-400">
              <strong>⚠️ Action Required:</strong> Please accept the Terms of Service to interact with the marketplace.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-6 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-400">
              <strong>👀 Browse Mode:</strong> You're viewing the leaderboard. Hold <strong>50,000 $PumpMarket</strong> tokens to create listings and make purchases.
            </p>
          </div>
        ) : null}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent"></div>
            <span className="ml-3 text-white/50">Loading leaderboard...</span>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm shadow-lg">
            <table className="min-w-full divide-y divide-purple-900/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
                    Seller
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-white/50">
                    Total Revenue
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-white/50">
                    Sales
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-white/50">
                    Active Listings
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-white/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30 bg-transparent">
                {leaderboard.map((entry, index) => {
                  const isTopTen = index < 10;
                  const isCurrentUserRow = isCurrentUser(entry.wallet);

                  return (
                    <tr
                      key={entry.wallet}
                      className={`transition-all duration-300 ${
                        isTopTen
                          ? 'bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/5 border-l-4 border-[#9945FF]'
                          : isCurrentUserRow
                          ? 'bg-purple-950/30'
                          : 'hover:bg-white/5'
                      } ${
                        isTopTen ? 'shadow-sm' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {index === 0 && (
                              <span className="text-3xl mr-2">🥇</span>
                            )}
                            {index === 1 && (
                              <span className="text-3xl mr-2">🥈</span>
                            )}
                            {index === 2 && (
                              <span className="text-3xl mr-2">🥉</span>
                            )}
                            <span className={`text-lg font-bold ${
                              index < 3
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent'
                                : 'text-white/70'
                            }`}>
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      </td>

                    {/* Seller Wallet */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="font-mono text-sm text-white">
                          {truncateWallet(entry.wallet)}
                        </code>
                        {isCurrentUser(entry.wallet) && (
                          <span className="inline-flex items-center rounded-full bg-purple-900/40 px-2 py-0.5 text-xs font-medium text-purple-300">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Revenue */}
                    <td className="px-6 py-4 text-right">
                      <div className="text-xl font-bold text-[#14F195]">
                        ${entry.totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-white/40">
                        USDC
                      </div>
                    </td>

                    {/* Sales Count */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                        <span className="text-sm font-semibold text-white/70">
                          {entry.salesCount}
                        </span>
                      </div>
                    </td>

                    {/* Active Listings */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                        <span className="text-sm font-semibold text-white/70">
                          {entry.activeListings}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/browse?wallet=${entry.wallet}`}
                        className="text-sm font-medium text-[#9945FF] hover:text-[#9945FF]/80"
                      >
                        View Listings →
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && (
          <div className="rounded-lg border border-purple-900/30 bg-white/5 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">
              No Sales Yet
            </h3>
            <p className="mt-2 text-sm text-white/50">
              Be the first to make a sale and claim the top spot!
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8">
          <div className="rounded-lg border border-[#14F195]/20 bg-[#14F195]/5 p-6">
            <h3 className="mb-2 text-sm font-bold text-[#14F195]">
              📊 How Rankings Work
            </h3>
            <ul className="space-y-1 text-sm text-[#14F195]">
              <li>• Rankings based on <strong>total revenue</strong> from successful sales</li>
              <li>• Updated in real-time as transactions complete</li>
              <li>• Only successful (completed) transactions count toward revenue</li>
              <li>• Your rank is highlighted when you're on the leaderboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardPageContent />;
}

