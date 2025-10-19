'use client';

export default function HelpWindow() {
  const commands = [
    { name: '-h', description: 'Display this help window' },
	{ name: 'lora', description: 'Gain blockchain insights using Lora!' },
    { name: 'wallet', description: 'Show your total wallet value' },
    { name: 'watch', description: 'Watch live agent decision stream in real-time' },
	{ name: 'events', description: 'Show all on-chain events across all agents' },
	{ name: 'list', description: 'List all agents with their status, tasks, and purchases' },
    { name: 'track <agent-id>', description: 'Track a specific agent\'s activity and wallet value' },
    { name: 'BUY -p <prompt> -v <value>', description: 'Create a new agent with specified prompt and budget value (in ALGO)' },
  ];

  return (
    <div className="text-white font-mono">
      <h2 className="text-lg font-bold mb-4 text-green-400">Available Commands</h2>
      <div className="space-y-3">
        {commands.map((cmd) => (
          <div key={cmd.name} className="border-l-2 border-green-500 pl-3">
            <div className="text-green-300 font-semibold">{cmd.name}</div>
            <div className="text-gray-400 text-sm">{cmd.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
