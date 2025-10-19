import React, { useState, useEffect } from 'react';
import { EvalSet, EvalResult, LabeledDecision } from '@/types/eval';
import { evalSetStore } from '@/lib/evalSetStore';
import { agentStore } from '@/lib/agentStore';
import { Agent } from '@/types/agent';

type EvalRunnerProps = {
  evalSetId: string;
  onClose?: () => void;
  onComplete?: (result: EvalResult) => void;
};

export default function EvalRunner({ evalSetId, onClose, onComplete }: EvalRunnerProps) {
  const [evalSet, setEvalSet] = useState<EvalSet | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const set = evalSetStore.getEvalSet(evalSetId);
    setEvalSet(set);

    const allAgents = agentStore.getAllAgents();
    setAgents(allAgents);
    
    if (allAgents.length > 0) {
      setSelectedAgentId(allAgents[0].id);
    }
  }, [evalSetId]);

  const runEvaluation = async () => {
    if (!evalSet || !selectedAgentId) return;

    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return;

    setRunning(true);
    setError('');
    setProgress(0);
    setResult(null);

    const results: EvalResult['results'] = [];
    const total = evalSet.decisions.length;

    try {
      for (let i = 0; i < evalSet.decisions.length; i++) {
        const labeledDecision = evalSet.decisions[i];
        const { decision, label } = labeledDecision;

        setCurrentTest(`Testing ${decision.itemName} (${i + 1}/${total})`);
        setProgress(((i + 1) / total) * 100);

        // Simulate calling the agent to make a decision on this item
        // In a real implementation, this would call your LLM/agent service
        const actualDecision = await simulateAgentDecision(agent, decision.itemName, decision.itemPrice);

        const expectedDecision = decision.decision;
        const correct = actualDecision === expectedDecision;

        results.push({
          decisionId: decision.id,
          itemName: decision.itemName,
          itemPrice: decision.itemPrice,
          expectedDecision,
          actualDecision,
          correct,
          label,
          reasoning: decision.reasoning
        });

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Calculate metrics
      const totalTests = results.length;
      const correctTests = results.filter(r => r.correct).length;
      const incorrectTests = totalTests - correctTests;
      
      const buyResults = results.filter(r => r.expectedDecision === 'BUY');
      const buyCorrect = buyResults.filter(r => r.correct).length;
      
      const ignoreResults = results.filter(r => r.expectedDecision === 'IGNORE');
      const ignoreCorrect = ignoreResults.filter(r => r.correct).length;

      const evalResult: EvalResult = {
        id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        evalSetId: evalSet.id,
        evalSetName: evalSet.name,
        agentId: agent.id,
        agentPrompt: agent.prompt,
        runAt: Date.now(),
        results,
        metrics: {
          total: totalTests,
          correct: correctTests,
          incorrect: incorrectTests,
          accuracy: (correctTests / totalTests) * 100,
          buyAccuracy: buyResults.length > 0 ? (buyCorrect / buyResults.length) * 100 : 0,
          ignoreAccuracy: ignoreResults.length > 0 ? (ignoreCorrect / ignoreResults.length) * 100 : 0
        }
      };

      // Save result
      evalSetStore.saveEvalResult(evalResult);
      setResult(evalResult);

      if (onComplete) {
        onComplete(evalResult);
      }
    } catch (err) {
      setError('Failed to run evaluation');
      console.error(err);
    } finally {
      setRunning(false);
      setCurrentTest('');
    }
  };

  // Simulate agent decision - replace with actual LLM call
  const simulateAgentDecision = async (agent: Agent, itemName: string, itemPrice: number): Promise<'BUY' | 'IGNORE'> => {
    // In production, this would call your agent decision API
    // For now, we'll make a simple simulation based on the agent's prompt
    
    try {
      const response = await fetch(`${process.env.EXPRESS_SERVER_URL || 'http://localhost:3000'}/agents/consider-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentState: {
            agent_id: agent.id,
            prompt: agent.prompt,
            model_id: agent.model_id,
            provider_id: agent.provider_id,
            wallet_id: agent.wallet_id,
            wallet_pwd: agent.wallet_pwd,
            currentItemsAcquired: agent.currentItemsAcquired
          },
          itemState: {
            id: `eval-item-${Date.now()}`,
            name: itemName,
            price: itemPrice
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.decision === 'BUY' ? 'BUY' : 'IGNORE';
      }
    } catch (err) {
      console.error('Error calling agent API:', err);
    }

    // Fallback simulation
    const prompt = agent.prompt.toLowerCase();
    const item = itemName.toLowerCase();
    
    // Simple keyword matching
    if (prompt.includes(item) || item.split(' ').some(word => prompt.includes(word))) {
      // Check if price is mentioned in prompt
      const priceMatch = prompt.match(/under\s+\$?(\d+)/i);
      if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1]);
        return itemPrice <= maxPrice ? 'BUY' : 'IGNORE';
      }
      return 'BUY';
    }
    
    return 'IGNORE';
  };

  if (!evalSet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 animate-pulse">Loading evaluation set...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Run Evaluation
            </h2>
            <p className="text-gray-400 text-sm mt-1">{evalSet.name}</p>
          </div>
          {onClose && !running && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!result && !running && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Agent Selection */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Select Agent to Test</h3>
              
              {agents.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  <p>No agents available</p>
                  <p className="text-sm mt-2">Create an agent first to run evaluations</p>
                </div>
              ) : (
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.prompt.substring(0, 60)}...
                    </option>
                  ))}
                </select>
              )}

              {selectedAgentId && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-purple-400">Prompt:</span>{' '}
                    {agents.find(a => a.id === selectedAgentId)?.prompt}
                  </p>
                </div>
              )}
            </div>

            {/* Eval Set Info */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Evaluation Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Tests:</span>
                  <span className="text-white font-semibold">{evalSet.decisions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Expected Correct:</span>
                  <span className="text-green-400 font-semibold">
                    {evalSet.decisions.filter(d => d.label === 'correct').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Expected Incorrect:</span>
                  <span className="text-red-400 font-semibold">
                    {evalSet.decisions.filter(d => d.label === 'incorrect').length}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={runEvaluation}
              disabled={!selectedAgentId || agents.length === 0}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all shadow-lg"
            >
              🎯 Start Evaluation
            </button>
          </div>
        )}

        {/* Running State */}
        {running && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4 animate-bounce">🧪</div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-2">Running Evaluation...</h3>
                <p className="text-gray-400">{currentTest}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/60 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-purple-400 font-semibold">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Metrics */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Evaluation Results</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">{result.metrics.accuracy.toFixed(1)}%</div>
                  <div className="text-gray-400 text-sm mt-1">Overall Accuracy</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{result.metrics.buyAccuracy.toFixed(1)}%</div>
                  <div className="text-gray-400 text-sm mt-1">Buy Accuracy</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">{result.metrics.ignoreAccuracy.toFixed(1)}%</div>
                  <div className="text-gray-400 text-sm mt-1">Ignore Accuracy</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{result.metrics.total}</div>
                  <div className="text-gray-400 text-xs">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{result.metrics.correct}</div>
                  <div className="text-gray-400 text-xs">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{result.metrics.incorrect}</div>
                  <div className="text-gray-400 text-xs">Incorrect</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Detailed Results</h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      r.correct
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-cyan-400">{r.itemName}</span>
                        <span className="text-gray-400 text-sm ml-2">${r.itemPrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.expectedDecision === 'BUY'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          Expected: {r.expectedDecision}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.actualDecision === 'BUY'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          Got: {r.actualDecision}
                        </span>
                        <span className={`text-xl ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                          {r.correct ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setProgress(0);
                }}
                className="flex-1 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg font-semibold transition-all"
              >
                Run Another Test
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg font-semibold transition-all"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
