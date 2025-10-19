# Evaluation System Updates - Agent-Specific Evals

## Changes Made

### 1. Agent-Specific Evaluation Sets

Evaluation sets are now tied to specific agents, allowing you to:
- Test how prompt changes affect agent performance
- Compare different agent prompts on the same test set
- Track agent improvements over time

### 2. Enhanced Mock Evaluation

The evaluation runner now uses an improved mock system that:
- **Keyword Matching**: Checks if item matches agent's interests
- **Price Thresholds**: Extracts price limits from prompts (e.g., "under $20")
- **Probabilistic Decisions**: Adds realistic randomness to decisions
- **Consistent Behavior**: Same agent + same item = similar (but not identical) results

### 3. Prompt Comparison

When running an eval, the system now shows:
- **Current Agent Prompt**: The prompt the agent has right now
- **Original Prompt**: The prompt when the eval set was created
- **Warning**: If prompts differ, alerts you that results will use current prompt

## Updated Data Structures

### EvalSet
```typescript
{
  id: string;
  name: string;
  description?: string;
  agentId: string;           // NEW: ID of agent this eval tests
  agentPrompt: string;       // NEW: Snapshot of prompt when created
  decisions: LabeledDecision[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}
```

### Decision Logic

The mock evaluation system now considers:

1. **Keyword Match** (from agent prompt)
   - Item name contains words from agent's prompt
   - Example: "coffee" agent → "Ethiopian Coffee" = match

2. **Price Constraint** (extracted from prompt)
   - Patterns: "under $X", "less than $X", "below $X", "max $X"
   - Example: "under $20" → extracts maxPrice = 20

3. **Decision Probability**
   - **High interest + good price**: 85% buy
   - **High interest + bad price**: 20% buy
   - **Low interest + good price**: 10% buy
   - **Low interest + bad price**: 5% buy

## Workflow Example

### Creating an Agent-Specific Eval Set

1. **Create an agent**
   ```
   > create Buy organic coffee under $20
   ```

2. **Let agent make decisions** (wait for it to see some items)

3. **Review those decisions**
   ```
   > review
   ```
   - Filter to that agent's decisions
   - Label decisions as correct/incorrect
   - Create eval set (automatically linked to agent)

4. **Modify agent prompt** (in agent tracker or agent list)
   ```
   New prompt: Buy any coffee under $25
   ```

5. **Run evaluation**
   ```
   > evals
   ```
   - Select your eval set
   - See original prompt: "under $20"
   - See current prompt: "under $25"
   - Run test to see how change affects performance

## UI Improvements

### Decision Review
- Now captures agent info when creating eval sets
- Automatically links eval set to the agent

### Eval Set Manager
- Shows agent prompt in eval set details
- Displays agent prompt in purple info box
- Makes it clear which agent the eval tests

### Eval Runner
- Shows current agent prompt
- Compares with original prompt (if different)
- Warns when prompts have changed
- Uses current prompt for testing

## Mock Evaluation Examples

### Example 1: Coffee Agent
```
Agent prompt: "Buy organic coffee under $20"

Items tested:
1. "Ethiopian Coffee" - $15
   → Keyword match: ✓
   → Price check: $15 ≤ $20 ✓
   → Result: BUY (85% probability)

2. "Premium Coffee Beans" - $25
   → Keyword match: ✓
   → Price check: $25 > $20 ✗
   → Result: IGNORE (80% probability)

3. "Green Tea" - $10
   → Keyword match: ✗
   → Price check: $10 ≤ $20 ✓
   → Result: IGNORE (90% probability)
```

### Example 2: Electronics Agent
```
Agent prompt: "Buy latest smartphone or tablet"

Items tested:
1. "iPhone 15 Pro" - $999
   → Keyword match: ✓ (smartphone)
   → No price limit
   → Result: BUY (70% probability)

2. "Samsung Tablet" - $599
   → Keyword match: ✓ (tablet)
   → No price limit
   → Result: BUY (70% probability)

3. "Coffee Maker" - $50
   → Keyword match: ✗
   → No price limit
   → Result: IGNORE (95% probability)
```

## Testing Prompt Improvements

### Scenario: Improving Coffee Agent

**Original Prompt**: "Buy coffee"
```
Test Results:
- Buys expensive coffee: ✗
- Buys low-quality coffee: ✗
- Misses good deals: ✗
- Accuracy: 40%
```

**Improved Prompt**: "Buy organic coffee under $20"
```
Test Results:
- Rejects expensive coffee: ✓
- Rejects low-quality: ✓
- Catches good deals: ✓
- Accuracy: 85%
```

**Further Improved**: "Buy organic, fair-trade coffee under $20 per pound"
```
Test Results:
- More specific matching
- Better price evaluation
- Accuracy: 92%
```

## API Reference

### EvalSetStore

New methods:
```typescript
// Get all eval sets for a specific agent
getEvalSetsByAgent(agentId: string): EvalSet[]

// Create eval set (updated signature)
createEvalSet(
  name: string,
  agentId: string,      // Agent this eval tests
  agentPrompt: string,  // Agent's current prompt
  description?: string,
  tags?: string[]
): EvalSet
```

## Files Modified

```
buyer-nextjs-app/
├── src/
│   ├── types/
│   │   └── eval.ts                     [MODIFIED] Added agentId, agentPrompt
│   ├── lib/
│   │   └── evalSetStore.ts             [MODIFIED] Updated createEvalSet signature
│   ├── components/
│   │   ├── DecisionReview.tsx          [MODIFIED] Capture agent info
│   │   ├── EvalSetManager.tsx          [MODIFIED] Show agent prompt
│   │   └── EvalRunner.tsx              [MODIFIED] Mock eval + prompt comparison
│   └── app/
│       └── page.tsx                    [MODIFIED] Pass evalSetId correctly
```

## Benefits

### 1. Prompt Iteration
- Create eval set with v1 prompt
- Modify prompt to v2
- Run eval to see improvement
- Keep iterating until accuracy improves

### 2. A/B Testing
- Create two agents with different prompts
- Run both on same eval set
- Compare accuracy scores
- Choose better prompt

### 3. Regression Testing
- Make eval set with current agent
- Later, modify agent
- Re-run eval to ensure no regression
- Maintain or improve performance

### 4. Documentation
- Eval sets capture prompt snapshots
- Historical record of what worked
- Can see how agent evolved

## Limitations & Future Work

### Current Mock System
- ✅ Fast (no API calls)
- ✅ Deterministic enough for testing
- ✅ Considers keywords and prices
- ⚠️ Not as smart as real LLM
- ⚠️ Can't understand complex reasoning
- ⚠️ Simple keyword matching only

### Future Enhancements
- [ ] Real LLM integration for evals
- [ ] More sophisticated decision logic
- [ ] Support for fine-tuning based on evals
- [ ] Auto-suggest prompt improvements
- [ ] Compare multiple agents side-by-side
- [ ] Version control for agent prompts
- [ ] Automated regression testing
- [ ] Performance trend charts

## Usage Tips

### Creating Good Eval Sets

1. **Start Simple**: Test 10-15 decisions first
2. **Cover Edge Cases**: Include borderline items
3. **Mix Decisions**: Both BUY and IGNORE
4. **Document Why**: Use notes to explain labels
5. **Test Iteratively**: Run → Improve → Re-run

### Improving Prompts

1. **Baseline First**: Run eval with current prompt
2. **One Change at a Time**: Modify single aspect
3. **Re-test**: Run eval again
4. **Compare**: Check if accuracy improved
5. **Document**: Note what worked

### Best Practices

✅ **DO**:
- Create eval sets early in development
- Re-run evals after prompt changes
- Document why decisions are correct/incorrect
- Test with diverse items
- Keep eval sets focused (one aspect)

❌ **DON'T**:
- Change eval set labels after creation
- Mix multiple agent types in one eval
- Over-fit to the eval set
- Ignore borderline cases
- Skip documenting reasoning

## Example Workflow

```bash
# Day 1: Create baseline
> create Buy coffee
> review  # Create eval set with 20 decisions
# Accuracy: 60%

# Day 2: Add specificity
Edit agent prompt: "Buy organic coffee"
> evals  # Run eval set
# Accuracy: 70% (+10%)

# Day 3: Add price constraint
Edit agent prompt: "Buy organic coffee under $20"
> evals  # Run eval set
# Accuracy: 85% (+15%)

# Day 4: Add quality criteria
Edit agent prompt: "Buy organic, single-origin coffee under $20"
> evals  # Run eval set
# Accuracy: 90% (+5%)

# Success! 30% improvement overall
```

## Summary

The evaluation system is now:
- ✅ **Agent-specific**: Each eval set tied to an agent
- ✅ **Prompt-aware**: Tracks original vs current prompt
- ✅ **Mock-ready**: Runs immediately without API calls
- ✅ **Improvement-focused**: Easy to iterate and compare
- ✅ **Educational**: Shows why decisions are made

You can now confidently test and improve your agents! 🎯
