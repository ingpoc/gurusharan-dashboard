---
name: project
description: {{PROJECT_DESCRIPTION}}
keywords: {{KEYWORDS}}
project_type: {{PROJECT_TYPE}}
framework: {{FRAMEWORK}}
---

# {{PROJECT_NAME}}

**Purpose**: {{PROJECT_PURPOSE}}

---

## Project Overview

| Aspect | Details |
|--------|---------|
| **Type** | {{PROJECT_TYPE}} |
| **Framework** | {{FRAMEWORK}} |
| **Language** | {{LANGUAGE}} |
| **Testing** | {{TEST_FRAMEWORK}} |

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
{{TECH_STACK_ROWS}}

### Project Structure

| Directory | Purpose |
|-----------|---------|
{{PROJECT_STRUCTURE_ROWS}}

---

## Common Commands

| Task | Command |
|------|---------|
{{COMMAND_ROWS}}

---

## Config Files

| File | Purpose |
|------|---------|
| `.claude/config/project.json` | Project settings |
| `.claude/progress/state.json` | Current state |
| `.claude/progress/feature-list.json` | Features |
| `.mcp.json` | MCP server configuration |
{{ADDITIONAL_CONFIG_FILES}}

---

## MCP Servers

{{MCP_SERVERS_SECTION}}

---

## Development Workflow

{{WORKFLOW_SECTION}}

---

## Token Efficiency

**CRITICAL**: Proactively use token-efficient MCP tools BEFORE expensive operations.

| Instead of | Use This | When | Savings |
| :--- | :--- | :--- | :--- |
| `Bash` (code exec) | `mcp__token-efficient__execute_code` | Python/Bash/Node code | 98% |
| `Bash` (load CSV) | `mcp__token-efficient__process_csv` | >50 rows, filtering | 99% |
| `Bash` (grep logs) | `mcp__token-efficient__process_logs` | Pattern matching | 95% |
| `Read` (large files) | `Read` with offset/limit | Files >100 lines | 90% |
| Multiple CSVs | `mcp__token-efficient__batch_process_csv` | 2-5 files | 80% |

**Priority Rule**: If operation processes >50 items, MUST use token-efficient MCP.

### Available Tools

- `execute_code` - Python/Bash/Node in sandbox
- `process_csv` - Filter, aggregate, paginate CSV
- `batch_process_csv` - Multiple CSVs with same filter
- `process_logs` - Pattern match with pagination
- `search_tools` - Find MCP tools by keyword (95% savings)

---

## Bug Fix Verification

**CRITICAL**: Human verification required before logging successful decision traces.

### Workflow

```text
Bug Found → Query Context Graph → No trace?
                                      ↓
                        Fix issue → Browser test → Agent: "Fixed!"
                                                    ↓
                                    AskUserQuestion (verify)
                                                    ↓
                         ┌──────────────────┬────────────────┬────────────────┐
                         │                  │                │                │
                      YES (Fixed)        NO (Broken)    EXPLAIN          OTHER
                         │                  │                │                │
                    Log trace          Try again        Get details      Handle case
                  outcome="success"      with fix          │               appropriately
                                                        Retry fix
```

### Rules

| Action | When | Outcome |
| :--- | :--- | :--- |
| Log trace with `outcome: "success"` | User confirms "Yes, fixed" | ✅ Allowed |
| Log trace with `outcome: "failure"` | Multiple failed attempts | ✅ Allowed |
| Log trace with `outcome: "pending"` | Before user verification | ✅ Allowed |
| Log trace with `outcome: "success"` | Without user verification | ❌ Blocked |

### Context Graph Clean Data

- Only verified fixes logged as `success`
- Prevents garbage data in learning system
- Human is ultimate source of truth
