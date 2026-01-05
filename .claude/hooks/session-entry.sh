#!/bin/bash
# session-entry.sh
#
# Session entry: Execute orchestrator logic, output actions only.
# stdout → model context, stderr → user terminal

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_ROOT:-.}"
PROGRESS_DIR="$PROJECT_ROOT/.claude/progress"
CONFIG_FILE="$PROJECT_ROOT/.claude/config/project.json"

# Initialize
CURRENT_STATE="START"
PENDING=0
HEALTH_STATUS="healthy"

# === User output (stderr) ===
echo "Session: $PROJECT_ROOT" >&2

# === Read state ===
if [[ -f "$PROGRESS_DIR/state.json" ]]; then
    CURRENT_STATE=$(jq -r '.state // "START"' "$PROGRESS_DIR/state.json")
fi

if [[ -f "$PROGRESS_DIR/feature-list.json" ]]; then
    PENDING=$(jq '[.features[] | select(.status=="pending")] | length' "$PROGRESS_DIR/feature-list.json" 2>/dev/null || echo "0")
fi

# === Health check ===
if [[ -f "$CONFIG_FILE" ]]; then
    HEALTH_CHECK=$(jq -r '.health_check // empty' "$CONFIG_FILE" 2>/dev/null)
    if [[ -n "$HEALTH_CHECK" ]]; then
        if eval "$HEALTH_CHECK" >/dev/null 2>&1; then
            echo "✓ Healthy" >&2
        else
            echo "✗ Health check failed" >&2
            HEALTH_STATUS="broken"
        fi
    fi
fi

# === Orchestrator logic (state machine) ===
ACTION=""
NEXT_STATE=""

case "$CURRENT_STATE" in
    START)
        if [[ ! -f "$PROGRESS_DIR/feature-list.json" ]]; then
            ACTION="Initialize project: run /initialization skill"
            NEXT_STATE="INIT"
        else
            ACTION="Start feature work"
            NEXT_STATE="IMPLEMENT"
        fi
        ;;
    INIT)
        ACTION="Complete initialization, then transition to IMPLEMENT"
        NEXT_STATE="IMPLEMENT"
        ;;
    IMPLEMENT)
        if [[ "$PENDING" -eq 0 ]]; then
            ACTION="All features complete. Run tests, then transition to TEST"
            NEXT_STATE="TEST"
        else
            ACTION="Implement next pending feature ($PENDING remaining)"
        fi
        ;;
    TEST)
        ACTION="Run test suite. If passing → COMPLETE, if failing → IMPLEMENT"
        ;;
    COMPLETE)
        ACTION="All done. Review and deploy."
        ;;
    *)
        ACTION="Unknown state. Check .claude/progress/state.json"
        ;;
esac

# === Output to model (stdout) ===
echo "# Session Context"
echo ""
echo "**State:** $CURRENT_STATE"
echo "**Pending:** $PENDING features"
echo "**Health:** $HEALTH_STATUS"
echo ""
echo "**Next action:** $ACTION"

if [[ -n "$NEXT_STATE" ]]; then
    echo ""
    echo "**To transition:** \`.claude/scripts/enter-state.sh $NEXT_STATE\`"
fi

echo ""
echo "---"
echo "Load skills on-demand: /implementation, /testing, /initialization"
