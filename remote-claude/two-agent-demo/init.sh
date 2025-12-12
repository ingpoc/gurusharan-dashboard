#!/usr/bin/env bash

################################################################################
# CLI Todo App - Development Environment Initialization Script
#
# This script sets up the complete development environment for the CLI Todo App
# project, including Python virtual environment, dependencies, and dev tools.
#
# Usage: ./init.sh
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${PROJECT_ROOT}/venv"
PROGRESS_DIR="${PROJECT_ROOT}/.claude/progress"

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for Python 3.9+
    if ! command_exists python3; then
        log_error "Python 3 is not installed. Please install Python 3.9 or higher."
        exit 1
    fi

    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    log_success "Found Python ${PYTHON_VERSION}"

    # Check for git
    if ! command_exists git; then
        log_warning "Git is not installed. Version control features will be limited."
    else
        log_success "Found Git $(git --version | cut -d' ' -f3)"
    fi

    # Check for pip
    if ! python3 -m pip --version >/dev/null 2>&1; then
        log_error "pip is not installed. Please install pip."
        exit 1
    fi

    log_success "All prerequisites satisfied"
}

################################################################################
# Virtual Environment Setup
################################################################################

setup_virtualenv() {
    log_info "Setting up Python virtual environment..."

    if [ -d "${VENV_DIR}" ]; then
        log_warning "Virtual environment already exists at ${VENV_DIR}"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Removing existing virtual environment..."
            rm -rf "${VENV_DIR}"
        else
            log_info "Using existing virtual environment"
            return 0
        fi
    fi

    log_info "Creating new virtual environment..."
    python3 -m venv "${VENV_DIR}"
    log_success "Virtual environment created at ${VENV_DIR}"
}

################################################################################
# Dependency Installation
################################################################################

install_dependencies() {
    log_info "Installing project dependencies..."

    # Activate virtual environment
    source "${VENV_DIR}/bin/activate"

    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip >/dev/null 2>&1

    # Install production dependencies
    if [ -f "${PROJECT_ROOT}/requirements.txt" ]; then
        log_info "Installing production dependencies from requirements.txt..."
        pip install -r "${PROJECT_ROOT}/requirements.txt"
        log_success "Production dependencies installed"
    else
        log_info "No requirements.txt found - will be created by coding-agent"
    fi

    # Install development dependencies
    if [ -f "${PROJECT_ROOT}/requirements-dev.txt" ]; then
        log_info "Installing development dependencies from requirements-dev.txt..."
        pip install -r "${PROJECT_ROOT}/requirements-dev.txt"
        log_success "Development dependencies installed"
    else
        log_info "Installing default development tools..."
        pip install pytest pytest-cov black flake8 mypy
        log_success "Default development tools installed"
    fi

    deactivate
}

################################################################################
# Git Setup
################################################################################

setup_git() {
    log_info "Setting up Git repository..."

    if [ -d "${PROJECT_ROOT}/.git" ]; then
        log_info "Git repository already initialized"
        return 0
    fi

    git init "${PROJECT_ROOT}"
    log_success "Git repository initialized"
}

################################################################################
# Directory Structure
################################################################################

create_directory_structure() {
    log_info "Creating project directory structure..."

    # Create necessary directories
    mkdir -p "${PROGRESS_DIR}"
    mkdir -p "${PROJECT_ROOT}/tests"
    mkdir -p "${PROJECT_ROOT}/docs"

    log_success "Directory structure created"
}

################################################################################
# Progress Tracking Verification
################################################################################

verify_progress_tracking() {
    log_info "Verifying progress tracking system..."

    local all_present=true

    if [ ! -f "${PROGRESS_DIR}/feature-list.json" ]; then
        log_error "Missing: feature-list.json"
        all_present=false
    fi

    if [ ! -f "${PROGRESS_DIR}/claude-progress.txt" ]; then
        log_error "Missing: claude-progress.txt"
        all_present=false
    fi

    if [ ! -f "${PROGRESS_DIR}/session-state.json" ]; then
        log_error "Missing: session-state.json"
        all_present=false
    fi

    if [ "$all_present" = true ]; then
        log_success "Progress tracking system verified"

        # Count features
        if command_exists jq; then
            local total_features=$(jq '.metadata.total_features' "${PROGRESS_DIR}/feature-list.json")
            local total_subtasks=$(jq '.metadata.total_subtasks' "${PROGRESS_DIR}/feature-list.json")
            log_info "Project breakdown: ${total_features} features, ${total_subtasks} subtasks"
        fi
    else
        log_warning "Some progress tracking files are missing"
    fi
}

################################################################################
# Summary and Next Steps
################################################################################

print_summary() {
    echo ""
    echo "========================================================================"
    echo -e "${GREEN}CLI Todo App - Environment Setup Complete${NC}"
    echo "========================================================================"
    echo ""
    echo "Project: CLI Todo App"
    echo "Location: ${PROJECT_ROOT}"
    echo "Virtual Environment: ${VENV_DIR}"
    echo ""
    echo "Next Steps:"
    echo "  1. Activate virtual environment:"
    echo "     source venv/bin/activate"
    echo ""
    echo "  2. Run tests (once implemented):"
    echo "     pytest tests/"
    echo ""
    echo "  3. Start development with coding-agent:"
    echo "     coding-agent 'Implement feature INFRA-001'"
    echo ""
    echo "  4. Track progress:"
    echo "     cat .claude/progress/claude-progress.txt"
    echo ""
    echo "Quick Commands:"
    echo "  - Run app: python todo.py"
    echo "  - Run tests: pytest"
    echo "  - Format code: black ."
    echo "  - Lint code: flake8 ."
    echo "  - Type check: mypy ."
    echo ""
    echo "Documentation:"
    echo "  - Feature breakdown: .claude/progress/feature-list.json"
    echo "  - Progress tracking: .claude/progress/claude-progress.txt"
    echo "  - PRD: plan.prd"
    echo ""
    echo "========================================================================"
    echo -e "${GREEN}Ready to start development!${NC}"
    echo "========================================================================"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo "========================================================================"
    echo "CLI Todo App - Development Environment Initialization"
    echo "========================================================================"
    echo ""

    check_prerequisites
    create_directory_structure
    setup_git
    setup_virtualenv
    install_dependencies
    verify_progress_tracking
    print_summary
}

# Run main function
main "$@"
