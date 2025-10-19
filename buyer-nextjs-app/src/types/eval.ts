import { AgentDecision } from './agent';

// A labeled decision with user feedback
export type LabeledDecision = {
  decision: AgentDecision;
  label: 'correct' | 'incorrect'; // User's evaluation
  notes?: string; // Optional notes about why it's correct/incorrect
};

// An evaluation set - a collection of labeled decisions
export type EvalSet = {
  id: string;
  name: string;
  description?: string;
  decisions: LabeledDecision[];
  createdAt: number;
  updatedAt: number;
  tags?: string[]; // Optional tags for categorization
};

// Result of running an agent against an eval set
export type EvalResult = {
  id: string;
  evalSetId: string;
  evalSetName: string;
  agentId: string;
  agentPrompt: string;
  runAt: number;
  results: {
    decisionId: string;
    itemName: string;
    itemPrice: number;
    expectedDecision: 'BUY' | 'IGNORE';
    actualDecision: 'BUY' | 'IGNORE';
    correct: boolean;
    label: 'correct' | 'incorrect'; // Original label from eval set
    reasoning?: string;
  }[];
  metrics: {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number; // Percentage
    buyAccuracy: number; // Accuracy on BUY decisions
    ignoreAccuracy: number; // Accuracy on IGNORE decisions
  };
};

// Summary statistics for eval sets
export type EvalSetStats = {
  totalSets: number;
  totalDecisions: number;
  avgDecisionsPerSet: number;
  correctLabels: number;
  incorrectLabels: number;
};
