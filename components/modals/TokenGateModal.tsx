'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { CONFIG } from '@/config/constants';

interface TokenGateModalProps {
  isOpen: boolean;
  currentBalance?: number;
  requiredBalance: number;
}

export function TokenGateModal({ isOpen, currentBalance = 0, requiredBalance }: TokenGateModalProps) {
  const { disconnect } = useWallet();
  const buyChartUrl = CONFIG.SRX402_DEXSCREENER_URL;

  const handleBuyTokens = () => {
    window.open(buyChartUrl, '_blank');
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isOpen) return null;

  const shortage = requiredBalance - currentBalance;
  const formattedBalance = currentBalance.toLocaleString();
  const formattedRequired = requiredBalance.toLocaleString();
  const formattedShortage = shortage.toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-purple-900/50 bg-[#0f0f14] p-6 shadow-2xl shadow-purple-900/20 mx-4">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-950/60 border border-purple-800/40">
            <svg
              className="h-8 w-8 text-[#9945FF]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-white">
            🔒 Token Gating Required
          </h2>
          <p className="mt-2 text-sm text-white/60">
            SOLk Road requires holding $PumpMarket tokens for access
          </p>
        </div>

        {/* Balance Info */}
        <div className="mb-6 rounded-lg border border-purple-900/40 bg-purple-950/20 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Your Balance:</span>
              <span className="font-mono font-semibold text-white">
                {formattedBalance} $PumpMarket
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Required:</span>
              <span className="font-mono font-semibold text-white">
                {formattedRequired} $PumpMarket
              </span>
            </div>
            <div className="border-t border-purple-900/40 pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-[#9945FF]">Need to Buy:</span>
                <span className="font-mono font-bold text-[#9945FF]">
                  {formattedShortage} $PumpMarket
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6 rounded-lg border border-[#14F195]/20 bg-[#14F195]/5 p-4">
          <p className="text-sm text-[#14F195]">
            <strong>ℹ️ How to get access:</strong>
          </p>
          <ol className="mt-2 ml-4 space-y-1 text-sm text-white/70 list-decimal">
            <li>Buy $PumpMarket tokens (see chart link below)</li>
            <li>Send tokens to your connected wallet</li>
            <li>Reconnect your wallet to refresh balance</li>
            <li>Accept TOS and start using the platform!</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleBuyTokens}
            className="w-full rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg"
          >
            📈 View chart / Buy $PumpMarket
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full rounded-lg border border-purple-900/50 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>

        {/* Contract Info */}
        <div className="mt-4 rounded border border-purple-900/30 bg-black/30 p-3">
          <p className="text-xs text-white/40 mb-1">
            <strong>Token Contract:</strong>
          </p>
          <p className="text-xs font-mono text-white/60 break-all">
            {CONFIG.SRX402_MINT}
          </p>
        </div>
      </div>
    </div>
  );
}
