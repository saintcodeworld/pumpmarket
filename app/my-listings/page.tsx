'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /my-listings to /listings/my
 * This is the old route - redirecting to new standardized route
 */
export default function MyListingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new my listings page
    router.replace('/listings/my');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent mx-auto mb-4"></div>
        <p className="text-white/50">Redirecting to your listings...</p>
      </div>
    </div>
  );
}
