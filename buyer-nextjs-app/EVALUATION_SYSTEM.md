# Agent Evaluation System

## Overview

A comprehensive frontend evaluation system that allows you to review agent decisions, create labeled test sets, and measure agent performance over time. All data is stored locally in the browser's localStorage.

## Features

### 1. **Decision Review** (`review` command)
- Browse all historical agent decisions
- Filter by decision type (BUY/IGNORE), search, and sort
- Select multiple decisions with checkboxes
- Label each decision as "correct" or "incorrect"
- Add optional notes explaining your evaluation
- Create named evaluation sets from selected decisions

### 2. **Evaluation Set Management** (`evals` command)
- View all created evaluation sets
- See statistics: total decisions, correct/incorrect breakdown
- Edit eval set name and description
- Delete eval sets (with confirmation)
- Launch evaluation runs from any set
- View historical test results

### 3. **Evaluation Runner** (automatic from eval manager)
- Select an agent to test
- Run agent against all decisions in the eval set
- Real-time progress indicator
- Detailed metrics:
  - Overall accuracy percentage
  - Buy decision accuracy
  - Ignore decision accuracy
  - Per-decision results breakdown
- Save results for future comparison
- Run multiple tests and track improvements

## Quick Start Guide

### Step 1: Review Decisions
```
> review
```

This opens the Decision Review window where you can:
1. See all agent decisions across all agents
2. Use filters to narrow down (search, decision type, sort)
3. Click checkboxes to select decisions
4. For each selected decision, mark it as ✓ Correct or ✗ Incorrect
5. Optionally add notes about why the decision was right/wrong

### Step 2: Create Evaluation Set

After selecting and labeling decisions:
1. Click "Create Eval Set" button
2. Enter a name (e.g., "Coffee Purchases Q4")
3. Add optional description
4. Click "Create"

Your eval set is now saved and ready to use!

### Step 3: Run Evaluation

```
> evals
```

In the Evaluation Manager:
1. Click on an eval set from the list
2. Click "🎯 Run Evaluation" button
3. Select which agent to test
4. Click "Start Evaluation"
5. Watch real-time progress as the agent processes each decision
6. Review detailed results and accuracy metrics

## Components

### DecisionReview Component
**File**: `src/components/DecisionReview.tsx`

**Features**:
- Fetches decisions from `/api/decisions`
- Multi-select with shift-click support
- Real-time search filtering
- Sort by time, price, or name
- Inline labeling UI
- Batch selection (select all visible)
- Modal for creating eval set with validation

**Props**:
```typescript
{
  agentId?: string;  // Optional filter by agent
  onClose?: () => void;
}
```

### EvalSetManager Component
**File**: `src/components/EvalSetManager.tsx`

**Features**:
- Two-panel layout: sets list + details
- Statistics dashboard
- Edit eval set metadata
- Delete confirmation modal
- Launch evaluation runs
- View historical test results

**Props**:
```typescript
{
  onRunEval?: (evalSetId: string) => void;
  onClose?: () => void;
}
```

### EvalRunner Component
**File**: `src/components/EvalRunner.tsx`

**Features**:
- Agent selection dropdown
- Eval set information display
- Real-time progress bar
- Animated running state
- Detailed results view with:
  - Accuracy metrics
  - Per-decision breakdown
  - Visual indicators (✓/✗)
- "Run Another Test" functionality

**Props**:
```typescript
{
  evalSetId: string;
  onClose?: () => void;
  onComplete?: (result: EvalResult) => void;
}
```

## Data Structures

### EvalSet
```typescript
{
  id: string;
  name: string;
  description?: string;
  decisions: LabeledDecision[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}
```

### LabeledDecision
```typescript
{
  decision: AgentDecision;  // Original decision
  label: 'correct' | 'incorrect';
  notes?: string;
}
```

### EvalResult
```typescript
{
  id: string;
  evalSetId: string;
  evalSetName: string;
  agentId: string;
  agentPrompt: string;
  runAt: number;
  results: Array<{
    decisionId: string;
    itemName: string;
    itemPrice: number;
    expectedDecision: 'BUY' | 'IGNORE';
    actualDecision: 'BUY' | 'IGNORE';
    correct: boolean;
    label: 'correct' | 'incorrect';
    reasoning?: string;
  }>;
  metrics: {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    buyAccuracy: number;
    ignoreAccuracy: number;
  };
}
```

## Storage Layer

### EvalSetStore
**File**: `src/lib/evalSetStore.ts`

A localStorage-backed store with methods:

**Eval Sets**:
- `getAllEvalSets(): EvalSet[]`
- `getEvalSet(id): EvalSet | null`
- `createEvalSet(name, description?, tags?): EvalSet`
- `updateEvalSet(id, updates): EvalSet | null`
- `deleteEvalSet(id): boolean`
- `addDecisionsToEvalSet(evalSetId, decisions): EvalSet | null`
- `removeDecisionFromEvalSet(evalSetId, decisionId): EvalSet | null`
- `updateDecisionLabel(evalSetId, decisionId, label, notes?): EvalSet | null`

**Eval Results**:
- `getAllEvalResults(): EvalResult[]`
- `getEvalResult(id): EvalResult | null`
- `getEvalResultsBySet(evalSetId): EvalResult[]`
- `getEvalResultsByAgent(agentId): EvalResult[]`
- `saveEvalResult(result): void`
- `deleteEvalResult(id): boolean`

**Utilities**:
- `getStats()` - Get aggregate statistics
- `clearAll()` - Clear all stored data

**Storage Keys**:
- `agent_eval_sets` - All evaluation sets
- `agent_eval_results` - All test results

## Commands

### review
Opens the Decision Review window to label decisions and create eval sets.
```bash
> review
```

### evals
Opens the Evaluation Set Manager to view, manage, and run evaluation sets.
```bash
> evals
```

## User Flow Example

### Creating an Eval Set

1. **Open Review Window**
   ```
   > review
   ```

2. **Filter Decisions** (optional)
   - Search for "coffee"
   - Filter to "BUY" only
   - Sort by price

3. **Select & Label**
   - Click checkbox on first decision
   - Click "✓ Correct" if agent made right choice
   - Click "✗ Incorrect" if agent made wrong choice
   - Add notes: "Should have bought - price was good"
   - Repeat for 10-20 decisions

4. **Create Eval Set**
   - Click "Create Eval Set"
   - Name: "Coffee Price Evaluation"
   - Description: "Tests if agent correctly identifies good coffee deals"
   - Click "Create"

### Running an Evaluation

1. **Open Eval Manager**
   ```
   > evals
   ```

2. **Select Eval Set**
   - Click "Coffee Price Evaluation" in list
   - See 15 decisions (10 correct, 5 incorrect expected)

3. **Run Test**
   - Click "🎯 Run Evaluation"
   - Select agent from dropdown
   - Click "Start Evaluation"
   - Watch progress: "Testing Ethiopian Blend (3/15)"

4. **Review Results**
   - Overall accuracy: 86.7%
   - Buy accuracy: 90.0%
   - Ignore accuracy: 80.0%
   - 13 correct, 2 incorrect
   - See which specific decisions failed

## Design Features

### Glassmorphism UI
- Frosted glass effect with backdrop blur
- Purple/cyan gradient accents
- Smooth hover transitions
- Shadow effects on focus

### Interactive Elements
- Hover states on all clickable items
- Scale animations on buttons
- Progress bars with gradient fills
- Loading states with pulse animations

### Color Coding
- **Cyan** (#00ffff) - Primary actions, headings
- **Purple** (#9333ea) - Secondary elements, borders
- **Green** (#22c55e) - Correct decisions, success states
- **Red** (#ef4444) - Incorrect decisions, errors
- **Gray** - Neutral elements, backgrounds

### Icons
- 📝 Review Decisions
- 🎯 Evaluation Sets
- 🧪 Test Runner
- ✓ Correct
- ✗ Incorrect
- 🏪 Marketplace
- 💰 Wallet

## API Integration

The eval runner calls the existing agent decision API:

```typescript
POST /agents/consider-purchase
{
  agentState: AgentState,
  itemState: ItemState
}

Response:
{
  decision: 'BUY' | 'IGNORE',
  purchaseIntentId?: number
}
```

This allows testing real agent behavior against historical decisions.

## Best Practices

### Creating Good Eval Sets

1. **Diverse Examples**: Include mix of BUY and IGNORE decisions
2. **Edge Cases**: Add borderline decisions where correct answer isn't obvious
3. **Consistent Criteria**: Label decisions based on consistent rules
4. **Size**: 10-30 decisions per set is ideal (enough data, not too time-consuming)
5. **Documentation**: Use descriptions to explain what the eval set tests

### Labeling Decisions

1. **Be Objective**: Base labels on stated criteria, not hindsight
2. **Add Context**: Use notes to explain reasoning
3. **Consider Prompt**: Evaluate if agent followed its instructions
4. **Price Sensitivity**: Note if price was the deciding factor
5. **Item Match**: Check if item aligns with agent's interests

### Running Evaluations

1. **Baseline First**: Run eval immediately after creating it
2. **Track Changes**: Re-run after modifying agent prompts
3. **Compare Agents**: Run multiple agents on same eval set
4. **Iterate**: Use results to refine agent prompts
5. **Document**: Keep notes on what changes improved performance

## Future Enhancements

### Potential Features
- [ ] Export eval sets as JSON
- [ ] Import eval sets from files
- [ ] Share eval sets with other users
- [ ] Comparison view (agent A vs agent B)
- [ ] Trend charts over time
- [ ] Confidence scores for decisions
- [ ] Category tags for eval sets
- [ ] Batch operations (delete multiple sets)
- [ ] Undo/redo for labeling
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

### Backend Integration
- [ ] Store eval sets in database
- [ ] Multi-user support
- [ ] Real-time collaboration
- [ ] Eval set versioning
- [ ] Automated eval runs on agent creation
- [ ] Scheduled eval runs
- [ ] Email notifications for test results

## Troubleshooting

### Decisions Not Loading
- Check browser console for API errors
- Verify express-server is running
- Check `/api/decisions` endpoint

### Eval Set Not Saving
- Check browser localStorage quota
- Try clearing old data: `localStorage.clear()`
- Open browser DevTools > Application > Local Storage

### Evaluation Stuck
- Check that agent endpoint is responding
- Look for errors in console
- Try refreshing page and running again

### Results Inconsistent
- Remember: LLM responses can vary
- Agent may be non-deterministic
- Try running multiple times for average

## Technical Notes

### localStorage Limits
- Most browsers: ~5-10MB limit
- Each eval set: ~1-5KB
- Each result: ~2-10KB
- Can store hundreds of eval sets comfortably

### Performance
- Decision list: Virtualized for 1000+ items
- Eval runs: Sequential (300ms between decisions)
- No server load (all frontend processing)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage support
- Requires fetch API

## Summary

The evaluation system provides a complete solution for:
- ✅ Reviewing agent decisions with rich filtering
- ✅ Creating labeled test sets with notes
- ✅ Running agents against test sets
- ✅ Measuring accuracy and performance
- ✅ Tracking improvements over time
- ✅ Comparing different agents

All with a beautiful, intuitive UI and no backend required!

## Commands Quick Reference

| Command | Description | Window |
|---------|-------------|--------|
| `review` | Review and label agent decisions | Decision Review |
| `evals` | Manage evaluation sets and run tests | Eval Manager |

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | Open Review |
| `Ctrl+E` | Open Evals |
| `Space` | Toggle selection |
| `Shift+Click` | Select range |
| `Ctrl+A` | Select all |
| `Delete` | Remove selected |
| `Escape` | Close modal |

---

**Made with ❤️ for better AI agent testing**
