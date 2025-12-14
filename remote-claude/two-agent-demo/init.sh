#!/bin/bash

# CLI Todo App - Development Environment Setup Script
# This script initializes the development environment for the two-agent workflow

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

echo "======================================"
echo "CLI Todo App - Environment Setup"
echo "======================================"
echo ""

# Check Python version
echo "[1/6] Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "Found Python $PYTHON_VERSION"

# Check if Python 3.9+
REQUIRED_VERSION="3.9"
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)"; then
    echo "WARNING: Python 3.9+ is recommended (found $PYTHON_VERSION)"
fi

# Create virtual environment
echo ""
echo "[2/6] Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created"
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "[3/6] Activating virtual environment..."
source venv/bin/activate
echo "Virtual environment activated"

# Install pytest for testing
echo ""
echo "[4/6] Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet pytest pytest-cov
echo "Installed: pytest, pytest-cov"

# Verify progress tracking structure
echo ""
echo "[5/6] Verifying progress tracking structure..."
if [ ! -f ".claude/progress/feature-list.json" ]; then
    echo "ERROR: feature-list.json not found"
    exit 1
fi
if [ ! -f ".claude/progress/claude-progress.txt" ]; then
    echo "ERROR: claude-progress.txt not found"
    exit 1
fi
if [ ! -f ".claude/progress/session-state.json" ]; then
    echo "ERROR: session-state.json not found"
    exit 1
fi
echo "Progress tracking files verified"

# Display project information
echo ""
echo "[6/6] Project Information"
echo "------------------------"

TOTAL_FEATURES=$(python3 -c "import json; data=json.load(open('.claude/progress/feature-list.json')); print(data['project']['total_features'])")
TOTAL_EPICS=$(python3 -c "import json; data=json.load(open('.claude/progress/feature-list.json')); print(data['project']['total_epics'])")

echo "Project: CLI Todo App"
echo "Total Epics: $TOTAL_EPICS"
echo "Total Features: $TOTAL_FEATURES"
echo "Estimated Time: 15.75 hours"
echo ""

# Git status
echo "Git Status:"
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "  Repository: Initialized"
    COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    echo "  Commits: $COMMIT_COUNT"
else
    echo "  Repository: Not initialized (run 'git init' to start)"
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Review feature list: cat .claude/progress/claude-progress.txt"
echo "3. Start implementation with coding-agent on feature: TASK-001"
echo ""
echo "Quick Commands:"
echo "  Run tests:     pytest"
echo "  Run with coverage: pytest --cov=todo"
echo "  View progress: cat .claude/progress/claude-progress.txt"
echo ""
