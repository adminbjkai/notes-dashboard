# project-vacuum

Scan the entire project tree and identify/delete unused files, legacy artifacts, and redundant code.

## Usage

When this skill is invoked, execute the following cleanup tasks:

### 1. Find Unused TypeScript/JavaScript Files

Search for files that are not imported anywhere:
```bash
# List all TS/TSX/JS files
find frontend/components frontend/lib frontend/types -name "*.ts" -o -name "*.tsx" -o -name "*.js" | while read file; do
  basename=$(basename "$file" | sed 's/\.[^.]*$//')
  # Check if imported anywhere
  if ! grep -r "from.*['\"].*${basename}['\"]" frontend/ --include="*.ts" --include="*.tsx" | grep -v "$file" > /dev/null 2>&1; then
    echo "POTENTIALLY UNUSED: $file"
  fi
done
```

### 2. Find Duplicate/Dead CSS Classes

Look for Tailwind classes defined but never used:
```bash
# Check for custom CSS classes not referenced in TSX files
grep -r "className=" frontend/components --include="*.tsx" | \
  sed 's/.*className="//g' | sed 's/".*//g' | \
  tr ' ' '\n' | sort | uniq -c | sort -rn
```

### 3. Find Legacy Artifacts

Look for these patterns:
- `*.bak` files
- `*.orig` files
- `*.old` files
- `__pycache__` directories
- `.pyc` files
- `node_modules/.cache` (can be cleared)
- `*.log` files in root
- `.DS_Store` files (except in .gitignore)

```bash
find . -name "*.bak" -o -name "*.orig" -o -name "*.old" -o -name "*.pyc" -o -name "*.log" 2>/dev/null
find . -type d -name "__pycache__" 2>/dev/null
```

### 4. Find Unused Python Imports

```bash
docker compose -p notes-dashboard-by-claude exec backend python -m pyflakes app/ 2>&1 | grep "imported but unused"
```

### 5. Find Unused Type Definitions

Check `frontend/types/` for types not imported anywhere:
```bash
for type_file in frontend/types/*.ts; do
  exports=$(grep -E "^export (type|interface)" "$type_file" | sed 's/export \(type\|interface\) //g' | sed 's/[{ ].*//g')
  for export in $exports; do
    if ! grep -r "$export" frontend/ --include="*.ts" --include="*.tsx" | grep -v "$type_file" > /dev/null 2>&1; then
      echo "POTENTIALLY UNUSED TYPE: $export in $type_file"
    fi
  done
done
```

### 6. Cleanup Actions

After analysis, perform these safe cleanups:
- Delete `__pycache__` directories: `find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null`
- Delete `.pyc` files: `find . -name "*.pyc" -delete 2>/dev/null`
- Delete test-results if present: `rm -rf frontend/test-results/`
- Delete any `.bak`, `.orig`, `.old` files found

### 7. Generate Report

Output a summary of:
- Files analyzed
- Files identified as potentially unused (DO NOT auto-delete source files)
- Files safely deleted (cache, temp files only)
- Recommendations for manual review

## Safety Rules

- NEVER auto-delete source code files (.ts, .tsx, .py, .js)
- ONLY auto-delete: cache files, temp files, build artifacts
- Report potentially unused source files for human review
- Preserve all files in .gitignore paths
