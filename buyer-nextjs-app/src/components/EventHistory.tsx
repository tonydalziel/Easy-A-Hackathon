'use client';

import { useEffect, useState } from 'react';

interface ChainEvent {
  id: string;
  agentId: string;
  type: string;
  timestamp: string;
  description: string;
  blockNumber?: number;
  transactionHash?: string;
}

export default function EventHistory() {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      const response = await fetch('/api/events/all');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white font-mono flex items-center justify-center h-full">
        Loading events...
      </div>
    );
  }

  return (
    <div className="text-white font-mono">
      <div className="mb-3 flex justify-between items-center">
        <h2 className="text-lg font-bold text-purple-400">
          On-Chain Event History ({events.length})
        </h2>
      </div>

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-950">
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Time</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Agent</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Type</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Description</th>
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Block</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-gray-800 hover:bg-gray-900 transition-colors"
                >
                  <td className="py-2 px-2 text-gray-400 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-2 text-cyan-400 font-semibold">
                    {event.agentId}
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-xs bg-purple-900 px-2 py-1 rounded text-purple-300">
                      {event.type}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-300 max-w-[300px] truncate">
                    {event.description}
                  </td>
                  <td className="py-2 px-2 text-gray-500 text-xs">
                    {event.blockNumber || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
