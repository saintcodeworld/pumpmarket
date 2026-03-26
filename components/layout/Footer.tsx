'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-purple-900/30 bg-[#0f0f14]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center space-x-2 sm:space-x-6 py-2 sm:py-3 px-2 sm:px-4">
        {/* FAQ Button */}
        <Link
          href="/faq"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
          title="Frequently Asked Questions"
        >
          <span className="text-lg sm:text-xl">❓</span>
          <span className="hidden sm:inline">FAQ</span>
        </Link>

        {/* Updates Button */}
        <Link
          href="/updates"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
          title="Platform Updates"
        >
          <span className="text-lg sm:text-xl">📋</span>
          <span className="hidden sm:inline">Updates</span>
        </Link>

        {/* Whitepaper Link */}
        <a
          href="https://pumpmarketwp.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
          title="Read Whitepaper"
        >
          <span className="text-lg sm:text-xl">📄</span>
          <span className="hidden sm:inline">Whitepaper</span>
        </a>

        {/* Dex paid at bond */}
        <span className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-4 py-2 text-sm font-medium text-white/50">
          <span>Dex paid at bond</span>
        </span>

      </div>
    </footer>
  );
}
