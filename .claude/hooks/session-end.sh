#!/bin/bash
# Global Hook: session-end.sh
#
# Session end hook: Creates checkpoint commit with session summary.
# Non-blocking - ensures session state is preserved for next session.
# If no summary exists, auto-generates one from current state.

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_ROOT:-.}"
PROGRESS_DIR="$PROJECT_ROOT/.claude/progress"
SESSION_FILE="$PROGRESS_DIR/session-state.json"
STATE_FILE="$PROGRESS_DIR/state.json"
FEATURE_FILE="$PROGRESS_DIR/feature-list.json"

# Only run if session file exists
if [[ ! -f "$SESSION_FILE" ]]; then
    exit 0
fi

cd "$PROJECT_ROOT"

# Check if session_summary exists and is not empty
SUMMARY=$(jq -r '.session_summary // empty' "$SESSION_FILE" 2>/dev/null || echo "")

# If no summary, auto-generate from current state
if [[ -z "$SUMMARY" ]]; then
    # Calculate progress from feature-list.json
    if [[ -f "$FEATURE_FILE" ]]; then
        COMPLETED=$(jq '[.features[] | select(.status == "completed")] | length' "$FEATURE_FILE" 2>/dev/null || echo "0")
        PENDING=$(jq '[.features[] | select(.status == "pending")] | length' "$FEATURE_FILE" 2>/dev/null || echo "0")
        TOTAL=$(jq '.features | length' "$FEATURE_FILE" 2>/dev/null || echo "0")
        CURRENT_FEAT=$(jq -r '[.features[] | select(.status == "pending")][0].id // "none"' "$FEATURE_FILE" 2>/dev/null || echo "none")
    else
        COMPLETED=0
        PENDING=0
        TOTAL=0
        CURRENT_FEAT="none"
    fi

    # Run health check
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        HEALTH="HEALTHY"
    else
        HEALTH="OFFLINE"
    fi

    # Get current state
    if [[ -f "$STATE_FILE" ]]; then
        CURRENT_STATE=$(jq -r '.state // "UNKNOWN"' "$STATE_FILE" 2>/dev/null || echo "UNKNOWN")
    else
        CURRENT_STATE="UNKNOWN"
    fi

    # Auto-generate summary
    SUMMARY="Auto-checkpoint: $COMPLETED/$TOTAL features complete. State: $CURRENT_STATE. Health: $HEALTH. Current: $CURRENT_FEAT"

    # Update session-state.json with auto-generated data
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    jq -n \
        --arg summary "$SUMMARY" \
        --arg timestamp "$TIMESTAMP" \
        --arg current "$CURRENT_FEAT" \
        --argjson completed "$COMPLETED" \
        --argjson pending "$PENDING" \
        --argjson total "$TOTAL" \
        '{
            session_summary: $summary,
            last_updated: $timestamp,
            current_feature: $current,
            completed_features: $completed,
            pending_features: $pending,
            total_features: $total
        }' > "$SESSION_FILE.tmp" && mv "$SESSION_FILE.tmp" "$SESSION_FILE"

    # Update state.json with timestamp and health
    if [[ -f "$STATE_FILE" ]]; then
        jq --arg timestamp "$TIMESTAMP" --arg health "$HEALTH" \
            '.last_updated = $timestamp | .health_status = $health' \
            "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    fi

    # Append to claude-progress.txt
    PROGRESS_TXT="$PROGRESS_DIR/claude-progress.txt"
    echo "$TIMESTAMP - $SUMMARY" >> "$PROGRESS_TXT"
else
    SUMMARY=$(jq -r '.session_summary' "$SESSION_FILE")
fi

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    # No changes, just update checkpoint file
    jq -n \
        --arg summary "$SUMMARY" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{checkpoint_at: $timestamp, summary: $summary}' > "$PROGRESS_DIR/checkpoint.json"
else
    # Has changes - create checkpoint commit
    git add .claude/progress/
    git commit -m "$(cat <<EOF
[checkpoint] Session summary

$SUMMARY

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)" 2>/dev/null || true
fi

exit 0
