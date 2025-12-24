# Claude Code Hooks Configuration

## Overview

This project uses Claude Code hooks to automatically run quality checks after code edits. Hooks are configured in `.claude/settings.json`.

## Configured Hooks

### PostToolUse Hooks

These hooks run automatically after Claude uses Edit or Write tools on source files.

| Trigger | File Pattern | Commands |
|---------|--------------|----------|
| Edit/Write | `backend/**/*.py` | ruff check, mypy |
| Edit/Write | `frontend/**/*.{ts,tsx}` | npm run lint, npm run type-check |

### What Happens

1. **Backend Python Edits**
   - Runs `ruff check app/` for linting
   - Runs `mypy app` for type checking
   - Output limited to first 20 lines to avoid noise

2. **Frontend TypeScript Edits**
   - Runs `npm run lint` for ESLint
   - Runs `npm run type-check` for TypeScript
   - Output limited to first 20 lines

### Example Output

When you edit a Python file:
```
🔍 Running backend quality checks...
✅ mypy: OK
```

When you edit a TypeScript file:
```
🔍 Running frontend quality checks...
✅ type-check: OK
```

## Requirements

- Docker must be running for backend checks
- Node.js must be available for frontend checks
- Commands use `|| true` to prevent blocking on lint errors

## Disabling Hooks

To temporarily disable hooks, rename or remove `.claude/settings.json`.

To disable specific hooks, remove entries from the `PostToolUse` array.

## Troubleshooting

### "Docker is not running"
Start Docker: `docker compose up -d`

### "npm: command not found"
Ensure Node.js is installed and in PATH.

### Hooks not firing
- Check file path matches the condition pattern
- Ensure file extension is `.py`, `.ts`, or `.tsx`
- Verify `.claude/settings.json` is valid JSON

## Related Files

- `.claude/settings.json` - Hook configuration
- `.claude/settings.local.json` - Local permissions (gitignored)
- `CONSTITUTION.md` - Quality standards and invariants
- `MASTER_PROMPT.md` - Workflow enforcement
