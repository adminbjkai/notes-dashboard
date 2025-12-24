# release-verification

Full verification suite for pre-release checks. More comprehensive than run-full-audit.

## Usage

When this skill is invoked before a release, execute all checks in sequence:

### Phase 1: Constitution Compliance

```bash
# Run governance guard skill first
# See .claude/skills/governance-guard.md

# Verify all invariants documented in CONSTITUTION.md
```

### Phase 2: Backend Quality Gates

```bash
# Linting
docker compose exec backend ruff check . --output-format=grouped

# Type checking
docker compose exec backend mypy app --ignore-missing-imports --show-error-codes

# Unit tests with coverage
docker compose exec backend pytest -v --tb=short --cov=app --cov-report=term-missing
```

### Phase 3: Frontend Quality Gates

```bash
# Linting
cd frontend && npm run lint

# Type checking
cd frontend && npm run type-check

# Build verification
cd frontend && npm run build
```

### Phase 4: E2E Tests (Full Suite)

```bash
# Run all Playwright tests
cd frontend && npx playwright test --reporter=html

# Test suites:
# - smoke.spec.ts (basic functionality)
# - master-audit.spec.ts (comprehensive)
# - horizontal-dnd-stress.spec.ts (drag-and-drop)
# - image-features.spec.ts (upload/images)
```

### Phase 5: Guard Scripts

```bash
# Forbidden zones
./scripts/forbid_docs_route.sh

# Any other guard scripts in scripts/
```

### Phase 6: Documentation Check

Verify the following are up to date:
- [ ] VERIFICATION_REPORT.md reflects current state
- [ ] CONSTITUTION.md version matches changes
- [ ] CLAUDE.md has correct commands
- [ ] README.md installation steps work

## Release Checklist Output

Generate a release checklist:

```markdown
# Release Verification: v[VERSION]
Date: [YYYY-MM-DD HH:MM]

## Quality Gates
- [ ] Backend ruff: PASS/FAIL
- [ ] Backend mypy: PASS/FAIL
- [ ] Backend pytest: X/Y passed
- [ ] Frontend lint: PASS/FAIL
- [ ] Frontend type-check: PASS/FAIL
- [ ] Frontend build: PASS/FAIL

## E2E Tests
- [ ] smoke.spec.ts: X/Y passed
- [ ] master-audit.spec.ts: X/Y passed
- [ ] horizontal-dnd-stress.spec.ts: X/Y passed
- [ ] image-features.spec.ts: X/Y passed

## Constitution Compliance
- [ ] All invariants preserved
- [ ] No forbidden zone violations
- [ ] Guard scripts pass

## Documentation
- [ ] VERIFICATION_REPORT.md current
- [ ] CONSTITUTION.md version correct
- [ ] README.md accurate

## Release Decision
- [ ] APPROVED FOR RELEASE
- [ ] BLOCKED - See issues below

## Issues (if any)
[List any blocking issues]
```

## When to Use
- Before tagging a release
- Before merging to main
- After major feature completion
- Monthly health checks
