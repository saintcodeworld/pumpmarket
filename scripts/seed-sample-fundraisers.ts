/**
 * Seed Sample Fundraisers
 * 
 * This script adds sample fundraisers to populate the database
 * Run with: npx tsx scripts/seed-sample-fundraisers.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: resolve('.env.local') });

const sampleFundraisers = [
  {
    wallet: '11111111111111111111111111111112',
    title: 'Medical Emergency Fund for Sarah',
    description: 'Help Sarah cover emergency medical expenses after a sudden accident. Your support will help with surgery costs and recovery.',
    price: 1000,
    goal_amount: 5000,
    raised_amount: 0, // Will be set dynamically
    category: 'Medical',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: true,
    pinned_at: new Date().toISOString(),
    views: 1250,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '22222222222222222222222222222223',
    title: 'Community Garden Project',
    description: 'Help us build a sustainable community garden to provide fresh produce for local families. Every donation helps us buy seeds, tools, and equipment.',
    price: 250,
    goal_amount: 2000,
    raised_amount: 0, // Will be set dynamically
    category: 'Community',
    image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: false,
    pinned_at: null,
    views: 890,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '33333333333333333333333333333334',
    title: 'Education Fund for Underprivileged Students',
    description: 'Support educational opportunities for students in need. Your contribution will help provide textbooks, school supplies, and tutoring services.',
    price: 500,
    goal_amount: 3000,
    raised_amount: 0, // Will be set dynamically
    category: 'Education',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: false,
    pinned_at: null,
    views: 567,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '44444444444444444444444444444445',
    title: 'Animal Rescue Shelter Support',
    description: 'Help our local animal rescue shelter provide food, medical care, and shelter for abandoned and rescued animals in need.',
    price: 300,
    goal_amount: 1500,
    raised_amount: 0, // Will be set dynamically
    category: 'Animal Welfare',
    image_url: 'https://images.unsplash.com/photo-1601758228041-f3be277374ef?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: false,
    pinned_at: null,
    views: 423,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '55555555555555555555555555555556',
    title: 'Environmental Cleanup Initiative',
    description: 'Join our efforts to clean local parks and waterways. Funds will be used for cleanup equipment, recycling bins, and educational materials.',
    price: 150,
    goal_amount: 1000,
    raised_amount: 0, // Will be set dynamically
    category: 'Environmental',
    image_url: 'https://images.unsplash.com/photo-1593422638660-5a9db845c82c?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: false,
    pinned_at: null,
    views: 234,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '66666666666666666666666666666667',
    title: 'Tech Education for Youth',
    description: 'Providing coding workshops and technology education to underserved youth. Help us purchase laptops and software licenses.',
    price: 750,
    goal_amount: 4000,
    raised_amount: 0, // Will be set dynamically
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: true,
    pinned_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    views: 1890,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '77777777777777777777777777777778',
    title: 'Sports Equipment for Local School',
    description: 'Help our local school purchase new sports equipment for physical education programs and after-school sports activities.',
    price: 200,
    goal_amount: 800,
    raised_amount: 0, // Will be set dynamically
    category: 'Sports',
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: false,
    pinned_at: null,
    views: 345,
    reports_count: 0,
    failed_purchase_count: 0
  },
  {
    wallet: '88888888888888888888888888888889',
    title: 'Arts & Culture Center Renovation',
    description: 'Support the renovation of our community arts center. Funds will help update facilities, purchase art supplies, and fund cultural programs.',
    price: 400,
    goal_amount: 2500,
    raised_amount: 0, // Will be set dynamically
    category: 'Arts & Culture',
    image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop',
    demo_video_url: null,
    whitepaper_url: null,
    github_url: null,
    delivery_url: 'encrypted-delivery-info',
    state: 'on_market',
    approved: true,
    risk_level: 'standard',
    pinned: false,
    pinned_at: null,
    views: 678,
    reports_count: 0,
    failed_purchase_count: 0
  }
];

async function seedFundraisers() {
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

  console.log('🌱 Seeding sample fundraisers...');

  try {
    // First, create the users that fundraisers reference
    console.log('👥 Creating users...');
    const wallets = [...new Set(sampleFundraisers.map(f => f.wallet))];
    
    for (const wallet of wallets) {
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

    // Clear existing fundraisers
    const { error: deleteError } = await supabase
      .from('fundraisers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.log('⚠️  Could not clear existing fundraisers:', deleteError.message);
    } else {
      console.log('🗑️  Cleared existing fundraisers');
    }

    // Insert sample fundraisers
    for (const fundraiser of sampleFundraisers) {
      // Add some random raised amounts to make it realistic
      const raisedPercentage = Math.random() * 0.8; // 0-80% funded
      fundraiser.raised_amount = Math.floor(fundraiser.goal_amount * raisedPercentage);

      const { data, error } = await supabase
        .from('fundraisers')
        .insert(fundraiser)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting fundraiser "${fundraiser.title}":`, error.message);
      } else {
        const fundedPercentage = Math.round((fundraiser.raised_amount / fundraiser.goal_amount) * 100);
        console.log(`✅ Added: ${fundraiser.title} - $${fundraiser.raised_amount} raised (${fundedPercentage}%)`);
      }
    }

    console.log('\n🎉 Sample fundraisers seeded successfully!');
    
    // Verify the count
    const { count, error: countError } = await supabase
      .from('fundraisers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting fundraisers:', countError.message);
    } else {
      console.log(`📊 Total fundraisers in database: ${count}`);
    }

  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedFundraisers();
