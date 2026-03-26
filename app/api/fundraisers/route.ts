import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { 
  getApprovedFundraisers, 
  getFundraisersByWallet, 
  createFundraiser as createFundraiserService,
  updateFundraiserRaisedAmount 
} from '@/services/fundraiserService';
import { sanitizeString } from '@/lib/validation/sanitization';
import { encrypt } from '@/lib/crypto/encryption';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';

// GET - Fetch all approved fundraisers or user's fundraisers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet'); // If provided, get user's fundraisers

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      // In mock mode, return empty array since we don't have mock fundraisers
      return NextResponse.json({
        success: true,
        fundraisers: [],
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    try {
      if (wallet) {
        console.log('📝 Fetching fundraisers for wallet:', wallet);
        const fundraisers = await getFundraisersByWallet(wallet);
        
        console.log(`✅ Found ${fundraisers.length} fundraisers for wallet`);
        
        return NextResponse.json({
          success: true,
          fundraisers,
        });
      }

      console.log('📝 Fetching all approved fundraisers');
      const fundraisers = await getApprovedFundraisers();

      console.log(`✅ Found ${fundraisers?.length || 0} approved fundraisers`);
      const pinnedCount = fundraisers.filter((f) => f.pinned === true).length;
      console.log(`   📌 ${pinnedCount} pinned, ${fundraisers.length - pinnedCount} unpinned`);

      return NextResponse.json({
        success: true,
        fundraisers: fundraisers || [],
      });
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      return NextResponse.json(
        { error: 'Database connection failed', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Get fundraisers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch fundraisers', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new fundraiser
export async function POST(req: NextRequest) {
  try {
    const { 
      wallet, 
      title, 
      description, 
      price, 
      category, 
      imageUrl, 
      deliveryUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl 
    } = await req.json();

    // Validation
    if (!wallet || !title || !description || !price || !category || !imageUrl || !deliveryUrl) {
      return NextResponse.json(
        { error: 'Required fields: wallet, title, description, price, category, imageUrl, deliveryUrl' },
        { status: 400 }
      );
    }

    // Validate wallet
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate title
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      );
    }

    // Validate description
    if (description.length < 50 || description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 50-2000 characters' },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0.10) {
      return NextResponse.json(
        { error: 'Price must be at least $0.10 USDC' },
        { status: 400 }
      );
    }

    // ANTI-SPAM: Rate limiting (3 fundraisers per hour)
    const rateLimit = await checkRateLimit(wallet, RATE_LIMITS.CREATE_LISTING);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: rateLimit.message,
          resetAt: rateLimit.resetAt,
          remaining: rateLimit.remaining
        },
        { status: 429 }
      );
    }

    // ANTI-SPAM: Check fundraiser count (max 3 per wallet)
    const existingFundraisers = await getFundraisersByWallet(wallet);
    const existingFundraisersCount = existingFundraisers.filter(
      f => f.state === 'in_review' || f.state === 'on_market'
    ).length;

    if (existingFundraisersCount >= 3) {
      return NextResponse.json(
        { 
          error: 'Maximum 3 active fundraisers allowed per wallet. Delete or deactivate existing fundraisers to create new ones.',
          currentCount: existingFundraisersCount,
          limit: 3
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      // In mock mode, just return success
      return NextResponse.json({
        success: true,
        fundraiser: {
          _id: 'mock-fundraiser-' + Date.now(),
          wallet,
          title: sanitizedTitle,
          description: sanitizedDescription,
          price: priceNum,
          category,
          imageUrl,
          deliveryUrl: '***encrypted***',
          demoVideoUrl,
          whitepaperUrl,
          githubUrl,
          state: 'in_review',
          approved: false,
          createdAt: new Date(),
        },
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    try {
      // Encrypt delivery URL before storing
      const encryptedDeliveryUrl = encrypt(deliveryUrl);

      const fundraiser = await createFundraiserService({
        wallet,
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: priceNum, // Store as price for compatibility
        goalAmount: priceNum, // Use the user's input as the goal amount
        category,
        imageUrl,
        deliveryUrl: encryptedDeliveryUrl,  // Store encrypted
        demoVideoUrl,
        whitepaperUrl,
        githubUrl,
        riskLevel: 'standard',
        state: 'in_review',
        approved: false,
        pinned: false,
      });

      // Log fundraiser creation
      await createLog(
        'fundraiser_created',
        `New fundraiser created: "${sanitizedTitle}" ($${priceNum}) by ${wallet.slice(0, 8)}...`,
        wallet,
        getIpFromRequest(req)
      );

      return NextResponse.json({
        success: true,
        fundraiser,
      });
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      return NextResponse.json(
        { error: 'Database connection failed', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Create fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to create fundraiser' },
      { status: 500 }
    );
  }
}

