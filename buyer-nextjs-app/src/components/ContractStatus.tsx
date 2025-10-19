/**
 * CONTRACT STATUS COMPONENT
 * 
 * Displays Algorand smart contract deployment information
 * 
 * Features:
 * - Shows contract initialization status
 * - Displays App ID and App Address
 * - Links to Algorand explorer
 * - Real-time status updates
 */

'use client';

import { useEffect, useState } from 'react';

interface ContractInfo {
  initialized: boolean;
  appId?: number;
  appAddress?: string;
  appName?: string;
}

export default function ContractStatus() {
  const [contractInfo, setContractInfo] = useState<ContractInfo>({
    initialized: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContractInfo();
    const interval = setInterval(fetchContractInfo, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchContractInfo = async () => {
    try {
      const res = await fetch('http://localhost:3000/agents/contract');
      if (res.ok) {
        const data = await res.json();
        setContractInfo(data);
        setError(null);
      } else {
        setError('Failed to fetch contract info');
      }
    } catch (err) {
      console.error('Failed to fetch contract info:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">Smart Contract Status</h2>
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4">Smart Contract Status</h2>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">Smart Contract Status</h2>
      
      <div className="space-y-4">
        {/* Initialization Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`font-mono font-semibold ${contractInfo.initialized ? 'text-green-400' : 'text-yellow-400'}`}>
            {contractInfo.initialized ? '● INITIALIZED' : '○ NOT INITIALIZED'}
          </span>
        </div>

        {contractInfo.initialized && contractInfo.appId && (
          <>
            {/* App Name */}
            {contractInfo.appName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Contract:</span>
                <span className="text-cyan-300 font-mono">{contractInfo.appName}</span>
              </div>
            )}

            {/* App ID */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400">App ID:</span>
              <span className="text-cyan-300 font-mono">{contractInfo.appId}</span>
            </div>

            {/* App Address */}
            {contractInfo.appAddress && (
              <div className="flex flex-col space-y-2">
                <span className="text-gray-400">App Address:</span>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <code className="text-xs text-cyan-300 break-all font-mono">
                    {contractInfo.appAddress}
                  </code>
                </div>
              </div>
            )}

            {/* Explorer Link */}
            <div className="pt-2 border-t border-gray-700">
              <a
                href={`https://testnet.explorer.perawallet.app/application/${contractInfo.appId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline text-sm flex items-center gap-2"
              >
                <span>View on Algorand Explorer</span>
                <span className="text-xs">↗</span>
              </a>
            </div>
          </>
        )}

        {!contractInfo.initialized && (
          <div className="text-gray-500 text-sm italic mt-4">
            Contract not yet deployed. It will be initialized on first listing creation.
          </div>
        )}
      </div>
    </div>
  );
}
