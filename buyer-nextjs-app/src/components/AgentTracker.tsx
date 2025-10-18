'use client';

import { useEffect, useState } from 'react';

interface AgentTrackerProps {
  agentId: string;
  onNotFound: () => void;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  item: string;
  amount: number;
  timestamp: string;
}

interface AgentData {
  id: string;
  walletValue: number;
  status: 'active' | 'idle' | 'error';
  currentTask: string;
  recentTransactions: Transaction[];
}

export default function AgentTracker({ agentId, onNotFound }: AgentTrackerProps) {
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  useEffect(() => {
    fetchAgentData(agentId);
  }, [agentId]);

  const fetchAgentData = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAgentData(data);
      } else if (response.status === 404) {
        // Agent not found - notify parent to close window
        onNotFound();
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      onNotFound();
    }
  };

  if (!agentData) {
    return (
      <div className="text-white font-mono flex items-center justify-center h-full">
        Loading agent data...
      </div>
    );
  }

  const statusColors = {
    active: 'text-green-400',
    idle: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="text-white font-mono space-y-4">
      {/* Agent Header */}
      <div className="border-b border-gray-700 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm text-gray-400">Agent ID</h3>
            <div className="text-lg font-bold text-cyan-400">{agentData.id}</div>
          </div>
          <div className="text-right">
            <h3 className="text-sm text-gray-400">Status</h3>
            <div className={`text-lg font-bold ${statusColors[agentData.status]}`}>
              {agentData.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Value */}
      <div className="bg-gray-900 rounded p-3">
        <div className="text-sm text-gray-400 mb-1">Wallet Value</div>
        <div className="text-2xl font-bold text-green-400">
          ${agentData.walletValue.toFixed(2)}
        </div>
      </div>

      {/* Current Task */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Current Task</div>
        <div className="bg-gray-900 rounded p-3 text-sm">
          {agentData.currentTask}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Recent Activity</div>
        <div className="space-y-2">
          {agentData.recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-gray-900 rounded p-2 flex justify-between items-center text-sm"
            >
              <div className="flex items-center gap-2">
                <span className={tx.type === 'buy' ? 'text-blue-400' : 'text-orange-400'}>
                  {tx.type === 'buy' ? '↓ BUY' : '↑ SELL'}
                </span>
                <span className="text-white">{tx.item}</span>
              </div>
              <div className="text-right">
                <div className="text-green-400">${tx.amount.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{tx.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
