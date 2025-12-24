# MASTER_PROMPT.md

## Notes Dashboard - Claude Code Governance System

Version: 1.0.0
Created: 2025-12-24

---

## OVERVIEW

This prompt governs all Claude Code interactions with the Notes Dashboard repository. It enforces a structured workflow and references the system constitution.

---

## MANDATORY WORKFLOW

All non-trivial changes MUST follow this sequence:

```
1. PLAN     → Update PLANS.md with implementation approach
2. /REVIEW  → Run code review before major edits
3. IMPLEMENT → Make changes following constitution invariants
4. VERIFY   → Run quality gates (ruff, mypy, pytest, lint, type-check)
5. DOCUMENT → Update VERIFICATION_REPORT.md with results
```

### Workflow Triggers

| Task Type | Required Steps |
|-----------|----------------|
| Bug fix | PLAN → IMPLEMENT → VERIFY |
| New feature | PLAN → /REVIEW → IMPLEMENT → VERIFY → DOCUMENT |
| Refactor | PLAN → /REVIEW → IMPLEMENT → VERIFY |
| Configuration | IMPLEMENT → VERIFY |
| Documentation only | IMPLEMENT |

---

## CONSTITUTION REFERENCE

All changes must preserve invariants defined in `CONSTITUTION.md`:

### Backend Invariants (MUST NOT VIOLATE)
- `_normalize_positions()` is single source of truth
- Positions are 0-indexed only
- Deterministic ordering: `ORDER BY position, created_at, id`
- Recursion depth limit: 100
- Atomic deletes (flush + commit in single transaction)

### Frontend Invariants (MUST NOT VIOLATE)
- 35/30/35 vertical drop zones
- +/-40px horizontal indent/outdent thresholds
- dnd-kit with pointerWithin collision detection

### Architecture Invariants (MUST NOT VIOLATE)
- Dual-URL backend access (localhost:8000 / backend:8000)
- TipTap stores Markdown as persistence format
- Uploaded images use absolute backend URLs

### Forbidden Zones
- No `/docs` route on frontend (guarded by `scripts/forbid_docs_route.sh`)

---

## QUALITY GATES

### Backend (run in Docker)
```bash
docker compose exec backend ruff check .
docker compose exec backend mypy app --ignore-missing-imports
docker compose exec backend pytest
```

### Frontend
```bash
npm run lint       # or: docker compose exec frontend npm run lint
npm run type-check # or: docker compose exec frontend npm run type-check
```

### Guard Scripts
```bash
./scripts/forbid_docs_route.sh
```

---

## AGENT INVOCATION

Available agents in `.claude/agents/`:

| Agent | Trigger | Purpose |
|-------|---------|---------|
| orchestrator | Complex multi-step tasks | Coordinates other agents |
| repo-auditor | "audit", "check health" | Full repository audit |
| upload-pipeline | Upload/image issues | Debug upload flow |
| verification-reporter | After implementations | Generate verification reports |
| interaction-expert | DnD/sidebar UX | Drag-and-drop physics |
| logic-expert | Hierarchy/positioning | Backend data integrity |
| qa-auditor | Testing/validation | Quality assurance |

---

## SKILL INVOCATION

Available skills in `.claude/skills/`:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| governance-guard | Before merges | Check constitution compliance |
| repo-cleanup | "cleanup", "prune" | Remove dead code/files |
| visualization | "diagram", "visualize" | Generate Mermaid diagrams |
| release-verification | Before releases | Full verification suite |
| coordinate-precision-dnd | DnD precision issues | Debug zone calculations |
| project-vacuum | "vacuum", "sweep" | Clean stale artifacts |
| run-full-audit | "full audit" | Comprehensive system audit |

---

## HOOKS (Automatic)

Configured in `.claude/settings.json`:

| Event | Trigger | Action |
|-------|---------|--------|
| PostToolUse (Edit backend) | After editing `backend/**/*.py` | Run ruff + mypy |
| PostToolUse (Edit frontend) | After editing `frontend/**/*.{ts,tsx}` | Run lint + type-check |

See `.claude/HOOKS_README.md` for details.

---

## DOCUMENTATION STANDARDS

### When to Update PLANS.md
- Starting any new feature or fix
- Changing implementation approach mid-task

### When to Update VERIFICATION_REPORT.md
- After completing any implementation phase
- After running quality gates
- After fixing bugs found in verification

### When to Update CONSTITUTION.md
- New invariants discovered
- Existing invariants modified (requires justification)
- Amendment process per Article VI

---

## PROGRESSIVE DISCLOSURE

When exploring the codebase:
1. Start with targeted `Grep` for specific patterns
2. Use `Glob` to find file locations
3. Only `Read` files that are directly relevant
4. Avoid reading entire directories unnecessarily

---

## ERROR HANDLING

If quality gates fail:
1. Diagnose root cause (read error output carefully)
2. Fix minimally (don't over-engineer)
3. Re-run until passing
4. Document the fix in VERIFICATION_REPORT.md

If constitution violation detected:
1. STOP implementation
2. Report the violation
3. Propose compliant alternative
4. Get user approval before proceeding

---

## REFERENCE FILES

| File | Purpose |
|------|---------|
| `CONSTITUTION.md` | System invariants (source of truth) |
| `PLANS.md` | Implementation plans and history |
| `VERIFICATION_REPORT.md` | Verification results and audit trail |
| `CLAUDE.md` | Quick reference for common commands |
| `REVIEW_INDEX.md` | Index of governance documentation |
| `.claude/settings.json` | Hooks and local configuration |
| `.claude/agents/` | Agent definitions |
| `.claude/skills/` | Skill definitions |

---

*This master prompt is enforced for all Claude Code sessions in this repository.*
