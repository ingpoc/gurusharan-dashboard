# Setting Up Implementation Scripts

## Quick Start (3 Steps)

### Step 1: Create Scripts Directory

```bash
mkdir -p .claude/scripts
cd .claude/scripts
```

### Step 2: Copy Templates

```bash
# Copy all templates from skill
cp /path/to/implementation/templates/*.example .

# Rename to remove .example suffix
for f in *.example; do mv "$f" "${f%.example}"; done

# Make executable
chmod +x *.sh
```

### Step 3: Customize for Your Project

Edit each script to match your project's services, ports, and setup:

```bash
# Open and edit each script
vim get-current-feature.sh    # Usually no changes needed
vim health-check.sh          # CUSTOMIZE: Add your services
vim feature-commit.sh        # CUSTOMIZE: Your commit format
vim mark-feature-complete.sh # Usually no changes needed
```

## Template Files

### 1. `get-current-feature.sh.example`

**What it does**: Reads next pending feature from feature-list.json

**Customize if**:

- Feature-list format is different
- Features stored in different location
- Need to filter features by other criteria

**Test it**:

```bash
./get-current-feature.sh
# Should output JSON of next pending feature
```

---

### 2. `health-check.sh.example` (Most Important)

**What it does**: Verifies all services are running and healthy

**MUST customize for YOUR project**:

- Monolith (single service)
- Monorepo (frontend + backend)
- Multi-service (3+ independent services)
- Blockchain projects (add validator checks)

**Customize if**:

- Your services run on different ports
- Different startup commands
- Different test commands
- Additional service dependencies

**Examples**:

```bash
# Monolithic Backend (FastAPI on :8000)
curl -sf http://localhost:8000/health > /dev/null || exit 1
pytest --tb=short -q || exit 1

# Frontend + Backend
curl -sf http://localhost:3000 > /dev/null || exit 1  # Frontend
curl -sf http://localhost:8000/health > /dev/null || exit 1  # Backend

# Multi-Service (Add all services)
curl -sf http://localhost:3000 > /dev/null || exit 1  # Frontend
curl -sf http://localhost:8000/health > /dev/null || exit 1  # API
curl -sf http://localhost:5000/health > /dev/null || exit 1  # Workers
```

**Test it**:

```bash
# Should exit 0 if all services healthy
./health-check.sh
echo $?  # Should print 0
```

---

### 3. `feature-commit.sh.example`

**What it does**: Commits changes with feature ID in message

**Customize if**:

- Your commit format is different
- Need custom validation
- Need to enforce additional checks

**Examples**:

```bash
# Default: [FEAT-123] message
git commit -m "[$FEATURE_ID] $MESSAGE"

# Conventional commits: feat(id): message
git commit -m "feat($FEATURE_ID): $MESSAGE"

# Custom: custom-prefix/feat-123-description
git commit -m "custom-prefix/$FEATURE_ID-$MESSAGE"
```

**Test it**:

```bash
# Make a test change
echo "test" > /tmp/test.txt
git add /tmp/test.txt

# Try commit
./feature-commit.sh feat-test "Test commit"

# Should have [feat-test] in commit message
git log -1 --format=%B
```

---

### 4. `mark-feature-complete.sh.example`

**What it does**: Updates feature-list.json status

**Customize if**:

- Feature-list format is different
- Feature ID format is different
- Additional metadata needs updating

**Test it**:

```bash
# Should update feature-list.json
./mark-feature-complete.sh feat-001 implemented

# Verify
cat .claude/progress/feature-list.json | grep -A2 feat-001
```

---

## Validation Checklist

Before committing scripts:

- [ ] `get-current-feature.sh` runs and outputs JSON
- [ ] `health-check.sh` exits 0 when services healthy
- [ ] `health-check.sh` exits 1 when services broken
- [ ] `feature-commit.sh` creates commits with feature ID
- [ ] `mark-feature-complete.sh` updates feature-list.json

## Common Mistakes

### Mistake 1: Wrong Ports

```bash
# BAD: hardcoded port from different project
curl -sf http://localhost:8080/health

# GOOD: verify YOUR project's port
curl -sf http://localhost:8000/health
```

### Mistake 2: Missing Service Checks

For multi-service projects, check ALL critical services:

```bash
# BAD: only check API
curl -sf http://localhost:8000/health || exit 1

# GOOD: check API + frontend + workers
curl -sf http://localhost:8000/health || exit 1
curl -sf http://localhost:3000 || exit 1
pgrep worker_process || exit 1
```

### Mistake 3: Test Command Doesn't Match Project

```bash
# BAD: assumes pytest
pytest --tb=short -q

# GOOD: check what test runner YOU use
if [ -f pytest.ini ]; then
  pytest --tb=short -q
elif [ -f package.json ]; then
  npm test
fi
```

### Mistake 4: Wrong Feature-List Path

```bash
# BAD: assumes default
FEATURE_FILE=".claude/progress/feature-list.json"

# GOOD: verify path exists
FEATURE_FILE=".claude/progress/feature-list.json"
[ -f "$FEATURE_FILE" ] || { echo "Feature list not found"; exit 1; }
```

## Debugging

### Script fails but you don't know why

Add debugging:

```bash
#!/bin/bash
set -x  # Print each command
set -e  # Exit on error

# Now you'll see exactly what's failing
curl -sf http://localhost:8000/health
```

### Service won't start in time

Add retry logic:

```bash
#!/bin/bash

retry() {
  local max_attempts=5
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if "$@"; then
      return 0
    fi
    echo "Attempt $attempt failed, retrying..."
    sleep 1
    ((attempt++))
  done

  return 1
}

retry curl -sf http://localhost:8000/health || exit 1
```

### Can't get feature format right

Test jq filters:

```bash
# Test filter
jq '.features[] | select(.status=="pending")' .claude/progress/feature-list.json

# If you get no output, format is different
# Check actual structure
jq '.features[0]' .claude/progress/feature-list.json
```

## Next Steps

1. Copy templates to `.claude/scripts/`
2. Customize for your project
3. Test each script
4. Commit to git
5. Implementation skill will auto-detect and use them

Questions? Check `../README.md` for project examples.
