# CLI Todo App

A minimal command-line todo application demonstrating the two-agent harness pattern for long-running AI development sessions.

## Project Overview

This project showcases how complex requirements decompose into granular, trackable features using a structured two-agent workflow:
- **Initializer Agent**: Breaks down requirements into detailed feature lists
- **Coding Agent**: Implements features incrementally with progress tracking

## Features (MVP)

- **Add tasks**: Create new todo items from the command line
- **List tasks**: Display all tasks with visual completion status
- **Complete tasks**: Mark tasks as done by number
- **Data persistence**: Automatic save/load to JSON file
- **Error handling**: Helpful messages for invalid commands

## Requirements

- Python 3.9 or higher
- pytest (for testing)

## Installation

1. Clone this repository
2. Run the setup script:
   ```bash
   chmod +x init.sh
   ./init.sh
   ```
3. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

## Usage

### Add a Task
```bash
python todo.py add "Buy groceries"
python todo.py add "Write documentation"
```

### List All Tasks
```bash
python todo.py list
```

Example output:
```
1. [ ] Buy groceries
2. [ ] Write documentation
```

### Complete a Task
```bash
python todo.py done 1
```

Updated output:
```
1. [✓] Buy groceries
2. [ ] Write documentation
```

## Development

### Project Structure
```
.
├── todo.py                 # Main application (to be created)
├── test_todo.py           # Test suite (to be created)
├── todos.json             # Data file (auto-generated)
├── plan.prd               # Product requirements
├── init.sh                # Environment setup script
├── .claude/
│   └── progress/
│       ├── feature-list.json      # Detailed feature breakdown (18 features)
│       ├── claude-progress.txt    # Human-readable progress tracker
│       └── session-state.json     # Session state for recovery
└── README.md              # This file
```

### Feature Breakdown

This project contains **18 granular features** across **4 epics**:

1. **EPIC-01: Core Task Operations** (4 features)
   - Task data model
   - Add task function
   - List tasks function
   - Complete task function

2. **EPIC-02: Data Persistence** (4 features)
   - Save tasks to JSON
   - Load tasks from JSON
   - Auto-save on modifications
   - Data validation and migration

3. **EPIC-03: CLI Interface** (4 features)
   - Argument parser setup
   - Main entry point
   - User feedback messages
   - Executable setup

4. **EPIC-04: Testing & Documentation** (6 features)
   - Core function unit tests
   - Persistence tests
   - Integration tests
   - README documentation
   - Code documentation

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=todo

# Run specific test file
pytest test_todo.py -v
```

### Development Workflow

This project uses the two-agent pattern:

1. **Initialization** (this phase - complete)
   - Feature breakdown created
   - Development environment set up
   - Progress tracking initialized

2. **Implementation** (next phase)
   - Use `coding-agent` to implement features one at a time
   - Features are tracked in `.claude/progress/`
   - Start with: `TASK-001: Task Data Model`

3. **Testing**
   - Tests are implemented as separate features
   - Run tests after each feature completion

### Progress Tracking

View current progress:
```bash
cat .claude/progress/claude-progress.txt
```

View detailed feature list:
```bash
cat .claude/progress/feature-list.json | python -m json.tool
```

## Demo Timeline

This project is scoped for a **10-minute live implementation demo**.

Recommended demo sequence:
1. TASK-002: Add Task Function (2 min)
2. TASK-003: List Tasks Function (2 min)
3. PERSIST-001: Save Tasks to JSON (2 min)
4. CLI-001: Argument Parser Setup (3 min)
5. Live demonstration (1 min)

## Future Enhancements (Out of Scope)

- Delete tasks
- Edit existing tasks
- Priority levels
- Due dates
- Categories/tags
- Search and filters
- Colored output
- Statistics and analytics

## Technical Details

- **Language**: Python 3.9+
- **CLI Framework**: argparse
- **Storage**: JSON file (todos.json)
- **Testing**: pytest
- **Architecture**: Single-file script (todo.py)

## License

This is a demonstration project for educational purposes.

## Contributing

This project follows a strict two-agent workflow:
1. All feature planning happens in the initialization phase
2. All implementation happens through the coding-agent
3. Progress is tracked automatically via `.claude/progress/`

See `.claude/progress/feature-list.json` for the complete feature roadmap.

---

**Status**: Initialized - Ready for implementation
**Next Feature**: TASK-001 (Task Data Model)
**Estimated Total Time**: 15.75 hours
