# CONSTITUTION_DRAFT.md

## Notes Dashboard - System Invariants & Governance Rules

Version: 1.0.0-draft
Generated: 2024-12-24
Source: System_Hardening_A_Case_Study PDF + Architecture Documentation

---

## PREAMBLE

This constitution codifies the invariant rules that govern the Notes Dashboard application. These rules were extracted from the System Hardening Case Study audit (docs-by-notebooklm) and validated against the codebase. Any modification to the system MUST preserve these invariants.

---

## ARTICLE I: BACKEND INVARIANTS

### Section 1.1: Position Management

**1.1.1 Single Source of Truth**
> `_normalize_positions()` is the ONLY function authorized to assign final positions to notes within a parent group.

**1.1.2 Zero-Indexed Positions**
> Positions MUST be 0-indexed. The sequence for N siblings MUST be [0, 1, 2, ..., N-1].
> - `_get_next_position()` returns `count` (not `count + 1`)
> - Any 1-indexed position assignment is a BUG

**1.1.3 Deterministic Ordering**
> All queries that order notes MUST use the tiebreaker sequence:
> ```sql
> ORDER BY position, created_at, id
> ```
> The `id` field provides final stability for race conditions where `position` and `created_at` are identical.

**1.1.4 Normalization on Every Mutation**
> `_normalize_positions()` MUST be called after:
> - `create()` - on the target parent_id
> - `update()` - on both old and new parent_id if changed
> - `reorder()` - on both source and destination parent_id
> - `delete()` - on the former parent_id

### Section 1.2: Circular Reference Prevention

**1.2.1 Self-Parent Prohibition**
> A note MUST NOT have itself as its own parent:
> ```python
> if new_parent_id == note_id:
>     raise ValueError("Note cannot be its own parent")
> ```

**1.2.2 Descendant Check**
> Before setting a new parent, the system MUST verify the target is not a descendant:
> ```python
> if self._is_descendant(new_parent_id, note_id):
>     raise ValueError("Cannot move note under its own descendant")
> ```

**1.2.3 Recursion Depth Limit**
> The `_is_descendant()` recursive CTE MUST have a hard depth limit:
> ```sql
> WHERE d.depth < 100
> ```
> This prevents infinite loops in case of data corruption.

### Section 1.3: Atomic Operations

**1.3.1 Delete Atomicity**
> The `delete()` method MUST execute as a single atomic transaction:
> ```python
> self.db.delete(note)
> self.db.flush()           # Stage deletion
> self._normalize_positions(parent_id)  # Fix gaps
> self.db.commit()          # Commit together
> ```
> Two separate commits are FORBIDDEN.

**1.3.2 Reorder Safety**
> During reorder, notes MUST be moved to a temporary position (999999) before normalization to avoid position conflicts.

### Section 1.4: Parent Validation

**1.4.1 Parent Existence Check**
> Before assigning a parent_id, the system MUST verify the parent exists:
> ```python
> if not self._parent_exists(new_parent_id):
>     raise ValueError("Parent note does not exist")
> ```

---

## ARTICLE II: FRONTEND INVARIANTS

### Section 2.1: Drag-and-Drop Zone Strategy

**2.1.1 The 35/30/35 Rule**
> Vertical drop zones MUST be divided as:
> - **Top 35%**: "before" - Insert as sibling above
> - **Middle 30%**: "on" - Nest as child
> - **Bottom 35%**: "after" - Insert as sibling below

```typescript
const upperBand = overRect.top + overRect.height * 0.35;
const lowerBand = overRect.bottom - overRect.height * 0.35;
if (y <= upperBand) return "before";
if (y >= lowerBand) return "after";
return "on";
```

**2.1.2 Horizontal Drag Thresholds**
> - **Indent (>+40px horizontal)**: Force "on" drop position (nest into target)
> - **Outdent (<-40px horizontal)**: Move to grandparent level

```typescript
const INDENT_THRESHOLD = 40;
if (horizontalOffset > INDENT_THRESHOLD) position = "on";
else if (horizontalOffset < -INDENT_THRESHOLD && overNode?.parent_id) {
  // Outdent to parent level
}
```

**2.1.3 Root Drop Zone**
> A 20px-wide invisible strip on the left side of the sidebar MUST accept drops to move items to root level.

### Section 2.2: Client-Side Validation

**2.2.1 Invalid Target Prevention**
> The frontend MUST track and visually indicate invalid drop targets:
> - The dragged note itself
> - All descendants of the dragged note

**2.2.2 Visual Feedback**
> - Valid nest target: blue highlight ring
> - Invalid target: red border + not-allowed cursor
> - Outdent target: indigo highlight on parent

### Section 2.3: dnd-kit Configuration

**2.3.1 Sensor Activation**
> PointerSensor MUST have a minimum activation distance:
> ```typescript
> activationConstraint: { distance: 8 }
> ```

**2.3.2 Collision Detection**
> Use `pointerWithin` collision detection for precision:
> ```typescript
> collisionDetection={pointerWithin}
> ```

---

## ARTICLE III: ARCHITECTURE INVARIANTS

### Section 3.1: Dual-URL Backend Access

**3.1.1 Browser Access**
> All client-side (browser) requests to the backend MUST use:
> ```
> http://localhost:8000
> ```

**3.1.2 Server-Side Access**
> All Next.js server-side requests (SSR, API routes) MUST use:
> ```
> http://backend:8000
> ```
> This leverages Docker's internal network for faster, more secure communication.

### Section 3.2: Content Persistence

**3.2.1 Storage Format**
> TipTap editor content MUST be stored as **Markdown** in the database.
> - Markdown is the persistence format
> - HTML is the editing format
> - Bidirectional conversion via `marked` (MD->HTML) and `turndown` (HTML->MD)

### Section 3.3: Container Network

**3.3.1 Service Names**
> Docker Compose services MUST be named:
> - `frontend` (port 3000)
> - `backend` (port 8000)
> - `db` (PostgreSQL port 5432)

---

## ARTICLE IV: FORBIDDEN ZONES

### Section 4.1: Reserved Routes

**4.1.1 /docs Route**
> The Next.js `/docs` route on port 3000 is reserved for internal documentation.
> - This route MUST NOT conflict with application functionality
> - Public documentation should use a separate deployment or subdomain

### Section 4.2: Restricted Operations

**4.2.1 Direct Position Assignment**
> Direct manipulation of `note.position` outside of `_normalize_positions()` is FORBIDDEN except for:
> - Initial assignment in `create()`
> - Temporary position (999999) during `reorder()`

**4.2.2 Cascade Bypass**
> Manual deletion of child notes to bypass cascade behavior is FORBIDDEN.

---

## ARTICLE V: TESTING & VERIFICATION

### Section 5.1: Backend Test Suite

**5.1.1 Test Command**
> ```bash
> docker compose exec backend pytest
> ```

**5.1.2 Required Test Coverage**
> - `test_reorder_comprehensive.py`: Edge cases for hierarchy operations
> - Circular reference prevention
> - Position beyond sibling count
> - Cross-parent moves
> - Root-level operations

### Section 5.2: Frontend E2E Tests

**5.2.1 Test Command**
> ```bash
> npx playwright test
> ```

**5.2.2 Master Audit Suite**
> `master-audit.spec.ts` MUST cover:
> - Rich content persistence (TipTap formatting)
> - Deep nesting (5 levels minimum)
> - Rapid create/delete stress tests

### Section 5.3: Verification Commands

**5.3.1 Full Reset**
> ```bash
> curl -X DELETE http://localhost:8000/api/notes/reset/all
> ```

**5.3.2 Lint Check**
> ```bash
> docker compose exec frontend npm run lint
> ```

---

## ARTICLE VI: AMENDMENT PROCESS

### Section 6.1: Modification Protocol

Any change to code governed by this constitution MUST:

1. **Identify Impact**: Document which Articles are affected
2. **Preserve Invariants**: Prove the change maintains all invariants
3. **Update Tests**: Add or modify tests to cover the change
4. **Update Constitution**: Amend this document if new invariants are introduced

### Section 6.2: Version Control

- Constitution versions follow SemVer
- Breaking invariant changes require major version bump
- New invariants require minor version bump
- Clarifications require patch version bump

---

## APPENDIX A: File References

| Invariant Category | Primary Source File |
|--------------------|---------------------|
| Position Management | `backend/app/services/note_service.py` |
| Drag-and-Drop Zones | `frontend/components/layout/page-tree.tsx` |
| Content Persistence | `frontend/components/editor/markdown-converter.ts` |
| Upload Handling | `backend/app/routers/uploads.py` |
| API Routes | `backend/app/routers/notes.py` |

## APPENDIX B: Audit Source

This constitution is derived from:
- `docs-by-notebooklm/System_Hardening_A_Case_Study (1).pdf`
- `docs-by-notebooklm/A_SIMPLE_GUIDE_TO_THIS_APPs_ARCHITECTURE.txt`
- Visual specifications from architecture PNG diagrams

---

*End of Constitution Draft*
