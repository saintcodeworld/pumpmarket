/**
 * x403 Anti-Bot Verification System
 * Based on SnekFi's clean implementation
 * 
 * Simple challenge-response authentication to prevent bots and automated attacks
 */

// Server utilities
export {
  generateX403Challenge,
  verifyX403Signature,
  isX403ChallengeValid,
  encodeChallenge,
  decodeChallenge,
  type X403Challenge,
} from './server';

// Client utilities
export {
  signChallenge,
  encodeAuthHeader,
  X403_VERSION,
  type AuthChallenge,
  type AuthRequiredResponse,
  type SignedChallenge,
} from './client';
