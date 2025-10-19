'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  status: 'active' | 'idle' | 'error';
  task: string;
  walletValue: number;
  itemsPurchased: string[];
}

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetchAllAgents();
  }, []);

  const fetchAllAgents = async () => {
    try {
      // Get list of agent IDs
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);

        // Handle different response formats
        let agentIds: string[] = [];
        if (Array.isArray(data)) {
          agentIds = data;
        } else if (data.agents && Array.isArray(data.agents)) {
          agentIds = data.agents;
        } else if (data.agentIds && Array.isArray(data.agentIds)) {
          agentIds = data.agentIds;
        } else {
          console.error('Unexpected API response format:', data);
          return;
        }

        if (agentIds.length === 0) {
          setAgents([]);
          return;
        }

        // Fetch details for each agent
        const agentDetails = await Promise.all(
          agentIds.map(async (id) => {
            try {
              const detailsResponse = await fetch(`/api/agents/${id}`);
              if (detailsResponse.ok) {
                return await detailsResponse.json();
              }
            } catch (err) {
              console.error(`Failed to fetch agent ${id}:`, err);
            }
            return null;
          })
        );

        // Filter out any failed fetches
        const validAgents = agentDetails.filter((agent): agent is Agent => agent !== null);
        setAgents(validAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'idle':
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
      case 'idle':
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
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Status</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Agent ID</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Task</th>
              <th className="text-right py-2 px-2 text-gray-400 font-semibold">Wallet</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Items</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                <td className="py-2 px-2">
                  <span className={`${getStatusColor(agent.status)} flex items-center gap-1`}>
                    <span>{getStatusIcon(agent.status)}</span>
                    <span className="text-xs">{agent.status}</span>
                  </span>
                </td>
                <td className="py-2 px-2 text-cyan-400 font-semibold">{agent.id}</td>
                <td className="py-2 px-2 text-gray-300 max-w-[200px] truncate">
                  {agent.task}
                </td>
                <td className="py-2 px-2 text-right text-green-400 font-semibold">
                  ${agent.walletValue.toFixed(2)}
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap gap-1">
                    {agent.itemsPurchased.slice(0, 2).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400"
                      >
                        {item}
                      </span>
                    ))}
                    {agent.itemsPurchased.length > 2 && (
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-500">
                        +{agent.itemsPurchased.length - 2}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
