/**
 * Fundraiser Service - Supabase Implementation
 * 
 * Handles all fundraiser database operations using Supabase
 */

import { connectSupabase, getSupabaseServiceClient } from '@/lib/supabase';

export interface Fundraiser {
  _id: string; // Add _id for compatibility
  id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  deliveryUrl: string;
  price: number;
  goalAmount: number;
  raisedAmount: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: 'in_review' | 'on_market' | 'pulled';
  approved: boolean;
  pinned: boolean;
  pinnedAt?: string;
  reportsCount: number;
  failedPurchaseCount: number;
  lastFailureAt?: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all approved fundraisers
 */
export async function getApprovedFundraisers(): Promise<Fundraiser[]> {
  try {
    await connectSupabase();
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('fundraisers')
      .select('*')
      .eq('approved', true)
      .eq('state', 'on_market')
      .order('pinned_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching fundraisers:', error);
      throw error;
    }

    // Convert snake_case to camelCase for frontend compatibility
    const fundraisers = (data || []).map(item => ({
      _id: item.id, // Add _id for compatibility
      id: item.id,
      wallet: item.wallet,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      demoVideoUrl: item.demo_video_url,
      whitepaperUrl: item.whitepaper_url,
      githubUrl: item.github_url,
      deliveryUrl: item.delivery_url,
      price: item.price,
      goalAmount: item.goal_amount,
      raisedAmount: item.raised_amount,
      category: item.category,
      riskLevel: item.risk_level,
      state: item.state,
      approved: item.approved,
      pinned: item.pinned,
      pinnedAt: item.pinned_at,
      reportsCount: item.reports_count,
      failedPurchaseCount: item.failed_purchase_count,
      lastFailureAt: item.last_failure_at,
      views: item.views,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    console.log(`✅ Found ${fundraisers?.length || 0} approved fundraisers`);
    return fundraisers;
  } catch (error: any) {
    console.error('❌ Get fundraisers error:', error);
    throw error;
  }
}

/**
 * Fetch fundraisers by wallet
 */
export async function getFundraisersByWallet(wallet: string): Promise<Fundraiser[]> {
  try {
    await connectSupabase();
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('fundraisers')
      .select('*')
      .eq('wallet', wallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching fundraisers for wallet:', error);
      throw error;
    }

    // Convert snake_case to camelCase for frontend compatibility
    const fundraisers = (data || []).map(item => ({
      _id: item.id, // Add _id for compatibility
      id: item.id,
      wallet: item.wallet,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      demoVideoUrl: item.demo_video_url,
      whitepaperUrl: item.whitepaper_url,
      githubUrl: item.github_url,
      deliveryUrl: item.delivery_url,
      price: item.price,
      goalAmount: item.goal_amount,
      raisedAmount: item.raised_amount,
      category: item.category,
      riskLevel: item.risk_level,
      state: item.state,
      approved: item.approved,
      pinned: item.pinned,
      pinnedAt: item.pinned_at,
      reportsCount: item.reports_count,
      failedPurchaseCount: item.failed_purchase_count,
      lastFailureAt: item.last_failure_at,
      views: item.views,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    console.log(`✅ Found ${fundraisers?.length || 0} fundraisers for wallet`);
    return fundraisers;
  } catch (error: any) {
    console.error('❌ Get fundraisers by wallet error:', error);
    throw error;
  }
}

/**
 * Create a new fundraiser
 */
export async function createFundraiser(fundraiserData: Omit<Fundraiser, 'id' | 'createdAt' | 'updatedAt' | 'raisedAmount' | 'views' | 'reportsCount' | 'failedPurchaseCount'>): Promise<Fundraiser> {
  try {
    await connectSupabase();
    const supabase = getSupabaseServiceClient();

    // Convert camelCase to snake_case for database
    const dbData = {
      wallet: fundraiserData.wallet,
      title: fundraiserData.title,
      description: fundraiserData.description,
      image_url: fundraiserData.imageUrl,
      demo_video_url: fundraiserData.demoVideoUrl,
      whitepaper_url: fundraiserData.whitepaperUrl,
      github_url: fundraiserData.githubUrl,
      delivery_url: fundraiserData.deliveryUrl,
      price: fundraiserData.price,
      goal_amount: fundraiserData.goalAmount,
      category: fundraiserData.category,
      risk_level: fundraiserData.riskLevel,
      state: fundraiserData.state,
      approved: fundraiserData.approved,
      pinned: fundraiserData.pinned,
      pinned_at: fundraiserData.pinnedAt,
      raised_amount: 0,
      views: 0,
      reports_count: 0,
      failed_purchase_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fundraisers')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating fundraiser:', error);
      throw error;
    }

    // Convert back to camelCase for response
    const fundraiser: Fundraiser = {
      _id: data.id, // Add _id for compatibility
      id: data.id,
      wallet: data.wallet,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      demoVideoUrl: data.demo_video_url,
      whitepaperUrl: data.whitepaper_url,
      githubUrl: data.github_url,
      deliveryUrl: data.delivery_url,
      price: data.price,
      goalAmount: data.goal_amount,
      raisedAmount: data.raised_amount,
      category: data.category,
      riskLevel: data.risk_level,
      state: data.state,
      approved: data.approved,
      pinned: data.pinned,
      pinnedAt: data.pinned_at,
      reportsCount: data.reports_count,
      failedPurchaseCount: data.failed_purchase_count,
      lastFailureAt: data.last_failure_at,
      views: data.views,
      createdAt: new Date(data.created_at), // Convert to Date object
      updatedAt: new Date(data.updated_at), // Convert to Date object
    };

    console.log('✅ Fundraiser created successfully');
    return fundraiser;
  } catch (error: any) {
    console.error('❌ Create fundraiser error:', error);
    throw error;
  }
}

/**
 * Update fundraiser raised amount from transactions
 */
export async function updateFundraiserRaisedAmount(fundraiserId: string, raisedAmount: number): Promise<void> {
  try {
    await connectSupabase();
    const supabase = getSupabaseServiceClient();

    const { error } = await supabase
      .from('fundraisers')
      .update({ 
        raisedAmount,
        updatedAt: new Date().toISOString()
      })
      .eq('id', fundraiserId);

    if (error) {
      console.error('❌ Error updating fundraiser amount:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Update fundraiser amount error:', error);
    throw error;
  }
}

/**
 * Get fundraiser by ID
 */
export async function getFundraiserById(id: string): Promise<Fundraiser | null> {
  try {
    await connectSupabase();
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('fundraisers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      console.error('❌ Error fetching fundraiser by ID:', error);
      throw error;
    }

    // Convert snake_case to camelCase and add _id for compatibility
    return {
      _id: data.id,
      id: data.id,
      wallet: data.wallet,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      demoVideoUrl: data.demo_video_url,
      whitepaperUrl: data.whitepaper_url,
      githubUrl: data.github_url,
      deliveryUrl: data.delivery_url,
      price: data.price,
      goalAmount: data.goal_amount,
      raisedAmount: data.raised_amount,
      category: data.category,
      riskLevel: data.risk_level,
      state: data.state,
      approved: data.approved,
      pinned: data.pinned,
      pinnedAt: data.pinned_at,
      reportsCount: data.reports_count,
      failedPurchaseCount: data.failed_purchase_count,
      lastFailureAt: data.last_failure_at,
      views: data.views,
      createdAt: new Date(data.created_at), // Convert to Date object
      updatedAt: new Date(data.updated_at), // Convert to Date object
    };
  } catch (error: any) {
    console.error('❌ Get fundraiser by ID error:', error);
    throw error;
  }
}

/**
 * Increment fundraiser view count
 */
export async function incrementFundraiserViews(id: string): Promise<void> {
  try {
    await connectSupabase();
    const supabase = getSupabaseServiceClient();

    const { error } = await supabase.rpc('increment_views', { 
      fundraiser_id: id 
    });

    if (error) {
      console.error('❌ Error incrementing views:', error);
      // Don't throw error for view tracking, just log it
    }
  } catch (error: any) {
    console.error('❌ Increment views error:', error);
    // Don't throw error for view tracking
  }
}
