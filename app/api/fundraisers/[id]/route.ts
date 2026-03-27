import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { getFundraiserById } from '@/services/fundraiserService';

// GET - Get fundraiser by ID
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
      console.log(`🧪 MOCK: Fetching fundraiser ${id}`);
      
      // Mock mode doesn't have fundraisers yet, return error
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // ============================================
    // REAL MODE - Supabase
    // ============================================
    const fundraiser = await getFundraiserById(id);
    
    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fundraiser,
    });
  } catch (error: any) {
    console.error('Get fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fundraiser' },
      { status: 500 }
    );
  }
}

// PATCH - Update fundraiser
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Updating fundraiser ${id}`);
      
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // ============================================
    // REAL MODE - Supabase
    // ============================================
    // For now, PATCH is not implemented for Supabase
    return NextResponse.json(
      { error: 'Update not implemented' },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('Update fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to update fundraiser' },
      { status: 500 }
    );
  }
}

// DELETE - Delete fundraiser
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Deleting fundraiser ${id}`);
      
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // ============================================
    // REAL MODE - Supabase
    // ============================================
    // For now, DELETE is not implemented for Supabase
    return NextResponse.json(
      { error: 'Delete not implemented' },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('Delete fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to delete fundraiser' },
      { status: 500 }
    );
  }
}

