'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /sell to /listings/new
 * This is the old route - redirecting to new standardized route
 */
export default function SellPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new listing creation page
    router.replace('/listings/new');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent mx-auto mb-4"></div>
        <p className="text-white/50">Redirecting to create listing...</p>
      </div>
    </div>
  );
}
