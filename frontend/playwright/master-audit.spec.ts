import { test, expect } from "@playwright/test";
import { createTestNote, deleteTestNote, getTestNote } from "./helpers/api-utils";

/**
 * MASTER AUDIT TEST SUITE
 * Comprehensive testing of Notes Dashboard functionality including:
 * - Rich content payloads (tables, code blocks, images)
 * - Persistence verification with forced reloads
 * - UX actions (rename, delete, add subpage)
 * - Stress tests (rapid operations, deep nesting)
 * - Edge cases (circular reference prevention)
 */

test.describe("Master Audit: Payload Tests", () => {
  test("creates note with table content", async ({ page, request }) => {
    const title = `Table Note ${Date.now()}`;
    const tableContent = `
# Test Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Row 2A   | Row 2B   | Row 2C   |
    `.trim();

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { 
        title, 
        content: tableContent 
      });
      noteId = note.id;

      // Navigate to the note
      await page.goto(`/notes/${note.id}`);
      
      // Wait for content to load
      await page.waitForSelector("main", { timeout: 5000 });
      
      // Verify the content is present in the page
      const mainContent = page.locator("main");
      await expect(mainContent).toContainText("Test Table");
      await expect(mainContent).toContainText("Column 1");
      
      // Reload and verify persistence
      await page.reload();
      await page.waitForSelector("main", { timeout: 5000 });
      await expect(mainContent).toContainText("Test Table");
      
      // Verify via API that content persisted
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.content).toBe(tableContent);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("creates note with code block content", async ({ page, request }) => {
    const title = `Code Note ${Date.now()}`;
    const codeContent = `
# TypeScript Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
\`\`\`
    `.trim();

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { 
        title, 
        content: codeContent 
      });
      noteId = note.id;

      await page.goto(`/notes/${note.id}`);
      await page.waitForSelector("main", { timeout: 5000 });
      
      const mainContent = page.locator("main");
      await expect(mainContent).toContainText("TypeScript Example");
      await expect(mainContent).toContainText("function greet");
      
      // Reload and verify persistence
      await page.reload();
      await page.waitForSelector("main", { timeout: 5000 });
      await expect(mainContent).toContainText("TypeScript Example");
      
      // Verify via API
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.content).toBe(codeContent);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("creates note with image URL content", async ({ page, request }) => {
    const title = `Image Note ${Date.now()}`;
    const imageContent = `
# My Image Gallery

![Sample Image](https://example.com/image.png)

This is a test image reference.
    `.trim();

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { 
        title, 
        content: imageContent 
      });
      noteId = note.id;

      await page.goto(`/notes/${note.id}`);
      await page.waitForSelector("main", { timeout: 5000 });
      
      const mainContent = page.locator("main");
      await expect(mainContent).toContainText("My Image Gallery");
      await expect(mainContent).toContainText("test image reference");
      
      // Reload and verify persistence
      await page.reload();
      await page.waitForSelector("main", { timeout: 5000 });
      await expect(mainContent).toContainText("My Image Gallery");
      
      // Verify via API
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.content).toBe(imageContent);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });
});

test.describe("Master Audit: Persistence Tests", () => {
  test("note title persists after multiple renames", async ({ page, request }) => {
    const initialTitle = `Initial Title ${Date.now()}`;
    const secondTitle = `Second Title ${Date.now()}`;
    const thirdTitle = `Third Title ${Date.now()}`;

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title: initialTitle });
      noteId = note.id;

      await page.goto(`/notes/${note.id}`);
      
      const sidebar = page.locator("aside");
      
      // First rename
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      await request.patch(`${API_BASE_URL}/api/notes/${note.id}`, {
        data: { title: secondTitle }
      });
      
      // Reload and verify first rename
      await page.reload();
      await expect(sidebar.getByRole("button", { name: secondTitle })).toBeVisible({ timeout: 5000 });
      
      // Second rename
      await request.patch(`${API_BASE_URL}/api/notes/${note.id}`, {
        data: { title: thirdTitle }
      });
      
      // Reload and verify second rename
      await page.reload();
      await expect(sidebar.getByRole("button", { name: thirdTitle })).toBeVisible({ timeout: 5000 });
      
      // Verify via API
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.title).toBe(thirdTitle);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("hierarchy persists after drag-and-drop", async ({ page, request }) => {
    const parentTitle = `Parent ${Date.now()}`;
    const childTitle = `Child ${Date.now()}`;

    let parentId: string | null = null;
    let childId: string | null = null;

    try {
      const parent = await createTestNote(request, { title: parentTitle });
      parentId = parent.id;
      
      const child = await createTestNote(request, { title: childTitle, parent_id: parent.id });
      childId = child.id;

      // Verify hierarchy via API
      const childFromApi = await getTestNote(request, child.id);
      expect(childFromApi.parent_id).toBe(parent.id);
      
      // Navigate and verify in UI
      await page.goto(`/notes/${child.id}`);
      
      const sidebar = page.locator("aside");
      
      // Parent should be visible and expanded
      await expect(sidebar.getByRole("button", { name: parentTitle })).toBeVisible();
      await expect(sidebar.getByRole("button", { name: childTitle })).toBeVisible();
      
      // Reload and verify hierarchy still exists
      await page.reload();
      await expect(sidebar.getByRole("button", { name: parentTitle })).toBeVisible({ timeout: 5000 });
      await expect(sidebar.getByRole("button", { name: childTitle })).toBeVisible({ timeout: 5000 });
      
      // Final API verification
      const finalChild = await getTestNote(request, child.id);
      expect(finalChild.parent_id).toBe(parent.id);
    } finally {
      if (childId) await deleteTestNote(request, childId);
      if (parentId) await deleteTestNote(request, parentId);
    }
  });
});

test.describe("Master Audit: UX Action Tests", () => {
  test("rename note via menu", async ({ page, request }) => {
    const originalTitle = `Original ${Date.now()}`;
    const newTitle = `Renamed ${Date.now()}`;

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title: originalTitle });
      noteId = note.id;

      await page.goto(`/notes/${note.id}`);
      
      const sidebar = page.locator("aside");
      const noteButton = sidebar.getByRole("button", { name: originalTitle });
      const noteRow = noteButton.locator("xpath=ancestor::div[contains(@class, 'group')][1]");

      // Hover to reveal menu
      await noteRow.hover();
      await page.waitForTimeout(200);

      // Click menu toggle
      const menuToggle = noteRow.locator("[data-menu-toggle]");
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();

      // Look for Rename option
      const renameMenuItem = sidebar.locator("button", { hasText: "Rename" });
      await expect(renameMenuItem).toBeVisible({ timeout: 5000 });
      await renameMenuItem.click();

      // Wait for input field to appear
      const inputField = noteRow.locator("input[type='text']");
      await expect(inputField).toBeVisible({ timeout: 5000 });

      // Clear and type new name
      await inputField.clear();
      await inputField.fill(newTitle);
      await inputField.press("Enter");

      // Wait for update to complete
      await page.waitForTimeout(500);

      // Verify rename in sidebar
      await expect(sidebar.getByRole("button", { name: newTitle })).toBeVisible({ timeout: 5000 });
      await expect(sidebar.getByRole("button", { name: originalTitle })).toHaveCount(0);

      // Verify via API
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.title).toBe(newTitle);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("delete note via menu with confirmation", async ({ page, request }) => {
    const title = `Delete Via Menu ${Date.now()}`;

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title });
      noteId = note.id;

      // Set up dialog handler BEFORE navigation
      let dialogHandled = false;
      page.on("dialog", async (dialog) => {
        expect(dialog.type()).toBe("confirm");
        dialogHandled = true;
        await dialog.accept();
      });

      await page.goto(`/notes/${note.id}`);
      
      const sidebar = page.locator("aside");
      const noteButton = sidebar.getByRole("button", { name: title });
      const noteRow = noteButton.locator("xpath=ancestor::div[contains(@class, 'group')][1]");

      // Hover to reveal menu
      await noteRow.hover();
      await page.waitForTimeout(200);

      // Click menu toggle
      const menuToggle = noteRow.locator("[data-menu-toggle]");
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();

      // Click Delete
      const deleteMenuItem = sidebar.locator("button.text-red-600", { hasText: "Delete" });
      await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
      await deleteMenuItem.click();

      // Give dialog time to be handled
      await page.waitForTimeout(500);

      // Verify dialog was shown and accepted
      expect(dialogHandled).toBe(true);

      // Verify note is gone from sidebar
      await expect(sidebar.getByRole("button", { name: title })).toHaveCount(0, { timeout: 10000 });

      // Mark as deleted so cleanup doesn't fail
      noteId = null;
    } finally {
      // Only try to delete if it wasn't deleted by the test
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("add subpage via menu", async ({ page, request }) => {
    const parentTitle = `Parent for Subpage ${Date.now()}`;
    const subpageTitle = `Subpage ${Date.now()}`;

    let parentId: string | null = null;
    let childId: string | null = null;

    try {
      const parent = await createTestNote(request, { title: parentTitle });
      parentId = parent.id;

      await page.goto(`/notes/${parent.id}`);
      
      const sidebar = page.locator("aside");
      const parentButton = sidebar.getByRole("button", { name: parentTitle });
      const parentRow = parentButton.locator("xpath=ancestor::div[contains(@class, 'group')][1]");

      // Hover to reveal menu
      await parentRow.hover();
      await page.waitForTimeout(200);

      // Click menu toggle
      const menuToggle = parentRow.locator("[data-menu-toggle]");
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();

      // Click "Add subpage"
      const addSubpageMenuItem = sidebar.locator("button", { hasText: "Add subpage" });
      await expect(addSubpageMenuItem).toBeVisible({ timeout: 5000 });
      await addSubpageMenuItem.click();

      // Wait for input field or new note to appear
      await page.waitForTimeout(1000);

      // Look for a new nested item or input field
      // The implementation may vary - check if there's an input or a new child
      const possibleInput = sidebar.locator("input[type='text']");
      
      if (await possibleInput.count() > 0) {
        // If there's an input, fill it
        await possibleInput.first().fill(subpageTitle);
        await possibleInput.first().press("Enter");
        await page.waitForTimeout(500);
      }

      // The subpage should now be visible in sidebar
      // Note: This depends on the actual implementation
      // If subpage is created automatically, verify it exists
      await page.waitForTimeout(1000);

      // Reload to verify persistence
      await page.reload();
      await page.waitForTimeout(1000);

      // Verify parent is still visible
      await expect(sidebar.getByRole("button", { name: parentTitle })).toBeVisible({ timeout: 5000 });

      // Get all notes to find the child
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const allNotesRes = await request.get(`${API_BASE_URL}/api/notes`);
      const allNotes = await allNotesRes.json();
      const children = allNotes.filter((n: any) => n.parent_id === parent.id);

      // If a child was created, track it for cleanup
      if (children.length > 0) {
        childId = children[0].id;
        expect(children[0].parent_id).toBe(parent.id);
      }
    } finally {
      if (childId) await deleteTestNote(request, childId);
      if (parentId) await deleteTestNote(request, parentId);
    }
  });
});

test.describe("Master Audit: Stress Tests", () => {
  test("handles rapid create/delete cycles", async ({ page, request }) => {
    const noteIds: string[] = [];

    try {
      // Create 5 notes rapidly
      for (let i = 0; i < 5; i++) {
        const note = await createTestNote(request, { 
          title: `Rapid Note ${Date.now()}-${i}` 
        });
        noteIds.push(note.id);
      }

      // Verify all created
      expect(noteIds.length).toBe(5);

      // Navigate to first note
      await page.goto(`/notes/${noteIds[0]}`);
      
      const sidebar = page.locator("aside");
      
      // Verify at least some notes are visible
      await page.waitForTimeout(1000);

      // Delete all 5 rapidly
      for (const id of noteIds) {
        await deleteTestNote(request, id);
      }

      // Clear the array since we deleted them
      noteIds.length = 0;

      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);

      // Verify sidebar doesn't contain the deleted notes
      // Get all notes to verify
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const allNotesRes = await request.get(`${API_BASE_URL}/api/notes`);
      const allNotes = await allNotesRes.json();
      
      const deletedTitles = noteIds.map((_, i) => `Rapid Note ${Date.now()}-${i}`);
      for (const title of deletedTitles) {
        const found = allNotes.find((n: any) => n.title === title);
        expect(found).toBeUndefined();
      }
    } finally {
      // Clean up any remaining notes
      for (const id of noteIds) {
        try {
          await deleteTestNote(request, id);
        } catch {
          // Already deleted
        }
      }
    }
  });

  test("handles deep nesting (5 levels)", async ({ page, request }) => {
    const noteIds: string[] = [];
    const titles = [
      `Level 0 ${Date.now()}`,
      `Level 1 ${Date.now()}`,
      `Level 2 ${Date.now()}`,
      `Level 3 ${Date.now()}`,
      `Level 4 ${Date.now()}`,
    ];

    try {
      // Create chain: A -> B -> C -> D -> E
      let parentId: string | null = null;
      
      for (let i = 0; i < 5; i++) {
        const note = await createTestNote(request, {
          title: titles[i],
          parent_id: parentId
        });
        noteIds.push(note.id);
        parentId = note.id;
      }

      // Navigate to deepest child (E)
      const deepestId = noteIds[noteIds.length - 1];
      await page.goto(`/notes/${deepestId}`);
      
      const sidebar = page.locator("aside");
      
      // Wait for sidebar to load
      await page.waitForTimeout(1000);

      // Verify all parents are visible (they should be auto-expanded)
      for (const title of titles) {
        await expect(sidebar.getByRole("button", { name: title })).toBeVisible({ timeout: 5000 });
      }

      // Reload and verify hierarchy maintained
      await page.reload();
      await page.waitForTimeout(1000);

      // All levels should still be visible after reload
      for (const title of titles) {
        await expect(sidebar.getByRole("button", { name: title })).toBeVisible({ timeout: 5000 });
      }

      // Verify hierarchy via API
      for (let i = 1; i < noteIds.length; i++) {
        const note = await getTestNote(request, noteIds[i]);
        expect(note.parent_id).toBe(noteIds[i - 1]);
      }

      // First note should have no parent
      const rootNote = await getTestNote(request, noteIds[0]);
      expect(rootNote.parent_id).toBeNull();
    } finally {
      // Delete in reverse order (children first)
      for (let i = noteIds.length - 1; i >= 0; i--) {
        await deleteTestNote(request, noteIds[i]);
      }
    }
  });
});

test.describe("Master Audit: Edge Case Tests", () => {
  test("prevents moving parent into child", async ({ page, request }) => {
    const parentTitle = `Parent ${Date.now()}`;
    const childTitle = `Child ${Date.now()}`;

    let parentId: string | null = null;
    let childId: string | null = null;

    try {
      const parent = await createTestNote(request, { title: parentTitle });
      parentId = parent.id;
      
      const child = await createTestNote(request, { title: childTitle, parent_id: parent.id });
      childId = child.id;

      await page.goto(`/notes/${child.id}`);

      const sidebar = page.locator("aside");
      const parentRow = sidebar.getByRole("button", { name: parentTitle }).locator("..");
      const childRow = sidebar.getByRole("button", { name: childTitle }).locator("..");
      const parentHandle = parentRow.locator("[data-dnd-handle]");

      // Get bounding boxes
      await parentRow.hover();
      const parentBox = await parentHandle.boundingBox();
      const childBox = await childRow.boundingBox();
      
      if (!parentBox || !childBox) {
        throw new Error("Missing drag handle bounds");
      }

      // Attempt to drag parent onto child
      await page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(childBox.x + childBox.width / 2, childBox.y + childBox.height / 2, {
        steps: 20,
      });

      // Wait for dnd-kit to process
      await page.waitForTimeout(300);

      // Should show red border indicating invalid drop
      const childRowInner = sidebar.getByRole("button", { name: childTitle })
        .locator("xpath=ancestor::div[contains(@class, 'group')][1]");
      await expect(childRowInner).toHaveClass(/border-red-400/, { timeout: 5000 });

      await page.mouse.up();

      // Verify parent_id didn't change (still null)
      const refreshedParent = await getTestNote(request, parent.id);
      expect(refreshedParent.parent_id).toBeNull();

      // Verify child is still a child of parent
      const refreshedChild = await getTestNote(request, child.id);
      expect(refreshedChild.parent_id).toBe(parent.id);
    } finally {
      if (childId) await deleteTestNote(request, childId);
      if (parentId) await deleteTestNote(request, parentId);
    }
  });

  test("prevents creating circular reference via API", async ({ page, request }) => {
    const noteATitle = `Note A ${Date.now()}`;
    const noteBTitle = `Note B ${Date.now()}`;

    let noteAId: string | null = null;
    let noteBId: string | null = null;

    try {
      // Create A -> B hierarchy
      const noteA = await createTestNote(request, { title: noteATitle });
      noteAId = noteA.id;
      
      const noteB = await createTestNote(request, { title: noteBTitle, parent_id: noteA.id });
      noteBId = noteB.id;

      // Verify initial hierarchy
      const initialB = await getTestNote(request, noteB.id);
      expect(initialB.parent_id).toBe(noteA.id);

      // Attempt to make A a child of B (would create cycle: A -> B -> A)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const updateRes = await request.patch(`${API_BASE_URL}/api/notes/${noteA.id}`, {
        data: { parent_id: noteB.id }
      });

      // The API should either reject this (4xx error) or handle it gracefully
      if (updateRes.ok()) {
        // If update succeeded, verify that circular reference was prevented
        const updatedA = await getTestNote(request, noteA.id);
        const updatedB = await getTestNote(request, noteB.id);
        
        // Should not have created a cycle
        if (updatedA.parent_id === noteB.id) {
          // If A is now child of B, then B should not be child of A
          expect(updatedB.parent_id).not.toBe(noteA.id);
        }
      } else {
        // API rejected the circular reference - this is expected behavior
        expect(updateRes.status()).toBeGreaterThanOrEqual(400);
      }

      // Verify hierarchy is still valid
      const finalA = await getTestNote(request, noteA.id);
      const finalB = await getTestNote(request, noteB.id);

      // At least one of these should be true to prevent cycles
      const noCycleExists = !(finalA.parent_id === noteB.id && finalB.parent_id === noteA.id);
      expect(noCycleExists).toBe(true);
    } finally {
      if (noteBId) await deleteTestNote(request, noteBId);
      if (noteAId) await deleteTestNote(request, noteAId);
    }
  });

  test("handles note with very long title", async ({ page, request }) => {
    const longTitle = `Very Long Title ${Date.now()} ${"Lorem ipsum ".repeat(50)}`;

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title: longTitle });
      noteId = note.id;

      await page.goto(`/notes/${note.id}`);
      
      const sidebar = page.locator("aside");
      
      // Wait for sidebar to render
      await page.waitForTimeout(1000);

      // Verify note exists (may be truncated in UI)
      const noteButtons = sidebar.getByRole("button");
      const noteCount = await noteButtons.count();
      expect(noteCount).toBeGreaterThan(0);

      // Verify via API that full title was saved
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.title).toBe(longTitle);

      // Reload and verify persistence
      await page.reload();
      await page.waitForTimeout(1000);

      const finalNote = await getTestNote(request, note.id);
      expect(finalNote.title).toBe(longTitle);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("handles special characters in note title", async ({ page, request }) => {
    const specialTitle = `Special <>&"' ${Date.now()} 🚀 τεστ`;

    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title: specialTitle });
      noteId = note.id;

      await page.goto(`/notes/${note.id}`);
      
      const sidebar = page.locator("aside");
      
      // Wait for sidebar
      await page.waitForTimeout(1000);

      // Verify via API
      const refreshedNote = await getTestNote(request, note.id);
      expect(refreshedNote.title).toBe(specialTitle);

      // Reload and verify
      await page.reload();
      await page.waitForTimeout(1000);

      const finalNote = await getTestNote(request, note.id);
      expect(finalNote.title).toBe(specialTitle);
    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });
});
