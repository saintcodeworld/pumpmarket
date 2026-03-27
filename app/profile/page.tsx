'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';

interface Transaction {
  _id: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  txnHash: string;
  status: 'success' | 'failed';
  createdAt: string;
}

interface UserStats {
  totalListings: number;
  activeListings: number;
  totalRevenue: number;
  totalPurchases: number;
  totalSpent: number;
}

function ProfilePageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const { balance: usdcBalance } = useUSDCBalance();
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalListings: 0,
    activeListings: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && isConnected && hasAcceptedTOS && publicKey) {
      fetchProfileData();
    }
  }, [mounted, isConnected, hasAcceptedTOS, publicKey, activeTab]);

  const fetchProfileData = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch transactions
      const txResponse = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: activeTab,
        },
      });

      if (activeTab === 'purchases') {
        setPurchases(txResponse.data.transactions || []);
      } else {
        setSales(txResponse.data.transactions || []);
      }

      // Fetch user stats (listings)
      const listingsResponse = await axios.get('/api/listings', {
        params: {
          wallet: publicKey.toBase58(),
        },
      });

      const listings = listingsResponse.data.listings || [];
      const activeListings = listings.filter((l: any) => l.state === 'on_market' && l.approved).length;

      // Calculate total revenue and purchases
      const allPurchasesResponse = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'purchases',
        },
      });
      const allSalesResponse = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'sales',
        },
      });

      const allPurchases = allPurchasesResponse.data.transactions || [];
      const allSales = allSalesResponse.data.transactions || [];

      const totalSpent = allPurchases
        .filter((t: Transaction) => t.status === 'success')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const totalRevenue = allSales
        .filter((t: Transaction) => t.status === 'success')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setStats({
        totalListings: listings.length,
        activeListings,
        totalRevenue,
        totalPurchases: allPurchases.filter((t: Transaction) => t.status === 'success').length,
        totalSpent,
      });

    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isConnected || !hasAcceptedTOS) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-white/50 mb-6">
            You need to connect your wallet and accept TOS to view your profile
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const currentTransactions = activeTab === 'purchases' ? purchases : sales;
  const totalAmount = currentTransactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#0f0f14] py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Profile & Analytics
          </h1>
          <p className="text-lg text-white/50 font-mono">
            {publicKey?.toBase58().slice(0, 12)}...{publicKey?.toBase58().slice(-12)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* USDC Balance */}
          <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">USDC Balance</span>
              <svg className="h-6 w-6 text-[#14F195]" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="#2775CA"/>
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">
              ${usdcBalance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Total Listings */}
          <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">Total Listings</span>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalListings}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {stats.activeListings} active
            </p>
          </div>

          {/* Total Revenue */}
          <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">Total Revenue</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-[#14F195]">
              ${stats.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-white/40 mt-1">
              From sales
            </p>
          </div>

          {/* Total Spent */}
          <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">Total Spent</span>
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-3xl font-bold text-[#14F195]">
              ${stats.totalSpent.toFixed(2)}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {stats.totalPurchases} purchases
            </p>
          </div>
        </div>

        {/* Token Gating Status */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-400">
              ⚠️ You don't have enough $PumpMarket tokens. Some features may be restricted.
            </p>
          </div>
        )}

        {/* Transaction History */}
        <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex border-b border-purple-900/30">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'purchases'
                  ? 'border-[#9945FF] text-[#9945FF]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              My Purchases
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'sales'
                  ? 'border-[#9945FF] text-[#9945FF]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              My Sales
            </button>
          </div>

          {/* Tab Stats */}
          {!loading && currentTransactions.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 border-b border-purple-900/30">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">
                  {currentTransactions.filter(t => t.status === 'success').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">
                  {activeTab === 'purchases' ? 'Spent' : 'Earned'}
                </p>
                <p className="text-2xl font-bold text-[#14F195]">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">Average</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${currentTransactions.filter(t => t.status === 'success').length > 0
                    ? (totalAmount / currentTransactions.filter(t => t.status === 'success').length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent"></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="m-6 p-4 bg-red-950/20 border border-red-900/50 rounded">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* No Transactions */}
          {!loading && !error && currentTransactions.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-white/50 mb-2">
                No {activeTab} yet
              </p>
              <p className="text-sm text-white/40 mb-4">
                {activeTab === 'purchases'
                  ? 'Browse listings to make your first purchase'
                  : 'Create a listing to start selling'}
              </p>
              <Link
                href={activeTab === 'purchases' ? '/browse' : '/listings/new'}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
              >
                {activeTab === 'purchases' ? 'Browse Listings' : 'Create Listing'}
              </Link>
            </div>
          )}

          {/* Transactions List */}
          {!loading && !error && currentTransactions.length > 0 && (
            <div className="p-6 space-y-3">
              {activeTab === 'purchases' && (
                <div className="mb-4 p-3 border border-yellow-800/40 bg-yellow-950/20 rounded text-sm text-yellow-400">
                  ⚠️ Delivery URLs are only shown once at purchase time
                </div>
              )}

              {currentTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="p-4 border border-purple-900/30 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {tx.listingTitle}
                      </h3>
                      <p className="text-sm text-white/40 mt-1">
                        {tx.listingCategory} • {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-[#14F195]">
                        ${tx.amount.toFixed(2)}
                      </p>
                      {tx.status === 'success' ? (
                        <span className="text-xs text-[#14F195]">✓ Success</span>
                      ) : (
                        <span className="text-xs text-red-400">✗ Failed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-purple-900/30 text-sm">
                    <span className="text-white/50 font-mono">
                      {activeTab === 'purchases' ? 'Seller' : 'Buyer'}: {
                        activeTab === 'purchases'
                          ? `${tx.sellerWallet.slice(0, 4)}...${tx.sellerWallet.slice(-4)}`
                          : `${tx.buyerWallet.slice(0, 4)}...${tx.buyerWallet.slice(-4)}`
                      }
                    </span>
                    <a
                      href={`https://solscan.io/tx/${tx.txnHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9945FF] hover:text-[#9945FF]/80 font-mono"
                    >
                      {tx.txnHash.slice(0, 8)}... ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedContent>
      <ProfilePageContent />
    </ProtectedContent>
  );
}

