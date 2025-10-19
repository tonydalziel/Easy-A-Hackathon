/**
 * AGENTIC PROCUREMENT SYSTEM - MAIN INTERFACE
 *
 * A modern, terminal-inspired interface for AI-powered procurement and selling.
 *
 * Features:
 * - Command-line interface with intelligent autocomplete
 * - Real-time agent monitoring and decision streaming
 * - Multi-window workspace management
 * - Live transaction tracking and analytics
 *
 * Architecture:
 * - Command routing to appropriate handlers
 * - Dynamic window management with focus/z-index control
 * - Real-time updates via Server-Sent Events (SSE)
 * - Responsive glassmorphism UI with smooth animations
 *
 * Commands:
 * - help: Display command reference
 * - create <prompt>: Create new AI agent
 * - track <id>: Monitor specific agent
 * - list: View all agents
 * - watch: Live decision stream
 * - wallet: Check balance
 * - events: Transaction history
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import Window from '@/components/Window';
import HelpWindow from '@/components/HelpWindow';
import WalletWindow from '@/components/WalletWindow';
import AgentTracker from '@/components/AgentTracker';
import AgentList from '@/components/AgentList';
import EventHistory from '@/components/EventHistory';
import DecisionStream from '@/components/DecisionStream';
import Dashboard from '@/components/Dashboard';
import ItemRegistration from '@/components/ItemRegistration';
import { WindowData } from '@/types/window';

export default function Home() {
  // Hardcoded wallet address - replace with your actual Algorand wallet address
  const HARDCODED_WALLET_ADDRESS = process.env.NEXT_PUBLIC_USER_WALLET_ID || 'VQKN6Y336A26P4EUGNLKW2KO7WF5K7OO3DODUCSSYFCXF35JBSJ6EHMSMU';

  const [command, setCommand] = useState('');
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parameterHint, setParameterHint] = useState('');
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; prompt: string; status: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [systemStats, setSystemStats] = useState({
    activeAgents: 0,
    totalDecisions: 0,
    successRate: 0,
  });

  // Wallet state management
  const [walletAddress] = useState(HARDCODED_WALLET_ADDRESS);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const commands = ['-h', 'wallet', 'watch', 'track', 'list', 'events', 'create', 'dashboard'];

  const commandInfo: Record<string, { params?: string; description: string; icon?: string }> = {
    '-h': { description: 'Display help window', icon: '?' },
    'wallet': { description: 'Show your total wallet value', icon: '$' },
    'watch': { description: 'Watch live agent decision stream in real-time', icon: '◉' },
    'track': { params: '<agent-id>', description: 'Track a specific agent\'s activity', icon: '→' },
    'list': { description: 'List all agents with their status', icon: '≡' },
    'events': { description: 'Show all on-chain events', icon: '⋯' },
    'create': { params: '<prompt>', description: 'Create a new agent with the specified prompt', icon: '+' },
    'dashboard': { description: 'Open system dashboard with analytics', icon: '▣' },
  };

  useEffect(() => {
    createWindow('help', 'Help - Available Commands');

    // Fetch system stats periodically
    const fetchStats = async () => {
      try {
        // Fetch agent count
        const agentsRes = await fetch('/api/agents');
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          const agents = agentsData.agents || [];
          const activeCount = agents.filter((a: any) => a.status === 'active').length || 0;

          // Store agents for autocomplete
          setAvailableAgents(agents.map((a: any) => ({
            id: a.id,
            prompt: a.prompt,
            status: a.status
          })));

          // Fetch decision stats
          const decisionsRes = await fetch('/api/decisions');
          if (decisionsRes.ok) {
            const decisionsData = await decisionsRes.json();
            const totalDecisions = decisionsData.decisions?.length || 0;
            const buyCount = decisionsData.decisions?.filter((d: any) => d.decision === 'BUY').length || 0;
            const successRate = totalDecisions > 0 ? Math.round((buyCount / totalDecisions) * 100) : 0;

            setSystemStats({
              activeAgents: activeCount,
              totalDecisions,
              successRate,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch wallet balance periodically
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await fetch(`/api/wallet?id=${walletAddress}`);
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.currentValue || 0);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };

    // Only fetch if we have a valid wallet address
    if (walletAddress && walletAddress !== 'REPLACE_WITH_YOUR_WALLET_ADDRESS') {
      fetchWalletBalance();
      const interval = setInterval(fetchWalletBalance, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  // Autocomplete logic
  useEffect(() => {
    // Reset selection when command changes
    setSelectedIndex(-1);

    if (!command) {
      setSuggestion('');
      setParameterHint('');
      setShowSuggestions(false);
      return;
    }

    const input = command.toLowerCase();
    const parts = input.split(/\s+/);
    const cmd = parts[0];

    // Find matching command
    const match = commands.find(c => c.startsWith(cmd) && c !== cmd);
    if (match && parts.length === 1) {
      setSuggestion(match.slice(cmd.length));
    } else {
      setSuggestion('');
    }

    // Show parameter hint for commands that need parameters
    if (commands.includes(cmd) && parts.length === 1) {
      const info = commandInfo[cmd];
      if (info?.params) {
        setParameterHint(`${cmd} ${info.params} - ${info.description}`);
      } else {
        setParameterHint('');
      }
    } else {
      setParameterHint('');
    }

    // Auto-show suggestions for track command
    if (cmd === 'track' && parts.length === 1) {
      setShowSuggestions(true);
    }
  }, [command]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const parts = command.toLowerCase().split(/\s+/);
    const cmd = parts[0];

    // Get current suggestions list
    let suggestions: any[] = [];
    if (cmd === 'track' && parts.length === 1 && showSuggestions) {
      suggestions = availableAgents;
    } else if (showSuggestions) {
      suggestions = commands.filter(c => c.toLowerCase().startsWith(command.toLowerCase()));
    }

    // Arrow Down - Navigate down through suggestions
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }

    // Arrow Up - Navigate up through suggestions
    if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
      return;
    }

    // Enter - Select highlighted suggestion
    if (e.key === 'Enter' && selectedIndex >= 0 && suggestions.length > 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];

      if (cmd === 'track' && parts.length === 1) {
        // Agent selection
        setCommand(`track ${selected.id}`);
      } else {
        // Command selection
        setCommand(selected + ' ');
      }

      setSelectedIndex(-1);
      setShowSuggestions(false);
      return;
    }

    // Tab or Right Arrow to accept suggestion
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      setCommand(command + suggestion);
      setSuggestion('');
    }
  };

  const highlightCommand = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(\s+)/);
    const cmd = parts[0].toLowerCase();

    return (
      <span>
        <span className={commands.includes(cmd) ? 'text-green-400' : 'text-red-400'}>
          {parts[0]}
        </span>
        {parts.slice(1).map((part, i) => (
          <span key={i} className="text-white">{part}</span>
        ))}
      </span>
    );
  };

  const handleCommand = async (e: FormEvent) => {
    e.preventDefault();
    const input = command.trim();

    if (!input) return;

    setError('');

    // Parse command and parameters
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const params = parts.slice(1);

    if (cmd === '-h') {
      createWindow('help', 'Help - Available Commands');
    } else if (cmd === 'wallet') {
      createWindow('wallet', 'Wallet Overview');
    } else if (cmd === 'watch') {
      createWindow('decision-stream', 'Live Decision Stream');
    } else if (cmd === 'track') {
      if (params.length === 0) {
        setError('Error: track command requires an agent ID. Usage: track <agent-id>');
      } else {
        const agentId = params[0];
        createWindow('agent-tracker', `Agent Tracker - ${agentId}`, agentId);
      }
    } else if (cmd === 'list') {
      createWindow('agent-list', 'All Agents');
    } else if (cmd === 'events') {
      createWindow('event-history', 'On-Chain Event History');
    } else if (cmd === 'dashboard') {
      createWindow('dashboard', 'System Dashboard');
    } else if (cmd === 'items') {
      createWindow('item-registration', 'Item Marketplace');
    } else if (cmd === 'create') {
      if (params.length === 0) {
        setError('Error: create command requires a prompt. Usage: create <prompt>');
      } else {
        const prompt = params.join(' ');
        await handleCreateAgent(prompt);
      }
    } else {
      setError(`Unknown command: ${cmd}. Type -h for help.`);
    }

    setCommand('');
  };

  const handleCreateAgent = async (prompt: string) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.agentId) {
          // Enhanced success message with blockchain info
          let successMsg = `Agent created successfully! ID: ${data.agentId}`;

          // Add blockchain wallet info if available
          if (data.agent?.wallet_id) {
            successMsg += ` | Funded with 1000 ALGO`;
            console.log(`Agent Wallet: ${data.agent.wallet_id}`);
          }

          setSuccess(successMsg);
          setTimeout(() => setSuccess(''), 7000);

          // Open the agent tracker window
          createWindow('agent-tracker', `Agent Tracker - ${data.agentId}`, data.agentId);
        } else {
          setError(data.message || 'Failed to create agent');
        }
      } else {
        setError('Failed to create agent');
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      setError('Failed to create agent');
    }

  };

  const createWindow = (
    type: 'help' | 'wallet' | 'agent-tracker' | 'agent-list' | 'event-history' | 'decision-stream' | 'dashboard' | 'item-registration',
    title: string,
    agentId?: string
  ) => {
    // Determine window size based on type
    let width = 500;
    let height = 400;
    let x = 20 + windows.length * 30;
    let y = 70 + windows.length * 30;

    if (type === 'help') {
      width = 400;
      height = 300;
      // Position help window on the right side to avoid terminal dropdown
      x = window.innerWidth - width - 40;
      y = 20;
    } else if (type === 'agent-list') {
      width = 700;
      height = 500;
    } else if (type === 'agent-tracker') {
      width = 500;
      height = 450;
    } else if (type === 'event-history') {
      width = 800;
      height = 500;
    } else if (type === 'decision-stream') {
      width = 700;
      height = 600;
    } else if (type === 'dashboard') {
      width = 900;
      height = 700;
    }

    const newWindow: WindowData = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      x,
      y,
      width,
      height,
      zIndex: nextZIndex,
      agentId,
    };

    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
  };

  const restoreWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  const focusWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, zIndex: nextZIndex } : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  const renderWindowContent = (window: WindowData) => {
    switch (window.type) {
      case 'help':
        return <HelpWindow />;
      case 'wallet':
        return <WalletWindow address={walletAddress} balance={walletBalance} />;
      case 'decision-stream':
        return <DecisionStream />;
      case 'dashboard':
        return <Dashboard />;
      case 'item-registration':
        return <ItemRegistration />;
      case 'agent-tracker':
        return window.agentId ? (
          <AgentTracker
            agentId={window.agentId}
            onNotFound={() => closeWindow(window.id)}
          />
        ) : null;
      case 'agent-list':
        return <AgentList />;
      case 'event-history':
        return <EventHistory />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col">
      {/* Top Navbar */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10 z-50">
        <div className="px-6">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 py-4 px-4 border-r border-gray-800">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Delphi
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">Agentic Procurement</div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-stretch flex-1">
              {/* Navigation Links */}
              {[
                { cmd: '-h', label: 'Help', icon: '?' },
                { cmd: 'create', label: 'New Agent', icon: '+' },
                { cmd: 'list', label: 'Agents', icon: '≡' },
                { cmd: 'watch', label: 'Live Feed', icon: '◉' },
                { cmd: 'items', label: 'Marketplace', icon: '🏪' },
                { cmd: 'dashboard', label: 'Dashboard', icon: '▣' },
              ].map((action, index) => (
                <div
                  key={action.cmd}
                  onClick={() => {
                    setCommand(action.cmd + ' ');
                    document.querySelector('input')?.focus();
                  }}
                  className="group relative px-6 py-4 flex items-center gap-2 cursor-pointer
                           hover:bg-cyan-500/10 transition-all duration-200
                           border-r border-gray-800 last:border-r-0"
                  title={action.label}
                >
                  {/* Hover indicator bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500
                               scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                  <span className="text-base font-bold text-gray-400 group-hover:text-cyan-400 transition-colors">
                    {action.icon}
                  </span>
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors font-medium">
                    {action.label}
                  </span>
                </div>
              ))}

              {/* Minimized Windows Section */}
              {windows.some(w => w.isMinimized) && (
                <div className="flex items-stretch border-l-2 border-cyan-500/30 ml-auto">
                  {windows
                    .filter(w => w.isMinimized)
                    .map((window) => (
                      <div
                        key={window.id}
                        onClick={() => restoreWindow(window.id)}
                        className="group relative px-5 py-4 flex items-center gap-2 cursor-pointer
                                 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20
                                 transition-all duration-200
                                 border-r border-gray-800 last:border-r-0"
                        title={`Restore ${window.title}`}
                      >
                        {/* Hover indicator bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500
                                     scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                        <span className="text-base text-cyan-400 group-hover:text-cyan-300 transition-colors">
                          {window.type === 'help' && '?'}
                          {window.type === 'wallet' && '$'}
                          {window.type === 'decision-stream' && '◉'}
                          {window.type === 'dashboard' && '▣'}
                          {window.type === 'item-registration' && '🏪'}
                          {window.type === 'agent-tracker' && '→'}
                        </span>
                        <span className="text-sm text-gray-300 group-hover:text-white font-medium max-w-[120px] truncate transition-colors">
                          {window.title}
                        </span>

                        {/* Close button on hover */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            closeWindow(window.id);
                          }}
                          className="ml-2 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500
                                   flex items-center justify-center opacity-0 group-hover:opacity-100
                                   transition-opacity text-white text-xs cursor-pointer"
                          title="Close"
                        >
                          ×
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Command Interface Section */}
      <div className="z-40 px-8 py-6 bg-gray-900/40 backdrop-blur-sm border-b border-gray-800">
        <form onSubmit={handleCommand} className="relative max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-center gap-3 bg-gray-900/50 border border-cyan-500/30 rounded-xl px-5 py-4 shadow-lg hover:border-cyan-500/50 transition-all hover:shadow-cyan-500/20 backdrop-blur-sm">
              {/* Terminal Prompt */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-cyan-400 font-mono text-lg font-bold">→</span>
              </div>

              <div className="flex-1 relative">
                {/* Styled overlay with syntax highlighting */}
                <div className="absolute inset-0 pointer-events-none font-mono text-lg whitespace-pre">
                  {command ? (
                    <>
                      {highlightCommand(command)}
                      <span className="text-gray-600">{suggestion}</span>
                    </>
                  ) : (
                    <span className="text-gray-600">Type a command or press Tab for suggestions...</span>
                  )}
                </div>

                {/* Actual input */}
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full bg-transparent text-transparent caret-cyan-400 font-mono text-lg outline-none"
                  autoFocus
                  placeholder=""
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2"
              >
                <span>Execute</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Parameter hint */}
            {parameterHint && !suggestion && (
              <div className="absolute top-full left-0 mt-2 w-full slide-in">
                <div className="glass rounded-lg px-4 py-3 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-blue-400">i</div>
                    <div>
                      <div className="text-blue-400 font-mono text-sm mb-1">
                        Usage: <span className="text-white font-semibold">{parameterHint.split(' - ')[0]}</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {parameterHint.split(' - ')[1]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Autocomplete hint */}
            {suggestion && (
              <div className="absolute top-full left-0 mt-2 px-5 slide-in">
                <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                  <span>Quick tip:</span>
                  <kbd className="px-2 py-1 bg-gray-800/80 rounded text-cyan-400 border border-gray-700">Tab</kbd>
                  <span>or</span>
                  <kbd className="px-2 py-1 bg-gray-800/80 rounded text-cyan-400 border border-gray-700">→</kbd>
                  <span>to autocomplete</span>
                </div>
              </div>
            )}

            {/* Dropdown suggestions */}
            {showSuggestions && command && (
              <div className="absolute top-full left-0 mt-2 w-full z-50 slide-in">
                <div className="glass rounded-xl shadow-2xl overflow-hidden border border-cyan-500/30 max-h-96 overflow-y-auto">
                  {(() => {
                    const parts = command.toLowerCase().split(/\s+/);
                    const cmd = parts[0];

                    // Show agent IDs if command is "track"
                    if (cmd === 'track' && parts.length === 1) {
                      if (availableAgents.length === 0) {
                        return (
                          <div className="px-5 py-6 text-center text-gray-500">
                            <div className="text-2xl mb-2">-</div>
                            <div className="text-sm">No agents available</div>
                            <div className="text-xs mt-1">Create an agent first with: create &lt;prompt&gt;</div>
                          </div>
                        );
                      }

                      return availableAgents.map((agent, index) => (
                        <div
                          key={agent.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCommand(`track ${agent.id}`);
                            setSuggestion('');
                            setShowSuggestions(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`px-5 py-3 cursor-pointer transition-all border-b border-gray-800/50 last:border-b-0 ${selectedIndex === index
                            ? 'bg-cyan-500/20 ring-2 ring-cyan-400/50'
                            : 'hover:bg-cyan-500/10'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">→</span>
                              <div>
                                <div className="font-mono text-sm text-cyan-400">
                                  {agent.id.slice(0, 16)}...
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Click to track this agent
                                </div>
                              </div>
                            </div>
                            <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${agent.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                              }
                                `}>
                              {agent.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs ml-9 line-clamp-1">
                            {agent.prompt}
                          </div>
                        </div>
                      ));
                    }

                    // Show regular command suggestions
                    return commands
                      .filter(c => c.toLowerCase().startsWith(command.toLowerCase()))
                      .map((cmd, index) => {
                        const info = commandInfo[cmd];
                        return (
                          <div
                            key={cmd}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCommand(cmd + ' ');
                              setSuggestion('');
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`px-5 py-3 cursor-pointer transition-all border-b border-gray-800/50 last:border-b-0 ${selectedIndex === index
                              ? 'bg-cyan-500/20 ring-2 ring-cyan-400/50'
                              : 'hover:bg-cyan-500/10'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{info?.icon}</span>
                                <span className="font-mono">
                                  <span className="text-gray-500">{command}</span>
                                  <span className="text-cyan-400 font-bold">{cmd.slice(command.length)}</span>
                                  {info?.params && (
                                    <span className="text-blue-400 ml-2">{info.params}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-400 text-xs ml-9">
                              {info?.description}
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-3 slide-in">
              <div className="glass border-red-500/50 rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="text-xl text-red-400 font-bold">!</div>
                <div>
                  <div className="text-red-400 font-medium text-sm mb-1">Error</div>
                  <div className="text-gray-300 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-3 slide-in">
              <div className="glass border-green-500/50 rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="text-xl text-green-400 font-bold">✓</div>
                <div>
                  <div className="text-green-400 font-medium text-sm mb-1">Success</div>
                  <div className="text-gray-300 text-sm">{success}</div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Windows Container */}
      <div className="flex-1 relative overflow-hidden">
        {windows.map((window) => (
          <Window
            key={window.id}
            window={window}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
          >
            {renderWindowContent(window)}
          </Window>
        ))}
      </div>

      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
    </div>
  );
}
