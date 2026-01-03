# Implementation Skill: Updated Workflow (Token-Efficient)

## 7-Step Implementation Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Get Current Feature                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ IF .claude/scripts/get-current-feature.sh exists:                          │
│   → Execute script                                                         │
│ ELSE:                                                                       │
│   → Read .claude/progress/feature-list.json                                │
│                                                                             │
│ OUTPUT: { feature_id, description, acceptance_criteria }                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Analyze Codebase Context (TOKEN-EFFICIENT - PROACTIVE)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ✨ PROACTIVELY use sandbox execution to save 95-99% tokens                 │
│                                                                             │
│ A. Use execute_code (98% savings)                                          │
│    • Analyze project structure (find relevant files, modules)              │
│    • Search for similar code patterns (validators, handlers)               │
│    • Check test structure and patterns                                     │
│    • Validate syntax and imports                                           │
│    • Count code metrics                                                    │
│                                                                             │
│ B. Use process_logs (95% savings)                                          │
│    • Search error logs for related issues                                  │
│    • Find integration points and known blockers                            │
│    • Pattern match for warnings                                            │
│                                                                             │
│ C. Use process_csv (99% savings)                                           │
│    • Analyze data patterns (if data processing involved)                   │
│    • Filter, aggregate, understand data format                             │
│    • Find edge cases and examples                                          │
│                                                                             │
│ OUTCOME: Full codebase context with 95-99% token savings                   │
│          (vs 5000+ tokens loading raw files)                               │
│                                                                             │
│ LOAD: references/token-efficient-mcp-patterns.md for detailed patterns     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Query Past Decisions (Context Graph)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Use MCP: context_query_traces(query=feature_description)                   │
│                                                                             │
│ SEARCH FOR:                                                                │
│ • Similar features implemented before                                      │
│ • Architectural patterns and decisions                                     │
│ • Known blockers and solutions                                             │
│ • Tested approaches from past work                                         │
│                                                                             │
│ COMBINE: With Step 2 codebase analysis for informed decisions              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Implement Feature                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. Follow project patterns from CLAUDE.md                                  │
│ 2. Write tests alongside code (test-driven)                                │
│ 3. Use token-efficient MCP for data >50 items:                             │
│    • execute_code: Code analysis, transformations, validation              │
│    • process_logs: Pattern matching, log analysis                          │
│    • process_csv: Filtering, aggregation, analysis                         │
│                                                                             │
│ LOAD:                                                                      │
│ • references/coding-patterns.md (project style)                            │
│ • references/mcp-usage.md (token efficiency)                               │
│ • references/async-parallel-operations.md (if needed)                      │
│                                                                             │
│ OUTCOME: Feature implemented with tests                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Verify Implementation                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ IF .claude/scripts/health-check.sh exists:                                 │
│   → Execute script (project-specific health check)                         │
│ ELSE:                                                                       │
│   → Manual verification                                                    │
│                                                                             │
│ CHECKS:                                                                    │
│ • Code compiles, no syntax errors                                          │
│ • Tests pass (all unit/integration tests)                                  │
│ • No regressions in existing functionality                                 │
│ • All services healthy (if multi-service)                                  │
│                                                                             │
│ LOAD: references/health-checks.md (if needed)                              │
│                                                                             │
│ EXIT CODES:                                                                │
│   0 = Healthy → Proceed to Step 6                                          │
│   1 = Broken → Go back to Step 4, fix issues                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Commit Changes                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ IF .claude/scripts/feature-commit.sh exists:                               │
│   → Execute script (project-specific commit format)                        │
│ ELSE:                                                                       │
│   → Manual commit: git commit -m "[feat-id] description"                   │
│                                                                             │
│ REQUIREMENT: Commit message MUST include feature ID                        │
│              Used for traceability and learning                            │
│                                                                             │
│ OUTCOME: Changes committed to git                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Mark Feature Complete                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ IF .claude/scripts/mark-feature-complete.sh exists:                        │
│   → Execute script (project-specific status update)                        │
│ ELSE:                                                                       │
│   → Manual update: Set feature.status = "implemented" in feature-list.json │
│                                                                             │
│ OUTCOME: feature-list.json updated                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXIT CRITERIA (Code Verified) ✓                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ✓ Feature implementation complete (code written, tests passing)            │
│ ✓ Changes committed to git with feature ID in message                      │
│ ✓ feature-list.json updated (status: "implemented")                        │
│ ✓ No regressions in existing functionality                                 │
│                                                                             │
│ IF MORE FEATURES: → Cycle back to STEP 1                                   │
│ IF NO MORE FEATURES: → Transition to TEST state                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Enhancement: Step 2 (Token-Efficient Analysis)

### Before (No Proactive Analysis)

```
Get Feature
  ↓
Query Context Graph  ← Only searches past decisions
  ↓
Implement  ← Blind implementation, no codebase awareness
  ↓
Discover patterns too late ✗
```

### After (With Proactive Token-Efficient Analysis)

```
Get Feature
  ↓
Analyze Codebase (PROACTIVE) ← execute_code, process_logs, process_csv
├─ Find similar code patterns (reuse)
├─ Understand project structure
├─ Analyze error logs (integration points)
└─ 95-99% token savings via sandbox execution

  ↓
Query Context Graph  ← Combines analysis with past decisions
  ↓
Implement with FULL CONTEXT  ← Informed implementation
  ↓
Patterns already known ✓
```

---

## Token Efficiency Comparison

| Step | Traditional | Token-Efficient | Savings |
|------|-------------|-----------------|---------|
| Get feature | ~100 tokens | ~100 tokens | — |
| Analyze context | 5000+ tokens | ~200 tokens | **96%** |
| Query graph | ~500 tokens | ~500 tokens | — |
| Implement | 3000+ tokens | 1000 tokens | **67%** |
| Verify | ~200 tokens | ~200 tokens | — |
| Commit | ~100 tokens | ~100 tokens | — |
| Mark complete | ~50 tokens | ~50 tokens | — |
| **TOTAL** | **~8950 tokens** | **~2150 tokens** | **76% savings** |

---

## Token-Efficient MCP Tools

### execute_code (98% savings)

Analyze project without loading files to context.

```python
# Find relevant files
files = execute_code("""
import os
for root, dirs, files in os.walk('gateway'):
    for f in files:
        if 'validator' in f: print(f"{root}/{f}")
""")
# Returns: ~200 tokens
# Traditional: Read 20 files = ~5000 tokens
# Savings: 96%
```

### process_logs (95% savings)

Search logs for patterns without loading entire file.

```bash
# Find validation errors
result = process_logs(
    file_path="logs/errors.log",
    pattern="validation|validator",
    limit=10
)
# Returns: ~200 tokens
# Traditional: Load entire log = ~3000 tokens
# Savings: 93%
```

### process_csv (99% savings)

Analyze data without loading entire CSV to context.

```bash
# Get rejection statistics
result = process_csv(
    file_path="data/test.csv",
    filter_expr="status='rejected'",
    agg_func="count",
    aggregate_by="provider"
)
# Returns: ~100 tokens
# Traditional: Load entire CSV = ~8000 tokens
# Savings: 98%
```

---

## When Each Tool is Used

### Step 2: Proactive Analysis

- **execute_code**: Analyze project structure, find similar code
- **process_logs**: Search error logs for integration issues
- **process_csv**: Understand data patterns

### Step 4: Implementation

- **execute_code**: Code transformations, validation, analysis
- **process_logs**: Debug specific integration issues
- **process_csv**: Process large datasets

---

## Project Integration

| Component | How It Works |
|-----------|-------------|
| **SKILL.md** | Workflow steps (abstract) |
| **token-efficient-mcp-patterns.md** | Reference: detailed patterns and examples |
| **coding-patterns.md** | Project-specific implementation style |
| **health-checks.md** | Verification strategies |
| **.claude/scripts/** | Project-specific automation (optional) |
| **.claude/config/project.json** | Project health check, test command |

---

## Quick Reference

**STEP 2 - Analyze Codebase Context:**

```bash
# Find relevant files
execute_code("find . -name '*validator*.py' | head -5")

# Check test patterns
execute_code("grep -r 'def test_' tests/ | head -5")

# Search error logs
process_logs("logs/errors.log", pattern="validation")

# Analyze data
process_csv("data.csv", filter_expr="status='error'", agg_func="count")
```

**Result**: Full context with minimal tokens.

---

## Best Practices

1. ✅ **Always use Step 2** - Proactive analysis saves 95-99% tokens
2. ✅ **Combine tools** - execute_code + process_logs + process_csv for complete picture
3. ✅ **Limit output** - Use `head`, `limit` to reduce output size
4. ✅ **Pattern first** - Search by pattern, then read matching code
5. ✅ **Sandbox only** - Never load raw data to context window
6. ✅ **Exit on sufficient** - Stop once you have enough context

---

## See Also

- `references/token-efficient-mcp-patterns.md` - Detailed patterns
- `references/coding-patterns.md` - Project implementation style
- `references/mcp-usage.md` - MCP tool usage
- `README.md` - Script setup guide
