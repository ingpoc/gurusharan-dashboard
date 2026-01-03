---
name: orchestrator
description: "Use when managing agent state transitions (START/INIT/IMPLEMENT/TEST/COMPLETE), triggering context compression at 80% capacity, or handling session lifecycle. Load at session start, on state change, or when context exceeds threshold. Core skill for single-orchestrator architecture."
keywords: state-machine, compression, session, transitions, context-management
---

# Orchestrator

State machine management for single-orchestrator architecture.

## Instructions

1. Check current state: `.claude/scripts/check-state.sh`
2. Validate transition allowed: `.claude/scripts/validate-transition.sh FROM TO`
3. Load skill for current state
4. Execute until exit conditions (code verified, not judged)
5. Compress when `.claude/scripts/check-context.sh` returns threshold exceeded

## State → Skill Mapping

| State | Load Skill |
|-------|------------|
| INIT | initialization/ |
| IMPLEMENT | implementation/ |
| TEST | testing/ |
| COMPLETE | context-graph/ |

## References

| File | Load When |
|------|-----------|
| references/state-machine.md | Designing state transitions |
| references/compression.md | Context exceeds 50% (progressive checkpoints) |
| references/session-management.md | Session start/recovery |
| references/session-resumption.md | Resuming with fresh context + summary |

## Scripts

All scripts are located in `.claude/scripts/` (copied during initialization).

| Script | Purpose | Output |
|--------|---------|--------|
| .claude/scripts/check-state.sh | Get current state | JSON state |
| .claude/scripts/validate-transition.sh | Check if transition valid | exit 0/1 |
| .claude/scripts/check-context.sh | Check context usage | threshold level |
| .claude/scripts/enter-state.sh | Transition to new state | Updated state.json |
