'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';

interface Transaction {
  _id: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  txnHash: string;
  status: 'success' | 'failed';
  createdAt: string;
}

function SalesPageContent() {
  const { publicKey } = useWallet();
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      fetchSales();
    }
  }, [publicKey]);

  const fetchSales = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'sales',
        },
      });

      setSales(response.data.transactions || []);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.response?.data?.error || 'Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales
    .filter(s => s.status === 'success')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-[#0f0f14] py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Sales History
          </h1>
          <p className="text-lg text-white/50">
            Track your sales and revenue
          </p>
        </div>

        {/* Stats */}
        {!loading && sales.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
              <p className="text-sm text-white/50 mb-2">Total Sales</p>
              <p className="text-3xl font-bold text-white">
                {sales.filter(s => s.status === 'success').length}
              </p>
            </div>

            <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
              <p className="text-sm text-white/50 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-[#14F195]">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm p-6">
              <p className="text-sm text-white/50 mb-2">Avg Sale</p>
              <p className="text-3xl font-bold text-purple-400">
                ${sales.length > 0 ? (totalRevenue / sales.filter(s => s.status === 'success').length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9945FF] border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
            <p className="text-sm text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* No Sales */}
        {!loading && !error && sales.length === 0 && (
          <div className="rounded-lg border border-purple-900/30 bg-white/5 p-12 text-center">
            <p className="text-lg text-white/50 mb-4">
              No sales yet
            </p>
            <p className="text-sm text-white/40 mb-6">
              Create a listing to start selling
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            >
              Create Listing
            </Link>
          </div>
        )}

        {/* Sales Table */}
        {!loading && !error && sales.length > 0 && (
          <div className="rounded-lg border border-purple-900/30 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-white">
                            {sale.listingTitle}
                          </p>
                          <p className="text-xs text-white/40">
                            {sale.listingCategory}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white/50">
                        {sale.buyerWallet.slice(0, 4)}...{sale.buyerWallet.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#14F195]">
                        ${sale.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.status === 'success' ? (
                          <span className="inline-flex items-center rounded-full bg-[#14F195]/10 px-2.5 py-0.5 text-xs font-medium text-[#14F195]">
                            ✓ Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-950/30 px-2.5 py-0.5 text-xs font-medium text-red-400">
                            ✗ Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`https://solscan.io/tx/${sale.txnHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#9945FF] hover:text-[#9945FF]/80 font-mono transition-colors"
                        >
                          <span>{sale.txnHash.slice(0, 8)}...</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <ProtectedContent>
      <SalesPageContent />
    </ProtectedContent>
  );
}
