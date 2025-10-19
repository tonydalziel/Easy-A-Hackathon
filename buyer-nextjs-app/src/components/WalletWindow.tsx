'use client';

import { useEffect, useState } from 'react';

interface WalletData {
  date: string;
  value: number;
}

interface WalletWindowProps {
  address: string;
  balance: number;
}

export default function WalletWindow({ address, balance }: WalletWindowProps) {
  const [walletHistory, setWalletHistory] = useState<WalletData[]>([]);
  const [currentValue, setCurrentValue] = useState(balance);

  // Update current value when balance prop changes
  useEffect(() => {
    setCurrentValue(balance);
  }, [balance]);

  useEffect(() => {
    fetchWalletData();
  }, [address]);

  const fetchWalletData = async () => {
    try {
<<<<<<< HEAD
      if (!address || address === 'DLGQ6LNZXWXE2BH34CEI3DRKYAXPFVPOOW6C3XKH7BU4DOIW7V7TAIMFDM') {
        console.log('No valid wallet address configured');
=======
      if (!address) {
        // No address provided, let the API use the authenticated user's wallet
        console.log('No address provided, using authenticated user wallet');
        const response = await fetch(`/api/wallet`);
        if (response.ok) {
          const data = await response.json();
          setCurrentValue(data.currentValue || 0);
        } else {
          console.error('Failed to fetch wallet data');
        }
        return;
      }

      if (address === 'REPLACE_WITH_YOUR_WALLET_ADDRESS') {
        console.log('Placeholder wallet address detected');
>>>>>>> 8d746e449476035afea3cbc844066f23c22cc44d
        return;
      }

      const response = await fetch(`/api/wallet?id=${address}`);
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
        <div className="text-gray-400 text-sm mb-2">Wallet Address</div>
        <div className="text-xs text-cyan-400 bg-gray-800/50 p-2 rounded mb-4 break-all flex items-center justify-between gap-2">
          <span>{address}</span>
          <a
            href={`https://lora.algokit.io/localnet/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors"
            title="View on Lora Explorer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <div className="text-gray-400 text-sm mb-1">Total Balance</div>
        <div className="text-3xl font-bold text-green-400">
          {(currentValue / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          })} ALGO
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentValue.toLocaleString()} microALGO
        </div>
        {walletHistory.length > 1 && (
          <div className={`text-sm mt-1 ${valueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {valueChange >= 0 ? '↑' : '↓'} {Math.abs(valueChange).toFixed(2)}% (7 days)
          </div>
        )}
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
