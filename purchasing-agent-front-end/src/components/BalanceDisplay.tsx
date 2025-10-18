'use client';

import { UserBalance } from '@/types';

interface BalanceDisplayProps {
  balance: UserBalance;
}

export default function BalanceDisplay({ balance }: BalanceDisplayProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white shadow-lg">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-semibold text-sm">
        {balance.amount.toFixed(2)} {balance.currency}
      </span>
    </div>
  );
}
