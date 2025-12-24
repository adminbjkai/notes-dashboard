# repo-cleanup

Remove dead code, stale files, and unused dependencies. Use with "cleanup" or "prune" commands.

## Usage

When this skill is invoked, execute the following cleanup checks:

### 1. Find Unused Imports (Python)

```bash
# Check for unused imports in backend
docker compose exec backend ruff check . --select F401 2>/dev/null || echo "Run: ruff check . --select F401"
```

### 2. Find Unused Imports (TypeScript)

```bash
# Check for unused imports in frontend
cd frontend && npx eslint --rule '{"@typescript-eslint/no-unused-vars": "warn"}' . 2>/dev/null | grep "no-unused-vars" | head -20
```

### 3. Find Orphaned Files

Check for files that are:
- Not imported anywhere
- Test files without corresponding source
- Stale migration files

```bash
# Find Python files not imported
find backend/app -name "*.py" -type f | while read f; do
  basename=$(basename "$f" .py)
  if [ "$basename" != "__init__" ] && ! grep -rq "from.*$basename\|import.*$basename" backend/app/; then
    echo "Potentially orphaned: $f"
  fi
done
```

### 4. Check for Stale Dependencies

```bash
# Backend: Check requirements.txt against imports
pip-check 2>/dev/null || echo "Install pip-check for dependency analysis"

# Frontend: Check for unused packages
cd frontend && npx depcheck 2>/dev/null || echo "Run: npx depcheck"
```

### 5. Clean Test Artifacts

```bash
# Remove old test results
rm -rf frontend/test-results/*
rm -rf frontend/playwright-report/*
rm -rf backend/.pytest_cache
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null
```

## Output

Return:
- List of files/imports to remove
- Suggested cleanup commands
- Before/after file count

## When to Use
- Before releases
- After removing features
- Periodic maintenance (weekly/monthly)

## Caution
- Always review suggestions before deleting
- Check git status before cleanup
- Don't delete files that are dynamically imported
