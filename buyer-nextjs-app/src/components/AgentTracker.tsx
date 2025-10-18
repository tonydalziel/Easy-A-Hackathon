'use client';

import { useEffect, useState } from 'react';
import { Agent } from '@/types/agent';

interface AgentTrackerProps {
  agentId: string;
  onNotFound: () => void;
}

export default function AgentTracker({ agentId, onNotFound }: AgentTrackerProps) {
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData(agentId);
    // Poll for updates every 5 seconds
    const interval = setInterval(() => fetchAgentData(agentId), 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  const fetchAgentData = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAgentData(data.agent);
        setLoading(false);
      } else if (response.status === 404) {
        // Agent not found - notify parent to close window
        onNotFound();
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      setLoading(false);
    }
  };

  if (loading || !agentData) {
    return (
      <div className="text-white font-mono flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <div>Loading agent data...</div>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'text-green-400',
    inactive: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="text-white font-mono space-y-4">
      {/* Agent Header */}
      <div className="border-b border-gray-700 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm text-gray-400">Agent ID</h3>
            <div className="text-lg font-bold text-cyan-400">
              {agentData.id.slice(0, 20)}...
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm text-gray-400">Status</h3>
            <div className={`text-lg font-bold ${statusColors[agentData.status]}`}>
              {agentData.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Model</div>
          <div className="text-sm font-semibold text-purple-400">
            {agentData.model_id}
          </div>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Provider</div>
          <div className="text-sm font-semibold text-blue-400">
            {agentData.provider_id}
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-gray-900 rounded p-3">
        <div className="text-sm text-gray-400 mb-2">Wallet ID</div>
        <div className="text-xs font-mono text-green-400 break-all">
          {agentData.wallet_id}
        </div>
      </div>

      {/* Agent Prompt */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Agent Prompt</div>
        <div className="bg-gray-900 rounded p-3 text-sm leading-relaxed">
          {agentData.prompt}
        </div>
      </div>

      {/* Items Acquired */}
      <div>
        <div className="text-sm text-gray-400 mb-2">
          Items Acquired ({agentData.currentItemsAcquired.length})
        </div>
        <div className="space-y-2">
          {agentData.currentItemsAcquired.length > 0 ? (
            agentData.currentItemsAcquired.map((item, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded p-2 flex items-center gap-2 text-sm"
              >
                <span className="text-green-400">✓</span>
                <span className="text-white">{item}</span>
              </div>
            ))
          ) : (
            <div className="bg-gray-900 rounded p-3 text-sm text-gray-500 text-center">
              No items acquired yet
            </div>
          )}
        </div>
      </div>

      {/* Created At */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
        Created: {new Date(agentData.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
