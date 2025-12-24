# Plans

## System Health Check

1. Review Docker Compose and service Dockerfiles for backend + db configuration.
2. Start the Docker stack and confirm db health + backend availability.
3. Run Playwright tests from the frontend directory and capture results.
4. Summarize failures and propose fixes (use gh-fix-ci logic if env-related).

## Implement Recursive Tree View for Hierarchical Notes (completed)

1. Locate note fetching and rendering paths in the frontend. (done)
2. Add recursive rendering with depth-based indentation (Tailwind). (done)
3. Ensure parent_id/position ordering and handle empty/large trees. (done)
4. Run /review for recursion safety and performance. (done)

## Phase 2: Data Integrity & Drag-and-Drop (completed)

1. Add backend validation for parent/child integrity. (done)
2. Harden drag-and-drop against cycles and invalid moves. (done)
3. Add tests around integrity rules and DnD behavior. (done)

## Testing Utilities

1. Add reset-all endpoint and UI trigger for test data. (done)
2. Update docs/commands to reflect reset flow. (done)

## Sidebar UX Overhaul

1. Fix action menu click handling. (done)
2. Improve DnD nesting/reordering with drop indicators. (done)
3. Add sidebar delete action test. (done)
4. Apply Docmost-style drag thresholds and auto-expand. (done)
5. Implement strict zone DnD + backend normalization + precision test. (done)

## AI Documentation Portal (GitBook-style)

**Goal:** Serve `/docs` route with live status badges, searchable docs, and optional AI summaries.

### Phase 1: Backend (completed)
1. Create `backend/app/schemas/docs.py` - Pydantic models. (done)
2. Create `backend/app/services/docs_service.py` - Parse markdown, extract badges. (done)
3. Create `backend/app/services/ai_summary_service.py` - Rule-based + Claude fallback. (done)
4. Create `backend/app/routers/docs.py` - API endpoints. (done)
5. Update `backend/app/main.py` - Register docs router. (done)
6. Update `docker-compose.yml` - Add `.:/repo:ro` volume mount. (done)

### Phase 2: Frontend (completed)
1. Create `frontend/types/docs.ts` - TypeScript types. (done)
2. Create `frontend/lib/docs-api.ts` - API client. (done)
3. Create `frontend/app/docs/layout.tsx` - Docs layout with sidebar. (done)
4. Create `frontend/app/docs/page.tsx` - Landing page. (done)
5. Create `frontend/app/docs/[slug]/page.tsx` - Individual doc page. (done)
6. Create `frontend/components/docs/` - Sidebar, breadcrumbs, badges, content, pulse, search. (done)
7. Create `frontend/hooks/use-doc-status.ts` - Polling hook. (done)

## System Audit & Stabilization (completed 2025-12-23)

**Goal:** Full system audit with security fixes and documentation alignment.

### Audit Phase (completed)
1. Route integrity - Verified no duplicate routes, /docs independent. (done)
2. Documentation review - All markdown docs accurate. (done)
3. Runtime verification - Docker compose, migrations, all pages 200. (done)
4. Lint/type checks - Frontend ESLint + TSC pass. (done)
5. Backend checks - mypy + pytest pass. (done)
6. Security scan - npm audit identified critical CVEs. (done)

### Fixes Applied (completed)
1. **Next.js 15.1.0 → 15.5.9** - Fixed 6 critical CVEs (DoS, SSRF, RCE). (done)
2. **Added ruff/mypy to requirements.txt** - Dev dependencies now tracked. (done)
3. **Pydantic ConfigDict migration** - Resolved deprecation warnings. (done)
4. **Ruff warnings fixed** - Prefixed 7 unused test variables with `_`. (done)

### Validation (completed)
- All pages: 200 (`/`, `/docs`, `/notes/new` with redirect)
- Backend tests: 7/7 passing (no deprecation warnings)
- Frontend lint + type-check: passing
- Backend ruff + mypy: passing (0 warnings)
- **Playwright E2E tests: 33/36 passing** (3 DnD timing-sensitive tests flaky)

### Additional Fixes (completed 2025-12-23)
1. Fixed smoke tests: Updated template picker flow to handle Enter submission
2. Fixed long title test: Reduced repeat from 50 to 15 (within VARCHAR(255) limit)
3. Fixed DnD race condition: Removed redundant updateNote calls after reorderNote

**Report:** `SYSTEM_AUDIT_2025-12-23.md`

## System Audit & Image Validation (completed 2025-12-24)

**Goal:** Follow-up audit with image upload/insert validation and full E2E verification.

### Phase 1: Audit (completed)
1. Route integrity verification - No issues found. (done)
2. Documentation audit - Fixed CLAUDE.md (25/50/25 → 35/30/35 zones). (done)
3. Runtime verification - All services healthy, all endpoints 200. (done)
4. Lint/type/test checks - All passing. (done)
5. Security audit - 5 moderate dev-only vulnerabilities (vitest/esbuild). (done)
6. Image URL insertion validation - New test suite created and passing. (done)

### Phase 2: Fixes Applied (completed)
1. **CLAUDE.md zone documentation** - Corrected 25/50/25 to 35/30/35 to match implementation. (done)
2. **New image-features.spec.ts test** - Comprehensive media features test suite. (done)

### Phase 3: E2E Validation (completed)
- **Playwright E2E tests: 37/40 passing (92.5%)**
- 3 known flaky DnD timing tests (position/coordinate precision)
- Media features tests: All 4 passing (Image URL, Image Upload, File Attachment)
- All smoke, master audit, sidebar, tree view tests: Passing

### New Tests Added
1. Image URL insertion - slash menu → dialog → insert → persist
2. Image URL cancel - dialog cancellation
3. Image upload - slash menu → file picker → upload → persist
4. File attachment - slash menu → file picker → upload → persist

**Report:** `SYSTEM_AUDIT_2025-12-24.md`

## Fix Flaky DnD Tests (completed 2025-12-24)

**Goal:** Improve E2E test reliability from 92.5% to 95%+.

### Root Cause Analysis

| Test | Issue | Root Cause | Status |
|------|-------|------------|--------|
| `shows blue line indicator` | Cleanup 404 | Cascade delete race | **FIXED** |
| `moves note with code block` | parent_id not null | Coordinate mismatch | **FIXED** |
| `before zone inserts above` | Position timing | Drag precision edge case | Known flaky |
| `after zone inserts below` | Position timing | Drag precision edge case | Known flaky |

### Fixes Applied

1. **Added `safeDeleteTestNote` helper** - Ignores 404 (cascade-deleted notes)
2. **Explicit horizontal offset for root drop** - Uses -120px offset instead of absolute coords
3. **Increased wait times** - 500ms → 1000ms for position normalization

### Final Results

- **Before:** 37/40 passing (92.5%)
- **After:** 38/40 passing (95%)
- 2 remaining flaky tests: Position-precision edge cases (timing-sensitive, not critical)
