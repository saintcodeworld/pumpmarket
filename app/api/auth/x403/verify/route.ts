/**
 * x403 Verify API
 * Based on SnekFi's clean implementation
 * 
 * POST /api/auth/x403/verify
 * Verifies signed challenge and issues session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { connectSupabase } from '@/lib/supabase';

const X403_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function decodeAuthHeader(authHeader: string): any | null {
  try {
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    const encoded = authHeader.substring(7);
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode auth header:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();
    const { walletAddress } = body;

    if (!authHeader) {
      return NextResponse.json(
        { authenticated: false, error: 'No authorization header' },
        { status: 403 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { authenticated: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Decode signed challenge
    const signedChallenge = decodeAuthHeader(authHeader);
    
    if (!signedChallenge || !signedChallenge.walletAddress || !signedChallenge.signature || !signedChallenge.nonce) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid authorization format' },
        { status: 403 }
      );
    }

    // Verify wallet address matches
    if (signedChallenge.walletAddress !== walletAddress) {
      return NextResponse.json(
        { authenticated: false, error: 'Wallet address mismatch' },
        { status: 403 }
      );
    }

    // Verify signature against the original challenge message
    try {
      const pubKey = new PublicKey(walletAddress);
      
      // Reconstruct the original challenge message
      const message = signedChallenge.message || [
        '🔐 SOLk Road Security Verification',
        '',
        'This signature proves you are human and helps protect',
        'our platform from bots, scammers, and automated attacks.',
        '',
        `Domain: ${signedChallenge.domain}`,
        `Wallet: ${walletAddress}`,
        `Issued: ${new Date(signedChallenge.issuedAt).toISOString()}`,
        `Expires: ${new Date(signedChallenge.expiresAt).toISOString()}`,
        '',
        '✓ NOT a transaction (no gas fees)',
        '✓ Does NOT access your funds',
        '✓ Only verifies wallet ownership',
        '',
        '🛡️ This helps keep the marketplace safe for everyone.',
      ].join('\n');
      
      // Verify the signature
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signedChallenge.signature);
      const isValidSignature = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        pubKey.toBytes()
      );
      
      if (!isValidSignature) {
        console.error('❌ x403: Invalid signature for', walletAddress.substring(0, 8));
        return NextResponse.json(
          { authenticated: false, error: 'Invalid signature' },
          { status: 403 }
        );
      }
      
      // Check if challenge has expired
      if (Date.now() > signedChallenge.expiresAt) {
        return NextResponse.json(
          { authenticated: false, error: 'Challenge expired' },
          { status: 403 }
        );
      }

      console.log('✅ x403: Signature verified for', walletAddress.substring(0, 8));

      // Store session in Supabase (optional - for audit trail)
      const supabase = await connectSupabase();
      const sessionToken = `x403_${walletAddress.substring(0, 8)}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + X403_SESSION_DURATION);
      
      // Store authentication session (optional)
      await supabase
        .from('auth_sessions')
        .upsert({
          wallet_address: walletAddress,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        });

      return NextResponse.json({
        authenticated: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('x403 signature verification error:', error);
      return NextResponse.json(
        { authenticated: false, error: 'Invalid signature' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('x403 verification error:', error);

    return NextResponse.json(
      { authenticated: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

