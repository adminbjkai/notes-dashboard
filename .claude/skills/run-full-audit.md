# run-full-audit

Run the complete test suite (Pytest + Playwright + Lint) and generate a verification report.

## Usage

When this skill is invoked, execute the following steps in order:

1. **Backend Tests (Pytest)**
   ```bash
   docker compose -p notes-dashboard-by-claude exec backend pytest -v --tb=short 2>&1 | tee /tmp/pytest-output.txt
   ```

2. **Frontend Lint**
   ```bash
   docker compose -p notes-dashboard-by-claude exec frontend npm run lint 2>&1 | tee /tmp/lint-output.txt
   ```

3. **Playwright Tests**
   ```bash
   docker compose -p notes-dashboard-by-claude exec frontend npx playwright test --reporter=list 2>&1 | tee /tmp/playwright-output.txt
   ```

4. **Generate VERIFICATION_REPORT.md**
   Create or overwrite `VERIFICATION_REPORT.md` in the project root with:

   ```markdown
   # Verification Report

   **Generated:** [current timestamp]
   **Status:** [PASS/FAIL]

   ## Backend Tests (Pytest)
   - Result: [PASS/FAIL]
   - Tests Run: [count]
   - Failures: [count]

   ## Frontend Lint
   - Result: [PASS/FAIL]
   - Errors: [count]
   - Warnings: [count]

   ## Playwright E2E Tests
   - Result: [PASS/FAIL]
   - Tests Run: [count]
   - Failures: [count]

   ## Summary
   [Brief summary of overall status and any action items]
   ```

5. **Return Status**
   - If all three pass: Return "PROJECT CERTIFIED: ALL TESTS PASS"
   - If any fail: Return details of failures for auto-fix

## Notes
- Ensure Docker containers are running before invoking
- Tests should be run in sequence (backend -> lint -> playwright)
- Capture all output for debugging purposes
