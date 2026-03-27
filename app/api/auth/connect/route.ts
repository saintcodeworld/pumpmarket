import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { checkTokenBalance } from '@/lib/solana/tokenGating';
import { CONFIG, MIN_SRX402_BALANCE } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { wallet, skipTokenCheck } = await req.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Validate wallet address
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE (for testing without database)
    // ============================================
    if (CONFIG.MOCK_MODE) {
      // Get or create mock user first (to get TOS status)
      const mockUser = mockStore.getUser(wallet, true); // Pass true initially
      
      // If frontend requests to skip token check (using cached balance)
      if (skipTokenCheck) {
        return NextResponse.json({
          success: true,
          wallet,
          hasAcceptedTOS: mockUser.hasAcceptedTOS,
          _mock: true,
          _cached: true,
        });
      }
      
      let tokenGatingPassed: boolean;
      let tokenBalance: number;

      // Check if we should bypass token gating or check real balance
      if (CONFIG.MOCK_TOKEN_GATING_PASSED) {
        tokenGatingPassed = true;
        tokenBalance = 50000; // Fake balance for display
      } else {
        // Check actual token balance on mainnet
        const balanceResult = await checkTokenBalance(wallet);
        tokenGatingPassed = balanceResult.meetsRequirement;
        tokenBalance = balanceResult.total;
      }

      // Update mock user with token gating status
      mockUser.isTokenGated = tokenGatingPassed;

      return NextResponse.json({
        success: true,
        wallet,
        tokenGatingPassed,
        hasAcceptedTOS: mockUser.hasAcceptedTOS,
        tokenBalance,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE (production)
    // ============================================

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find user first
    let { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet', wallet)
      .single();
    
    // If frontend requests to skip token check (using cached balance)
    if (skipTokenCheck && user) {
      return NextResponse.json({
        success: true,
        wallet,
        hasAcceptedTOS: user.has_accepted_tos || false,
        _cached: true,
      });
    }

    let tokenGatingPassed: boolean;
    let tokenBalance: number;

    // Check if we should bypass token gating or check real balance
    if (CONFIG.MOCK_TOKEN_GATING_PASSED) {
      tokenGatingPassed = true;
      tokenBalance = 50000; // Fake balance for display
      console.log('🔓 Token gating bypassed (MOCK_TOKEN_GATING_PASSED=true)');
    } else {
      // Check token balance for gating (mainnet)
      const balanceResult = await checkTokenBalance(wallet);
      tokenGatingPassed = balanceResult.meetsRequirement;
      tokenBalance = balanceResult.total;
    }

    // Check if user has accepted TOS
    const hasAcceptedTOS = user?.has_accepted_tos || false;

    // Create user record if doesn't exist
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet,
          has_accepted_tos: false,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error creating user:', insertError);
        throw insertError;
      }
      
      user = newUser;
    }

    return NextResponse.json({
      success: true,
      wallet,
      tokenGatingPassed,
      hasAcceptedTOS,
      tokenBalance, // Return the balance (real or fake)
    });
  } catch (error: any) {
    console.error('Auth connect error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

