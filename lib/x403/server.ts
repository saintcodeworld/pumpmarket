/**
 * x403 Server Utilities
 * 
 * Simple x403 challenge/response verification for anti-bot protection
 */

import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { randomBytes } from 'crypto';

export interface X403Challenge {
  nonce: string;
  timestamp: string;
  message: string;
}

/**
 * Generate a random x403 challenge
 * 
 * @returns X403Challenge object
 */
export function generateX403Challenge(): X403Challenge {
  const nonce = randomBytes(16).toString('base64url');
  const timestamp = new Date().toISOString();
  
  const message = [
    '🔐 SilkRoadx402 Security Verification',
    '',
    'This signature proves you are human and helps protect',
    'our platform from bots, scammers, and automated attacks.',
    '',
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`,
    '',
    'This signature does NOT access your wallet funds.',
    'It only verifies you control this wallet address.'
  ].join('\n');

  return { nonce, timestamp, message };
}

/**
 * Verify x403 signature
 * 
 * @param signature - Base58 encoded signature
 * @param publicKey - Solana wallet public key (Base58 string)
 * @param challenge - The original challenge object
 * @returns boolean - true if valid
 */
export function verifyX403Signature(
  signature: string,
  publicKey: string,
  challenge: X403Challenge
): boolean {
  try {
    // Validate public key
    const pubKey = new PublicKey(publicKey);
    
    // Decode signature from base58
    const sigBytes = bs58.decode(signature);
    
    // Encode message as UTF-8 bytes
    const messageBytes = new TextEncoder().encode(challenge.message);
    
    // Get public key bytes (32 bytes for Ed25519)
    const pubKeyBytes = pubKey.toBytes();
    
    // Verify Ed25519 signature using tweetnacl
    const verified = nacl.sign.detached.verify(
      messageBytes,
      sigBytes,
      pubKeyBytes
    );
    
    return verified;
  } catch (error) {
    console.error('x403 signature verification error:', error);
    return false;
  }
}

/**
 * Check if x403 challenge is still valid (not expired)
 * 
 * @param timestamp - Challenge timestamp
 * @param maxAgeSeconds - Maximum age in seconds (default: 180 = 3 minutes)
 * @returns boolean
 */
export function isX403ChallengeValid(
  timestamp: string,
  maxAgeSeconds: number = 180
): boolean {
  try {
    const challengeTime = new Date(timestamp).getTime();
    const now = Date.now();
    const ageSeconds = (now - challengeTime) / 1000;
    
    return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
  } catch (error) {
    console.error('x403 timestamp validation error:', error);
    return false;
  }
}

/**
 * Encode challenge for transmission
 * 
 * @param challenge - Challenge object
 * @returns Base64 encoded string
 */
export function encodeChallenge(challenge: X403Challenge): string {
  return Buffer.from(JSON.stringify(challenge)).toString('base64');
}

/**
 * Decode challenge from transmission
 * 
 * @param encoded - Base64 encoded challenge
 * @returns X403Challenge object or null if invalid
 */
export function decodeChallenge(encoded: string): X403Challenge | null {
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(json) as X403Challenge;
  } catch (error) {
    console.error('x403 challenge decode error:', error);
    return null;
  }
}

