import { EvalSet, EvalResult, LabeledDecision } from '@/types/eval';

const EVAL_SETS_KEY = 'agent_eval_sets';
const EVAL_RESULTS_KEY = 'agent_eval_results';

/**
 * Local storage manager for evaluation sets
 */
export class EvalSetStore {
  // ========== Eval Sets ==========
  
  getAllEvalSets(): EvalSet[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(EVAL_SETS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getEvalSet(id: string): EvalSet | null {
    const sets = this.getAllEvalSets();
    return sets.find(set => set.id === id) || null;
  }

  createEvalSet(name: string, agentId: string, agentPrompt: string, description?: string, tags?: string[]): EvalSet {
    const newSet: EvalSet = {
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      agentId,
      agentPrompt,
      decisions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: tags || []
    };

    const sets = this.getAllEvalSets();
    sets.push(newSet);
    this.saveEvalSets(sets);
    return newSet;
  }

  updateEvalSet(id: string, updates: Partial<EvalSet>): EvalSet | null {
    const sets = this.getAllEvalSets();
    const index = sets.findIndex(set => set.id === id);
    
    if (index === -1) return null;

    sets[index] = {
      ...sets[index],
      ...updates,
      id: sets[index].id, // Don't allow ID changes
      updatedAt: Date.now()
    };

    this.saveEvalSets(sets);
    return sets[index];
  }

  deleteEvalSet(id: string): boolean {
    const sets = this.getAllEvalSets();
    const filtered = sets.filter(set => set.id !== id);
    
    if (filtered.length === sets.length) return false;

    this.saveEvalSets(filtered);
    
    // Also delete associated results
    const results = this.getAllEvalResults();
    const filteredResults = results.filter(result => result.evalSetId !== id);
    this.saveEvalResults(filteredResults);
    
    return true;
  }

  addDecisionsToEvalSet(evalSetId: string, decisions: LabeledDecision[]): EvalSet | null {
    const evalSet = this.getEvalSet(evalSetId);
    if (!evalSet) return null;

    const updatedDecisions = [...evalSet.decisions, ...decisions];
    
    return this.updateEvalSet(evalSetId, {
      decisions: updatedDecisions
    });
  }

  removeDecisionFromEvalSet(evalSetId: string, decisionId: string): EvalSet | null {
    const evalSet = this.getEvalSet(evalSetId);
    if (!evalSet) return null;

    const updatedDecisions = evalSet.decisions.filter(
      ld => ld.decision.id !== decisionId
    );
    
    return this.updateEvalSet(evalSetId, {
      decisions: updatedDecisions
    });
  }

  updateDecisionLabel(
    evalSetId: string, 
    decisionId: string, 
    label: 'correct' | 'incorrect',
    notes?: string
  ): EvalSet | null {
    const evalSet = this.getEvalSet(evalSetId);
    if (!evalSet) return null;

    const updatedDecisions = evalSet.decisions.map(ld => {
      if (ld.decision.id === decisionId) {
        return { ...ld, label, notes };
      }
      return ld;
    });
    
    return this.updateEvalSet(evalSetId, {
      decisions: updatedDecisions
    });
  }

  private saveEvalSets(sets: EvalSet[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EVAL_SETS_KEY, JSON.stringify(sets));
  }

  getEvalSetsByAgent(agentId: string): EvalSet[] {
    const sets = this.getAllEvalSets();
    return sets.filter(set => set.agentId === agentId);
  }

  // ========== Eval Results ==========
  
  getAllEvalResults(): EvalResult[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(EVAL_RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getEvalResult(id: string): EvalResult | null {
    const results = this.getAllEvalResults();
    return results.find(result => result.id === id) || null;
  }

  getEvalResultsBySet(evalSetId: string): EvalResult[] {
    const results = this.getAllEvalResults();
    return results.filter(result => result.evalSetId === evalSetId);
  }

  getEvalResultsByAgent(agentId: string): EvalResult[] {
    const results = this.getAllEvalResults();
    return results.filter(result => result.agentId === agentId);
  }

  saveEvalResult(result: EvalResult): void {
    const results = this.getAllEvalResults();
    results.push(result);
    this.saveEvalResults(results);
  }

  deleteEvalResult(id: string): boolean {
    const results = this.getAllEvalResults();
    const filtered = results.filter(result => result.id !== id);
    
    if (filtered.length === results.length) return false;

    this.saveEvalResults(filtered);
    return true;
  }

  private saveEvalResults(results: EvalResult[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EVAL_RESULTS_KEY, JSON.stringify(results));
  }

  // ========== Utility Methods ==========
  
  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(EVAL_SETS_KEY);
    localStorage.removeItem(EVAL_RESULTS_KEY);
  }

  getStats() {
    const sets = this.getAllEvalSets();
    const totalDecisions = sets.reduce((sum, set) => sum + set.decisions.length, 0);
    const correctLabels = sets.reduce(
      (sum, set) => sum + set.decisions.filter(d => d.label === 'correct').length,
      0
    );
    const incorrectLabels = sets.reduce(
      (sum, set) => sum + set.decisions.filter(d => d.label === 'incorrect').length,
      0
    );

    return {
      totalSets: sets.length,
      totalDecisions,
      avgDecisionsPerSet: sets.length > 0 ? totalDecisions / sets.length : 0,
      correctLabels,
      incorrectLabels
    };
  }
}

// Singleton instance
export const evalSetStore = new EvalSetStore();
