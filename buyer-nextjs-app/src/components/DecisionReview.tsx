import React, { useState, useEffect } from 'react';
import { AgentDecision } from '@/types/agent';
import { LabeledDecision } from '@/types/eval';
import { evalSetStore } from '@/lib/evalSetStore';
import { agentStore } from '@/lib/agentStore';

type DecisionReviewProps = {
  agentId?: string; // Optional filter by agent
  onClose?: () => void;
};

export default function DecisionReview({ agentId, onClose }: DecisionReviewProps) {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [decisionLabels, setDecisionLabels] = useState<Map<string, { label: 'correct' | 'incorrect', notes?: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [evalSetName, setEvalSetName] = useState('');
  const [evalSetDescription, setEvalSetDescription] = useState('');
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'BUY' | 'IGNORE'>('ALL');
  const [sortBy, setSortBy] = useState<'timestamp' | 'price' | 'name'>('timestamp');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDecisions();
  }, [agentId]);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const url = agentId 
        ? `/api/decisions?agentId=${agentId}`
        : '/api/decisions';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch decisions');
      
      const data = await response.json();
      setDecisions(data.decisions || []);
    } catch (err) {
      setError('Failed to load decisions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedDecisions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      // Also remove label if unselected
      const newLabels = new Map(decisionLabels);
      newLabels.delete(id);
      setDecisionLabels(newLabels);
    } else {
      newSelected.add(id);
    }
    setSelectedDecisions(newSelected);
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredDecisions();
    if (selectedDecisions.size === filtered.length) {
      setSelectedDecisions(new Set());
      setDecisionLabels(new Map());
    } else {
      setSelectedDecisions(new Set(filtered.map(d => d.id)));
    }
  };

  const setLabel = (id: string, label: 'correct' | 'incorrect', notes?: string) => {
    const newLabels = new Map(decisionLabels);
    newLabels.set(id, { label, notes });
    setDecisionLabels(newLabels);
  };

  const handleCreateEvalSet = () => {
    if (!evalSetName.trim()) {
      alert('Please enter a name for the eval set');
      return;
    }

    if (selectedDecisions.size === 0) {
      alert('Please select at least one decision');
      return;
    }

    // Ensure all selected decisions have labels
    const unlabeled = Array.from(selectedDecisions).filter(id => !decisionLabels.has(id));
    if (unlabeled.length > 0) {
      alert(`Please label all selected decisions (${unlabeled.length} remaining)`);
      return;
    }

    // Create labeled decisions
    const labeledDecisions: LabeledDecision[] = Array.from(selectedDecisions).map(id => {
      const decision = decisions.find(d => d.id === id)!;
      const labelData = decisionLabels.get(id)!;
      return {
        decision,
        label: labelData.label,
        notes: labelData.notes
      };
    });

    // Get agent info - use first decision's agentId or provided agentId
    const firstDecision = labeledDecisions[0].decision;
    const evalAgentId = agentId || firstDecision.agentId;
    const agent = agentStore.getAgent(evalAgentId);
    
    if (!agent) {
      alert('Could not find agent information');
      return;
    }

    // Save eval set
    const evalSet = evalSetStore.createEvalSet(
      evalSetName.trim(),
      evalAgentId,
      agent.prompt,
      evalSetDescription.trim() || undefined
    );

    evalSetStore.addDecisionsToEvalSet(evalSet.id, labeledDecisions);

    // Reset state
    setShowCreateModal(false);
    setEvalSetName('');
    setEvalSetDescription('');
    setSelectedDecisions(new Set());
    setDecisionLabels(new Map());

    alert(`Created eval set "${evalSet.name}" with ${labeledDecisions.length} decisions`);
  };

  const getFilteredDecisions = () => {
    let filtered = decisions;

    // Filter by decision type
    if (filterDecision !== 'ALL') {
      filtered = filtered.filter(d => d.decision === filterDecision);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.itemName.toLowerCase().includes(term) ||
        d.reasoning?.toLowerCase().includes(term)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'timestamp') return b.timestamp - a.timestamp;
      if (sortBy === 'price') return b.itemPrice - a.itemPrice;
      if (sortBy === 'name') return a.itemName.localeCompare(b.itemName);
      return 0;
    });

    return sorted;
  };

  const filteredDecisions = getFilteredDecisions();
  const selectedCount = selectedDecisions.size;
  const labeledCount = Array.from(selectedDecisions).filter(id => decisionLabels.has(id)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 animate-pulse">Loading decisions...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Review Agent Decisions
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm text-gray-300">
            <span className="font-semibold text-cyan-400">{filteredDecisions.length}</span> decisions
          </div>
          <div className="text-sm text-gray-300">
            <span className="font-semibold text-purple-400">{selectedCount}</span> selected
          </div>
          <div className="text-sm text-gray-300">
            <span className="font-semibold text-green-400">{labeledCount}</span> labeled
          </div>
          <div className="flex-1" />
          {selectedCount > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={labeledCount !== selectedCount}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all shadow-lg"
            >
              Create Eval Set ({selectedCount})
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
          
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value as any)}
            className="px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Decisions</option>
            <option value="BUY">Buy Only</option>
            <option value="IGNORE">Ignore Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="price">Sort by Price</option>
            <option value="name">Sort by Name</option>
          </select>

          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors text-sm"
          >
            {selectedDecisions.size === filteredDecisions.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Decisions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {filteredDecisions.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {decisions.length === 0 ? 'No decisions found' : 'No decisions match your filters'}
          </div>
        ) : (
          filteredDecisions.map(decision => {
            const isSelected = selectedDecisions.has(decision.id);
            const labelData = decisionLabels.get(decision.id);

            return (
              <div
                key={decision.id}
                className={`bg-black/40 backdrop-blur-sm rounded-lg border ${
                  isSelected ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'border-purple-500/30'
                } p-4 transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(decision.id)}
                    className="mt-1 w-5 h-5 rounded border-purple-500/50 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                  />

                  {/* Decision Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400">{decision.itemName}</h3>
                        <p className="text-sm text-gray-400">
                          Price: <span className="text-green-400 font-semibold">${decision.itemPrice}</span>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          decision.decision === 'BUY'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}
                      >
                        {decision.decision}
                      </span>
                    </div>

                    {decision.reasoning && (
                      <p className="mt-2 text-sm text-gray-300 italic">"{decision.reasoning}"</p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(decision.timestamp).toLocaleString()}
                    </p>

                    {/* Labeling UI - only show if selected */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-purple-500/30">
                        <p className="text-sm font-semibold text-purple-400 mb-2">
                          Was this decision correct?
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setLabel(decision.id, 'correct')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              labelData?.label === 'correct'
                                ? 'bg-green-500/30 text-green-400 border-2 border-green-500'
                                : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                            }`}
                          >
                            ✓ Correct
                          </button>
                          <button
                            onClick={() => setLabel(decision.id, 'incorrect')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              labelData?.label === 'incorrect'
                                ? 'bg-red-500/30 text-red-400 border-2 border-red-500'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            ✗ Incorrect
                          </button>
                        </div>
                        {labelData && (
                          <input
                            type="text"
                            placeholder="Optional notes..."
                            value={labelData.notes || ''}
                            onChange={(e) => setLabel(decision.id, labelData.label, e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500/50"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Eval Set Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Create Evaluation Set</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={evalSetName}
                  onChange={(e) => setEvalSetName(e.target.value)}
                  placeholder="e.g., Coffee Purchases Q4 2024"
                  className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={evalSetDescription}
                  onChange={(e) => setEvalSetDescription(e.target.value)}
                  placeholder="Describe what this eval set tests..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm">
                <p className="text-gray-300">
                  This eval set will contain <span className="text-cyan-400 font-semibold">{selectedCount}</span> labeled decisions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvalSet}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg font-semibold transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
