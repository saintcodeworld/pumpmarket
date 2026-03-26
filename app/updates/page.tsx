'use client';

import Link from 'next/link';
import { Updates } from '@/components/home/Updates';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-[#0f0f14] py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-white/50 hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>

        <Updates />
      </div>
    </div>
  );
}
