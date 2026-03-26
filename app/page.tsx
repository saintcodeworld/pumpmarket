'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

const CONTRACT_ADDRESS = '8uQHXVLgXj8AKgRzDTFZGXeGZqzNTwCL3BYuJnPMpump';
const DEXSCREENER_CHART_URL = 'https://dexscreener.com/solana/8uQHXVLgXj8AKgRzDTFZGXeGZqzNTwCL3BYuJnPMpump';

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyCA = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    isConnected,
    hasAcceptedTOS,
    isTokenGated,
    isLoading,
    error,
    mounted,
  } = useAuth();

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center bg-[#0f0f14] px-4 py-12 relative z-10"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(153, 69, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(20, 241, 149, 0.05) 0%, transparent 50%)'
      }}
    >
      <div className="w-full max-w-4xl text-center">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-center gap-3">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-white">
              <span className="gradient-text">PUMP</span>Market
            </h1>
          </div>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white/80">
            Anonymous Digital Marketplace on Solana
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/60">
            Peer-to-peer marketplace using{' '}
            <span className="font-semibold text-[#9945FF]">x402 micropayments</span> on Solana.
            <br />
            <span className="text-base">No KYC. No middlemen. Just freedom.</span>
          </p>
        </div>

        {/* $PumpMarket Token – CA & Chart */}
        <div className="mb-6 rounded-xl border border-purple-900/50 bg-white/5 p-4 shadow-md backdrop-blur-sm">
          <p className="text-sm font-semibold text-[#9945FF] mb-3">💎 $PumpMarket</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex-1 w-full rounded-lg bg-black/40 p-3 border border-purple-900/40 overflow-hidden">
              <p className="text-xs sm:text-sm text-white/80 text-center sm:text-left font-mono truncate">
                {CONTRACT_ADDRESS}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              <button
                onClick={copyCA}
                className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {copied ? '✓ Copied!' : '📋 Copy CA'}
              </button>
              <a
                href={DEXSCREENER_CHART_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors whitespace-nowrap"
              >
                📈 View chart
              </a>
            </div>
          </div>
        </div>

        {/* 0% Fees Banner */}
        <div className="mb-8 rounded-2xl border border-purple-900/40 bg-white/5 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-left">
                <h3 className="text-3xl font-black gradient-text">
                  0% FEES
                </h3>
                <p className="text-sm font-semibold text-white/60">
                  100% Direct P2P
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-white/20">|</div>
            <p className="text-center sm:text-left text-sm text-white/60 max-w-md">
              <span className="font-bold text-white">Sellers keep 100%</span> of every sale. Direct payments via Solana USDC. Zero platform fees, forever.
            </p>
          </div>
        </div>

        {/* Status Cards */}
        {isConnected ? (
          <div className="mb-8 space-y-4">
            {/* Loading State */}
            {isLoading && (
              <div className="rounded-lg border border-purple-900/40 bg-white/5 p-6 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#9945FF] border-t-transparent"></div>
                  <p className="text-sm text-white/60">Checking authentication...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 shadow-sm backdrop-blur-sm">
                <p className="text-sm text-red-400">⚠️ {error}</p>
              </div>
            )}

            {/* Success State */}
            {!isLoading && hasAcceptedTOS && (
              <div className="space-y-4">
                {/* Token Gating Status */}
                <div className={`rounded-lg border p-6 shadow-sm backdrop-blur-sm ${
                  isTokenGated
                    ? 'border-[#14F195]/30 bg-[#14F195]/5'
                    : 'border-yellow-800/40 bg-yellow-950/20'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">{isTokenGated ? '✅' : '⚠️'}</span>
                    <p className={`text-sm font-medium ${
                      isTokenGated
                        ? 'text-[#14F195]'
                        : 'text-yellow-400'
                    }`}>
                      {isTokenGated
                        ? 'Full Access Granted'
                        : 'Insufficient $PumpMarket Balance — Restricted Access'}
                    </p>
                  </div>
                  {!isTokenGated && (
                    <p className="mt-2 text-xs text-yellow-500/80">
                      You need ≥50,000 $PumpMarket tokens for full platform access
                    </p>
                  )}
                </div>

                {/* Navigation */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Link
                    href="/browse"
                    className="rounded-lg border border-purple-900/40 bg-white/5 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-[#9945FF]/60 hover:bg-purple-950/20 hover:shadow-md hover:scale-105"
                  >
                    <div className="text-3xl mb-2">🛒</div>
                    <h3 className="font-semibold text-white">Browse</h3>
                    <p className="text-sm text-white/50">Explore the marketplace</p>
                  </Link>

                  <Link
                    href="/sell"
                    className="rounded-lg border border-purple-900/40 bg-white/5 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-[#14F195]/60 hover:bg-[#14F195]/5 hover:shadow-md hover:scale-105"
                  >
                    <div className="text-3xl mb-2">📦</div>
                    <h3 className="font-semibold text-white">Sell</h3>
                    <p className="text-sm text-white/50">List your products</p>
                  </Link>

                  <Link
                    href="/my-listings"
                    className="rounded-lg border border-purple-900/40 bg-white/5 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-[#9945FF]/60 hover:bg-purple-950/20 hover:shadow-md hover:scale-105"
                  >
                    <div className="text-3xl mb-2">📋</div>
                    <h3 className="font-semibold text-white">My Listings</h3>
                    <p className="text-sm text-white/50">Manage your shop</p>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Disconnected State
          <div className="mb-8">
            <div className="rounded-lg border border-purple-900/40 bg-white/5 p-8 shadow-lg backdrop-blur-sm">
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 border border-purple-800/40">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-white">
                  Connect Your Wallet
                </h2>
                <p className="text-sm text-white/50">
                  Connect your Solana wallet to access the marketplace
                </p>
              </div>
              <WalletMultiButton className="!bg-gradient-to-r !from-[#9945FF] !to-[#14F195] hover:!opacity-90 !rounded-lg !h-12 !w-full !text-base !font-medium transition-opacity" />
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-lg border border-purple-900/40 bg-white/5 p-6 backdrop-blur-sm hover:scale-105 transition-transform">
            <div className="text-2xl mb-3">🕵️</div>
            <h3 className="mb-2 font-semibold text-[#9945FF]">Anonymous</h3>
            <p className="text-sm text-white/50">
              No KYC, no emails. Your wallet is your identity. Shop privately on-chain.
            </p>
          </div>

          <div className="rounded-lg border border-purple-900/40 bg-white/5 p-6 backdrop-blur-sm hover:scale-105 transition-transform">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="mb-2 font-semibold text-[#14F195]">0% Platform Fees</h3>
            <p className="text-sm text-white/50">
              Sellers keep 100% of every sale. Direct P2P payments via USDC on Solana.
            </p>
          </div>

          <div className="rounded-lg border border-purple-900/40 bg-white/5 p-6 backdrop-blur-sm hover:scale-105 transition-transform">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="mb-2 font-semibold text-[#9945FF]">Token Gated</h3>
            <p className="text-sm text-white/50">
              Hold $PumpMarket tokens for full access to the marketplace. Coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
