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

**Purpose:** Verify all services are healthy

**Exit codes:**

- `0` = All services healthy
- `1` = One or more services failed
- `2` = Timeout waiting for services

**Customize for:**

- Your services (frontend, backend, database, cache, etc.)
- Service ports and health endpoints
- Service dependencies (e.g., check database before backend)
- Timeout values

**Examples:**

Single service (Next.js):

```bash
#!/bin/bash
curl -f http://localhost:3000/api/health || exit 1
```

Multi-service (Next.js + FastAPI):

```bash
#!/bin/bash
curl -f http://localhost:3000/api/health || exit 1
curl -f http://localhost:8000/api/health || exit 1
```

With dependencies:

```bash
#!/bin/bash
# Check Redis first
redis-cli ping >/dev/null 2>&1 || { echo "Redis not ready"; exit 2; }

# Then check services
curl -f http://localhost:3000/api/health || exit 1
```

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

```
~/.claude/skills/implementation/templates/
```

When in doubt, refer to templates for examples and best practices.

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
