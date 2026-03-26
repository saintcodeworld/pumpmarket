'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Listing {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: 'in_review' | 'on_market' | 'pulled';
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
  revenue?: number;
  salesCount?: number;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  type?: 'listing' | 'fundraiser'; // Added to distinguish type
}

function MyListingsPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'fundraisers'>('market');

  // Edit modal state
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    demoVideoUrl: '',
    whitepaperUrl: '',
    githubUrl: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (mounted && isConnected && hasAcceptedTOS && publicKey) {
      fetchMyListings();
    }
  }, [mounted, isConnected, hasAcceptedTOS, publicKey]);

  const fetchMyListings = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);

      // Fetch both regular listings and fundraisers
      const [listingsResponse, fundraisersResponse] = await Promise.all([
        axios.get(`/api/listings?wallet=${publicKey.toBase58()}`).catch(() => ({ data: { listings: [] } })),
        axios.get(`/api/fundraisers?wallet=${publicKey.toBase58()}`).catch(() => ({ data: { fundraisers: [] } })),
      ]);

      // Combine and mark with type
      const listings = (listingsResponse.data.listings || []).map((item: Listing) => ({
        ...item,
        type: 'listing' as const
      }));
      const fundraisers = (fundraisersResponse.data.fundraisers || []).map((item: Listing) => ({
        ...item,
        type: 'fundraiser' as const
      }));

      // Merge and sort by creation date (newest first)
      const combined = [...listings, ...fundraisers].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setListings(combined);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type?: 'listing' | 'fundraiser') => {
    const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
    const confirmed = await confirm({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setDeletingId(id);
      const endpoint = type === 'fundraiser' ? `/api/fundraisers/${id}` : `/api/listings/${id}`;
      await axios.delete(endpoint);
      setListings(prev => prev.filter(l => l._id !== id));
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to delete ${itemType}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeactivate = async (id: string, type?: 'listing' | 'fundraiser') => {
    const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
    const confirmed = await confirm({
      title: `Deactivate ${itemType}`,
      message: `Take this ${itemType} off the market? You can reactivate it later.`,
      confirmLabel: 'Deactivate',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      setUpdatingId(id);
      const endpoint = type === 'fundraiser' ? `/api/fundraisers/${id}` : `/api/listings/${id}`;
      await axios.patch(endpoint, { state: 'pulled' });
      await fetchMyListings(); // Refresh list
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deactivated successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to deactivate ${itemType}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReactivate = async (id: string, type?: 'listing' | 'fundraiser') => {
    const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
    const confirmed = await confirm({
      title: `Reactivate ${itemType}`,
      message: `Reactivate this ${itemType}? It will need admin approval again.`,
      confirmLabel: 'Reactivate',
      variant: 'info',
    });

    if (!confirmed) return;

    try {
      setUpdatingId(id);
      const endpoint = type === 'fundraiser' ? `/api/fundraisers/${id}` : `/api/listings/${id}`;
      await axios.patch(endpoint, {
        state: 'in_review',
        approved: false
      });
      await fetchMyListings(); // Refresh list
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} reactivated successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to reactivate ${itemType}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (listing: Listing) => {
    setEditingListing(listing);
    setEditFormData({
      title: listing.title,
      description: listing.description,
      price: listing.price.toString(),
      category: listing.category,
      imageUrl: listing.imageUrl,
      demoVideoUrl: listing.demoVideoUrl || '',
      whitepaperUrl: listing.whitepaperUrl || '',
      githubUrl: listing.githubUrl || '',
    });
    setImagePreview(listing.imageUrl);
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingListing(null);
    setEditFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      demoVideoUrl: '',
      whitepaperUrl: '',
      githubUrl: '',
    });
    setImagePreview('');
    setImageFile(null);
    setEditError(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setEditError('Image must be JPEG, PNG, or WebP');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setEditError(null);

    // Auto-upload image
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const wallet = publicKey?.toBase58() || '';
      const uploadUrl = `/api/upload/image${wallet ? `?wallet=${wallet}` : ''}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload image';
      setEditError(errorMsg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingListing || !publicKey) return;

    // Validation
    if (editFormData.title.length < 5 || editFormData.title.length > 100) {
      setEditError('Title must be 5-100 characters');
      return;
    }

    if (editFormData.description.length < 50 || editFormData.description.length > 2000) {
      setEditError('Description must be 50-2000 characters');
      return;
    }

    const price = parseFloat(editFormData.price);
    if (isNaN(price) || price < 0.1 || price > 10000) {
      setEditError('Price must be between $0.10 and $10,000 USDC');
      return;
    }

    if (!editFormData.imageUrl) {
      setEditError('Please upload an image');
      return;
    }

    try {
      setSubmittingEdit(true);

      // Use correct endpoint based on item type
      const endpoint = editingListing.type === 'fundraiser'
        ? `/api/fundraisers/${editingListing._id}/edit`
        : `/api/listings/${editingListing._id}/edit`;

      await axios.put(endpoint, {
        wallet: publicKey.toBase58(),
        title: editFormData.title,
        description: editFormData.description,
        price,
        category: editFormData.category,
        imageUrl: editFormData.imageUrl,
        demoVideoUrl: editFormData.demoVideoUrl || undefined,
        whitepaperUrl: editFormData.whitepaperUrl || undefined,
        githubUrl: editFormData.githubUrl || undefined,
      });

      closeEditModal();
      await fetchMyListings(); // Refresh list
      const itemType = editingListing.type === 'fundraiser' ? 'Fundraiser' : 'Listing';
      toast.success(`${itemType} updated successfully!`);
    } catch (err: any) {
      const itemType = editingListing.type === 'fundraiser' ? 'fundraiser' : 'listing';
      setEditError(err.response?.data?.error || `Failed to update ${itemType}`);
    } finally {
      setSubmittingEdit(false);
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
            You need to connect your wallet and accept TOS to view your listings
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

  const getStateColor = (state: string, approved: boolean) => {
    if (state === 'in_review' && !approved) return 'bg-yellow-950/30 text-yellow-400';
    if (state === 'on_market' && approved) return 'bg-[#14F195]/10 text-[#14F195]';
    if (state === 'pulled') return 'bg-red-950/30 text-red-400';
    return 'bg-white/10 text-white/70';
  };

  const getStateText = (state: string, approved: boolean) => {
    if (state === 'in_review' && !approved) return 'In Review';
    if (state === 'on_market' && approved) return 'Live';
    if (state === 'pulled') return 'Pulled';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#0f0f14] py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              My Listings
            </h1>
            <p className="text-lg text-white/50">
              Manage your software listings
            </p>
          </div>
          <Link
            href="/listings/new"
            className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          >
            + Create Listing
          </Link>
        </div>

        {/* Token Gating Warning */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-400">
              ⚠️ You don't have enough $PumpMarket tokens. Some features may be restricted.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
            <p className="text-sm text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <div className="rounded-lg border border-purple-900/30 bg-white/5 p-12 text-center">
            <div className="mb-4 text-5xl">📦</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No listings yet
            </h2>
            <p className="text-white/50 mb-6">
              Create your first listing to start selling on SOLk Road
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            >
              Create Listing
            </Link>
          </div>
        )}

        {/* Tab Navigation */}
        {!loading && !error && listings.length > 0 && (() => {
          // Separate market listings and fundraisers
          const marketListings = listings.filter(l => l.type !== 'fundraiser');
          const fundraiserListings = listings.filter(l => l.type === 'fundraiser');

          return (
            <>
              {/* Tabs */}
              <div className="mb-6 border-b border-purple-900/30">
                <nav className="flex gap-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('market')}
                    className={`flex items-center gap-2 border-b-2 pb-4 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'market'
                        ? 'border-[#9945FF] text-[#9945FF]'
                        : 'border-transparent text-white/40 hover:text-white/60'
                    }`}
                  >
                    <span className="text-xl">🏪</span>
                    <span>Market Items</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activeTab === 'market'
                        ? 'bg-[#9945FF]/20 text-[#9945FF]'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {marketListings.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('fundraisers')}
                    className={`flex items-center gap-2 border-b-2 pb-4 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'fundraisers'
                        ? 'border-[#9945FF] text-[#9945FF]'
                        : 'border-transparent text-white/40 hover:text-white/60'
                    }`}
                  >
                    <span className="text-xl">💝</span>
                    <span>Fundraisers</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activeTab === 'fundraisers'
                        ? 'bg-[#9945FF]/20 text-[#9945FF]'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {fundraiserListings.length}
                    </span>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div>
                {/* Market Items Section */}
                {activeTab === 'market' && marketListings.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm">
            <table className="w-full">
              <thead className="border-b border-purple-900/30 bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                    Listing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase text-white/40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                        {marketListings.map((listing) => (
                  <tr key={listing._id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={listing.imageUrl}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                          <div className="font-medium text-white">
                            {listing.title}
                            </div>
                            {listing.type === 'fundraiser' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-900/40 px-2 py-0.5 text-xs font-medium text-purple-300">
                                💝
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/40">
                            {listing.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        ${listing.price.toFixed(2)} USDC
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#14F195]">
                        ${(listing.revenue || 0).toFixed(2)} USDC
                      </div>
                      <div className="text-xs text-white/40">
                        {listing.salesCount || 0} {listing.salesCount === 1 ? 'sale' : 'sales'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStateColor(listing.state, listing.approved)}`}>
                        {getStateText(listing.state, listing.approved)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white/50">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={listing.type === 'fundraiser' ? `/fundraisers/${listing._id}?from=my-listings` : `/listings/${listing._id}?from=my-listings`}
                          className="text-sm text-[#9945FF] hover:text-[#9945FF]/80 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => openEditModal(listing)}
                          className="text-sm text-[#14F195] hover:text-[#14F195]/80 transition-colors"
                        >
                          Edit
                        </button>
                        {listing.state === 'on_market' && listing.approved && (
                          <button
                            onClick={() => handleDeactivate(listing._id, listing.type)}
                            disabled={updatingId === listing._id}
                            className="text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors"
                          >
                            {updatingId === listing._id ? 'Updating...' : 'Deactivate'}
                          </button>
                        )}
                        {listing.state === 'pulled' && (
                          <button
                            onClick={() => handleReactivate(listing._id, listing.type)}
                            disabled={updatingId === listing._id}
                            className="text-sm text-[#14F195] hover:text-[#14F195]/80 disabled:opacity-50 transition-colors"
                          >
                            {updatingId === listing._id ? 'Updating...' : 'Reactivate'}
                          </button>
                        )}
                        <button
                        onClick={() => handleDelete(listing._id, listing.type)}
                          disabled={deletingId === listing._id}
                          className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === listing._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

                {activeTab === 'market' && marketListings.length === 0 && (
                  <div className="rounded-lg border border-purple-900/30 bg-white/5 p-12 text-center">
                    <div className="mb-4 text-5xl">🏪</div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      No market items yet
                    </h2>
                    <p className="text-white/50 mb-6">
                      Create your first market listing
                    </p>
                    <Link
                      href="/listings/new"
                      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                    >
                      Create Market Listing
                    </Link>
                  </div>
                )}

                {/* Fundraisers Section */}
                {activeTab === 'fundraisers' && fundraiserListings.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        💝 Fundraisers
                      </h2>
                      <span className="rounded-full bg-purple-900/40 px-3 py-1 text-sm font-medium text-purple-300">
                        {fundraiserListings.length}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm">
                    <table className="w-full">
                      <thead className="border-b border-purple-900/30 bg-white/5">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                            Fundraiser
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                            Donation Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                            Revenue
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase text-white/40">
                            Created
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-medium uppercase text-white/40">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-900/30">
                        {fundraiserListings.map((listing) => (
                          <tr key={listing._id} className="hover:bg-white/5">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                                  <Image
                                    src={listing.imageUrl}
                                    alt={listing.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-white">
                                    {listing.title}
                                  </div>
                                  <div className="text-sm text-white/40">
                                    {listing.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-white">
                                ${listing.price.toFixed(2)} USDC
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-[#14F195]">
                                ${(listing.revenue || 0).toFixed(2)} USDC
                              </div>
                              <div className="text-xs text-white/40">
                                {listing.salesCount || 0} {listing.salesCount === 1 ? 'donation' : 'donations'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStateColor(listing.state, listing.approved)}`}>
                                {getStateText(listing.state, listing.approved)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-white/50">
                                {new Date(listing.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  href={`/fundraisers/${listing._id}?from=my-listings`}
                                  className="text-sm text-[#9945FF] hover:text-[#9945FF]/80 transition-colors"
                                >
                                  View
                                </Link>
                                <button
                                  onClick={() => openEditModal(listing)}
                                  className="text-sm text-[#14F195] hover:text-[#14F195]/80 transition-colors"
                                >
                                  Edit
                                </button>
                                {listing.state === 'on_market' && listing.approved && (
                                  <button
                                    onClick={() => handleDeactivate(listing._id, listing.type)}
                                    disabled={updatingId === listing._id}
                                    className="text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors"
                                  >
                                    {updatingId === listing._id ? 'Updating...' : 'Deactivate'}
                                  </button>
                                )}
                                {listing.state === 'pulled' && (
                                  <button
                                    onClick={() => handleReactivate(listing._id, listing.type)}
                                    disabled={updatingId === listing._id}
                                    className="text-sm text-[#14F195] hover:text-[#14F195]/80 disabled:opacity-50 transition-colors"
                                  >
                                    {updatingId === listing._id ? 'Updating...' : 'Reactivate'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(listing._id, listing.type)}
                                  disabled={deletingId === listing._id}
                                  className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                                >
                                  {deletingId === listing._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {activeTab === 'fundraisers' && fundraiserListings.length === 0 && (
                  <div className="rounded-lg border border-purple-900/30 bg-white/5 p-12 text-center">
                    <div className="mb-4 text-5xl">💝</div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      No fundraisers yet
                    </h2>
                    <p className="text-white/50 mb-6">
                      Create your first fundraiser campaign
                    </p>
                    <Link
                      href="/listings/new"
                      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                    >
                      Create Fundraiser
                    </Link>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Edit Modal */}
        {editingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEditModal}>
            <div
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-purple-900/30 bg-[#0f0f14] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-purple-900/30 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    Edit Listing
                  </h2>
                  <button
                    onClick={closeEditModal}
                    className="rounded-lg p-2 hover:bg-white/5 transition-colors"
                  >
                    <svg className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-sm text-white/50">
                  Update your listing information. Changes will require admin approval if currently live.
                </p>
                <div className="mt-3 rounded-lg border border-purple-900/40 bg-purple-950/20 p-3">
                  <p className="text-xs text-purple-300">
                    <strong>Note:</strong> The delivery URL cannot be changed. Only title, description, price, category, image, and public URLs can be edited.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
                {/* Error Message */}
                {editError && (
                  <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                    <p className="text-sm text-red-400">⚠️ {editError}</p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                    maxLength={100}
                    required
                  />
                  <p className="mt-1 text-xs text-white/40">{editFormData.title.length}/100 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                    maxLength={2000}
                    required
                  />
                  <p className="mt-1 text-xs text-white/40">{editFormData.description.length}/2000 characters</p>
                </div>

                {/* Price & Category Row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Price */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Price (USDC) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-white focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                      required
                    >
                      {editingListing?.type === 'fundraiser' ? (
                        <>
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
                      ) : (
                        <>
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
                      )}
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
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
                        JPEG, PNG, or WebP. Max 5MB.
                      </p>
                      {uploadingImage && (
                        <p className="mt-2 text-sm text-[#14F195]">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional URLs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white/70">
                    Optional Resources
                  </h3>

                  <div>
                    <label className="mb-1 block text-sm text-white/50">
                      Demo Video URL
                    </label>
                    <input
                      type="url"
                      value={editFormData.demoVideoUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, demoVideoUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/50">
                      Whitepaper URL
                    </label>
                    <input
                      type="url"
                      value={editFormData.whitepaperUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, whitepaperUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/50">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={editFormData.githubUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full rounded-lg border border-purple-900/40 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#9945FF] focus:outline-none focus:ring-2 focus:ring-[#9945FF]/30"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-4 border-t border-purple-900/30 pt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-lg border border-purple-900/40 bg-white/5 px-6 py-2 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit || uploadingImage}
                    className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submittingEdit ? 'Updating...' : 'Update Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <ProtectedContent>
      <MyListingsPageContent />
    </ProtectedContent>
  );
}
