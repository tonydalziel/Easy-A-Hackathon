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

interface TypewriterDecision extends AgentDecision {
  fullText: string;
  displayedChars: number;
  isComplete: boolean;
}

// Format decision outside component to avoid recreating on every render
const formatDecisionAsTerminal = (decision: AgentDecision): string => {
  const timestamp = new Date(decision.timestamp).toLocaleTimeString();
  const lines: string[] = [];
  
  lines.push(`[${timestamp}] ━━━ NEW DECISION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push('');
  
  // Item name and description first
  lines.push(`ITEM: ${decision.itemName}`);
  
  // Reasoning prominently displayed
  if (decision.reasoning) {
    lines.push('');
    lines.push('REASONING:');
    // Split reasoning into wrapped lines
    const words = decision.reasoning.split(' ');
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + word).length > 75) {
        lines.push('  ' + currentLine);
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    if (currentLine.trim().length > 0) {
      lines.push('  ' + currentLine.trim());
    }
  }
  
  lines.push('');
  
  // Decision and metadata
  lines.push(`STATUS: ${decision.decision}`);
  lines.push(`PRICE: ${decision.itemPrice} ALGO${decision.maxPrice ? ` | MAX: ${decision.maxPrice} ALGO` : ''}`);
  lines.push(`AGENT: ${decision.agentId.slice(0, 24)}...`);
  
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('');
  
  return lines.join('\n');
};

export default function DecisionStream() {
  const [decisions, setDecisions] = useState<TypewriterDecision[]>([]);
  const [decisionQueue, setDecisionQueue] = useState<AgentDecision[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);
  const decisionsEndRef = useRef<HTMLDivElement>(null);

  // Process queue - add next decision when current is complete
  useEffect(() => {
    // Only process queue if the most recent decision is complete (or no decisions yet)
    const canProcessNext = decisions.length === 0 || decisions[0].isComplete;
    
    if (canProcessNext && decisionQueue.length > 0) {
      const [nextDecision, ...remainingQueue] = decisionQueue;
      
      // Convert to typewriter decision
      const fullText = formatDecisionAsTerminal(nextDecision);
      const typewriterDecision: TypewriterDecision = {
        ...nextDecision,
        fullText: fullText,
        displayedChars: 0,
        isComplete: false
      };
      
      setDecisions(prev => [typewriterDecision, ...prev].slice(0, 30)); // Keep last 30
      setDecisionQueue(remainingQueue);
    }
  }, [decisions, decisionQueue]);

  // Character-by-character typewriter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDecisions(prev => {
        let updated = false;
        const newDecisions = prev.map((decision, index) => {
          // Only type the first (most recent) decision
          if (index > 0) {
            return decision; // Keep older decisions as-is
          }
          
          if (!decision.isComplete && decision.displayedChars < decision.fullText.length) {
            updated = true;
            // Type 2 characters at a time for nice pacing
            const charsToAdd = Math.min(2, decision.fullText.length - decision.displayedChars);
            return {
              ...decision,
              displayedChars: decision.displayedChars + charsToAdd,
              isComplete: decision.displayedChars + charsToAdd >= decision.fullText.length
            };
          }
          return decision;
        });
        return updated ? newDecisions : prev;
      });
    }, 30); // Slowed to 30ms intervals for better readability

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource('/api/decisions/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[Stream] Connected to decision stream');
      setStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'connected':
            console.log('[Stream]', message.message);
            break;
            
          case 'stats':
            setStats(message.data);
            break;
            
          case 'decision':
            const decision = message.data as AgentDecision;
            console.log('[Decision] New decision received:', decision);
            
            // Add to queue instead of directly to decisions
            setDecisionQueue(prev => [...prev, decision]);
            
            // Update stats
            setStats(prev => prev ? {
              ...prev,
              total: prev.total + 1,
              buy: decision.decision === 'BUY' ? prev.buy + 1 : prev.buy,
              ignore: decision.decision === 'IGNORE' ? prev.ignore + 1 : prev.ignore,
            } : null);
            break;
            
          case 'heartbeat':
            console.log('[Stream] Heartbeat');
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
    if (decisions.length > 0 && decisions[0].displayedChars > 0) {
      decisionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [decisions]);

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

  const renderLine = (line: string, decision: TypewriterDecision) => {
    // Empty lines
    if (line.trim() === '') {
      return <span>&nbsp;</span>;
    }
    
    // Header line with timestamp
    if (line.includes('NEW DECISION')) {
      return <span className="text-cyan-400 font-bold">{line}</span>;
    }
    
    // Separator line
    if (line.match(/^─+$/)) {
      return <span className="text-cyan-500/40">{line}</span>;
    }
    
    let remaining = line;
    
    // ITEM: label
    if (remaining.startsWith('ITEM:')) {
      const itemName = remaining.replace('ITEM:', '').trim();
      return (
        <>
          <span className="text-cyan-400 font-bold">ITEM:</span>
          <span className="text-white text-lg font-semibold ml-2">{itemName}</span>
        </>
      );
    }
    
    // REASONING: label
    if (remaining.startsWith('REASONING:')) {
      return <span className="text-purple-400 font-bold">REASONING:</span>;
    }
    
    // Reasoning content (indented)
    if (remaining.startsWith('  ') && !remaining.includes(':')) {
      return <span className="text-gray-300">{remaining}</span>;
    }
    
    // STATUS: line
    if (remaining.includes('STATUS:')) {
      if (remaining.includes('BUY')) {
        const [before, ...after] = remaining.split('BUY');
        return (
          <>
            <span className="text-cyan-400 font-bold">{before}</span>
            <span className="text-green-400 font-bold bg-green-500/20 px-2 py-0.5 rounded">BUY</span>
            <span className="text-gray-300">{after.join('BUY')}</span>
          </>
        );
      } else if (remaining.includes('IGNORE')) {
        const [before, ...after] = remaining.split('IGNORE');
        return (
          <>
            <span className="text-cyan-400 font-bold">{before}</span>
            <span className="text-red-400 font-bold bg-red-500/20 px-2 py-0.5 rounded">IGNORE</span>
            <span className="text-gray-300">{after.join('IGNORE')}</span>
          </>
        );
      }
    }
    
    // PRICE: line with dollar amounts
    if (remaining.includes('PRICE:') || remaining.includes('$')) {
      const priceRegex = /(\$[\d.]+)/g;
      const parts = remaining.split(priceRegex);
      return (
        <>
          {parts.map((part, i) => 
            part.startsWith('$') ? (
              <span key={i} className="text-green-400 font-bold">{part}</span>
            ) : part.includes('PRICE:') || part.includes('MAX:') ? (
              <span key={i} className="text-cyan-400 font-bold">{part}</span>
            ) : (
              <span key={i} className="text-gray-300">{part}</span>
            )
          )}
        </>
      );
    }
    
    // AGENT: line
    if (remaining.includes('AGENT:')) {
      const [label, value] = remaining.split('AGENT:');
      return (
        <>
          <span className="text-cyan-400 font-bold">AGENT:</span>
          <span className="text-gray-400 text-sm ml-1">{value}</span>
        </>
      );
    }
    
    // Default - readable white/gray
    return <span className="text-gray-300">{remaining}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono overflow-hidden">
      {/* Terminal Header */}
      <div className="border-b border-green-500/30 p-3 bg-gray-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${getStatusColor()} animate-pulse`}>{getStatusIcon()}</span>
          <span className="text-sm text-green-400">
            {status === 'connected' && '> LIVE DECISION STREAM ACTIVE'}
            {status === 'connecting' && '> CONNECTING TO STREAM...'}
            {status === 'disconnected' && '> STREAM DISCONNECTED'}
          </span>
        </div>
        {stats && (
          <div className="text-xs text-gray-500 flex gap-4 font-mono">
            <span className="text-green-400">BUY:{stats.buy}</span>
            <span className="text-red-400">IGN:{stats.ignore}</span>
            <span className="text-gray-400">TOT:{stats.total}</span>
          </div>
        )}
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0 leading-relaxed bg-black" style={{ lineHeight: '1.6' }}>
        <div ref={decisionsEndRef} />
        {decisions.length === 0 ? (
          <div className="text-green-500/50 animate-pulse">
            <div>&gt; Awaiting agent decisions...</div>
            <div className="mt-2">&gt; Stream initialized. Ready to receive.</div>
            <div className="mt-1">&gt; <span className="animate-pulse">_</span></div>
          </div>
        ) : (
          <>
            {decisions.map((decision) => {
              const displayText = decision.fullText.substring(0, decision.displayedChars);
              const lines = displayText.split('\n');
              
              return (
                <div key={decision.id} className="mb-2">
                  {lines.map((line, lineIndex) => (
                    <div key={`${decision.id}-${lineIndex}`} className="transition-opacity duration-50">
                      {renderLine(line, decision)}
                      {lineIndex === lines.length - 1 && !decision.isComplete && (
                        <span className="text-green-400 animate-pulse ml-1">▊</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            {decisions[0] && !decisions[0].isComplete && (
              <div className="text-green-400/50 animate-pulse mt-1">&gt; _</div>
            )}
          </>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="border-t border-green-500/30 p-2 bg-gray-950 text-xs text-green-500/70 flex items-center justify-between">
        <span>&gt; /stream/decisions [LIVE]</span>
        <div className="flex items-center gap-4">
          {decisionQueue.length > 0 && (
            <span className="text-yellow-400 animate-pulse">
              {decisionQueue.length} queued
            </span>
          )}
          <span className="text-gray-600">SSE Protocol • Agent Oracle Network</span>
        </div>
      </div>
    </div>
  );
}