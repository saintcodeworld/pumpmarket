import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';

/**
 * GET /api/fundraisers/[id]/transactions
 * 
 * Fetch all successful donations for a fundraiser
 * Returns anonymized transaction data (amounts, timestamps, truncated wallets)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Fetching transactions for fundraiser ${id}`);
      return NextResponse.json({
        success: true,
        transactions: [],
        totalRaised: 0,
        donationCount: 0,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE - Supabase
    // ============================================
    // For now, return empty transactions (not implemented in Supabase yet)
    // In a real implementation, you would fetch from a transactions table
    return NextResponse.json({
      success: true,
      transactions: [],
      totalRaised: 0,
      donationCount: 0,
    });
  } catch (error: any) {
    console.error('❌ Get fundraiser transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

