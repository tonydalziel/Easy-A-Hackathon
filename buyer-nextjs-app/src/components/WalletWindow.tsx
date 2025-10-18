'use client';

import { useEffect, useState } from 'react';

interface WalletData {
  date: string;
  value: number;
}

export default function WalletWindow() {
  const [walletHistory, setWalletHistory] = useState<WalletData[]>([]);
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
<<<<<<< HEAD
      const walletId = process.env.NEXT_PUBLIC_USER_WALLET_ID || 'user-wallet';
=======
      // For user wallet, we need a wallet ID
      // This should be configured or passed in
      const walletId = 'QUEXXCUSEWQJHE3BPC77VP6F46IAJBPJIZNVUU7EIWPX7EQ2W2CA'; // TODO: Get actual user wallet ID
>>>>>>> c7ff951 (test)

      const response = await fetch(`/api/wallet?id=${walletId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentValue(data.currentValue || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const maxValue = Math.max(...walletHistory.map(d => d.value));
  const minValue = Math.min(...walletHistory.map(d => d.value));
  const valueChange = walletHistory.length > 1
    ? ((walletHistory[walletHistory.length - 1].value - walletHistory[0].value) / walletHistory[0].value) * 100
    : 0;

  return (
    <div className="text-white font-mono">
      <div className="mb-6">
        <div className="text-gray-400 text-sm mb-1">Total Balance</div>
        <div className="text-3xl font-bold text-green-400">${currentValue.toFixed(2)}</div>
        <div className={`text-sm mt-1 ${valueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {valueChange >= 0 ? '↑' : '↓'} {Math.abs(valueChange).toFixed(2)}% (7 days)
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="text-gray-400 text-sm mb-3">Value Over Time</div>
        <div className="relative h-32 flex items-end space-x-2">
          {walletHistory.map((data, index) => {
            const heightPercent = ((data.value - minValue) / (maxValue - minValue)) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-green-500 hover:bg-green-400 transition-colors rounded-t"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${data.value}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{walletHistory[0]?.date}</span>
          <span>{walletHistory[walletHistory.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
