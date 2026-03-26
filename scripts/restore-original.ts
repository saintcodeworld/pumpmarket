import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: resolve('.env.local') });

async function restoreOriginal() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load original data
  const mockData = JSON.parse(fs.readFileSync('.mock-data.json', 'utf-8'));
  
  console.log('🔄 Restoring your original data as fundraisers...');

  // Clear existing
  await supabase.from('fundraisers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Create users
  const wallets = ['11111111111111111111111111111112', '22222222222222222222222222222223', '33333333333333333333333333333334'];
  for (const wallet of wallets) {
    await supabase.from('users').upsert({ wallet, has_accepted_tos: true }, { onConflict: 'wallet' });
  }

  // Your original listings converted to fundraisers
  const fundraisers = [
    {
      wallet: '11111111111111111111111111111112',
      title: 'Advanced Trading Fund - MEV Arbitrage',
      description: 'High-frequency trading fundraiser optimized for Solana DEX arbitrage. Includes advanced MEV strategies, customizable parameters, and detailed profit tracking. Built with Rust for maximum performance.\n\n🎯 **Fundraising Goal:** $2500.00\n💝 **Your contribution helps make this project a reality!**',
      price: 49.99,
      goal_amount: 2500,
      raised_amount: 875,
      category: 'Technology',
      image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
      delivery_url: 'encrypted-delivery-info',
      state: 'on_market',
      approved: true,
      risk_level: 'standard',
      pinned: true,
      pinned_at: new Date().toISOString(),
      views: 1234,
      reports_count: 0,
      failed_purchase_count: 0
    },
    {
      wallet: '22222222222222222222222222222223',
      title: 'NFT Sniper Fund - Multi-Marketplace',
      description: 'Lightning-fast NFT minting and sniping fundraiser supporting Magic Eden, Tensor, and other major Solana marketplaces. Real-time floor tracking and automated bidding.\n\n🎯 **Fundraising Goal:** $1500.00\n💝 **Your contribution helps make this project a reality!**',
      price: 29.99,
      goal_amount: 1500,
      raised_amount: 450,
      category: 'Technology',
      image_url: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop',
      delivery_url: 'encrypted-delivery-info',
      state: 'on_market',
      approved: true,
      risk_level: 'standard',
      pinned: true,
      pinned_at: new Date(Date.now() - 86400000).toISOString(),
      views: 987,
      reports_count: 0,
      failed_purchase_count: 0
    },
    {
      wallet: '11111111111111111111111111111112',
      title: 'Solana RPC Analytics Fund',
      description: 'RESTful API fundraiser providing real-time Solana blockchain analytics, wallet tracking, and transaction monitoring. Perfect for building dashboards and monitoring tools.\n\n🎯 **Fundraising Goal:** $1000.00\n💝 **Your contribution helps make this project a reality!**',
      price: 19.99,
      goal_amount: 1000,
      raised_amount: 320,
      category: 'Technology',
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      delivery_url: 'encrypted-delivery-info',
      state: 'on_market',
      approved: true,
      risk_level: 'standard',
      pinned: false,
      pinned_at: null,
      views: 654,
      reports_count: 0,
      failed_purchase_count: 0
    },
    {
      wallet: '33333333333333333333333333333334',
      title: 'Token Launcher Fund - Full Automation',
      description: 'Complete token launch fundraiser for Solana. Creates mint, metadata, and initial liquidity pool. Includes anti-bot measures and customizable tokenomics.\n\n🎯 **Fundraising Goal:** $775.00\n💝 **Your contribution helps make this project a reality!**',
      price: 15.5,
      goal_amount: 775,
      raised_amount: 233,
      category: 'Technology',
      image_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop',
      delivery_url: 'encrypted-delivery-info',
      state: 'on_market',
      approved: true,
      risk_level: 'standard',
      pinned: false,
      pinned_at: null,
      views: 432,
      reports_count: 0,
      failed_purchase_count: 0
    },
    {
      wallet: '22222222222222222222222222222223',
      title: 'Wallet Security Fund - Detection Tools',
      description: 'Security fundraiser that analyzes smart contracts and transaction patterns to detect potential wallet drainers and malicious dApps. Includes real-time alerts.\n\n🎯 **Fundraising Goal:** $1250.00\n💝 **Your contribution helps make this project a reality!**',
      price: 24.99,
      goal_amount: 1250,
      raised_amount: 688,
      category: 'Other',
      image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
      delivery_url: 'encrypted-delivery-info',
      state: 'on_market',
      approved: true,
      risk_level: 'standard',
      pinned: false,
      pinned_at: null,
      views: 876,
      reports_count: 0,
      failed_purchase_count: 0
    },
    {
      wallet: '33333333333333333333333333333334',
      title: 'DeFi Yield Optimizer Fund',
      description: 'Automated yield farming fundraiser that rebalances your portfolio across multiple Solana DeFi protocols to maximize APY. Set it and forget it.\n\n🎯 **Fundraising Goal:** $1750.00\n💝 **Your contribution helps make this project a reality!**',
      price: 34.99,
      goal_amount: 1750,
      raised_amount: 789,
      category: 'Technology',
      image_url: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&h=600&fit=crop',
      delivery_url: 'encrypted-delivery-info',
      state: 'on_market',
      approved: true,
      risk_level: 'standard',
      pinned: false,
      pinned_at: null,
      views: 543,
      reports_count: 0,
      failed_purchase_count: 0
    }
  ];

  // Insert fundraisers
  for (const fundraiser of fundraisers) {
    await supabase.from('fundraisers').insert(fundraiser);
    const fundedPercentage = Math.round((fundraiser.raised_amount / fundraiser.goal_amount) * 100);
    const pinnedStatus = fundraiser.pinned ? '📌 PINNED' : '';
    console.log(`✅ Restored: ${fundraiser.title} - $${fundraiser.raised_amount} raised (${fundedPercentage}%) ${pinnedStatus}`);
  }

  console.log('\n🎉 Your original data has been restored as fundraisers!');
  console.log(`📊 Total fundraisers: ${fundraisers.length}`);
}

restoreOriginal();
