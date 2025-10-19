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
 * - BUY -p <prompt> -v <value>: Create new AI agent with budget
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
import DecisionReview from '@/components/DecisionReview';
import EvalSetManager from '@/components/EvalSetManager';
import EvalRunner from '@/components/EvalRunner';
import SignupForm from '@/components/SignupForm';
import LoraExplorer from '@/components/LoraExplorer';
import AnimatedGlobe from '@/components/AnimatedGlobe';
import { WindowData } from '@/types/window';
import { EXPRESS_SERVER_URL } from './api/agents/create/route';

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    username: string;
    walletId: string;
    privateKey?: string;
    merchantId?: string;
    description?: string;
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  const commands = ['-h', 'wallet', 'watch', 'track', 'list', 'events', 'buy', 'dashboard', 'items', 'review', 'evals', 'lora'];

  const commandInfo: Record<string, { params?: string; description: string; icon?: string }> = {
    '-h': { description: 'Display help window', icon: '?' },
    'wallet': { description: 'Show your total wallet value', icon: '$' },
    'watch': { description: 'Watch live agent decision stream in real-time', icon: '◉' },
    'track': { params: '<agent-id>', description: 'Track a specific agent\'s activity', icon: '→' },
    'list': { description: 'List all agents with their status', icon: '≡' },
    'events': { description: 'Show all on-chain events', icon: '⋯' },
    'buy': { params: '-p <prompt> -v <value>', description: 'Create a new agent with prompt and budget (in ALGO)', icon: '+' },
    'dashboard': { description: 'Open system dashboard with analytics', icon: '▣' },
    'lora': { description: 'Open Lora Algorand block explorer', icon: '🔍' },
  };

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        // First check localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }

        // Then check server-side cookie
        const response = await fetch('/api/auth/signup');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Only initialize the app after authentication
    if (!isAuthenticated) return;

    createWindow('help', 'Help - Available Commands');

    // Fetch system stats periodically
    const fetchStats = async () => {
      try {
        // Fetch agent count
        const agentsRes = await fetch(`/api/agents`);
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
    const interval = setInterval(fetchStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

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
    } else if (cmd === 'lora') {
      createWindow('lora-explorer', 'Lora Explorer');
    } else if (cmd === 'review') {
      createWindow('decision-review', '📝 Review Agent Decisions');
    } else if (cmd === 'evals') {
      createWindow('eval-manager', '🎯 Evaluation Sets');
    } else if (cmd === 'buy') {
      // Parse -p <prompt> -v <value> format
      let prompt = '';
      let value = '';

      for (let i = 0; i < params.length; i++) {
        if (params[i] === '-p' && i + 1 < params.length) {
          // Collect all text until we hit -v or end
          let j = i + 1;
          while (j < params.length && params[j] !== '-v') {
            prompt += (prompt ? ' ' : '') + params[j];
            j++;
          }
          i = j - 1;
        } else if (params[i] === '-v' && i + 1 < params.length) {
          value = params[i + 1];
          i++;
        }
      }

      if (!prompt || !value) {
        setError('Error: BUY command requires -p <prompt> and -v <value>. Usage: BUY -p <prompt> -v <value>');
      } else {
        await handleCreateAgent(prompt, parseFloat(value));
      }
    } else {
      setError(`Unknown command: ${cmd}. Type -h for help.`);
    }

    setCommand('');
  };

  const handleCreateAgent = async (prompt: string, value: number) => {
    setError('');
    setSuccess('');

    try {
      // Ensure user is authenticated and has a wallet
      if (!user?.walletId) {
        setError('You must be logged in with a wallet to create an agent');
        return;
      }

      // Convert ALGO to microALGO (1 ALGO = 1,000,000 microALGO)
      const microAlgoValue = Math.floor(value * 1000000);

      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          user_wallet_id: user.walletId, // Pass user's wallet ID
          walletBalance: microAlgoValue // Pass the value in microALGO
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.agentId) {
          setSuccess(`Agent created successfully with ${value} ALGO! ID: ${data.agentId}`);
          setTimeout(() => setSuccess(''), 5000);
          // Optionally open the agent tracker window
        //   createWindow('agent-tracker', `Agent Tracker - ${data.agentId}`, data.agentId);
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

  // Smart window positioning to avoid overlaps
  const findOptimalPosition = (width: number, height: number, existingWindows: WindowData[]) => {
    const padding = 20;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const navbarHeight = 70;

    // Check if a position overlaps with existing windows
    const hasOverlap = (x: number, y: number, w: number, h: number) => {
      return existingWindows.some(win => {
        if (win.isMinimized) return false;
        
        const overlapX = x < win.x + win.width && x + w > win.x;
        const overlapY = y < win.y + win.height && y + h > win.y;
        return overlapX && overlapY;
      });
    };

    // Try cascading positions first (classic staircase pattern)
    for (let i = 0; i < 15; i++) {
      const x = padding + i * 40;
      const y = navbarHeight + padding + i * 40;
      
      if (x + width < screenWidth - padding && y + height < screenHeight - padding) {
        if (!hasOverlap(x, y, width, height)) {
          return { x, y };
        }
      }
    }

    // Try grid positions
    const cols = Math.floor((screenWidth - padding * 2) / (width + padding));
    const rows = Math.floor((screenHeight - navbarHeight - padding * 2) / (height + padding));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = padding + col * (width + padding);
        const y = navbarHeight + padding + row * (height + padding);
        
        if (!hasOverlap(x, y, width, height)) {
          return { x, y };
        }
      }
    }

    // Fallback: center of screen
    return {
      x: Math.max(padding, (screenWidth - width) / 2),
      y: Math.max(navbarHeight + padding, (screenHeight - height) / 2)
    };
  };

  const createWindow = (
    type: 'help' | 'wallet' | 'agent-tracker' | 'agent-list' | 'event-history' | 'decision-stream' | 'dashboard' | 'item-registration' | 'decision-review' | 'eval-manager' | 'eval-runner' | 'lora-explorer',
    title: string,
    agentId?: string,
    evalSetId?: string,
    walletId?: string
  ) => {
    // Determine window size based on type
    let width = 500;
    let height = 400;

    if (type === 'help') {
      width = 400;
      height = 500;
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
    } else if (type === 'lora-explorer') {
      width = 1000;
      height = 700;
    } else if (type === 'decision-review') {
      width = 900;
      height = 700;
    } else if (type === 'eval-manager') {
      width = 1000;
      height = 700;
    } else if (type === 'eval-runner') {
      width = 800;
      height = 700;
    }

    // Find optimal position
    const { x, y } = findOptimalPosition(width, height, windows);

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
      evalSetId,
      walletId,
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

  // Handle window position change
  const handleWindowPositionChange = (id: string, x: number, y: number) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, x, y } : w
    ));
  };

  const renderWindowContent = (window: WindowData) => {
    const handleOpenLora = (walletId: string) => {
      createWindow('lora-explorer', 'Lora Explorer', undefined, undefined, walletId);
    };

    switch (window.type) {
      case 'help':
        return <HelpWindow />;
      case 'wallet':
        return <WalletWindow address={user?.walletId || ''} balance={0} onOpenLora={handleOpenLora} />;
      case 'decision-stream':
        return <DecisionStream />;
      case 'dashboard':
        return <Dashboard />;
      case 'item-registration':
        return <ItemRegistration />;
      case 'lora-explorer':
        return <LoraExplorer walletId={window.walletId} />;
      case 'decision-review':
        return <DecisionReview onClose={() => closeWindow(window.id)} />;
      case 'eval-manager':
        return (
          <EvalSetManager
            onRunEval={(evalSetId) => {
              createWindow('eval-runner', 'Run Evaluation', undefined, evalSetId);
            }}
            onClose={() => closeWindow(window.id)}
          />
        );
      case 'eval-runner':
        return window.evalSetId ? (
          <EvalRunner
            evalSetId={window.evalSetId}
            onClose={() => closeWindow(window.id)}
            onComplete={() => {
              setSuccess('Evaluation completed successfully!');
              setTimeout(() => setSuccess(''), 5000);
            }}
          />
        ) : null;
      case 'agent-tracker':
        return window.agentId ? (
          <AgentTracker
            agentId={window.agentId}
            onNotFound={() => closeWindow(window.id)}
            onOpenLora={handleOpenLora}
          />
        ) : null;
      case 'agent-list':
        return <AgentList onOpenLora={handleOpenLora} />;
      case 'event-history':
        return <EventHistory />;
      default:
        return null;
    }
  };

  const handleSignupSuccess = (userData: {
    username: string;
    walletId: string;
    privateKey?: string;
    merchantId?: string;
    description?: string;
  }) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log('✅ User authenticated:', {
      username: userData.username,
      walletId: userData.walletId,
      merchantId: userData.merchantId
    });
    setSuccess(`Welcome, ${userData.username}! Your Algorand wallet has been created: ${userData.walletId.substring(0, 20)}...`);
    setTimeout(() => setSuccess(''), 7000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signup', { method: 'DELETE' });
      localStorage.removeItem('user');
      localStorage.removeItem('wallet_private_key');
      setUser(null);
      setIsAuthenticated(false);
      setWindows([]);
      console.log('👋 User logged out');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
        <div className="text-white text-xl">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Show signup form if not authenticated
  if (!isAuthenticated) {
    return <SignupForm onSignupSuccess={handleSignupSuccess} />;
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col">
      {/* Animated Globe Background */}
      <AnimatedGlobe />
      
      {/* Top Navbar with integrated terminal */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10 z-50">
        <div className="px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 py-4 px-4 border-r border-gray-800">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Delphi
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">Crypto Marketplace</div>
            </div>

            {/* Menu Dropdown - Now outside terminal */}
            <div className="relative group">
              <button
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 rounded-lg text-white font-medium transition-all border border-purple-500/30 flex items-center gap-2"
              >
                <span className="text-sm">Menu</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute left-0 top-full mt-2 w-56 bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {[
                  { cmd: '-h', label: 'Help', icon: '?' },
                  { cmd: 'create', label: 'New Agent', icon: '+' },
                  { cmd: 'list', label: 'List Agents', icon: '≡' },
                  { cmd: 'watch', label: 'Live Feed', icon: '◉' },
                  { cmd: 'items', label: 'Marketplace', icon: '🏪' },
                  { cmd: 'review', label: 'Review', icon: '📝' },
                  { cmd: 'evals', label: 'Evaluations', icon: '🎯' },
                  { cmd: 'dashboard', label: 'Dashboard', icon: '▣' },
                  { cmd: 'wallet', label: 'Wallet', icon: '$' },
                  { cmd: 'lora', label: 'Explorer', icon: '🔍' },
                ].map((action) => (
                  <div
                    key={action.cmd}
                    onClick={() => {
                      setCommand(action.cmd + ' ');
                      document.querySelector('input')?.focus();
                    }}
                    className="px-4 py-2.5 hover:bg-cyan-500/10 cursor-pointer transition-all border-b border-gray-800/50 last:border-b-0 flex items-center gap-3"
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span className="text-sm text-gray-300 hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrated Terminal - Now takes maximum space */}
            <form onSubmit={handleCommand} className="flex-1">
              <div className="flex items-center gap-3 bg-gray-900/50 border border-cyan-500/30 rounded-lg px-4 py-2 hover:border-cyan-500/50 transition-all">
                {/* Terminal Prompt */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-cyan-400 font-mono text-sm font-bold">→</span>
                </div>

                <div className="flex-1 relative">
                  {/* Styled overlay with syntax highlighting */}
                  <div className="absolute inset-0 pointer-events-none font-mono text-sm whitespace-pre">
                    {command ? (
                      <>
                        {highlightCommand(command)}
                        <span className="text-gray-600">{suggestion}</span>
                      </>
                    ) : (
                      <span className="text-gray-600">Type command...</span>
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
                    className="w-full bg-transparent text-transparent caret-cyan-400 font-mono text-sm outline-none"
                    placeholder=""
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2"
                >
                  <span className="text-sm">Run</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {showSuggestions && command && (
                <div className="absolute left-0 right-0 mt-2 mx-6 z-50">
                  <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-cyan-500/30 max-h-96 overflow-y-auto">
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
            </form>

            {/* Right side - User info and minimized windows */}
            <div className="flex items-stretch">
              {/* User Info Section */}
              {user && (
                <div className="flex items-center gap-4 px-6 py-4 border-r border-gray-800">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-white">
                      {user.username}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {user.walletId.substring(0, 20)}...
                      </span>
                      <button
                        onClick={() => createWindow('lora-explorer', 'Lora Explorer', undefined, undefined, user.walletId)}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                        title="View on Lora Explorer"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300
                             rounded-lg text-xs font-medium transition-all border border-red-500/30"
                    title="Logout"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Minimized Windows Section */}
              {windows.some(w => w.isMinimized) && (
                <div className="flex items-stretch border-l border-cyan-500/30">
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
                          {window.type === 'decision-review' && '📝'}
                          {window.type === 'eval-manager' && '🎯'}
                          {window.type === 'eval-runner' && '🧪'}
                          {window.type === 'agent-tracker' && '→'}
                          {window.type === 'lora-explorer' && '🔍'}
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

        {/* Error/Success Messages */}
        {(error || success) && (
          <div className="px-6 pb-3">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 flex items-start gap-3">
                <div className="text-lg text-red-400 font-bold">!</div>
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 flex items-start gap-3">
                <div className="text-lg text-green-400 font-bold">✓</div>
                <div className="text-green-400 text-sm">{success}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Windows Container - Now takes full remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {windows.map((window) => (
          <Window
            key={window.id}
            window={window}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
            onPositionChange={handleWindowPositionChange}
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
