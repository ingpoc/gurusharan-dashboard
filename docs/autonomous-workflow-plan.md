# Autonomous Development Workflow Plan

## Overview

This document defines the ideal autonomous development workflow from session start to project completion. It addresses critical flaws in the current system and introduces human decision gates at strategic points.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Autonomy ≠ No human input** | Human input at the RIGHT moments, not constant oversight |
| **Bi-directional state flow** | Can backtrack to fix architectural mistakes, not just bugs |
| **Dependencies enforced** | Can't implement feature until prerequisites are tested |
| **Test-first implementation** | Tests written before code, must fail first |
| **Evidence-based completion** | Tests pass + acceptance criteria verified + human approval |
| **Learning enforced** | Past mistakes prevent future ones (not just advisory) |

---

## State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
               ┌─────────┐                                 │
               │  START  │                                 │
               └────┬────┘                                 │
                    │                                      │
                    ▼                                      │
               ┌─────────┐   Major changes needed          │
       ┌──────►│  INIT   │◄────────────────────────────────┤
       │       └────┬────┘                                 │
       │            │ Approved breakdown                   │
       │            ▼                                      │
       │       ┌───────────┐                               │
       │  ┌───►│ IMPLEMENT │◄──────────────┐               │
       │  │    └─────┬─────┘               │               │
       │  │          │ All implemented     │               │
       │  │          ▼                     │               │
       │  │    ┌───────────┐               │               │
       │  │    │   TEST    │───────────────┘               │
       │  │    └─────┬─────┘  Tests fail                   │
       │  │          │ Tests pass                          │
       │  │          ▼                                     │
       │  │    ┌───────────┐                               │
       │  │    │ VALIDATE  │───────────────────────────────┤
       │  │    └─────┬─────┘  Rejected (minor)    Rejected │
       │  │          │ Approved                   (major)  │
       │  │          ▼                                     │
       │  │    ┌───────────┐                               │
       │  └────│ COMPLETE  │───────────────────────────────┘
       │       └─────┬─────┘  New features/bugs
       │             │
       └─────────────┘
```

### State Transitions

| From | To | Trigger |
|------|----|---------|
| START | INIT | Session starts, no feature-list.json |
| START | IMPLEMENT | Session starts, features exist |
| INIT | IMPLEMENT | Feature breakdown approved |
| IMPLEMENT | TEST | All features implemented |
| IMPLEMENT | IMPLEMENT | Loop for next feature |
| TEST | IMPLEMENT | Tests fail |
| TEST | VALIDATE | All tests pass |
| VALIDATE | COMPLETE | Human approves |
| VALIDATE | IMPLEMENT | Human rejects (minor changes) |
| VALIDATE | INIT | Human rejects (major changes) |
| COMPLETE | IMPLEMENT | New features or bugs reported |
| COMPLETE | INIT | Requirements change significantly |

---

## Phase 1: Session Start

### Entry Protocol

```
SESSION START
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Environment Validation                            │
│  ─────────────────────────────────────────────────────────  │
│  • Check ALL required services (not just "something runs")  │
│  • Verify env vars, API keys, database connectivity         │
│  • Verify schema version matches expectations               │
│  • Check external dependencies (APIs, MCP servers)          │
│  • Output: Detailed report with severity levels             │
│            (CRITICAL / WARNING / INFO) not binary           │
└─────────────────────────────────────────────────────────────┘
     │
     ├── CRITICAL failure ──► AskUserQuestion: "Health Issue"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Session Context Recovery                          │
│  ─────────────────────────────────────────────────────────  │
│  • Load last session summary (if exists)                    │
│  • Check what was in progress (WIP feature?)                │
│  • Verify git state (uncommitted changes? stashed work?)    │
│  • Detect conflicts between saved state and reality         │
│  • Output: "You were working on Feature X, Y was failing"   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: State Verification (Reality Check)                │
│  ─────────────────────────────────────────────────────────  │
│  • Don't trust state.json blindly                           │
│  • If state=COMPLETE but tests fail → auto-correct to TEST  │
│  • If state=IMPLEMENT but feature done → advance state      │
│  • Reconcile declared state with actual project state       │
│  • Output: Verified current state                           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: Skill Loading                                     │
│  ─────────────────────────────────────────────────────────  │
│  • Load skill based on VERIFIED state (not declared state)  │
│  • Present context: "State is X, loading Y skill"           │
│  • Offer override: "Or tell me what you want to do"         │
└─────────────────────────────────────────────────────────────┘
```

### AskUserQuestion: Health Issue

```
Header: "Health Issue"

Question: "Health check failed: [specific error].
Auto-restart didn't fix it. What should I do?"

Options:
• "Diagnose and fix automatically"
• "Show me the error, I'll fix manually"
• "Continue anyway (risky)"
• "End session, I'll fix environment"
```

---

## Phase 2: INIT State

### Workflow

```
INIT STATE
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Requirements Collection                            │
│  ─────────────────────────────────────────────────────────  │
│  • Gather from: user input, PRD, existing code, tickets     │
│  • Categorize: MUST / SHOULD / COULD / WON'T (MoSCoW)       │
│  • Store as: requirements.json (source of truth)            │
│  • Output: Structured requirements document                 │
└─────────────────────────────────────────────────────────────┘
     │
     ├── Ambiguous requirement ──► AskUserQuestion: "Clarification"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Feature Breakdown (with Dependencies)              │
│  ─────────────────────────────────────────────────────────  │
│  Each feature gets:                                         │
│  • id: Unique identifier                                    │
│  • description: What it does                                │
│  • requirement_ids: Which requirements it satisfies         │
│  • depends_on: [feature IDs that must be done first]        │
│  • acceptance_criteria: How to know it's done               │
│  • test_types: [unit, integration, e2e, browser]            │
│  • complexity: S / M / L                                    │
│  • priority: MUST / SHOULD / COULD                          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Dependency Graph & Execution Order                 │
│  ─────────────────────────────────────────────────────────  │
│  • Build DAG from depends_on relationships                  │
│  • Detect circular dependencies (ERROR - block)             │
│  • Topological sort → execution order                       │
│  • Identify parallelizable features (same depth in DAG)     │
│  • Output: feature-graph.json + execution-order.json        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Human Approval Gate (MANDATORY)                    │
│  ─────────────────────────────────────────────────────────  │
│  • Present breakdown to user via AskUserQuestion            │
│  • Show: features, dependencies, execution order            │
│  • Allow: add/remove/edit features                          │
│  • BLOCK until explicit approval                            │
│  • Output: Approved feature-list.json                       │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Infrastructure Setup                               │
│  ─────────────────────────────────────────────────────────  │
│  • Create .claude/progress/, .claude/config/                │
│  • Install project hooks                                    │
│  • Verify dependencies (npm install, pip install)           │
│  • Run initial health check                                 │
│  • Output: Ready-to-implement state                         │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  TRANSITION TO IMPLEMENT
```

### Feature Schema

```json
{
  "id": "F001",
  "description": "User authentication with JWT",
  "requirement_ids": ["R001", "R002"],
  "depends_on": ["F000-database-setup"],
  "acceptance_criteria": [
    "User can register with email/password",
    "User can login and receive JWT",
    "Invalid credentials return 401"
  ],
  "test_types": ["unit", "integration", "api"],
  "complexity": "M",
  "priority": "MUST",
  "status": "pending"
}
```

### AskUserQuestion: Feature Plan

```
Header: "Feature Plan"

Question: "I've broken down your requirements into X
features with dependencies. Review the plan?"

Options:
• "Approve and proceed" (Recommended)
• "Show me the breakdown first"
• "I want to modify features"
• "Start over with different approach"
```

### AskUserQuestion: Clarification

```
Header: "Clarification"

Question: "Requirement [X] is ambiguous. Did you mean
[interpretation A] or [interpretation B]?"

Options:
• "Interpretation A"
• "Interpretation B"
• "Neither - let me explain"
• "Skip this requirement for now"
```

---

## Phase 3: IMPLEMENT State

### Workflow

```
IMPLEMENT STATE
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Feature Selection (Dependency-Aware)               │
│  ─────────────────────────────────────────────────────────  │
│  • Get next feature from execution-order.json               │
│  • Verify ALL depends_on features are status=tested         │
│  • If dependencies not met → AskUserQuestion                │
│  • Output: Current feature context                          │
└─────────────────────────────────────────────────────────────┘
     │
     ├── Dependencies missing ──► AskUserQuestion: "Dependency Block"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Precedent Lookup (Learn from Past)                 │
│  ─────────────────────────────────────────────────────────  │
│  • Query context-graph: "Similar features I've built"       │
│  • Query: "Mistakes I've made on similar features"          │
│  • Query: "Architectural decisions in this domain"          │
│  • If relevant past mistake found → AskUserQuestion         │
│  • Output: Lessons to apply (ENFORCED, not advisory)        │
└─────────────────────────────────────────────────────────────┘
     │
     ├── Past mistake relevant ──► AskUserQuestion: "Past Issue"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Design Phase (for M/L complexity)                  │
│  ─────────────────────────────────────────────────────────  │
│  • If complexity = S: Skip                                  │
│  • If complexity = M/L:                                     │
│    - Document approach                                      │
│    - List affected files                                    │
│    - Identify API/schema changes                            │
│    - AskUserQuestion for approval                           │
│    - Store design in context-graph                          │
│  • Output: Design document (or skip marker)                 │
└─────────────────────────────────────────────────────────────┘
     │
     ├── M/L complexity ──► AskUserQuestion: "Design Review"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Test-First Implementation (CRITICAL)               │
│  ─────────────────────────────────────────────────────────  │
│  A. Write acceptance tests FROM acceptance_criteria         │
│  B. Run tests → MUST FAIL (proves tests are real)           │
│  C. Implement feature                                       │
│  D. Run tests → MUST PASS                                   │
│  E. If tests passed without failing first → WARNING         │
│  • Output: Implementation + tests that prove it works       │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Self-Review Checklist                              │
│  ─────────────────────────────────────────────────────────  │
│  • Security: No secrets, no SQL injection, no XSS           │
│  • Performance: No N+1 queries, no unbounded loops          │
│  • Edge cases: Null handling, empty arrays, large inputs    │
│  • Past mistakes: Apply lessons from context-graph          │
│  • Output: Checklist pass/fail                              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Commit with Traceability                           │
│  ─────────────────────────────────────────────────────────  │
│  • Commit message includes: feature ID                      │
│  • Commit tagged for potential rollback                     │
│  • Store trace in context-graph: decision + outcome         │
│  • Output: Traceable commit                                 │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Mark as IMPLEMENTED (not complete)                 │
│  ─────────────────────────────────────────────────────────  │
│  • Status: pending → implemented                            │
│  • NOT "tested" yet - that happens in TEST state            │
│  • NOT "validated" yet - that happens in VALIDATE state     │
│  • Output: Feature ready for testing                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  IF more pending features → LOOP
  IF all implemented → TRANSITION TO TEST
```

### AskUserQuestion: Dependency Block

```
Header: "Dependency Block"

Question: "Feature [X] depends on [Y, Z] which aren't
tested yet. What should I do?"

Options:
• "Implement dependencies first" (Recommended)
• "Skip this, work on something else"
• "Override - implement anyway (risky)"
• "Remove this dependency"
```

### AskUserQuestion: Past Issue

```
Header: "Past Issue"

Question: "Similar feature [X] had issue [Y] before.
Should I apply the fix that worked, or try new approach?"

Options:
• "Apply the known fix" (Recommended)
• "Try a new approach"
• "Show me the past issue details"
• "Ignore - this is different"
```

### AskUserQuestion: Design Review

```
Header: "Design Review"

Question: "Feature [X] requires [schema change / API
change / architectural decision]. My approach: [brief].
Proceed?"

Options:
• "Proceed with this approach" (Recommended)
• "Explain more before I decide"
• "Use a different approach"
• "Skip this feature for now"
```

---

## Phase 4: TEST State

### Workflow

```
TEST STATE
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Unit Tests                                        │
│  ─────────────────────────────────────────────────────────  │
│  • Run: pytest / jest / cargo test                          │
│  • Require: 100% pass for features in this cycle            │
│  • Allow: Known failures (tracked, not new)                 │
│  • Output: Unit test report + coverage                      │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Integration Tests                                 │
│  ─────────────────────────────────────────────────────────  │
│  • Run tests that span multiple features                    │
│  • Verify: Feature A + Feature B work together              │
│  • Detect: Regressions (new feature broke old feature)      │
│  • Output: Integration test report                          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: End-to-End Tests                                  │
│  ─────────────────────────────────────────────────────────  │
│  • Run full user journeys (not just isolated features)      │
│  • Use: claude-in-chrome for browser flows                  │
│  • Cover: Critical paths (login → action → logout)          │
│  • Output: E2E report + screenshots + console logs          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: Acceptance Criteria Verification                  │
│  ─────────────────────────────────────────────────────────  │
│  For EACH feature:                                          │
│    For EACH acceptance criterion:                           │
│      • Provide evidence (test output, screenshot, etc.)     │
│      • Mark: MET / NOT MET / PARTIAL                        │
│  • Output: Acceptance matrix per feature                    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: Requirements Coverage                             │
│  ─────────────────────────────────────────────────────────  │
│  • Compare: requirements.json vs feature-list.json          │
│  • Calculate: % of requirements covered by tested features  │
│  • Identify: Gaps (requirements with no feature)            │
│  • Identify: Orphans (features with no requirement)         │
│  • Output: Coverage matrix                                  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 6: Evidence Collection                               │
│  ─────────────────────────────────────────────────────────  │
│  • Store: All test outputs in /tmp/test-evidence/           │
│  • Store: Screenshots, API responses, logs                  │
│  • Create: Audit trail for each feature                     │
│  • Output: Evidence package (required for VALIDATE)         │
└─────────────────────────────────────────────────────────────┘
     │
     ├── 3+ failures ──► AskUserQuestion: "Test Failure"
     │
     ▼
  IF any test fails → TRANSITION BACK TO IMPLEMENT
  IF all pass → TRANSITION TO VALIDATE
```

### AskUserQuestion: Test Failure

```
Header: "Test Failure"

Question: "Tests for [X] have failed 3 times. Root cause
appears to be [Y]. How should I proceed?"

Options:
• "Try a different approach"
• "Show me the error details"
• "Skip this test for now"
• "This is a flaky test - mark as known issue"
```

---

## Phase 5: VALIDATE State (NEW)

### Workflow

```
VALIDATE STATE
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Present Acceptance Report                          │
│  ─────────────────────────────────────────────────────────  │
│  Show user:                                                 │
│  • What was built (feature list with descriptions)          │
│  • How it was tested (test types, coverage)                 │
│  • Evidence (screenshots, test outputs)                     │
│  • Requirements coverage (% and gaps)                       │
│  • Output: Formatted acceptance report                      │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Demo Walkthrough (Optional)                        │
│  ─────────────────────────────────────────────────────────  │
│  • If UI exists: Walk through key flows in browser          │
│  • If API: Show example requests/responses                  │
│  • If CLI: Run demo commands                                │
│  • Output: User sees system working                         │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Human Decision Gate (MANDATORY)                    │
│  ─────────────────────────────────────────────────────────  │
│  Ask user via AskUserQuestion                               │
│  • "Does this meet your requirements?"                      │
│  Options:                                                   │
│  • APPROVE → Transition to COMPLETE                         │
│  • REJECT → Transition to IMPLEMENT (revision cycle)        │
│  • MODIFY → Add/change features → back to INIT              │
│  • Output: Explicit human approval or rejection             │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Revision Handling (if rejected)                    │
│  ─────────────────────────────────────────────────────────  │
│  • Collect feedback: What's wrong? What's missing?          │
│  • Create revision features (linked to original)            │
│  • Track: Revision cycle count                              │
│  • Transition: Back to IMPLEMENT or INIT                    │
│  • Output: New features added to feature-list.json          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  IF approved → TRANSITION TO COMPLETE
  IF rejected → TRANSITION TO IMPLEMENT (or INIT for major changes)
```

### AskUserQuestion: Acceptance

```
Header: "Acceptance"

Question: "All X features implemented and tested.
Requirements coverage: Y%. Ready to review?"

Options:
• "Show me a demo" (Recommended)
• "Show acceptance report"
• "Approve - mark as complete"
• "I have changes to request"
```

---

## Phase 6: COMPLETE State

### Workflow

```
COMPLETE STATE
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Generate Documentation                             │
│  ─────────────────────────────────────────────────────────  │
│  • Summary of what was built                                │
│  • List of features with acceptance criteria                │
│  • Known issues / limitations                               │
│  • API documentation (if applicable)                        │
│  • Output: project-summary.md                               │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Learning Loop                                      │
│  ─────────────────────────────────────────────────────────  │
│  • Extract patterns: What worked?                           │
│  • Extract anti-patterns: What failed?                      │
│  • Store in context-graph for future projects               │
│  • Identify automation candidates (repeated actions)        │
│  • Output: lessons-learned.json                             │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Create Rollback Point                              │
│  ─────────────────────────────────────────────────────────  │
│  • Tag current commit as release point                      │
│  • Store rollback instructions                              │
│  • Output: git tag + rollback.md                            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Archive & Clean                                    │
│  ─────────────────────────────────────────────────────────  │
│  • Archive test evidence                                    │
│  • Clean up temporary files                                 │
│  • Update state.json with completion timestamp              │
│  • Output: Clean project state                              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  COMPLETE (but NOT terminal)
     │
     ▼
  USER CAN:
  • Add new features → Return to INIT
  • Report bugs → Create bug features → Return to IMPLEMENT
  • Request changes → Return to VALIDATE → IMPLEMENT
```

---

## Hook Architecture

| Hook Event | When | What It Does |
|------------|------|--------------|
| `SessionStart` | Session begins | Environment validation, context recovery, state reconciliation |
| `UserPromptSubmit` | User sends message | Intent detection, skill suggestion, context injection |
| `PreToolUse[Write\|Edit]` | Before code changes | Dependency check, past-mistake injection, state validation |
| `PreToolUse[Bash:git]` | Before commits | Secret detection, feature ID validation, evidence check |
| `PostToolUse[Write\|Edit]` | After code changes | Trace storage, progress update |
| `PostToolUse[Bash:test]` | After tests | Evidence collection, acceptance criteria check |
| `Stop` | Agent finishes | Completion verification, next action suggestion |
| `SubagentStop` | Subagent finishes | Task completion check, result rollup |
| `SessionEnd` | Session ends | Session summary generation, context archival |

### Hook Enforcement Points

| Check | Hook Type | Action |
|-------|-----------|--------|
| Dependencies met? | `PreToolUse` on Edit/Write | Block if deps not tested |
| Tests failed first? | `PostToolUse` on test run | Warn if tests never failed |
| Past mistakes checked? | `PreToolUse` on Edit/Write | Inject warnings from context-graph |
| Secrets in code? | `PreToolUse` on git commit | Block commit |
| Feature ID in commit? | `PreToolUse` on git commit | Block if missing |
| Evidence exists? | `PreToolUse` on mark-complete | Block without evidence |

---

## MCP Server Roles

| Server | States | Role |
|--------|--------|------|
| `token-efficient` | ALL | Code execution, log processing, CSV analysis (98% savings) |
| `context-graph` | ALL | Decision traces, precedent lookup, enforced learning |
| `claude-in-chrome` | TEST, VALIDATE | Browser E2E tests, demos, evidence capture |
| `context7` | IMPLEMENT | Up-to-date library documentation |
| `perplexity` | INIT, IMPLEMENT | Research, best practices lookup |
| NEW: `requirements-tracker` | INIT, TEST, VALIDATE | Coverage calculation, gap detection |

---

## Skills Summary

| Skill | State | Responsibility |
|-------|-------|----------------|
| `orchestrator` | ALL | Session entry, state management, skill routing |
| `initialization` | INIT | Requirements→Features with deps, human approval |
| `implementation` | IMPLEMENT | Dependency-aware, test-first, self-review |
| `testing` | TEST | 6-layer testing, evidence collection |
| `validation` (NEW) | VALIDATE | Human acceptance, demos, revision handling |
| `context-graph` | COMPLETE | Learning loop, pattern extraction |
| `enforcement` | ALL | Preventive blocking via hooks |

---

## AskUserQuestion Strategic Placement

### Mandatory Gates (MUST ask)

| Gate | State | When |
|------|-------|------|
| Feature Plan | INIT | After breakdown, before implementation |
| Acceptance | VALIDATE | After tests pass, before complete |

### Conditional Gates (ask if condition met)

| Gate | Condition | When |
|------|-----------|------|
| Health Issue | Environment broken | Session start |
| Clarification | Requirement ambiguous | INIT |
| Dependency Block | Prerequisites not done | IMPLEMENT |
| Past Issue | Similar mistake found | IMPLEMENT |
| Design Review | M/L complexity | IMPLEMENT |
| Test Failure | 3+ failures | TEST |

---

## Key Differences from Current System

| Current | Proposed |
|---------|----------|
| Binary health check (pass/fail) | Multi-level (CRITICAL/WARNING/INFO) |
| One-way state transitions | Bi-directional (can backtrack) |
| No dependency tracking | DAG with topological sort |
| Tests = done | Tests + acceptance criteria + human approval = done |
| No VALIDATE state | VALIDATE before COMPLETE |
| COMPLETE is terminal | COMPLETE can re-enter for new features |
| Context-graph is advisory | Context-graph is enforced |
| Tests written after code | Tests written before code (must fail first) |
| No evidence collection | Evidence required for completion |
| No requirements coverage | Coverage calculated and reported |

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `.claude/progress/requirements.json` | Source of truth for requirements |
| `.claude/progress/feature-graph.json` | DAG of feature dependencies |
| `.claude/progress/execution-order.json` | Topological sort of features |
| `.claude/scripts/build-dependency-graph.py` | Construct DAG, detect cycles |
| `.claude/scripts/state-reconciler.py` | Compare declared vs actual state |
| `.claude/scripts/environment-validator.py` | Multi-level health check |
| `.claude/scripts/acceptance-validator.py` | Check criteria against evidence |
| `.claude/scripts/coverage-calculator.py` | Requirements coverage matrix |
| `~/.claude/skills/validation/SKILL.md` | NEW validation skill |

### Modified Files

| File | Changes |
|------|---------|
| `.claude/progress/feature-list.json` | Add depends_on, acceptance_criteria, test_types |
| `~/.claude/skills/orchestrator/SKILL.md` | Add state reconciliation, bi-directional transitions |
| `~/.claude/skills/initialization/SKILL.md` | Add dependency graph, human approval gate |
| `~/.claude/skills/implementation/SKILL.md` | Add test-first, dependency check, design phase |
| `~/.claude/skills/testing/SKILL.md` | Add 6-layer testing, evidence collection |
| `.claude/settings.json` | Add new hooks for enforcement |

---

## Implementation Priority

| Priority | Component | Reason |
|----------|-----------|--------|
| P0 | Feature dependencies (depends_on) | Prevents wrong order implementation |
| P0 | VALIDATE state | Prevents declaring victory prematurely |
| P0 | AskUserQuestion gates | Prevents runaway autonomy |
| P1 | Test-first implementation | Prevents biased test writing |
| P1 | Evidence collection | Proves work was done |
| P1 | Bi-directional state flow | Allows fixing mistakes |
| P2 | Context-graph enforcement | Prevents repeating mistakes |
| P2 | Multi-level health check | Better diagnostics |
| P2 | Requirements coverage | Ensures nothing missed |
| P3 | Learning loop | Improves over time |
| P3 | Rollback points | Safety net |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Features built in wrong order | Unknown | 0 |
| Human approval before complete | No | 100% |
| Tests written before code | Rare | 100% |
| Evidence for each feature | None | 100% |
| Past mistakes repeated | Common | 0 |
| Requirements coverage tracked | No | Yes |
| Rollback capability | None | Yes |
| Session context recovery | Partial | Full |
