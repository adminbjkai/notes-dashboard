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
