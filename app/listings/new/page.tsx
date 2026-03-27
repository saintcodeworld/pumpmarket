'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

function NewListingPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const router = useRouter();

  const [listingType, setListingType] = useState<'market' | 'fundraiser'>('market');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Trading Bot',
    imageUrl: '',
    deliveryUrl: '',  // REQUIRED: Download link for buyers
    demoVideoUrl: '',  // Optional
    whitepaperUrl: '',  // Optional
    githubUrl: '',  // Optional
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Image must be JPEG, PNG, or WebP');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);

    // Auto-upload image
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      // Include wallet for rate limiting
      const wallet = publicKey?.toBase58() || '';
      const uploadUrl = `/api/upload/image${wallet ? `?wallet=${wallet}` : ''}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload image';
      setError(errorMsg);

      // Show rate limit info if available
      if (err.response?.status === 429) {
        const resetAt = err.response?.data?.resetAt;
        if (resetAt) {
          const resetTime = new Date(resetAt).toLocaleTimeString();
          setError(`${errorMsg} Try again after ${resetTime}.`);
        }
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.title.length < 5 || formData.title.length > 100) {
      setError('Title must be 5-100 characters');
      return;
    }

    if (formData.description.length < 50 || formData.description.length > 2000) {
      setError('Description must be 50-2000 characters');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.10) {
      setError('Price must be at least $0.10 USDC');
      return;
    }

    if (!formData.imageUrl) {
      setError('Please upload an image');
      return;
    }

    if (!formData.deliveryUrl) {
      setError('Delivery URL is required (the download link buyers will receive)');
      return;
    }

    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);

      // ====================================
      // VALIDATE: Check if seller has USDC account
      // ====================================
      console.log('🔍 Validating seller can receive USDC payments...');

      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed');

      // USDC mainnet mint
      const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

      // Get seller's USDC token account
      const sellerUsdcAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      console.log(`📤 Checking USDC account: ${sellerUsdcAccount.toBase58()}`);

      // Check if account exists
      const accountInfo = await connection.getAccountInfo(sellerUsdcAccount);

      if (!accountInfo) {
        console.error('❌ Seller does not have a USDC token account');
        setError(
          '❌ Your wallet cannot receive USDC payments. You need to create a USDC token account first. ' +
          'Solution: Open Phantom wallet → Add a small amount of USDC (even $0.01) to create your account, ' +
          'or use a different wallet like Phantom that automatically creates token accounts. ' +
          'This is a one-time setup to enable receiving payments.'
        );
        setLoading(false);
        return;
      }

      console.log('✅ Seller has a valid USDC account');

      // ====================================
      // CREATE LISTING OR FUNDRAISER
      // ====================================
      const endpoint = listingType === 'fundraiser' ? '/api/fundraisers' : '/api/listings';

      const response = await axios.post(endpoint, {
        wallet: publicKey.toBase58(),
        title: formData.title,
        description: formData.description,
        price,
        category: formData.category,
        imageUrl: formData.imageUrl,
        deliveryUrl: formData.deliveryUrl,
        demoVideoUrl: formData.demoVideoUrl || undefined,
        whitepaperUrl: formData.whitepaperUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      });

      // Redirect to my-listings
      router.push('/listings/my');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create listing';
      setError(errorMsg);

      // Show additional info for rate limits (429 status)
      if (err.response?.status === 429) {
        const resetAt = err.response?.data?.resetAt;
        const currentCount = err.response?.data?.currentCount;
        const limit = err.response?.data?.limit;

        if (resetAt) {
          const resetTime = new Date(resetAt).toLocaleTimeString();
          setError(`${errorMsg} Try again after ${resetTime}.`);
        } else if (currentCount !== undefined && limit !== undefined) {
          setError(`${errorMsg} (${currentCount}/${limit} listings)`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isConnected || !hasAcceptedTOS) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-white/50 mb-6">
            You need to connect your wallet and accept TOS to create listings
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f14] py-12 px-4 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {listingType === 'fundraiser' ? 'Create Fundraiser' : 'List Your Product'}
          </h1>
          <p className="text-lg text-white/50">
            {listingType === 'fundraiser' ? 'Start a fundraising campaign' : 'Create a new listing for the marketplace'}
          </p>
        </div>

        {/* Listing Type Selector */}
        <div className="mb-6 rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
          <label className="mb-3 block text-sm font-medium text-white/70">
            Listing Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setListingType('market');
                setFormData(prev => ({ ...prev, category: 'Trading Bot' }));
              }}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                listingType === 'market'
                  ? 'border-[#9945FF] bg-[#9945FF]/10'
                  : 'border-purple-900/40 hover:border-purple-900/60'
              }`}
            >
              <span className="text-4xl">🏪</span>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  Market Item
                </div>
                <div className="text-sm text-white/50">
                  Sell software, tools, services
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setListingType('fundraiser');
                setFormData(prev => ({ ...prev, category: 'Medical' }));
              }}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                listingType === 'fundraiser'
                  ? 'border-[#9945FF] bg-[#9945FF]/10'
                  : 'border-purple-900/40 hover:border-purple-900/60'
              }`}
            >
              <span className="text-4xl">💝</span>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  Fundraiser
                </div>
                <div className="text-sm text-white/50">
                  Raise funds for a cause
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Token Gating Warning */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-400">
              ⚠️ You don't have enough $PumpMarket tokens. Listing creation may be restricted.
            </p>
          </div>
        )}

        {/* Critical USDC Account Warning */}
        <div className="mb-6 rounded-lg border-2 border-red-600 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div>
              <h3 className="text-sm font-bold text-red-400 mb-2">
                CRITICAL: USDC Account Required
              </h3>
              <p className="text-sm text-red-400/80">
                <strong>YOU MUST HAVE A USDC ACCOUNT ON YOUR WALLET TO RECEIVE USDC FROM SALES.</strong> If you don't do this, it will error for the buyer in Phantom when they try to purchase.
              </p>
              <p className="text-sm text-red-400/80 mt-2">
                ✅ <strong>Ensure you have a USDC account by transferring at least $0.10 USDC to your wallet before listing.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Delivery URL Info */}
        <div className="mb-6 rounded-lg border border-purple-900/40 bg-purple-950/20 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <h3 className="text-sm font-semibold text-purple-300 mb-1">
                Important: Delivery URL Cannot Be Changed
              </h3>
              <p className="text-sm text-purple-300/80">
                Once your listing is created, the <strong>delivery URL cannot be edited</strong>. Make sure it's correct before submitting! You can edit all other fields (title, description, price, category, image) later.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
              <p className="text-sm text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Advanced Trading Bot - MEV Arbitrage"
              className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
              maxLength={100}
              required
            />
            <p className="mt-1 text-xs text-white/40">{formData.title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your software in detail. What does it do? What are the key features? Who is it for?"
              rows={6}
              className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
              maxLength={2000}
              required
            />
            <p className="mt-1 text-xs text-white/40">{formData.description.length}/2000 characters (min 50)</p>
          </div>

          {/* Price / Goal Amount */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/70">
              {listingType === 'fundraiser' ? 'Fundraising Goal (USDC)' : 'Price (USDC)'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-white/40">$</span>
              <input
                type="number"
                step="0.01"
                min={listingType === 'fundraiser' ? '1' : '0.10'}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder={listingType === 'fundraiser' ? '500.00' : '0.00'}
                className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 pl-8 text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                required
              />
            </div>
            <p className="mt-1 text-xs text-white/40">
              {listingType === 'fundraiser'
                ? 'Your fundraising target amount. Donors can contribute any amount they choose.'
                : 'Minimum $0.10 USDC'}
            </p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
              required
            >
              {listingType === 'market' ? (
                <>
                  <option value="">Select a category...</option>
                  <optgroup label="🤖 Software & Tools">
                    <option value="Trading Bot">Trading Bot</option>
                    <option value="API Tool">API Tool</option>
                    <option value="Script">Script</option>
                    <option value="NFT Tools">NFT Tools</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Marketing Tools">Marketing Tools</option>
                  </optgroup>
                  <optgroup label="🎨 Creative Content">
                    <option value="Art & Design">Art & Design</option>
                    <option value="Music">Music</option>
                    <option value="Video Content">Video Content</option>
                  </optgroup>
                  <optgroup label="🎮 Gaming">
                    <option value="Games">Games</option>
                    <option value="Mods">Mods</option>
                  </optgroup>
                  <optgroup label="💼 Services & Access">
                    <option value="Jobs/Services">Jobs/Services</option>
                    <option value="Private Access">Private Access</option>
                    <option value="Call Groups">Call Groups</option>
                    <option value="Courses & Tutorials">Courses & Tutorials</option>
                  </optgroup>
                  <optgroup label="💬 Community Services">
                    <option value="Telegram Groups">Telegram Groups</option>
                    <option value="Discord Services">Discord Services</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Raid Services">Raid Services</option>
                  </optgroup>
                  <optgroup label="⚡ Other">
                    <option value="Custom">Custom</option>
                  </optgroup>
                </>
              ) : (
                <>
                  <option value="">Select a category...</option>
                  <option value="Medical">🏥 Medical</option>
                  <option value="Education">📚 Education</option>
                  <option value="Community">🤝 Community</option>
                  <option value="Emergency">🚨 Emergency</option>
                  <option value="Animal Welfare">🐾 Animal Welfare</option>
                  <option value="Environmental">🌍 Environmental</option>
                  <option value="Arts & Culture">🎭 Arts & Culture</option>
                  <option value="Technology">💻 Technology</option>
                  <option value="Sports">⚽ Sports</option>
                  <option value="Religious">🙏 Religious</option>
                  <option value="Memorial">🕯️ Memorial</option>
                  <option value="Business">💼 Business</option>
                  <option value="Personal">👤 Personal</option>
                  <option value="Other">⚡ Other</option>
                </>
              )}
            </select>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Product Image <span className="text-red-400">*</span>
            </label>
            <div className="flex items-start space-x-4">
              {imagePreview && (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-purple-900/40">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-white/50 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-[#9945FF] file:to-[#14F195] file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:opacity-90"
                />
                <p className="mt-2 text-xs text-white/40">
                  JPEG, PNG, or WebP. Max 5MB. Recommended 800x600px
                </p>
                {uploadingImage && (
                  <p className="mt-2 text-sm text-[#14F195]">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* Private Delivery URL Section */}
          <div className="mb-6 rounded-lg border-2 border-red-900/50 bg-red-950/20 p-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold flex-shrink-0">
                🔒
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-400 mb-1">
                  Private Delivery URL <span className="text-red-400">*</span>
                </h3>
                <p className="text-xs text-red-400/80">
                  ⚠️ <strong>ENCRYPTED & PRIVATE:</strong> Only shown to buyers after successful payment. Never displayed publicly.
                </p>
              </div>
            </div>

            <input
              type="url"
              value={formData.deliveryUrl}
              onChange={(e) => setFormData({ ...formData, deliveryUrl: e.target.value })}
              placeholder="https://github.com/yourrepo/releases/v1.0.0/software.zip"
              className="w-full rounded-lg border border-red-900/50 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
              required
            />
            <p className="mt-2 text-xs text-red-400/70">
              The download link buyers receive after purchase (GitHub release, Dropbox, Google Drive, etc.)
            </p>
          </div>

          {/* Public Information Section */}
          <div className="mb-6 rounded-lg border-2 border-[#14F195]/20 bg-[#14F195]/5 p-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14F195] text-black font-bold flex-shrink-0">
                👁️
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14F195] mb-1">
                  Public Resources (Optional)
                </h3>
                <p className="text-xs text-[#14F195]/80">
                  ✅ <strong>PUBLICLY VISIBLE:</strong> Shown on your listing page to help buyers make informed decisions.
                </p>
              </div>
            </div>

            {/* Demo Video URL */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white/70">
                🎥 Demo Video URL (YouTube)
              </label>
              <input
                type="url"
                value={formData.demoVideoUrl}
                onChange={(e) => setFormData({ ...formData, demoVideoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
                className="w-full rounded-lg border border-[#14F195]/20 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#14F195] focus:outline-none focus:ring-2 focus:ring-[#14F195]/30"
              />
              <p className="mt-1 text-xs text-[#14F195]/60">
                YouTube video that will auto-play (muted) on your listing page
              </p>
            </div>

            {/* Whitepaper URL */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white/70">
                📄 Whitepaper URL
              </label>
              <input
                type="url"
                value={formData.whitepaperUrl}
                onChange={(e) => setFormData({ ...formData, whitepaperUrl: e.target.value })}
                placeholder="https://docs.google.com/document/..."
                className="w-full rounded-lg border border-[#14F195]/20 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#14F195] focus:outline-none focus:ring-2 focus:ring-[#14F195]/30"
              />
              <p className="mt-1 text-xs text-[#14F195]/60">
                Public technical documentation or whitepaper shown on your listing page
              </p>
            </div>

            {/* GitHub URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                💻 GitHub URL (Public Repo)
              </label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/username/repo"
                className="w-full rounded-lg border border-[#14F195]/20 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#14F195] focus:outline-none focus:ring-2 focus:ring-[#14F195]/30"
              />
              <p className="mt-1 text-xs text-[#14F195]/60">
                Public GitHub repository link shown on your listing page
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-purple-900/30">
            <Link
              href="/listings/my"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-2 text-sm font-medium text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg border border-purple-900/40 bg-purple-950/20 p-4">
            <p className="text-sm text-purple-300">
              ℹ️ Your listing will be reviewed by admins before going live on the marketplace.
              This usually takes 24-48 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <ProtectedContent>
      <NewListingPageContent />
    </ProtectedContent>
  );
}
