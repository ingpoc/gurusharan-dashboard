---
name: browser-testing
description: "Use when testing web applications, debugging browser console errors, automating form interactions, or verifying UI implementations. Load for localhost testing, authenticated app testing (Gmail, Notion), or recording demo GIFs. Requires Chrome extension 1.0.36+, Claude Code 2.0.73+, paid plan."
keywords: browser, chrome, testing, console, debug, forms, ui, gif, localhost
---

# Browser Testing

Test and debug web applications via Chrome integration.

## Prerequisites

| Requirement | Minimum |
|-------------|---------|
| Chrome extension | 1.0.36+ |
| Claude Code CLI | 2.0.73+ |
| Plan | Pro/Team/Enterprise |

## Instructions

**CRITICAL: Token-Efficient First**

- Use `mcp__token-efficient__execute_code` for code execution (98% savings)
- Use `mcp__token-efficient__process_logs` for log parsing (95% savings)
- Never load raw logs/code into context

**Deterministic Workflow:**

1. **Check script catalog**: Read `.claude/scripts/README.md` for available scripts
2. **Restart servers**: Run `.claude/scripts/restart-servers.sh` (create if missing)
3. **Get tab context**: `tabs_context_mcp` to initialize browser session
4. **Navigate & test**: Use MCP tools for browser automation
5. **Verify results**: Check console, take screenshots, collect evidence
6. **Automate**: Run `/automate-flow` after testing to script repeatable patterns

**After Each Test Session:**

Always run `/automate-flow` to capture learnings into new scripts.

## Project Scripts

**Discovery Pattern:** Check `.claude/scripts/` for project-specific automation before global scripts.

```bash
# List available project scripts
ls .claude/scripts/ 2>/dev/null || echo "No project scripts found"
```

**Convention:** Exit codes 0=pass, 1=fail, 2=timeout. Evidence in `/tmp/`.

## Quick Commands

```bash
# Check for console errors
scripts/check-console-errors.sh TAB_ID

# Verify page loaded
scripts/verify-page-load.sh TAB_ID URL

# Run smoke test
scripts/smoke-test.sh URL

# After testing: automate repeatable patterns
/automate-flow
```

## MCP Tools

| Tool | Purpose |
|------|---------|
| `tabs_context_mcp` | Get tab IDs (call first) |
| `navigate` | Go to URL |
| `computer` | Click, type, screenshot |
| `find` | Find element by description |
| `form_input` | Fill form fields |
| `read_console_messages` | Debug with pattern filter |
| `read_page` | Get DOM/accessibility tree |
| `gif_creator` | Record interactions |

## References

| File | Load When |
|------|-----------|
| references/patterns.md | Designing test scenarios |
| references/examples.md | Need concrete examples |
