'use client';

import { useAuth } from '@/hooks/useAuth';
import { TOSModal } from '@/components/modals/TOSModal';
import { TokenGateModal } from '@/components/modals/TokenGateModal';
import { X403Modal } from '@/components/modals/X403Modal';
import { MIN_SRX402_BALANCE } from '@/config/constants';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    showTOSModal,
    showTokenGateModal,
    tokenBalance,
    acceptTOS,
    declineTOS,
    x403,
  } = useAuth();

  return (
    <>
      {/* x403 Auth Modal - Priority 0: Required BEFORE anything else */}
      <X403Modal
        isOpen={x403.showAuthModal}
        onSign={x403.handleAuthSign}
        onCancel={x403.handleAuthCancel}
        isLoading={x403.isAuthenticating}
        error={x403.authError}
        challengeMessage={x403.authChallenge?.message}
      />

      {/* Global Token Gate Modal - Priority 1: Shown if insufficient tokens */}
      <TokenGateModal
        isOpen={showTokenGateModal}
        currentBalance={tokenBalance}
        requiredBalance={MIN_SRX402_BALANCE}
      />

      {/* Global TOS Modal - Priority 2: Shown if tokens sufficient but TOS not accepted */}
      <TOSModal
        isOpen={showTOSModal}
        onAccept={acceptTOS}
        onDecline={declineTOS}
      />
      
      {children}
    </>
  );
}

