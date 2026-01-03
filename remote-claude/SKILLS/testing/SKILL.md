---
name: testing
description: "Use when running tests to validate implementations, collecting test evidence, or debugging failures. Load in TEST state. Covers unit tests (pytest/jest), API tests (curl), browser tests (Claude-in-Chrome), database verification. All results are code-verified, not LLM-judged."
keywords: test, verify, pytest, jest, api, browser, evidence
---

# Testing

Comprehensive testing for TEST state.

## Instructions

1. Run unit tests: `.claude/scripts/run-unit-tests.sh` or project test command
2. Run API tests: `.claude/scripts/run-api-tests.sh` (if API exists)
3. Run browser tests (if UI): via Claude-in-Chrome MCP
4. Verify database (if data): Manual or `.claude/scripts/verify-database.sh` (if exists)
5. Collect evidence: `.claude/scripts/collect-evidence.sh` (optional)
6. Report results (code verified, not judged)

**Note:** Testing scripts are project-specific. If scripts don't exist in `.claude/scripts/`, use project's test commands directly.

## Exit Criteria (Code Verified)

```bash
# All tests must pass (exit code 0)
npm test                    # or pytest, cargo test, etc.
jq '.all_passed == true' /tmp/test-evidence/results.json  # if evidence collected
```

## References

| File | Load When |
|------|-----------|
| references/unit-testing.md | Writing/running unit tests |
| references/api-testing.md | Testing API endpoints |
| references/browser-testing.md | UI testing with Chrome |
| references/database-testing.md | Database verification |
