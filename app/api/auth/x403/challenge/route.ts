/**
 * x403 Challenge API
 * Based on SnekFi's clean implementation
 * 
 * POST /api/auth/x403/challenge
 * Returns 403 with challenge (WebX403 protocol)
 */

import { NextRequest, NextResponse } from 'next/server';

const X403_VERSION = 1;

function generateNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const now = Date.now();
    const expiresAt = now + (3 * 60 * 1000); // 3 minutes

    const challenge = {
      x403Version: X403_VERSION,
      domain,
      nonce: generateNonce(),
      issuedAt: now,
      expiresAt,
      message: [
        '🔐 SOLk Road Security Verification',
        '',
        'This signature proves you are human and helps protect',
        'our platform from bots, scammers, and automated attacks.',
        '',
        `Domain: ${domain}`,
        `Wallet: ${walletAddress}`,
        `Issued: ${new Date(now).toISOString()}`,
        `Expires: ${new Date(expiresAt).toISOString()}`,
        '',
        '✓ NOT a transaction (no gas fees)',
        '✓ Does NOT access your funds',
        '✓ Only verifies wallet ownership',
        '',
        '🛡️ This helps keep the marketplace safe for everyone.',
      ].join('\n'),
    };

    // Return 403 with challenge (WebX403 protocol)
    return NextResponse.json(
      {
        x403Version: X403_VERSION,
        challenge: {
          ...challenge,
          message: challenge.message // Include message for verification
        },
        reason: 'Authentication required',
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('x403 challenge generation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

