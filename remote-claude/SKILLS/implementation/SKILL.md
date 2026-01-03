---
name: implementation
description: "Use when implementing features from feature-list.json. Load in IMPLEMENT state. Template-based: provides workflow steps and script templates (in .claude/scripts/) for projects to customize. Covers coding patterns, test writing, context graph queries, and health checks."
keywords: implement, code, develop, feature, workflow, template
---

# Implementation

Feature development for IMPLEMENT state (template-based, project-agnostic).

## Purpose

Implement next pending feature following project patterns and best practices.

## When to Load

- State: IMPLEMENT
- Condition: Pending feature exists in feature-list.json

## Core Procedures

1. **Get current feature**
   - Run `.claude/scripts/get-current-feature.sh`
   - Provides: `{ feature_id, description, acceptance_criteria }`
   - **Note:** Scripts are created during initialization. If missing, run initialization skill.

2. **Verify scripts are customized for this project**
   - Review `.claude/scripts/README.md` for script purposes
   - Check if scripts match project architecture:
     - `health-check.sh` verifies all services
     - `feature-commit.sh` uses correct commit format
     - `get-current-feature.sh` handles project structure (monorepo, etc.)
   - **Customize if needed** - scripts are project-specific and should evolve with your project
   - Commit script changes with clear messages

3. **Analyze codebase context** (token-efficient)
   - **CRITICAL: Token-Efficient First**
   - Use `mcp__token-efficient__execute_code` for code execution (98% savings)
   - Use `mcp__token-efficient__process_logs` for log parsing (95% savings)
   - Never load raw logs/code into context
   - Analyze project structure: find relevant files, modules, patterns
   - Parse code to understand dependencies, imports, existing implementations
   - Check test structure, test patterns
   - Search error logs for related issues, past failures
   - Analyze data patterns if feature involves data processing
   - See `references/token-efficient-mcp-patterns.md` for efficient analysis patterns
   - Consider using token-efficient MCP tools for large datasets (>50 items)

4. **Query past decisions** (context graph)
   - Use MCP: `context_query_traces(query=feature_description)`
   - Search for similar patterns, architectural decisions, blockers
   - Load learned solutions before implementing
   - Combine with codebase analysis for informed implementation

5. **Implement feature**
   - Follow project patterns from `CLAUDE.md` (reference section)
   - Write tests alongside code (test-driven approach)
   - Use token-efficient MCP tools for data >50 items (see references for patterns)
   - See `references/mcp-usage.md` for tool guidance

6. **Verify implementation**
   - Run `.claude/scripts/health-check.sh`
   - Check: Code compiles, tests pass, no regressions

7. **Commit changes**
   - Run `.claude/scripts/feature-commit.sh feat-ID "description"`
   - Or: `.claude/scripts/feature-commit.sh` (interactive)
   - Commit MUST include feature ID for traceability

8. **Mark feature complete**
   - Run `.claude/scripts/mark-feature-complete.sh feat-ID implemented`
   - Or: `.claude/scripts/mark-feature-complete.sh feat-ID tested`

## Exit Criteria (Code Verified)

- [ ] Feature implementation complete (code written, tests written/passing)
- [ ] Changes committed to git with feature ID in message
- [ ] feature-list.json updated with new status
- [ ] No regressions in existing functionality

## Project Scripts

Scripts are created in `.claude/scripts/` during initialization. These are **project-specific** and should be customized as your project evolves.

| Script | Purpose | Source Template |
|--------|---------|-----------------|
| `get-current-feature.sh` | Extract next pending feature | Copied during init |
| `health-check.sh` | Verify implementation health | Copied during init |
| `feature-commit.sh` | Commit with feature ID | Copied during init |
| `mark-feature-complete.sh` | Update feature status | Copied during init |

**All scripts are in `.claude/scripts/`** - this is the single source of truth for project automation.

**Customization:**
- Review `.claude/scripts/README.md` for detailed documentation
- Scripts start as generic templates
- Customize for your project architecture as needed
- Commit customizations to git for team-wide use

## References

| File | Load When |
|------|-----------|
| references/token-efficient-mcp-patterns.md | Efficient analysis patterns for large datasets (>50 items) |
| references/coding-patterns.md | Project-specific implementation patterns and style guidelines |
| references/mcp-usage.md | MCP tool usage examples and best practices |
| references/health-checks.md | Verification strategies for different project types |
| references/async-parallel-operations.md | Parallel operation patterns for independent tasks |
