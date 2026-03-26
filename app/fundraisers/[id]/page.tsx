'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CommentSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface Fundraiser {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: string;
  approved: boolean;
  createdAt: Date;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  views?: number;
  raisedAmount?: number;
  goalAmount?: number;
}

function FundraiserDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise
  const { id } = use(params);

  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey, signTransaction } = useWallet();
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasDonated, setHasDonated] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [customDonationAmount, setCustomDonationAmount] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [donationCount, setDonationCount] = useState(0);

  // Track navigation context from URL params
  const [backUrl, setBackUrl] = useState('/fundraisers');

  useEffect(() => {
    // Check if we have a 'from' query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');

    if (from === 'my-listings') {
      setBackUrl('/listings/my');
    } else {
      setBackUrl('/fundraisers');
    }
  }, []);

  const fetchFundraiser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/fundraisers/${id}`);
      setFundraiser(response.data.fundraiser || response.data.listing);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load fundraiser');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/fundraisers/${id}/comments`);
      setComments(response.data.comments || []);
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/fundraisers/${id}/transactions`);
      setTransactions(response.data.transactions || []);
      setTotalRaised(response.data.totalRaised || 0);
      setDonationCount(response.data.donationCount || 0);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const incrementViews = async () => {
    try {
      await axios.post(`/api/fundraisers/${id}/view`);
      console.log('✅ View tracked for fundraiser:', id);
    } catch (err) {
      // Silently fail - view tracking is not critical
      console.debug('Failed to track view:', err);
    }
  };

  useEffect(() => {
    if (mounted && id) {
      fetchFundraiser();
      fetchComments();
      fetchTransactions();
      incrementViews();
    }
  }, [mounted, id]);

  useEffect(() => {
    if (mounted && id && publicKey) {
      checkDonationStatus();
    }
  }, [mounted, id, publicKey, comments]);

  useEffect(() => {
    if (fundraiser && fundraiser.riskLevel === 'high-risk') {
      setShowWarning(true);
    }
  }, [fundraiser]);

  const checkDonationStatus = async () => {
    if (!publicKey) return;

    try {
      const response = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'purchases',
        },
      });

      const purchases = response.data.transactions || [];
      const donated = purchases.some((tx: any) => tx.listingId === id && tx.status === 'success');
      setHasDonated(donated);

      // Check if already commented
      const commented = comments.some((c: any) => c.buyerWallet === publicKey.toBase58());
      setHasCommented(commented);
    } catch (err: any) {
      console.error('Failed to check donation status:', err);
    }
  };

  const handleDonate = async () => {
    if (!publicKey || !fundraiser) return;

    if (!isConnected || !hasAcceptedTOS) {
      toast.warning('Please connect your wallet and accept TOS first');
      router.push('/');
      return;
    }

    if (!isTokenGated) {
      toast.warning('You need ≥50k $PumpMarket tokens to make donations');
      return;
    }

    if (!signTransaction) {
      toast.error('Wallet does not support transaction signing');
      return;
    }

    // Validate custom donation amount
    const donationAmount = parseFloat(customDonationAmount);
    if (isNaN(donationAmount) || donationAmount < 0.10) {
      setError('Please enter a valid donation amount (minimum $0.10 USDC)');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Donation',
      message: `Support "${fundraiser.title}" with $${donationAmount.toFixed(2)} USDC donation?`,
      confirmLabel: 'Donate Now',
      variant: 'info',
    });

    if (confirmed) {
      try {
        setDonating(true);
        setError(null);

        console.log('💝 Starting x402 donation flow...');

        // ====================================
        // STEP 1: Get 402 Payment Required
        // ====================================
        console.log('📋 Step 1: Requesting payment requirements...');
        let paymentRequired;

        try {
          await axios.post('/api/fundraise', {
            fundraiserId: fundraiser._id,
            customAmount: donationAmount, // Send custom amount to backend
          });
          // If we get here, payment wasn't required (shouldn't happen)
          throw new Error('Expected 402 Payment Required response');
        } catch (err: any) {
          if (err.response?.status === 402) {
            paymentRequired = err.response.data;
            console.log('✅ Got payment requirements:', paymentRequired);
          } else {
            throw err;
          }
        }

        // Extract payment requirements
        const requirements = paymentRequired.accepts[0];
        // Use custom donation amount instead of the default
        const amountLamports = Math.floor(donationAmount * 1_000_000);
        const sellerWallet = new PublicKey(requirements.payTo);
        const usdcMint = new PublicKey(requirements.asset);

        console.log(`💰 Amount: ${amountLamports / 1_000_000} USDC`);
        console.log(`👤 Fundraiser Creator: ${sellerWallet.toBase58()}`);
        console.log(`🪙 Mint: ${usdcMint.toBase58()}`);

        // ====================================
        // STEP 2: Construct SPL Transfer
        // ====================================
        console.log('🔨 Step 2: Constructing USDC transfer transaction...');

        // Get RPC connection (devnet or mainnet based on requirements)
        const rpcUrl = requirements.network === 'solana-devnet'
          ? process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com'
          : process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';

        const connection = new Connection(rpcUrl, 'confirmed');

        // Get associated token accounts
        const donorTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          publicKey
        );

        const creatorTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          sellerWallet
        );

        console.log(`📥 Donor token account: ${donorTokenAccount.toBase58()}`);
        console.log(`📤 Creator token account: ${creatorTokenAccount.toBase58()}`);

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
          donorTokenAccount,
          creatorTokenAccount,
          publicKey,
          amountLamports,
          [],
          TOKEN_PROGRAM_ID
        );

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);
        transaction.feePayer = publicKey;

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        console.log('✅ Transaction constructed');

        // ====================================
        // STEP 3: Sign & Broadcast
        // ====================================
        console.log('✍️  Step 3: Signing transaction with wallet...');

        const signed = await signTransaction(transaction);

        console.log('📡 Broadcasting transaction...');
        const signature = await connection.sendRawTransaction(signed.serialize());

        console.log(`✅ Transaction sent! Signature: ${signature}`);
        console.log(`🔗 View: https://explorer.solana.com/tx/${signature}?cluster=${requirements.network === 'solana-devnet' ? 'devnet' : 'mainnet'}`);

        // Wait for confirmation using polling (avoid WebSocket issues)
        console.log('⏳ Waiting for confirmation...');

        let confirmed = false;
        const maxAttempts = 30; // 30 attempts = ~30 seconds

        for (let i = 0; i < maxAttempts; i++) {
          try {
            const status = await connection.getSignatureStatus(signature);

            if (status?.value?.confirmationStatus === 'confirmed' ||
                status?.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log(`✅ Transaction confirmed! (${status.value.confirmationStatus})`);
              break;
            }

            if (status?.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }

            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.warn(`Attempt ${i + 1}/${maxAttempts} - checking status...`);
          }
        }

        if (!confirmed) {
          console.warn('⚠️ Could not confirm transaction in time, proceeding anyway...');
          console.warn('   Backend will verify on-chain');
        }

        // ====================================
        // STEP 4: Send Payment to Backend
        // ====================================
        console.log('📨 Step 4: Sending payment proof to backend...');

        // Construct payment payload
        const paymentPayload = {
          x402Version: 1,
          scheme: 'exact',
          network: requirements.network,
          payload: {
            signature,
            from: publicKey.toBase58(),
            to: sellerWallet.toBase58(),
            amount: amountLamports.toString(),
            mint: usdcMint.toBase58(),
          },
        };

        // Encode to Base64
        const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

          // Send to backend with X-PAYMENT header
          const finalResponse = await axios.post(
            '/api/fundraise',
            {
              fundraiserId: fundraiser._id,
              customAmount: donationAmount, // Include custom amount
            },
            {
              headers: {
                'X-PAYMENT': paymentHeader,
              },
            }
          );

          console.log('✅ Backend response received:', finalResponse.data);

          if (finalResponse.data.success && finalResponse.data.transactionId) {
            console.log('🎉 Donation successful! Transaction ID:', finalResponse.data.transactionId);

            // Refresh transactions and fundraiser data before redirecting
            await fetchTransactions();
            await fetchFundraiser();

            // Redirect to delivery page with transaction ID
            router.push(`/delivery/${finalResponse.data.transactionId}`);
          } else {
            console.error('❌ No transaction ID in response:', finalResponse.data);
            throw new Error('Donation succeeded but no transaction record received');
          }

      } catch (err: any) {
        console.error('❌ Donation error:', err);

        // Handle user rejection gracefully
        if (err.code === 4001 || err.name === 'WalletSignTransactionError' || err.message?.includes('rejected')) {
          console.log('ℹ️ User cancelled transaction');
          setError('Transaction cancelled');
          return; // Don't show alert, user knows they cancelled
        } else if (err.response?.status === 402) {
          setError('Payment verification failed: ' + (err.response.data.error || 'Unknown error'));
          toast.error('Payment verification failed. Please try again.');
        } else {
          const errorMsg = err.response?.data?.error || err.message || 'Donation failed';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setDonating(false);
      }
    }
  };

  const handleReport = async () => {
    if (!isConnected || !publicKey || !fundraiser) {
      toast.warning('Please connect your wallet to report');
      return;
    }

    const confirmed = await confirm({
      title: 'Report Fundraiser',
      message: 'Report this fundraiser? This will be reviewed by administrators.',
      confirmLabel: 'Submit Report',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        setReporting(true);
        await axios.post('/api/reports', {
          listingId: fundraiser._id,
          wallet: publicKey.toBase58(),
          reason: reportReason.trim() || undefined,
        });
        toast.success('Report submitted successfully. Thank you for helping keep the community safe!');
        setShowReportForm(false);
        setReportReason('');
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Failed to submit report';
        toast.error(errorMsg);
      } finally {
        setReporting(false);
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !publicKey || !fundraiser) {
      toast.warning('Please connect your wallet to leave a review');
      return;
    }

    if (!hasDonated) {
      toast.warning('You must donate to this fundraiser before leaving a review');
      return;
    }

    if (hasCommented) {
      toast.info('You have already left a review for this fundraiser');
      return;
    }

    if (!newComment.trim()) {
      toast.warning('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      await axios.post(`/api/fundraisers/${fundraiser._id}/comments`, {
        wallet: publicKey.toBase58(),
        comment: newComment.trim(),
      });
      toast.success('Review submitted successfully!');
      setNewComment('');
      setHasCommented(true);
      fetchComments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/50">Loading fundraiser...</p>
        </div>
      </div>
    );
  }

  if (error || !fundraiser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || 'Fundraiser Not Found'}
          </h1>
          <Link
            href={backUrl}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          >
            {backUrl === '/listings/my' ? 'Back to My Listings' : 'Back to Fundraisers'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f14] py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Link
          href={backUrl}
          className="mb-6 inline-flex items-center text-sm text-white/50 hover:text-white transition-colors"
        >
          {backUrl === '/listings/my' ? '← Back to My Listings' : '← Back to Fundraisers'}
        </Link>

        {/* Critical Warning Banner (Toggleable) */}
        {showWarning && (
          <div className="mb-8 rounded-lg border-2 border-red-600 bg-red-950/20 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white text-2xl font-bold flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-400 mb-2">
                  CRITICAL WARNING
                </h2>
                <p className="text-red-400 mb-3">
                  This fundraiser has been flagged as <strong>HIGH RISK</strong>. Exercise extreme caution before donating.
                </p>
                <ul className="list-disc list-inside text-sm text-red-400/80 space-y-1 mb-4">
                  <li>Only donate what you can afford to lose</li>
                  <li>Be aware that this may be a scam or fraudulent fundraiser</li>
                  <li>There are NO refunds or chargebacks in crypto</li>
                  <li>Report suspicious fundraisers to help protect others</li>
                </ul>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-sm text-red-400 hover:text-red-300 underline transition-colors"
                >
                  I understand the risks, dismiss warning
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-purple-900/30 bg-white/5">
            <Image
              src={fundraiser.imageUrl}
              alt={fundraiser.title}
              fill
              className="object-cover"
            />
            {fundraiser.riskLevel === 'high-risk' && (
              <div className="absolute top-4 right-4 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                ⚠️ High Risk
              </div>
            )}
            {/* Fundraiser Badge */}
            <div className="absolute top-4 left-4 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-medium text-black shadow-lg flex items-center gap-2">
              💝 Fundraiser
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-6 relative">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70 mb-3">
                {fundraiser.category}
              </span>

              {/* Icon Buttons - Top Right */}
              <div className="absolute top-0 right-0 flex items-center space-x-2">
                {/* Warning Icon */}
                {fundraiser.riskLevel === 'high-risk' && (
                  <button
                    onClick={() => setShowWarning(!showWarning)}
                    className="rounded-full bg-red-950/30 p-2 text-red-400 hover:bg-red-950/50 transition-colors"
                    title="Show risk warning"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}

                {/* Report Button */}
                <button
                  onClick={() => setShowReportForm(!showReportForm)}
                  className="rounded-full bg-white/5 p-2 text-white/40 hover:bg-white/10 transition-colors"
                  title="Report fundraiser"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                {fundraiser.title}
              </h1>

              {/* Donation Progress */}
              <div className="mb-6 rounded-lg border border-purple-900/30 bg-white/5 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-[#14F195]">
                    ${totalRaised.toFixed(2)} raised
                  </span>
                  <span className="text-white/50">
                    of ${(fundraiser.goalAmount || fundraiser.price).toFixed(2)} goal
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#9945FF] to-[#14F195] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalRaised / (fundraiser.goalAmount || fundraiser.price)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-white/50 mt-2 font-medium">
                  {Math.round((totalRaised / (fundraiser.goalAmount || fundraiser.price)) * 100)}% funded
                </div>
              </div>
            </div>

            <p className="text-white/70 mb-6 whitespace-pre-wrap">
              {fundraiser.description}
            </p>

            {/* CTA Button - Hide if viewing own fundraiser */}
            {publicKey && fundraiser.wallet === publicKey.toBase58() ? (
              <div className="w-full rounded-lg border border-purple-900/30 bg-white/5 px-6 py-3 text-sm font-medium text-white/50 text-center mb-3">
                👤 This is your fundraiser
              </div>
            ) : (
              <>
                {/* Custom Donation Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Donation Amount (USDC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-white/40 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      value={customDonationAmount}
                      onChange={(e) => setCustomDonationAmount(e.target.value)}
                      placeholder="Enter amount (e.g. 10.00)"
                      className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-3 pl-8 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    Choose your donation amount. Every contribution helps reach the ${fundraiser.goalAmount?.toFixed(2) || fundraiser.price.toFixed(2)} goal!
                  </p>
                </div>

                <button
                  onClick={handleDonate}
                  disabled={donating || !isConnected || !hasAcceptedTOS || !isTokenGated || !customDonationAmount}
                  className="w-full rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity mb-3"
                >
                  {donating ? 'Processing...' : hasDonated ? '💝 Donate Again' : '💝 Support This Cause'}
                </button>

                {!isConnected && (
                  <p className="text-xs text-center text-white/40">
                    Connect your wallet to donate
                  </p>
                )}
                {isConnected && !hasAcceptedTOS && (
                  <p className="text-xs text-center text-red-400">
                    Accept Terms of Service in your profile to donate
                  </p>
                )}
              </>
            )}
            {isConnected && hasAcceptedTOS && !isTokenGated && publicKey && fundraiser.wallet !== publicKey.toBase58() && (
              <p className="text-xs text-center text-red-400">
                Hold 50,000+ $PumpMarket tokens to donate
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 rounded-lg border border-red-900/50 bg-red-950/20 p-3">
                <p className="text-sm text-red-400">⚠️ {error}</p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-purple-900/30 bg-white/5 p-4">
                <div className="text-xs text-white/40 mb-1">Views</div>
                <span className="text-lg font-bold text-white">
                  {fundraiser.views?.toLocaleString() || 0}
                </span>
              </div>

              <div className="rounded-lg border border-purple-900/30 bg-white/5 p-4">
                <div className="text-xs text-white/40 mb-1">Donations</div>
                <span className="text-lg font-bold text-[#14F195]">
                  {donationCount.toLocaleString()}
                </span>
              </div>

              {/* Organizer Info */}
              <div className="rounded-lg border border-purple-900/30 bg-white/5 p-4 col-span-2 sm:col-span-1">
                <div className="text-xs text-white/40 mb-1">Organizer</div>
                <Link
                  href={`/fundraisers?wallet=${fundraiser.wallet}`}
                  className="text-xs font-mono text-[#9945FF] hover:text-[#9945FF]/80 transition-colors block truncate"
                  title={fundraiser.wallet}
                >
                  {fundraiser.wallet.slice(0, 6)}...{fundraiser.wallet.slice(-4)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Video Section */}
        {fundraiser.demoVideoUrl && getYouTubeVideoId(fundraiser.demoVideoUrl) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              🎥 Campaign Video
            </h2>
            <div className="relative w-full overflow-hidden rounded-lg border border-purple-900/30 bg-white/5" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 h-full w-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(fundraiser.demoVideoUrl)}?autoplay=1&mute=1&rel=0`}
                title="Campaign Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Additional Resources Section */}
        {(fundraiser.whitepaperUrl || fundraiser.githubUrl) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              📚 Additional Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fundraiser.whitepaperUrl && (
                <a
                  href={fundraiser.whitepaperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-purple-900/30 bg-white/5 p-4 hover:border-[#9945FF] hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm font-medium text-white">📄 Documentation</span>
                  <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              {fundraiser.githubUrl && (
                <a
                  href={fundraiser.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-purple-900/30 bg-white/5 p-4 hover:border-[#9945FF] hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm font-medium text-white">💻 GitHub</span>
                  <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Report Form */}
        {showReportForm && (
          <div className="mt-8 rounded-lg border-2 border-red-900/50 bg-red-950/20 p-6">
            <h3 className="text-lg font-bold text-red-400 mb-3">
              🚨 Report This Fundraiser
            </h3>
            <p className="text-sm text-red-400/80 mb-4">
              Help us keep the community safe. If you believe this fundraiser violates our terms or is fraudulent, please report it.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Optional: Describe the issue (max 100 characters)"
              maxLength={100}
              rows={2}
              className="w-full rounded-lg border border-red-900/50 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 mb-3"
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReport}
                disabled={reporting || !isConnected}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {reporting ? 'Submitting...' : '🚨 Submit Report'}
              </button>
              {!isConnected && (
                <p className="text-xs text-red-400">
                  Connect your wallet to report
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recent Donations */}
        {transactions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              💝 Recent Donations ({donationCount})
            </h2>
            <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm">
              <div className="max-h-96 overflow-y-auto">
                {transactions.map((txn, index) => (
                  <div
                    key={txn._id}
                    className={`flex items-center justify-between p-4 ${
                      index !== transactions.length - 1 ? 'border-b border-purple-900/30' : ''
                    } hover:bg-white/5 transition-colors`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-900/40 flex-shrink-0">
                        <span className="text-lg">💝</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-white truncate">
                            {txn.wallet.slice(0, 8)}...{txn.wallet.slice(-6)}
                          </span>
                          <span className="text-xs text-white/40">
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-1">
                          <span>Tx:</span>
                          <a
                            href={`https://solscan.io/tx/${txn.txnHash}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? 'devnet' : 'mainnet'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono hover:text-[#9945FF] transition-colors truncate max-w-[150px]"
                            title={txn.txnHash}
                          >
                            {txn.txnHash.slice(0, 8)}...
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-lg font-bold text-[#14F195]">
                        ${txn.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-white/40">
                        USDC
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Footer */}
              <div className="border-t border-purple-900/30 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/70">
                    Total Raised
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#14F195]">
                      ${totalRaised.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40">
                      of ${fundraiser.goalAmount?.toFixed(2) || fundraiser.price.toFixed(2)} goal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews/Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            📝 Reviews ({comments.length})
          </h2>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="rounded-lg border border-purple-900/30 bg-white/5 p-8 text-center">
              <p className="text-white/50">
                No reviews yet. Be the first to review after donating!
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment: any) => {
                const wallet = comment.buyerWallet;
                const truncatedWallet = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;

                // Calculate time ago
                const timeAgo = () => {
                  const now = new Date();
                  const created = new Date(comment.createdAt);
                  const diffMs = now.getTime() - created.getTime();
                  const diffSecs = Math.floor(diffMs / 1000);
                  const diffMins = Math.floor(diffSecs / 60);
                  const diffHours = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHours / 24);

                  if (diffDays > 0) return `${diffDays}d ago`;
                  if (diffHours > 0) return `${diffHours}h ago`;
                  if (diffMins > 0) return `${diffMins}m ago`;
                  return 'Just now';
                };

                return (
                  <div
                    key={comment._id}
                    className="rounded-lg border border-purple-900/30 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] flex items-center justify-center text-black text-xs font-bold">
                          {wallet.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {truncatedWallet}
                          </p>
                          <p className="text-xs text-white/40">
                            Verified Donor
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-white/40">
                        {timeAgo()}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">
                      {comment.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Form */}
          {hasDonated && !hasCommented && (
            <div className="mt-6 rounded-lg border border-[#14F195]/20 bg-[#14F195]/5 p-6">
              <h3 className="text-lg font-bold text-[#14F195] mb-3">
                Leave a Review
              </h3>
              <form onSubmit={handleSubmitComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this fundraiser... (max 200 characters)"
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30 mb-3"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-2 text-sm font-medium text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
                >
                  {submittingComment ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>
          )}

          {!hasDonated && isConnected && (
            <div className="mt-6 rounded-lg border border-purple-900/30 bg-white/5 p-4 text-center">
              <p className="text-sm text-white/50">
                💝 Donate to this fundraiser to leave a review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FundraiserPage({ params }: { params: Promise<{ id: string }> }) {
  return <FundraiserDetail params={params} />;
}
