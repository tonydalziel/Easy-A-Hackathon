'use client';

import { useState, FormEvent, useEffect } from 'react';
import Window from '@/components/Window';
import HelpWindow from '@/components/HelpWindow';
import WalletWindow from '@/components/WalletWindow';
import AgentTracker from '@/components/AgentTracker';
import AgentList from '@/components/AgentList';
import EventHistory from '@/components/EventHistory';
import DecisionStream from '@/components/DecisionStream';
import { WindowData } from '@/types/window';

export default function Home() {
  const [command, setCommand] = useState('');
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parameterHint, setParameterHint] = useState('');

  const commands = ['-h', 'wallet', 'watch', 'track', 'list', 'events', 'create'];
  
  const commandInfo: Record<string, { params?: string; description: string }> = {
    '-h': { description: 'Display help window' },
    'wallet': { description: 'Show your total wallet value' },
    'watch': { description: 'Watch live agent decision stream in real-time' },
    'track': { params: '<agent-id>', description: 'Track a specific agent\'s activity' },
    'list': { description: 'List all agents with their status' },
    'events': { description: 'Show all on-chain events' },
    'create': { params: '<prompt>', description: 'Create a new agent with the specified prompt' },
  };

  useEffect(() => {
	createWindow('help', 'Help - Available Commands');
  }, []);

  // Autocomplete logic
  useEffect(() => {
    if (!command) {
      setSuggestion('');
      setParameterHint('');
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
  }, [command]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      createWindow('decision-stream', '📡 Live Decision Stream');
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
    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.agentId) {
          setError(`Agent created successfully! ID: ${data.agentId}`);
          // Optionally open the agent tracker window
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
    type: 'help' | 'wallet' | 'agent-tracker' | 'agent-list' | 'event-history' | 'decision-stream',
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
        return <WalletWindow />;
      case 'decision-stream':
        return <DecisionStream />;
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
    <div className="h-screen w-screen bg-gray-950 relative">
      {/* Command Prompt - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <form onSubmit={handleCommand} className="flex flex-col gap-2">
          <div className="relative">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 shadow-lg hover:border-green-500/50 transition-colors">
              <span className="text-green-400 font-mono">$</span>
              
              <div className="relative w-64">
                {/* Visible styled text with syntax highlighting and suggestion */}
                <div className="absolute inset-0 pointer-events-none font-mono whitespace-pre">
                  {command ? (
                    <>
                      {highlightCommand(command)}
                      <span className="text-gray-500">{suggestion}</span>
                    </>
                  ) : (
                    <span className="text-gray-600">Enter command...</span>
                  )}
                </div>
                
                {/* Actual input for typing */}
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full bg-transparent text-transparent caret-green-400 font-mono outline-none"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Parameter hint */}
            {parameterHint && !suggestion && (
              <div className="mt-1 ml-12 font-mono text-xs bg-gray-900 border border-blue-900/50 rounded px-3 py-2">
                <div className="text-blue-400 mb-1">
                  📝 Usage: <span className="text-white">{parameterHint.split(' - ')[0]}</span>
                </div>
                <div className="text-gray-400">
                  {parameterHint.split(' - ')[1]}
                </div>
              </div>
            )}
            
            {/* Suggestion hint */}
            {suggestion && (
              <div className="text-xs text-gray-500 mt-1 ml-12 font-mono">
                Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-green-400">Tab</kbd> or <kbd className="px-1 py-0.5 bg-gray-800 rounded text-green-400">→</kbd> to autocomplete
              </div>
            )}
            
            {/* Dropdown suggestions */}
            {showSuggestions && command && (
              <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden w-full z-10">
                {commands
                  .filter(cmd => cmd.toLowerCase().startsWith(command.toLowerCase()))
                  .map(cmd => {
                    const info = commandInfo[cmd];
                    return (
                      <div
                        key={cmd}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur
                          setCommand(cmd + ' ');
                          setSuggestion('');
                          setShowSuggestions(false);
                        }}
                        className="px-4 py-2 hover:bg-green-500/20 cursor-pointer font-mono text-sm transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white">{command}</span>
                            <span className="text-green-400">{cmd.slice(command.length)}</span>
                            {info?.params && (
                              <span className="text-blue-400 ml-2">{info.params}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {info?.description}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-red-400 text-sm font-mono bg-gray-900 border border-red-900 rounded px-3 py-1">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Windows Container */}
      <div className="absolute inset-0">
        {windows.map((window) => (
          <Window
            key={window.id}
            window={window}
            onClose={closeWindow}
            onFocus={focusWindow}
          >
            {renderWindowContent(window)}
          </Window>
        ))}
      </div>
    </div>
  );
}
