import React, { useState, useEffect } from 'react';
import { EvalSet, EvalResult } from '@/types/eval';
import { evalSetStore } from '@/lib/evalSetStore';

type EvalSetManagerProps = {
  onRunEval?: (evalSetId: string) => void;
  onClose?: () => void;
};

export default function EvalSetManager({ onRunEval, onClose }: EvalSetManagerProps) {
  const [evalSets, setEvalSets] = useState<EvalSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<EvalSet | null>(null);
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<{ id: string, name: string, description: string } | null>(null);

  useEffect(() => {
    loadEvalSets();
  }, []);

  useEffect(() => {
    if (selectedSet) {
      loadResultsForSet(selectedSet.id);
    }
  }, [selectedSet]);

  const loadEvalSets = () => {
    const sets = evalSetStore.getAllEvalSets();
    setEvalSets(sets.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const loadResultsForSet = (setId: string) => {
    const results = evalSetStore.getEvalResultsBySet(setId);
    setEvalResults(results.sort((a, b) => b.runAt - a.runAt));
  };

  const handleDelete = (id: string) => {
    evalSetStore.deleteEvalSet(id);
    if (selectedSet?.id === id) {
      setSelectedSet(null);
    }
    loadEvalSets();
    setShowDeleteConfirm(null);
  };

  const handleEdit = (set: EvalSet) => {
    setEditingSet({
      id: set.id,
      name: set.name,
      description: set.description || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingSet) return;
    
    evalSetStore.updateEvalSet(editingSet.id, {
      name: editingSet.name,
      description: editingSet.description || undefined
    });
    
    loadEvalSets();
    if (selectedSet?.id === editingSet.id) {
      setSelectedSet(evalSetStore.getEvalSet(editingSet.id));
    }
    setEditingSet(null);
  };

  const handleRunEval = (setId: string) => {
    if (onRunEval) {
      onRunEval(setId);
    }
  };

  const handleDeleteResult = (resultId: string) => {
    evalSetStore.deleteEvalResult(resultId);
    if (selectedSet) {
      loadResultsForSet(selectedSet.id);
    }
  };

  const stats = evalSetStore.getStats();

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Left Panel - Eval Sets List */}
      <div className="w-1/3 border-r border-purple-500/30 flex flex-col">
        <div className="bg-black/40 backdrop-blur-sm border-b border-purple-500/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Evaluation Sets
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
              <div className="text-cyan-400 font-semibold">{stats.totalSets}</div>
              <div className="text-gray-400 text-xs">Eval Sets</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
              <div className="text-purple-400 font-semibold">{stats.totalDecisions}</div>
              <div className="text-gray-400 text-xs">Total Decisions</div>
            </div>
          </div>
        </div>

        {/* Eval Sets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {evalSets.length === 0 ? (
            <div className="text-center text-gray-400 py-12 px-4">
              <p className="mb-2">No evaluation sets yet</p>
              <p className="text-sm">Review decisions and create an eval set to get started</p>
            </div>
          ) : (
            evalSets.map(set => (
              <div
                key={set.id}
                onClick={() => setSelectedSet(set)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSet?.id === set.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-black/40 border-purple-500/30 hover:bg-black/60'
                }`}
              >
                <h3 className="font-semibold text-cyan-400 mb-1">{set.name}</h3>
                {set.description && (
                  <p className="text-xs text-gray-400 mb-2">{set.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{set.decisions.length} decisions</span>
                  <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Selected Set Details */}
      <div className="flex-1 flex flex-col">
        {!selectedSet ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p>Select an evaluation set to view details</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-black/40 backdrop-blur-sm border-b border-purple-500/30 p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-cyan-400 mb-2">{selectedSet.name}</h2>
                  {selectedSet.description && (
                    <p className="text-gray-300 text-sm mb-2">{selectedSet.description}</p>
                  )}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-2">
                    <p className="text-xs text-purple-400 font-semibold mb-1">Agent Prompt:</p>
                    <p className="text-sm text-gray-300 italic">"{selectedSet.agentPrompt}"</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Created {new Date(selectedSet.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(selectedSet)}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(selectedSet.id)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                  <div className="text-purple-400 font-semibold text-lg">{selectedSet.decisions.length}</div>
                  <div className="text-gray-400 text-xs">Decisions</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <div className="text-green-400 font-semibold text-lg">
                    {selectedSet.decisions.filter(d => d.label === 'correct').length}
                  </div>
                  <div className="text-gray-400 text-xs">Correct</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                  <div className="text-red-400 font-semibold text-lg">
                    {selectedSet.decisions.filter(d => d.label === 'incorrect').length}
                  </div>
                  <div className="text-gray-400 text-xs">Incorrect</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3">
                  <div className="text-cyan-400 font-semibold text-lg">{evalResults.length}</div>
                  <div className="text-gray-400 text-xs">Test Runs</div>
                </div>
              </div>

              <button
                onClick={() => handleRunEval(selectedSet.id)}
                className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg font-semibold transition-all shadow-lg"
              >
                🎯 Run Evaluation
              </button>
            </div>

            {/* Decisions & Results Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="bg-black/40 border-b border-purple-500/30 px-4">
                <div className="flex gap-4">
                  <button className="px-4 py-2 border-b-2 border-cyan-500 text-cyan-400 font-semibold">
                    Decisions ({selectedSet.decisions.length})
                  </button>
                  <button className="px-4 py-2 text-gray-400 hover:text-gray-300">
                    Test Results ({evalResults.length})
                  </button>
                </div>
              </div>

              {/* Decisions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedSet.decisions.map(({ decision, label, notes }) => (
                  <div
                    key={decision.id}
                    className="bg-black/40 backdrop-blur-sm rounded-lg border border-purple-500/30 p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-cyan-400">{decision.itemName}</h4>
                        <p className="text-sm text-gray-400">Price: ${decision.itemPrice}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            decision.decision === 'BUY'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {decision.decision}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            label === 'correct'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {label === 'correct' ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                    {decision.reasoning && (
                      <p className="text-xs text-gray-400 italic mb-1">"{decision.reasoning}"</p>
                    )}
                    {notes && (
                      <p className="text-xs text-purple-400 mt-2">Note: {notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Evaluation Set?</h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete the eval set and all associated test results. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Edit Evaluation Set</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Name</label>
                <input
                  type="text"
                  value={editingSet.name}
                  onChange={(e) => setEditingSet({ ...editingSet, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Description</label>
                <textarea
                  value={editingSet.description}
                  onChange={(e) => setEditingSet({ ...editingSet, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setEditingSet(null)}
                className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg font-semibold transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
