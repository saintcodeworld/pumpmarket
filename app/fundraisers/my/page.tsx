'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /fundraisers/my to /listings/my (for now)
 * TODO: Create dedicated fundraisers management page
 * For MVP, users can manage fundraisers through the same listings interface
 */
export default function MyFundraisersPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to listings management
    // In future, create dedicated fundraiser management
    router.replace('/listings/my');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent mx-auto mb-4"></div>
        <p className="text-white/50">Redirecting to your fundraisers...</p>
      </div>
    </div>
  );
}
