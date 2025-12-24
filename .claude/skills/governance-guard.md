# governance-guard

Check constitution compliance before merges. Prevents invariant violations from entering the codebase.

## Usage

When this skill is invoked, execute the following checks:

### 1. Backend Invariant Checks

```bash
# Check for 1-indexed positions (violation)
grep -rn "count + 1" backend/app/services/ || echo "OK: No 1-indexed positions"

# Verify normalize_positions calls after mutations
grep -A5 "def create\|def update\|def reorder\|def delete" backend/app/services/note_service.py | grep "_normalize_positions" || echo "WARNING: Check normalization calls"

# Verify deterministic ordering
grep -n "ORDER BY" backend/app/ -r | grep -v "position.*created_at.*id" && echo "WARNING: Non-deterministic ordering found"
```

### 2. Frontend Invariant Checks

```bash
# Verify 35/30/35 zone constants
grep -n "0.35\|35%" frontend/components/layout/page-tree.tsx || echo "WARNING: Check zone constants"

# Verify indent/outdent thresholds
grep -n "INDENT_THRESHOLD\|40" frontend/components/layout/page-tree.tsx || echo "WARNING: Check indent thresholds"

# Check collision detection
grep -n "pointerWithin" frontend/components/layout/page-tree.tsx || echo "WARNING: Check collision detection"
```

### 3. Forbidden Zone Checks

```bash
# Run guard script
./scripts/forbid_docs_route.sh

# Check for direct position assignment
grep -rn "\.position\s*=" backend/app/services/ | grep -v "_normalize_positions\|999999\|_get_next_position" && echo "WARNING: Direct position assignment found"
```

### 4. Architecture Checks

```bash
# Verify dual-URL pattern
grep -rn "localhost:8000\|backend:8000" frontend/ | head -5

# Check upload URL handling
grep -n "getImageUrl" frontend/components/editor/resizable-image.tsx || echo "WARNING: Check upload URL handling"
```

## Output

Return one of:
- `GOVERNANCE CHECK: PASS` - All invariants preserved
- `GOVERNANCE CHECK: FAIL` - List violations with file:line references

## When to Use
- Before merging PRs
- After significant refactoring
- As part of CI pipeline
