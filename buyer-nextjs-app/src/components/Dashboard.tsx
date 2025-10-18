/**
 * DASHBOARD COMPONENT
 * 
 * System-wide analytics and monitoring dashboard
 * 
 * Features:
 * - Real-time system metrics
 * - Agent performance analytics
 * - Transaction history visualization
 * - Decision success rate tracking
 * - Live activity feed
 * 
 * Updates:
 * - Polls API endpoints every 5 seconds for latest data
 * - Connects to SSE stream for real-time decision updates
 */

'use client';

import { useEffect, useState } from 'react';
import { Agent, AgentDecision } from '@/types/agent';

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  totalDecisions: number;
  buyDecisions: number;
  ignoreDecisions: number;
  successRate: number;
  recentActivity: AgentDecision[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    inactiveAgents: 0,
    totalDecisions: 0,
    buyDecisions: 0,
    ignoreDecisions: 0,
    successRate: 0,
    recentActivity: [],
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch agents
      const agentsRes = await fetch('/api/agents');
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        const agentsList = agentsData.agents || [];
        setAgents(agentsList);

        const active = agentsList.filter((a: Agent) => a.status === 'active').length;
        const inactive = agentsList.filter((a: Agent) => a.status === 'inactive').length;

        // Fetch decisions
        const decisionsRes = await fetch('/api/decisions');
        if (decisionsRes.ok) {
          const decisionsData = await decisionsRes.json();
          const decisions = decisionsData.decisions || [];
          const recentActivity = decisions.slice(0, 10);

          const buyCount = decisions.filter((d: AgentDecision) => d.decision === 'BUY').length;
          const ignoreCount = decisions.filter((d: AgentDecision) => d.decision === 'IGNORE').length;
          const successRate = decisions.length > 0 ? Math.round((buyCount / decisions.length) * 100) : 0;

          setStats({
            totalAgents: agentsList.length,
            activeAgents: active,
            inactiveAgents: inactive,
            totalDecisions: decisions.length,
            buyDecisions: buyCount,
            ignoreDecisions: ignoreCount,
            successRate,
            recentActivity,
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse text-cyan-400">▣</div>
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header with Title */}
      <div className="glass rounded-xl p-6 border border-cyan-500/30">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
          Agentic Procurement System
        </h1>
        <p className="text-gray-400 text-sm">AI-Powered Autonomous Trading Platform - Real-time System Dashboard</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Agents */}
        <div className="glass rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl text-cyan-400 font-bold">AI</div>
            <div className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50">
              Total
            </div>
          </div>
          <div className="text-4xl font-bold text-cyan-400 mb-2">{stats.totalAgents}</div>
          <div className="text-gray-400 text-sm">AI Agents</div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="text-green-400">● {stats.activeAgents} active</span>
            <span className="text-gray-500">● {stats.inactiveAgents} idle</span>
          </div>
        </div>

        {/* Total Decisions */}
        <div className="glass rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl text-purple-400 font-bold">→</div>
            <div className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/50">
              All Time
            </div>
          </div>
          <div className="text-4xl font-bold text-purple-400 mb-2">{stats.totalDecisions}</div>
          <div className="text-gray-400 text-sm">Decisions Made</div>
          <div className="mt-3 text-xs text-gray-500">
            {stats.totalAgents > 0 ? Math.round(stats.totalDecisions / stats.totalAgents) : 0} avg per agent
          </div>
        </div>

        {/* Buy Decisions */}
        <div className="glass rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl text-green-400 font-bold">✓</div>
            <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/50">
              Approved
            </div>
          </div>
          <div className="text-4xl font-bold text-green-400 mb-2">{stats.buyDecisions}</div>
          <div className="text-gray-400 text-sm">Buy Decisions</div>
          <div className="mt-3 text-xs text-gray-500">
            {stats.totalDecisions > 0 ? Math.round((stats.buyDecisions / stats.totalDecisions) * 100) : 0}% approval rate
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass rounded-xl p-6 border border-yellow-500/30 hover:border-yellow-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl text-yellow-400 font-bold">↗</div>
            <div className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
              Performance
            </div>
          </div>
          <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.successRate}%</div>
          <div className="text-gray-400 text-sm">Success Rate</div>
          <div className="mt-3">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Agents</h3>
            <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/50 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow"></div>
              {stats.activeAgents} Online
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {agents.filter(a => a.status === 'active').length > 0 ? (
              agents.filter(a => a.status === 'active').map((agent) => (
                <div
                  key={agent.id}
                  className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-green-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-sm text-cyan-400 mb-1">
                        {agent.id.slice(0, 12)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.model_id} • {agent.provider_id}
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                      ACTIVE
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2">
                    {agent.prompt}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {agent.currentItemsAcquired.length} items acquired
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2 text-gray-600">-</div>
                <div className="text-sm">No active agents</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <div className="text-xs text-gray-500">Last 10 decisions</div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((decision) => (
                <div
                  key={decision.id}
                  className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
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
                  <div className="text-sm text-white font-medium mb-1">
                    {decision.itemName}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Agent: {decision.agentId.slice(0, 8)}...
                    </span>
                    <span className="text-gray-400">
                      ${decision.itemPrice}
                      {decision.maxPrice && ` → $${decision.maxPrice}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2 text-gray-600">-</div>
                <div className="text-sm">No recent activity</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Breakdown Chart */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Decision Breakdown</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Buy Decisions
              </span>
              <span className="text-sm font-bold text-green-400">{stats.buyDecisions}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-600 to-green-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalDecisions > 0 ? (stats.buyDecisions / stats.totalDecisions) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-red-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Ignore Decisions
              </span>
              <span className="text-sm font-bold text-red-400">{stats.ignoreDecisions}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 to-red-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalDecisions > 0 ? (stats.ignoreDecisions / stats.totalDecisions) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalDecisions}</div>
            <div className="text-xs text-gray-500">Total Decisions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{stats.buyDecisions}</div>
            <div className="text-xs text-gray-500">Approved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{stats.ignoreDecisions}</div>
            <div className="text-xs text-gray-500">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
