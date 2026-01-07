#!/bin/bash
# Next.js Server Restart Script
#
# Purpose: Kill process on port 3000 and restart Next.js dev server
#
# Project: dashboard (Next.js)
#   - Single Next.js server on port 3000
#   - Logs output to logs/nextjs.log
#
# Usage: ./restart-servers.sh

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

NEXTJS_PORT=3000
LOG_DIR="$PROJECT_ROOT/logs"

echo "=== Restarting Next.js Server ==="

# ============================================================================
# Kill existing process on port
# ============================================================================

kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null || true)

  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  else
    echo "No process found on port $port"
  fi
}

kill_port $NEXTJS_PORT

# ============================================================================
# Create log directory
# ============================================================================

mkdir -p "$LOG_DIR"

# ============================================================================
# Start Next.js dev server
# ============================================================================

echo ""
echo "Starting Next.js on port $NEXTJS_PORT..."

cd "$PROJECT_ROOT"
nohup npm run dev > "$LOG_DIR/nextjs.log" 2>&1 &
NEXTJS_PID=$!
echo "Next.js started (PID: $NEXTJS_PID, logs: $LOG_DIR/nextjs.log)"

# ============================================================================
# Wait for server to be ready
# ============================================================================

echo ""
echo "Waiting for Next.js to start..."

wait_for_service() {
  local url=$1
  local name=$2
  local max_wait=30
  local count=0

  while [ $count -lt $max_wait ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      echo "✓ $name is ready"
      return 0
    fi
    sleep 1
    count=$((count + 1))
    echo -n "."
  done

  echo ""
  echo "✗ $name failed to start within ${max_wait}s" >&2
  echo "Check logs: $LOG_DIR/nextjs.log" >&2
  return 1
}

wait_for_service "http://localhost:$NEXTJS_PORT" "Next.js" || exit 1

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "=== Next.js server restarted successfully ==="
echo "URL:  http://localhost:$NEXTJS_PORT"
echo "Logs: $LOG_DIR/nextjs.log"

exit 0
