'use client';

import { useEffect, useState, useRef } from 'react';
import { AgentDecision } from '@/types/agent';

interface StreamStats {
  total: number;
  buy: number;
  ignore: number;
  uniqueAgents: number;
  uniqueItems: number;
}

export default function DecisionStream() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [newDecisionId, setNewDecisionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const decisionsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource('/api/decisions/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📡 Connected to decision stream');
      setStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'connected':
            console.log('✅', message.message);
            break;
            
          case 'stats':
            setStats(message.data);
            break;
            
          case 'decision':
            const decision = message.data as AgentDecision;
            console.log('🎯 New decision received:', decision);
            setDecisions(prev => [decision, ...prev].slice(0, 50)); // Keep last 50
            setNewDecisionId(decision.id);
            
            // Clear highlight after animation
            setTimeout(() => setNewDecisionId(null), 2000);
            
            // Update stats
            setStats(prev => prev ? {
              ...prev,
              total: prev.total + 1,
              buy: decision.decision === 'BUY' ? prev.buy + 1 : prev.buy,
              ignore: decision.decision === 'IGNORE' ? prev.ignore + 1 : prev.ignore,
            } : null);
            break;
            
          case 'heartbeat':
            console.log('💓 Heartbeat');
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('❌ Connection error');
      setStatus('disconnected');
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  // Auto-scroll to newest decision
  useEffect(() => {
    if (newDecisionId) {
      decisionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [newDecisionId]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '●';
      case 'connecting': return '○';
      case 'disconnected': return '✕';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-700 p-3 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${getStatusColor()}`}>{getStatusIcon()}</span>
            <span className="text-sm">
              {status === 'connected' && 'Live Stream Active'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'disconnected' && 'Disconnected'}
            </span>
          </div>
          {stats && (
            <div className="text-xs text-gray-400 flex gap-4">
              <span>Total: {stats.total}</span>
              <span className="text-green-400">Buy: {stats.buy}</span>
              <span className="text-red-400">Ignore: {stats.ignore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      {stats && (
        <div className="grid grid-cols-5 gap-2 p-3 bg-gray-900/50 border-b border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.buy}</div>
            <div className="text-xs text-gray-500">Buy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.ignore}</div>
            <div className="text-xs text-gray-500">Ignore</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.uniqueAgents}</div>
            <div className="text-xs text-gray-500">Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.uniqueItems}</div>
            <div className="text-xs text-gray-500">Items</div>
          </div>
        </div>
      )}

      {/* Decision Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div ref={decisionsEndRef} />
        {decisions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👀</div>
            <div>Waiting for decisions...</div>
            <div className="text-xs mt-2">Decisions will appear here in real-time</div>
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
                  <div className="text-green-400 font-bold">
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
                <div className="text-xs text-gray-500">
                  Agent: {decision.agentId.slice(0, 8)}...
                </div>
                {decision.reasoning && (
                  <div className="text-xs text-gray-400 mt-2 italic border-l-2 border-gray-700 pl-2">
                    {decision.reasoning.length > 150 
                      ? decision.reasoning.slice(0, 150) + '...' 
                      : decision.reasoning
                    }
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-2 bg-gray-900 text-xs text-gray-500 text-center">
        Real-time agent decision stream • Powered by SSE
      </div>
    </div>
  );
}
