/**
 * Migrate Original Data from MockStore to Supabase
 * 
 * This script converts your original listings to fundraisers
 * and migrates them to Supabase
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: resolve('.env.local') });

// Load original mock data
const mockDataPath = resolve('.mock-data.json');
let mockData: any = null;

try {
  const fileContent = fs.readFileSync(mockDataPath, 'utf-8');
  mockData = JSON.parse(fileContent, (key, value) => {
    // Revive Date objects
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  });
  console.log('✅ Loaded original mock data');
} catch (error) {
  console.error('❌ Failed to load mock data:', error);
  process.exit(1);
}

// Convert listings to fundraisers
function convertListingToFundraiser(listing: any, index: number) {
  // Map categories from listings to fundraiser categories
  const categoryMap: Record<string, string> = {
    'Trading Bot': 'Technology',
    'API Tool': 'Technology', 
    'Script': 'Technology',
    'Custom': 'Other'
  };

  // Generate realistic fundraiser data based on listing
  const baseGoal = listing.price * 50; // Goal is 50x the listing price
  const raisedPercentage = 0.1 + (Math.random() * 0.6); // 10-70% funded
  
  return {
    wallet: listing.wallet.replace('mockSeller', '1111111111111111111111111111111').slice(0, 44) + (index + 1).toString().padStart(2, '0'),
    title: listing.title.replace('Bot', 'Fund').replace('Script', 'Campaign').replace('Tool', 'Initiative'),
    description: listing.description.replace('bot', 'fundraiser').replace('trading', 'fundraising').replace('tool', 'campaign') + 
      '\n\n🎯 **Fundraising Goal:** $' + baseGoal.toFixed(2) + 
      '\n💝 **Your contribution helps make this project a reality!**',
    price: listing.price,
    goal_amount: baseGoal,
    raised_amount: Math.floor(baseGoal * raisedPercentage),
    category: categoryMap[listing.category] || 'Other',
    image_url: listing.imageUrl,
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: index < 2, // Pin first 2 fundraisers
    pinned_at: index < 2 ? new Date(Date.now() - (index * 86400000)).toISOString() : null,
    views: Math.floor(Math.random() * 2000) + 100,
    reports_count: 0,
    failed_purchase_count: 0
  };
}

async function migrateOriginalData() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log('🔄 Migrating original data to Supabase...');

  try {
    // Clear existing fundraisers
    console.log('🗑️ Clearing existing fundraisers...');
    await supabase.from('fundraisers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create users for the wallets
    console.log('👥 Creating users...');
    const wallets = new Set<string>();
    
    mockData.listings.forEach(([_id: string, listing: any]) => {
      const wallet = listing.wallet.replace('mockSeller', '1111111111111111111111111111111').slice(0, 44) + '01';
      wallets.add(wallet);
    });

    for (const wallet of Array.from(wallets)) {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          wallet,
          has_accepted_tos: true
        }, {
          onConflict: 'wallet'
        });

      if (userError) {
        console.error(`❌ Error creating user ${wallet}:`, userError.message);
      } else {
        console.log(`✅ Created user: ${wallet.slice(0, 8)}...`);
      }
    }

    // Convert and insert fundraisers
    console.log('💝 Converting listings to fundraisers...');
    const fundraisers = mockData.listings.map(([id, listing]: [string, any], index: number) => {
      return convertListingToFundraiser(listing, index);
    });

    console.log(`📊 Found ${fundraisers.length} original listings to convert`);

    // Insert fundraisers
    for (let i = 0; i < fundraisers.length; i++) {
      const fundraiser = fundraisers[i];
      
      const { data, error } = await supabase
        .from('fundraisers')
        .insert(fundraiser)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting fundraiser "${fundraiser.title}":`, error.message);
      } else {
        const fundedPercentage = Math.round((fundraiser.raised_amount / fundraiser.goal_amount) * 100);
        const pinnedStatus = fundraiser.pinned ? '📌 PINNED' : '';
        console.log(`✅ Migrated: ${fundraiser.title} - $${fundraiser.raised_amount} raised (${fundedPercentage}%) ${pinnedStatus}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // Verify the count
    const { count, error: countError } = await supabase
      .from('fundraisers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting fundraisers:', countError.message);
    } else {
      console.log(`📊 Total fundraisers migrated: ${count}`);
    }

    console.log('\n📋 Your original data has been restored as fundraisers!');
    console.log('🔗 Categories mapped: Trading Bot/API Tool/Script → Technology, Custom → Other');
    console.log('💰 Goals calculated as 50x original listing prices');
    console.log('📌 First 2 fundraisers are pinned for visibility');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateOriginalData();
