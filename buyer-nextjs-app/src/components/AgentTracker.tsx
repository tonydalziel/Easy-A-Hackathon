'use client';

import { useEffect, useState, useRef } from 'react';
import { Agent, AgentDecision } from '@/types/agent';

interface AgentTrackerProps {
  agentId: string;
  onNotFound: () => void;
}

export default function AgentTracker({ agentId, onNotFound }: AgentTrackerProps) {
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [newDecisionId, setNewDecisionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const decisionsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgentData(agentId);
    // Poll for updates every 5 seconds
    const interval = setInterval(() => fetchAgentData(agentId), 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Connect to decision stream
  useEffect(() => {
    const eventSource = new EventSource('/api/decisions/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[Stream] Agent tracker connected to decision stream');
      setStreamStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'decision') {
          const decision = message.data as AgentDecision;
          // Only add decisions for this specific agent
          if (decision.agentId === agentId) {
            console.log('[Decision] New decision for agent:', decision);
            setDecisions(prev => [decision, ...prev].slice(0, 20)); // Keep last 20
            setNewDecisionId(decision.id);
            
            // Clear highlight after animation
            setTimeout(() => setNewDecisionId(null), 2000);
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('❌ Stream connection error');
      setStreamStatus('disconnected');
    };

    return () => {
      eventSource.close();
    };
  }, [agentId]);

  // Auto-scroll to newest decision
  useEffect(() => {
    if (newDecisionId) {
      decisionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [newDecisionId]);

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

  const getStreamStatusColor = () => {
    switch (streamStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
    }
  };

  const getStreamStatusIcon = () => {
    switch (streamStatus) {
      case 'connected': return '●';
      case 'connecting': return '○';
      case 'disconnected': return '✕';
    }
  };

  const buyCount = decisions.filter(d => d.decision === 'BUY').length;
  const ignoreCount = decisions.filter(d => d.decision === 'IGNORE').length;

  return (
    <div className="text-white font-mono h-full flex flex-col">
      {/* Agent Header */}
      <div className="border-b border-gray-700 pb-3 px-4 pt-4">
        <div className="flex justify-between items-start mb-3">
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

        {/* Stream Status */}
        <div className="flex items-center justify-between text-xs bg-gray-900 rounded px-2 py-1">
          <div className="flex items-center gap-2">
            <span className={getStreamStatusColor()}>{getStreamStatusIcon()}</span>
            <span className="text-gray-400">
              {streamStatus === 'connected' && 'Live Stream'}
              {streamStatus === 'connecting' && 'Connecting...'}
              {streamStatus === 'disconnected' && 'Disconnected'}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-green-400">{buyCount} Buy</span>
            <span className="text-red-400">{ignoreCount} Ignore</span>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 space-y-4">
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
            <div className="text-xs font-mono text-green-400 break-all flex items-center justify-between gap-2">
              <span>{agentData.wallet_id}</span>
              <a
                href={`https://lora.algokit.io/localnet/account/${agentData.wallet_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-green-400 hover:text-green-300 transition-colors"
                title="View on Lora Explorer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
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

          {/* Live Decisions Section */}
          <div className="border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
              <span>Live Decisions ({decisions.length})</span>
              {streamStatus === 'connected' && (
                <span className="text-xs text-green-400">● Streaming</span>
              )}
            </div>
            
            <div className="space-y-2">
              <div ref={decisionsEndRef} />
              {decisions.length === 0 ? (
                <div className="bg-gray-900 rounded p-6 text-center text-gray-500">
                  <div className="text-2xl mb-2 text-gray-600">◉</div>
                  <div className="text-sm">Waiting for decisions...</div>
                  <div className="text-xs mt-1">Decisions will appear here in real-time</div>
                </div>
              ) : (
                decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className={`
                      border rounded-lg p-3 transition-all duration-500
                      ${decision.id === newDecisionId 
                        ? 'border-yellow-400 bg-yellow-400/10 scale-105 shadow-lg shadow-yellow-400/20' 
                        : 'border-gray-700 bg-gray-900/50 hover:bg-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-1 rounded text-xs font-bold
                          ${decision.decision === 'BUY' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }
                        `}>
                          {decision.decision}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(decision.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {decision.maxPrice && (
                        <div className="text-green-400 font-bold text-sm">
                          ${decision.maxPrice.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-400">Item:</span>{' '}
                        <span className="text-white font-semibold">{decision.itemName}</span>
                        <span className="text-gray-500 ml-2">(${decision.itemPrice})</span>
                      </div>
                      {decision.reasoning && (
                        <div className="text-xs text-gray-400 mt-2 italic border-l-2 border-gray-700 pl-2">
                          {decision.reasoning.length > 100 
                            ? decision.reasoning.slice(0, 100) + '...' 
                            : decision.reasoning
                          }
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Created At */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
            Created: {new Date(agentData.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
