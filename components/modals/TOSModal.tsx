'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface TOSModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function TOSModal({ isOpen, onAccept, onDecline }: TOSModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { disconnect } = useWallet();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 5;
    if (isBottom) {
      setHasScrolled(true);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept();
    // Reset state after a delay in case modal doesn't close
    setTimeout(() => setAccepting(false), 1000);
  };

  const handleDecline = () => {
    disconnect();
    onDecline();
  };

  // Reset scroll state when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setHasScrolled(false);
      setAccepting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border border-purple-900/50 bg-[#0f0f14] p-6 shadow-2xl shadow-purple-900/20 mx-4">
        {/* Header */}
        <div className="mb-4 border-b border-purple-900/30 pb-4">
          <h2 className="text-2xl font-bold text-white">
            Terms of Service
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Please read carefully and scroll to the bottom to continue
          </p>
        </div>

        {/* TOS Content - Scrollable */}
        <div
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto rounded border border-purple-900/30 bg-black/30 p-4 text-sm leading-relaxed text-white/70"
        >
          <h3 className="mb-2 font-semibold text-white">1. Acceptance of Terms</h3>
          <p className="mb-4">
            By connecting your wallet and accessing SOLk Road, you agree to these Terms of Service. If you do not agree, disconnect immediately.
          </p>

          <h3 className="mb-2 font-semibold text-white">2. Anonymous & Wallet-Only Platform</h3>
          <p className="mb-4">
            SOLk Road is an anonymous, wallet-based platform. No KYC, email, or personal information is required. Your wallet address is your identity.
          </p>

          <h3 className="mb-2 font-semibold text-white">3. Token Gating</h3>
          <p className="mb-4">
            Full platform access requires holding ≥50,000 $PumpMarket tokens in your wallet. The platform checks your balance on Solana mainnet. Insufficient balance restricts functionality.
          </p>

          <h3 className="mb-2 font-semibold text-white">4. Peer-to-Peer Payments (No Escrow)</h3>
          <p className="mb-4">
            All payments are direct peer-to-peer via x402 protocol. The platform does NOT hold, escrow, or process funds. Payments go directly from buyer to seller. No refunds or chargebacks.
          </p>

          <h3 className="mb-2 font-semibold text-white">5. Buyer Responsibility (Caveat Emptor)</h3>
          <p className="mb-4">
            Buyers purchase at their own risk. The platform does NOT validate software quality, delivery URLs, or seller integrity beyond manual review for illegal/malicious content. &quot;Buyer beware.&quot;
          </p>

          <h3 className="mb-2 font-semibold text-white">6. Seller Obligations</h3>
          <p className="mb-4">
            Sellers must provide accurate listings and valid delivery URLs. Listings are manually reviewed by admins. Fraudulent or illegal listings will be pulled. Repeated payment failures (3+) auto-pull listings.
          </p>

          <h3 className="mb-2 font-semibold text-white">7. Prohibited Content</h3>
          <p className="mb-4">
            You may NOT list or purchase: ransomware, child exploitation material, state-secret leaks, DoS tools, or any content violating US federal law. Admins flag and remove violations. Users may be banned.
          </p>

          <h3 className="mb-2 font-semibold text-white">8. Platform Facilitation Only</h3>
          <p className="mb-4">
            The platform only facilitates connections between buyers and sellers. We do not provide support, refunds, or dispute resolution. All transactions are final.
          </p>

          <h3 className="mb-2 font-semibold text-white">9. Ephemeral Delivery</h3>
          <p className="mb-4">
            Delivery URLs are shown once after payment. If you lose the URL, it cannot be recovered via UI. Contact admin support only in exceptional cases (manual recovery possible).
          </p>

          <h3 className="mb-2 font-semibold text-white">10. Reporting</h3>
          <p className="mb-4">
            You may report suspicious listings. Reports trigger admin review. False/spam reports may result in restrictions.
          </p>

          <h3 className="mb-2 font-semibold text-white">11. Risk Levels</h3>
          <p className="mb-4">
            Listings are flagged as Standard or High-Risk by admins based on content. Risk levels are for future fee integration; in MVP, they serve as warnings only.
          </p>

          <h3 className="mb-2 font-semibold text-white">12. Data & Privacy</h3>
          <p className="mb-4">
            We store wallet addresses, transaction hashes, and encrypted delivery URLs. No IP logging beyond rate-limiting. Data is not sold or shared.
          </p>

          <h3 className="mb-2 font-semibold text-white">13. Platform Changes</h3>
          <p className="mb-4">
            We may update these terms, add fees, or change functionality at any time. Continued use implies acceptance.
          </p>

          <h3 className="mb-2 font-semibold text-white">14. No Warranties</h3>
          <p className="mb-4">
            The platform is provided &quot;as is&quot; without warranties of any kind. We are not liable for losses, damages, or disputes arising from platform use.
          </p>

          <h3 className="mb-2 font-semibold text-white">15. Termination</h3>
          <p className="mb-4">
            We may ban wallets for TOS violations. You may disconnect your wallet at any time to cease platform use.
          </p>

          <p className="mt-6 font-semibold text-white">
            By clicking &quot;Accept,&quot; you confirm you have read, understood, and agree to these Terms of Service.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-4">
          <button
            onClick={handleDecline}
            className="rounded-lg border border-purple-900/40 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={!hasScrolled || accepting}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              hasScrolled && !accepting
                ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 cursor-pointer'
                : 'bg-white/10 cursor-not-allowed text-white/40'
            }`}
          >
            {accepting ? 'Accepting...' : 'Accept'}
          </button>
        </div>

        {!hasScrolled && !accepting && (
          <p className="mt-2 text-center text-xs text-white/40">
            Scroll to the bottom to enable the Accept button
          </p>
        )}
        {accepting && (
          <p className="mt-2 text-center text-xs text-[#14F195]">
            Processing...
          </p>
        )}
      </div>
    </div>
  );
}
