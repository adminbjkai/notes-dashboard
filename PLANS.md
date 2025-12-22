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
5. Implement strict zone DnD + backend normalization + precision test. (in progress)
