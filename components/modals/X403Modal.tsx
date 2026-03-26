'use client';

interface X403ModalProps {
  isOpen: boolean;
  onSign: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
  challengeMessage?: string;
}

export function X403Modal({ isOpen, onSign, onCancel, isLoading, error, challengeMessage }: X403ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative border border-purple-900/50 bg-[#0f0f14] rounded-3xl shadow-2xl shadow-purple-900/20 max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-purple-900/30 bg-purple-950/20 p-4 md:p-6 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Security Verification Required
            </h2>
          </div>
          <p className="text-xs md:text-sm text-white/60">
            x403 Protocol — Secure Wallet Authentication
          </p>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          {/* Explanation */}
          <div className="border border-[#9945FF]/30 bg-[#9945FF]/5 rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-[#9945FF] mb-2">
              🛡️ Why This Is Safe:
            </h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• <strong className="text-white/90">NOT a transaction</strong> — Costs $0, no blockchain interaction</li>
              <li>• <strong className="text-white/90">Just verification</strong> — Proves you own this wallet</li>
              <li>• <strong className="text-white/90">No fund access</strong> — This signature cannot move your money</li>
              <li>• <strong className="text-white/90">Standard protocol</strong> — Industry-standard x403 authentication</li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="border border-[#14F195]/20 bg-[#14F195]/5 rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-[#14F195] mb-2">
              ✅ How x403 Protects SOLk Road:
            </h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>✓ Prevents bot spam and fake listings</li>
              <li>✓ Stops scammers from mass account creation</li>
              <li>✓ Ensures fair marketplace access</li>
              <li>✓ One wallet = one verified session</li>
            </ul>
          </div>

          {/* Authorization */}
          <div className="border border-yellow-800/40 bg-yellow-950/20 rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-yellow-400 mb-2">
              📜 By Signing, You Authorize:
            </h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• Create a 30-minute authentication session</li>
              <li>• Verify you&apos;re a real human user</li>
              <li>• Access the marketplace features</li>
              <li>• Prevent unfair bot activity</li>
            </ul>
          </div>

          {/* Security Warning */}
          <div className="border-2 border-red-900/50 bg-red-950/20 rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
              ⚠️ SECURITY: Verify Domain
            </h3>
            <p className="text-xs text-white/60 mb-2">
              <strong className="text-red-400">Always check the domain before signing!</strong>
            </p>
            <div className="bg-black/50 rounded px-3 py-2 font-mono text-xs text-white break-all">
              {typeof window !== 'undefined' ? window.location.hostname : 'pumpmarket.fun'}
            </div>
            <p className="text-xs text-red-400/80 mt-2">
              ✗ Never sign if the domain looks suspicious!
            </p>
          </div>

          {/* Technical Details (Collapsible) */}
          {challengeMessage && (
            <details className="bg-black/30 border border-purple-900/40 rounded-lg p-3">
              <summary className="text-xs font-bold text-[#9945FF] cursor-pointer hover:text-purple-300">
                🔍 View Full Message (Advanced)
              </summary>
              <pre className="mt-3 text-xs text-white/60 font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {challengeMessage}
              </pre>
            </details>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3">
              <p className="text-sm text-red-400">❌ {error}</p>
            </div>
          )}

          {/* Session Info */}
          <div className="text-xs text-white/40 text-center space-y-1">
            <div>⏰ You have 3 minutes to read and sign this challenge</div>
            <div>🔒 Session lasts 30 minutes after signing</div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-purple-900/30 p-4 md:p-6 flex gap-3 shrink-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-purple-900/40 text-white/70 hover:text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSign}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing...
              </>
            ) : (
              <>
                <span>✍️</span>
                Sign & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
