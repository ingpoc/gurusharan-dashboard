# CLI Todo App

A minimal command-line todo application demonstrating the two-agent harness pattern for AI-assisted development.

## Project Overview

This project showcases how complex requirements can be systematically decomposed into granular, trackable features using a two-agent architecture:
- **Initializer Agent**: Breaks down requirements into 198 detailed subtasks
- **Coding Agent**: Implements features incrementally with progress tracking

## Features (MVP)

- **Add tasks**: Create new todo items with a simple command
- **List tasks**: View all tasks with status indicators
- **Complete tasks**: Mark tasks as done
- **Data persistence**: Automatic save/load to JSON file
- **Error handling**: Graceful error messages and validation

## Technology Stack

- Python 3.9+
- argparse (CLI argument parsing)
- JSON (data persistence)
- pytest (testing framework)

## Quick Start

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd two-agent-demo
```

2. Run the initialization script:
```bash
chmod +x init.sh
./init.sh
```

3. Activate the virtual environment:
```bash
source venv/bin/activate
```

### Usage

Once implemented, the CLI will support these commands:

```bash
# Add a new task
todo add "Buy groceries"

# List all tasks
todo list

# Mark task as complete
todo done 1
```

## Development Status

This project is currently in the initialization phase. The complete feature breakdown is available in:
- `.claude/progress/feature-list.json` - 31 features across 8 categories
- `.claude/progress/claude-progress.txt` - Progress tracking dashboard

### Implementation Phases

1. **Phase 1: Foundation** (30 min) - Project structure and data models
2. **Phase 2: Data Layer** (45 min) - JSON persistence and task management
3. **Phase 3: Core Operations** (90 min) - Add, list, complete functionality
4. **Phase 4: CLI Interface** (90 min) - Command-line argument parsing
5. **Phase 5: Error Handling** (60 min) - Robust error management
6. **Phase 6: Testing** (90 min) - Comprehensive test coverage
7. **Phase 7: Documentation** (45 min) - User and developer docs
8. **Phase 8: Polish** (30 min) - UX improvements

## Project Structure

```
two-agent-demo/
├── .claude/
│   └── progress/
│       ├── feature-list.json      # 31 features, 198 subtasks
│       ├── claude-progress.txt    # Progress dashboard
│       └── session-state.json     # Current session state
├── tests/                          # Test files
├── docs/                           # Documentation
├── init.sh                         # Environment setup script
├── plan.prd                        # Product requirements
├── README.md                       # This file
└── todo.py                         # Main application (to be created)
```

## Two-Agent Architecture

This project demonstrates the "Effective Harnesses for Long-Running Agents" pattern:

### Initializer Agent
- Analyzes requirements and creates comprehensive feature breakdown
- Sets up development environment and progress tracking
- Creates 198 granular subtasks across 31 features
- Establishes clear implementation order and dependencies

### Coding Agent
- Implements features one at a time from feature-list.json
- Updates progress after each feature completion
- Follows test-driven development practices
- Maintains code quality and documentation standards

### Benefits
- **Granular Progress Tracking**: Every subtask is tracked
- **Recovery from Interruptions**: Session state enables seamless resumption
- **Clear Dependencies**: Features are ordered by prerequisites
- **Systematic Development**: No ambiguity about what to build next

## Development Workflow

1. **Check current status**:
```bash
cat .claude/progress/claude-progress.txt
```

2. **Start implementing next feature**:
```bash
# The coding-agent will automatically pick the next feature
coding-agent "Implement next feature from feature-list"
```

3. **Run tests**:
```bash
pytest tests/ -v
```

4. **Check coverage**:
```bash
pytest --cov=. --cov-report=html
```

## Contributing

This is a demonstration project for the two-agent harness pattern. The systematic breakdown serves as a reference for:
- Breaking down complex projects into manageable features
- Setting up progress tracking systems
- Implementing features incrementally
- Maintaining code quality throughout development

## Testing

Run the test suite:
```bash
pytest tests/
```

Run with coverage:
```bash
pytest --cov=. --cov-report=term-missing
```

## Future Enhancements (Backlog)

The feature-list.json includes 8 additional features for future releases:
- Delete tasks
- Edit task text
- Priority levels (high/medium/low)
- Due dates
- Categories and tags
- Search and filters
- Colored output
- Statistics and productivity reports

## License

This project is for educational/demonstration purposes.

## Acknowledgments

Based on the research paper "Effective Harnesses for Long-Running Agents" demonstrating systematic task decomposition and progress tracking for AI-assisted development.

---

**Current Status**: Initialized - Ready for feature implementation

**Next Step**: Implement INFRA-001 (Project Structure Setup)

**Progress**: 0/31 features completed (0/198 subtasks)
