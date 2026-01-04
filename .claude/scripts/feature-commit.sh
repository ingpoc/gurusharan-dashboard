#!/bin/bash
# Feature Commit Script
#
# Purpose: Commit implementation with feature ID for traceability
#
# Project: x-content-dashboard (Next.js 16 + Prisma)
#   - Format: [feat-ID] description
#   - Adds Claude Code co-author attribution
#
# Usage: ./feature-commit.sh <feature-id> [message]
# Example: ./feature-commit.sh F018 "Implement dashboard components"

set -e

FEATURE_ID=$1
MESSAGE=${2:-"Implementation"}

if [ -z "$FEATURE_ID" ]; then
  echo "Usage: feature-commit.sh <feature-id> [message]" >&2
  echo "Example: feature-commit.sh F018 'Implement dashboard components'" >&2
  exit 1
fi

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit" >&2
  exit 0
fi

# Normalize feature ID (handle F018, feat-018, etc)
NORMALIZED_ID=$(echo "$FEATURE_ID" | sed 's/^feat-//i' | sed 's/^F//')

# Construct commit message with feature ID
COMMIT_MSG="feat($NORMALIZED_ID): ${MESSAGE}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "Committing: $COMMIT_MSG"
git add -A
git commit -m "$COMMIT_MSG"

exit 0
