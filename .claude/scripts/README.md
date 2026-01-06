# Project Automation Scripts

## Overview

These scripts customize the Claude Code workflow for this project. They are copied during initialization and should be customized to match your project architecture.

## Scripts

### get-current-feature.sh

**Purpose:** Extract the next pending feature from `.claude/progress/feature-list.json`

**Output:** JSON with feature details

```json
{
  "id": "feat-013",
  "description": "Feature description",
  "priority": "P0",
  "status": "pending",
  "acceptance_criteria": [...]
}
```

**Customize for:**

- Monorepo structure (multiple feature lists)
- Custom feature ordering logic
- Filtering by priority, phase, or tags

**Default:** Returns first pending feature from feature-list.json

---

### health-check.sh

**Purpose:** Fast health diagnosis - show root cause immediately

**⚠️ CRITICAL:** This script runs at the START of EVERY SESSION by orchestrator.
**NO TIME should be wasted finding root cause.** Evolve this continuously.

**Exit codes:**

- `0` = All systems healthy
- `1` = Infrastructure/service failed (shows error immediately)
- `2` = Timeout

**Checks (in order - fails fast on infrastructure):**

1. **Infrastructure FIRST** (before services):
   - PostgreSQL database running
   - Disk space (prevent out-of-disk errors)
   - Required environment files exist

2. **Services:**
   - Frontend health endpoint (:3000)
   - Backend health endpoint (:8000/api/health)
   - Process status (running vs not responding)

3. **Logs:**
   - Recent errors from log files
   - Warnings (non-critical)

4. **Optional:**
   - MCP servers running

**Examples:**

```bash
# All healthy
./.claude/scripts/health-check.sh
# ✅ All systems healthy

# Database down - IMMEDIATE diagnosis
./.claude/scripts/health-check.sh
# ✗ PostgreSQL not responding
#
# Fix:
#   brew services start postgresql@15
# ❌ Infrastructure check FAILED

# Backend failed - shows WHY instantly
./.claude/scripts/health-check.sh
# ✗ Backend is NOT responding
#   Process 'uvicorn' is NOT running
#
# Recent errors from logs/backend.log:
# ---
# ConnectionRefusedError: [Errno 61] Connection refused
# Database initialization failed
# ---
```

**Customize for:**

- Your infrastructure (Redis, Solana validator, etc.)
- Your services (ports, health endpoints)
- Your log file locations
- Your environment file paths
- **Keep evolving this - add new failure patterns as you discover them**

---

### run-tests.sh

**Purpose:** Batch API endpoint testing

**Usage:**

```bash
./.claude/scripts/run-tests.sh                    # Test default (localhost:3000)
./.claude/scripts/run-tests.sh http://localhost:3001  # Custom base URL
```

**What it does:**

1. Tests all GET endpoints in batch
2. Reports pass/fail with HTTP status codes
3. Stores evidence in `/tmp/test-evidence/`
4. Returns exit code 0 (all pass) or 1 (any fail)

**Exit codes:**

- `0` = All tests passed
- `1` = One or more tests failed

**Current endpoints tested:**

- `/api/stats` - Usage statistics
- `/api/autonomous/status` - Workflow status
- `/api/drafts` - Draft management
- `/api/personas` - Persona management
- `/api/chat/sessions` - Chat sessions
- `/api/auth/x/status` - X account status

**Customize for:**

- Add new API endpoints as they're created
- Adjust expected status codes (not all are 200)
- Add POST/PUT endpoint tests with data
- Test with different base URLs (staging, production)

**Update workflow:**

When adding new API endpoints, update this script:

```bash
# Add new endpoint test
test_endpoint "New Feature API" "/api/new-feature"
```

---

### restart-servers.sh

**Purpose:** Kill processes on ports and restart frontend/backend servers

**Usage:**

```bash
./.claude/scripts/restart-servers.sh                    # Restart both
./.claude/scripts/restart-servers.sh --no-frontend      # Backend only
./.claude/scripts/restart-servers.sh --no-backend       # Frontend only
```

**What it does:**

1. Kills processes on ports 3000 and 8000
2. Starts backend with logs output to `logs/backend.log`
3. Starts frontend with logs output to `logs/frontend.log`
4. Waits for services to be ready (30s timeout)
5. Reports success/failure

**Customize for:**

- Different ports for your services
- Additional services (database, validator)
- Different start commands
- Log file locations

---

### feature-commit.sh

**Purpose:** Commit changes with feature ID in commit message

**Usage:**

```bash
.claude/scripts/feature-commit.sh feat-013 "Implemented DID registry"
```

**Customize for:**

- Commit message format (conventional commits, etc.)
- Git hooks (pre-commit hooks, signing, etc.)
- Branch naming conventions
- Linking to issue trackers

**Default format:**

```
[feat-013] Implemented DID registry

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### mark-feature-complete.sh

**Purpose:** Update feature status in `.claude/progress/feature-list.json`

**Usage:**

```bash
.claude/scripts/mark-feature-complete.sh feat-013 implemented
.claude/scripts/mark-feature-complete.sh feat-013 tested
```

**Customize for:**

- Custom status values (e.g., "review", "deployed")
- Additional metadata (completion time, tester, etc.)
- State transitions (only allow tested → completed)

**Default:** Sets `status` field to provided value (default: "implemented")

---

### check-state.sh

**Purpose:** Get current state from `.claude/progress/state.json`

**Output:** Human-readable or JSON state

**Usage:**

```bash
.claude/scripts/check-state.sh          # Human-readable
.claude/scripts/check-state.sh --json   # JSON format
```

**Customize for:**

- Additional state information
- Custom state fields
- Integration with other tools

---

### validate-transition.sh

**Purpose:** Validate state machine transitions

**Usage:**

```bash
.claude/scripts/validate-transition.sh FROM TO
# Exit 0 = valid, Exit 1 = invalid
```

**Customize for:**

- Custom state machines
- Additional transition rules
- Project-specific constraints

**Default:** Enforces standard state machine (START → INIT → IMPLEMENT → TEST → COMPLETE)

---

### transition-state.sh

**Purpose:** Execute state transition with validation (uses validate-transition.sh)

**Usage:**

```bash
.claude/scripts/transition-state.sh TEST "Tests passed"
.claude/scripts/transition-state.sh IMPLEMENT "Starting feature X"
```

**What it does:**

1. Validates state name (valid: START, INIT, IMPLEMENT, TEST, COMPLETE)
2. Calls validate-transition.sh to ensure transition is allowed
3. Adds entry to history array with timestamp and reason
4. Preserves health_status, feature_id, and attempts
5. Updates state, entered_at, and last_updated timestamps

**Output:**

```json
{
  "state": "TEST",
  "entered_at": "2026-01-05T13:22:08+05:30",
  "health_status": "HEALTHY",
  "history": [
    {
      "from": "IMPLEMENT",
      "to": "TEST",
      "at": "2026-01-05T13:22:08+05:30",
      "reason": "Tests passed"
    }
  ],
  "last_updated": "2026-01-05T13:22:08+05:30"
}
```

**Customize for:**

- Additional state machine states
- Custom validation rules
- Additional metadata fields
- State transition side effects

---

### check-context.sh

**Purpose:** Monitor token usage and trigger compression

**Output:** Compression level (none, remove_raw, summarize, full, emergency)

**Usage:**

```bash
.claude/scripts/check-context.sh 0.75  # Pass usage percentage
```

**Customize for:**

- Custom thresholds
- Project-specific compression strategies
- Integration with context management tools

---

## Testing Workflow

**Recommended sequence before browser testing:**

```bash
# 1. Start servers
./.claude/scripts/restart-servers.sh

# 2. Check health (auto-runs by orchestrator, but manual check is useful)
./.claude/scripts/health-check.sh

# 3. Run API tests
./.claude/scripts/run-tests.sh

# 4. Browser testing (if API tests pass)
# Now use browser automation for UI testing
```

**Why this order:**

1. **restart-servers**: Clean slate - kills old processes
2. **health-check**: Infrastructure diagnosis - fails fast on root cause
3. **run-tests**: API validation - backend working before UI testing
4. **Browser testing**: UI validation - only if backend is healthy

**Exit code flow:**

```bash
./.claude/scripts/restart-servers.sh && \
./.claude/scripts/health-check.sh && \
./.claude/scripts/run-tests.sh && \
echo "✅ Ready for browser testing"
```

---

## Customization Workflow

### During Implementation

1. **Read this README** to understand script purposes
2. **Review each script** for project fit
3. **Customize as needed** before implementing feature
4. **Test scripts** to ensure they work for your architecture
5. **Commit changes** with clear commit messages

### Example Customization

```bash
# Before implementing feat-013
cat .claude/scripts/README.md  # Understand purposes
nano .claude/scripts/health-check.sh  # Customize for my services
./.claude/scripts/health-check.sh  # Test it works
git add .claude/scripts/health-check.sh
git commit -m "feat: customize health-check for multi-service architecture"
```

---

## Template Location

Original templates are maintained in:

```bash
~/.claude/skills/initialization/templates/
```

When in doubt, refer to templates for examples and best practices.

To re-copy templates (preserving your customizations):

```bash
~/.claude/skills/initialization/assets/copy-scripts.sh
```

---

## Evolution

These scripts should evolve with your project:

- **Initial:** Generic templates (copied from templates/)
- **Customized:** Modified for project architecture
- **Mature:** Optimized for project workflows and patterns

Track evolution in git:

```bash
git log --follow .claude/scripts/health-check.sh
```

---

## Troubleshooting

**Script not executable?**

```bash
chmod +x .claude/scripts/*.sh
```

**Script uses wrong paths?**

- Update paths to match your project structure
- Use relative paths from project root

**Health check failing?**

- Verify services are running
- Check ports and endpoints match your setup
- Increase timeout if services start slowly

**Feature list not found?**

- Ensure `.claude/progress/feature-list.json` exists
- Run initialization skill if missing
