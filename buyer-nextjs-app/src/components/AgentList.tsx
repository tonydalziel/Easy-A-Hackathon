'use client';

import { useEffect, useState } from 'react';
import { Agent } from '@/types/agent';

interface AgentListProps {
  onOpenLora?: (walletId: string) => void;
}

export default function AgentList({ onOpenLora }: AgentListProps = {}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAllAgents();
  }, []);

  // Fetch wallet balances for all agents every second
  useEffect(() => {
    const fetchWalletBalances = async () => {
      if (agents.length === 0) return;

      const balances: Record<string, number> = {};

      await Promise.all(
        agents.map(async (agent) => {
          try {
            const response = await fetch(`/api/wallet?id=${agent.wallet_id}`);
            if (response.ok) {
              const data = await response.json();
              balances[agent.wallet_id] = data.currentValue || 0;
            }
          } catch (error) {
            console.error(`Failed to fetch wallet balance for ${agent.wallet_id}:`, error);
          }
        })
      );

      setWalletBalances(balances);
    };

    // Fetch immediately
    fetchWalletBalances();

    // Set up 1-second interval
    const interval = setInterval(fetchWalletBalances, 1000);
    return () => clearInterval(interval);
  }, [agents]);

  const fetchAllAgents = async () => {
    try {
      setIsRefreshing(true);
      // Get list of agent IDs
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);

        // Handle different response formats
        let agents: Agent[] = [];
		console.log(Array.isArray(data['agents']));
        if (Array.isArray(data['agents'])) {
          agents = data['agents'];
        } else {
          console.error('Unexpected API response format:', data);
          return;
        }

        if (agents.length === 0) {
          setAgents([]);
          return;
        }

        // Filter out any failed fetches
        const validAgents = agents.filter((agent): agent is Agent => agent !== null);

		console.log('Fetched agents:', validAgents);
        setAgents(validAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'inactive':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return '●';
      case 'inactive':
        return '○';
      case 'error':
        return '✕';
      default:
        return '?';
    }
  };

  return (
    <div className="text-white font-mono">
      <div className="mb-3 flex justify-between items-center">
        <h2 className="text-lg font-bold text-cyan-400">All Agents ({agents.length})</h2>
        <button
          onClick={fetchAllAgents}
          disabled={isRefreshing}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            transition-all duration-200 border
            ${isRefreshing
              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 border-cyan-500/50 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20'
            }
          `}
          title="Refresh agent list"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Status</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Agent ID</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Prompt</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Wallet ID</th>
              <th className="text-right py-2 px-2 text-gray-400 font-semibold">Balance</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Items</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const balance = walletBalances[agent.wallet_id] || 0;
              return (
                <tr key={agent.id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                  <td className="py-2 px-2">
                    <span className={`${getStatusColor(agent.status)} flex items-center gap-1`}>
                      <span>{getStatusIcon(agent.status)}</span>
                      <span className="text-xs">{agent.status}</span>
                    </span>
                  </td>
                  <td className="py-2 px-2 text-cyan-400 font-semibold text-xs">
                    {agent.id.slice(0, 12)}...
                  </td>
                  <td className="py-2 px-2 text-gray-300 max-w-[200px] truncate text-xs">
                    {agent.prompt}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-green-400">
                      <span className="truncate max-w-[150px]">
                        {agent.wallet_id}
                      </span>
                      <button
                        onClick={() => onOpenLora?.(agent.wallet_id)}
                        className="flex-shrink-0 text-green-400 hover:text-green-300 transition-colors"
                        title="View on Lora Explorer"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <div className="text-green-400 font-semibold text-xs">
                      {(balance / 1000000).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6
                      })} ALGO
                    </div>
                    <div className="text-gray-500 text-xs">
                      {balance.toLocaleString()} μALGO
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {agent.currentItemsAcquired.slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400"
                        >
                          {item}
                        </span>
                      ))}
                      {agent.currentItemsAcquired.length > 2 && (
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-500">
                          +{agent.currentItemsAcquired.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
