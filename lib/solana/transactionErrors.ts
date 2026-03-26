/**
 * Maps Solana transaction simulation / send errors to user-friendly messages.
 * Handles SPL Token "insufficient funds" (0x1), missing token accounts, and common RPC errors.
 */

/** SPL Token program error codes (custom program error 0x...) */
const SPL_TOKEN_ERRORS: Record<number, string> = {
  0x0: 'Token account has a close authority',
  0x1: 'insufficient funds', // InsufficientFunds
  0x2: 'Invalid mint',
  0x3: 'Amount would exceed maximum supply',
  0x4: 'Amount must be greater than zero',
  // Add more as needed: https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/error.rs
};

const INSUFFICIENT_FUNDS_HINT =
  ' Add USDC to your wallet (or create a USDC token account by receiving a small amount) and try again.';

/**
 * Returns a user-friendly message for Solana transaction errors (simulation failed, send failed).
 * Handles SendTransactionError-style messages and logs containing "Error: insufficient funds" or "custom program error: 0x1".
 */
export function getFriendlyTransactionError(err: unknown): string {
  if (err == null) return 'Transaction failed. Please try again.';

  const msg = typeof (err as Error).message === 'string' ? (err as Error).message : '';
  const logs = typeof (err as { getLogs?: () => string[] }).getLogs === 'function'
    ? (err as { getLogs: () => string[] }).getLogs()
    : [];

  const fullText = [msg, ...logs].join(' ');

  // User cancelled / rejected
  if (
    (err as { code?: number }).code === 4001 ||
    (err as Error).name === 'WalletSignTransactionError' ||
    /rejected|cancelled|denied|user rejected/i.test(fullText)
  ) {
    return 'Transaction cancelled.';
  }

  // Simulation failed: insufficient funds (SPL Token 0x1) or "Error: insufficient funds" in logs
  if (
    /custom program error: 0x1\b/i.test(fullText) ||
    /Error: insufficient funds/i.test(fullText) ||
    /insufficient funds/i.test(fullText)
  ) {
    return (
      'You don\'t have enough USDC for this purchase, or you don\'t have a USDC token account yet.' +
      INSUFFICIENT_FUNDS_HINT
    );
  }

  // Other SPL Token errors by code
  const programErrorMatch = fullText.match(/custom program error: (0x[0-9a-fA-F]+)/);
  if (programErrorMatch) {
    const code = parseInt(programErrorMatch[1], 16);
    const known = SPL_TOKEN_ERRORS[code];
    if (known) {
      if (code === 0x1) {
        return 'Insufficient USDC balance.' + INSUFFICIENT_FUNDS_HINT;
      }
      return `Transaction failed: ${known}. Please try again.`;
    }
  }

  // Token account does not exist (common when user never received USDC)
  if (
    /could not find account|account not found|invalid account data/i.test(fullText) ||
    /TokenAccountNotFound|AccountDoesNotExist/i.test(fullText)
  ) {
    return (
      'No USDC token account found for your wallet. Receive a small amount of USDC first to create the account, then try again.'
    );
  }

  // Blockhash expired / timeout
  if (/blockhash|expired|Blockhash not found/i.test(fullText)) {
    return 'Transaction expired. Please try again.';
  }

  // Generic simulation failure - still try to show a short message
  if (/Transaction simulation failed/i.test(msg)) {
    return (
      'Transaction failed (e.g. insufficient USDC or no USDC account).' +
      INSUFFICIENT_FUNDS_HINT
    );
  }

  // Fallback: return original message if it's short enough, else generic
  if (msg && msg.length <= 120 && !msg.includes('Program log:')) {
    return msg;
  }
  return 'Transaction failed. Please check your USDC balance and try again.';
}
