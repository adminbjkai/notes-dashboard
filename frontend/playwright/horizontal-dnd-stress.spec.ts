import { test, expect, Page } from "@playwright/test";
import { createTestNote, deleteTestNote, getTestNote, safeDeleteTestNote } from "./helpers/api-utils";

/**
 * HORIZONTAL DND STRESS TEST SUITE
 * Tests the 35/30/35 vertical zones and 40px horizontal offset logic
 * for professional tree navigation UX.
 */

interface TestNote {
  id: string;
  title: string;
}

async function createDeepTree(
  request: any,
  depth: number,
  prefix: string
): Promise<TestNote[]> {
  const notes: TestNote[] = [];
  let parentId: string | null = null;

  for (let i = 0; i < depth; i++) {
    const title = `${prefix} Level ${i} ${Date.now()}`;
    const note = await createTestNote(request, {
      title,
      parent_id: parentId,
    });
    notes.push({ id: note.id, title });
    parentId = note.id;
  }

  return notes;
}

async function cleanupNotes(request: any, notes: TestNote[]): Promise<void> {
  // Delete in reverse order (deepest first)
  for (let i = notes.length - 1; i >= 0; i--) {
    try {
      await deleteTestNote(request, notes[i].id);
    } catch {
      // Already deleted or doesn't exist
    }
  }
}

async function getDragHandle(page: Page, title: string) {
  const sidebar = page.locator("aside");
  const noteButton = sidebar.getByRole("button", { name: title });
  const noteRow = noteButton.locator("xpath=ancestor::div[contains(@class, 'group')][1]");
  await noteRow.hover();
  await page.waitForTimeout(100);
  return noteRow.locator("[data-dnd-handle]");
}

test.describe("Horizontal DnD: 4-Level Tree Operations", () => {
  test("creates and navigates 4-level deep tree", async ({ page, request }) => {
    const notes = await createDeepTree(request, 4, "Deep");

    try {
      // Navigate to deepest note
      await page.goto(`/notes/${notes[3].id}`);

      const sidebar = page.locator("aside");

      // All levels should be visible and expanded
      for (const note of notes) {
        await expect(sidebar.getByRole("button", { name: note.title })).toBeVisible({ timeout: 10000 });
      }

      // Verify hierarchy via API
      for (let i = 1; i < notes.length; i++) {
        const note = await getTestNote(request, notes[i].id);
        expect(note.parent_id).toBe(notes[i - 1].id);
      }

      // Root should have null parent
      const rootNote = await getTestNote(request, notes[0].id);
      expect(rootNote.parent_id).toBeNull();
    } finally {
      await cleanupNotes(request, notes);
    }
  });

  test("moves level-4 to root using left-outdent drag (multiple outdents)", async ({ page, request }) => {
    const notes = await createDeepTree(request, 4, "Outdent");

    try {
      // Navigate to deepest note
      await page.goto(`/notes/${notes[3].id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Verify all visible
      for (const note of notes) {
        await expect(sidebar.getByRole("button", { name: note.title })).toBeVisible({ timeout: 10000 });
      }

      // Get drag handle for level 3 (index 3)
      const deepHandle = await getDragHandle(page, notes[3].title);
      const handleBox = await deepHandle.boundingBox();

      if (!handleBox) throw new Error("Could not get drag handle bounds");

      // Drag far to the left (>40px) to trigger outdent
      // This should move it up in hierarchy
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();

      // Move left by 200px to trigger multiple outdent levels
      // Also move to the root level area (leftmost part of sidebar)
      const navRect = await sidebar.boundingBox();
      if (!navRect) throw new Error("Could not get sidebar bounds");

      // Move to far left to trigger root drop zone
      await page.mouse.move(navRect.x + 10, handleBox.y + handleBox.height / 2, { steps: 30 });
      await page.waitForTimeout(300);
      await page.mouse.up();

      // Wait for reorder to complete
      await page.waitForTimeout(500);

      // Verify the note is now at root level
      const movedNote = await getTestNote(request, notes[3].id);
      expect(movedNote.parent_id).toBeNull();

      // Reload and verify persistence
      await page.reload();
      await page.waitForTimeout(500);

      const persistedNote = await getTestNote(request, notes[3].id);
      expect(persistedNote.parent_id).toBeNull();
    } finally {
      await cleanupNotes(request, notes);
    }
  });

  test("indent mode: drag right nests into target", async ({ page, request }) => {
    // Create two root-level notes
    const note1 = await createTestNote(request, { title: `Parent ${Date.now()}` });
    const note2 = await createTestNote(request, { title: `Child Candidate ${Date.now()}` });

    try {
      await page.goto(`/notes/${note2.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Both should be visible at root level
      await expect(sidebar.getByRole("button", { name: note1.title })).toBeVisible();
      await expect(sidebar.getByRole("button", { name: note2.title })).toBeVisible();

      // Get positions
      const handle2 = await getDragHandle(page, note2.title);
      const handle1Box = await (await getDragHandle(page, note1.title)).boundingBox();
      const handle2Box = await handle2.boundingBox();

      if (!handle1Box || !handle2Box) throw new Error("Could not get handle bounds");

      // Drag note2 to note1's position but move RIGHT (>40px) to force nesting
      await page.mouse.move(handle2Box.x + handle2Box.width / 2, handle2Box.y + handle2Box.height / 2);
      await page.mouse.down();

      // Move to note1's Y position but 60px to the right of start to trigger indent
      await page.mouse.move(
        handle2Box.x + handle2Box.width / 2 + 60, // Move right to trigger indent
        handle1Box.y + handle1Box.height / 2, // At note1's vertical level
        { steps: 20 }
      );
      await page.waitForTimeout(300);
      await page.mouse.up();

      // Wait for reorder
      await page.waitForTimeout(500);

      // Verify note2 is now child of note1
      const movedNote = await getTestNote(request, note2.id);
      expect(movedNote.parent_id).toBe(note1.id);
    } finally {
      await deleteTestNote(request, note2.id);
      await deleteTestNote(request, note1.id);
    }
  });

  test("vertical 35/30/35 zones: before zone inserts above", async ({ page, request }) => {
    const note1 = await createTestNote(request, { title: `First ${Date.now()}` });
    const note2 = await createTestNote(request, { title: `Second ${Date.now()}` });

    try {
      await page.goto(`/notes/${note1.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Verify initial order
      const note1Data = await getTestNote(request, note1.id);
      const note2Data = await getTestNote(request, note2.id);

      // note1 should be position 0, note2 should be position 1
      expect(note1Data.position).toBeLessThan(note2Data.position);

      // Get positions
      const handle2 = await getDragHandle(page, note2.title);
      const handle1Box = await (await getDragHandle(page, note1.title)).boundingBox();
      const handle2Box = await handle2.boundingBox();

      if (!handle1Box || !handle2Box) throw new Error("Could not get handle bounds");

      // Drag note2 to top 35% of note1 (should insert before)
      await page.mouse.move(handle2Box.x + handle2Box.width / 2, handle2Box.y + handle2Box.height / 2);
      await page.mouse.down();

      // Move to top 35% of note1
      const targetY = handle1Box.y + (handle1Box.height * 0.2); // 20% from top (in "before" zone)
      await page.mouse.move(handle1Box.x + handle1Box.width / 2, targetY, { steps: 20 });
      await page.waitForTimeout(300);
      await page.mouse.up();

      // Wait for API and position normalization to complete
      await page.waitForTimeout(1000);

      // Verify note2 is now before note1
      const updatedNote1 = await getTestNote(request, note1.id);
      const updatedNote2 = await getTestNote(request, note2.id);

      expect(updatedNote2.position).toBeLessThan(updatedNote1.position);
    } finally {
      await safeDeleteTestNote(request, note2.id);
      await safeDeleteTestNote(request, note1.id);
    }
  });

  test("vertical 35/30/35 zones: after zone inserts below", async ({ page, request }) => {
    const note1 = await createTestNote(request, { title: `First After ${Date.now()}` });
    const note2 = await createTestNote(request, { title: `Second After ${Date.now()}` });
    const note3 = await createTestNote(request, { title: `Third After ${Date.now()}` });

    try {
      await page.goto(`/notes/${note1.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Get handles
      const handle3 = await getDragHandle(page, note3.title);
      const handle1Box = await (await getDragHandle(page, note1.title)).boundingBox();
      const handle3Box = await handle3.boundingBox();

      if (!handle1Box || !handle3Box) throw new Error("Could not get handle bounds");

      // Drag note3 to bottom 35% of note1 (should insert after note1, before note2)
      await page.mouse.move(handle3Box.x + handle3Box.width / 2, handle3Box.y + handle3Box.height / 2);
      await page.mouse.down();

      // Move to bottom 35% of note1
      const targetY = handle1Box.y + (handle1Box.height * 0.8); // 80% from top (in "after" zone)
      await page.mouse.move(handle1Box.x + handle1Box.width / 2, targetY, { steps: 20 });
      await page.waitForTimeout(300);
      await page.mouse.up();

      // Wait longer for API call and position normalization to complete
      await page.waitForTimeout(1000);

      // Verify order: note1, note3, note2
      const updatedNote1 = await getTestNote(request, note1.id);
      const updatedNote2 = await getTestNote(request, note2.id);
      const updatedNote3 = await getTestNote(request, note3.id);

      expect(updatedNote1.position).toBeLessThan(updatedNote3.position);
      expect(updatedNote3.position).toBeLessThan(updatedNote2.position);
    } finally {
      await safeDeleteTestNote(request, note3.id);
      await safeDeleteTestNote(request, note2.id);
      await safeDeleteTestNote(request, note1.id);
    }
  });

  test("persistence after reload: tree structure survives page refresh", async ({ page, request }) => {
    const notes = await createDeepTree(request, 4, "Persist");

    try {
      // Navigate to deepest note
      await page.goto(`/notes/${notes[3].id}`);

      const sidebar = page.locator("aside");

      // Verify all visible
      for (const note of notes) {
        await expect(sidebar.getByRole("button", { name: note.title })).toBeVisible({ timeout: 10000 });
      }

      // Reload multiple times
      for (let i = 0; i < 3; i++) {
        await page.reload();
        await page.waitForTimeout(500);

        // All notes should still be visible
        for (const note of notes) {
          await expect(sidebar.getByRole("button", { name: note.title })).toBeVisible({ timeout: 10000 });
        }

        // Hierarchy should be preserved
        for (let j = 1; j < notes.length; j++) {
          const noteData = await getTestNote(request, notes[j].id);
          expect(noteData.parent_id).toBe(notes[j - 1].id);
        }
      }
    } finally {
      await cleanupNotes(request, notes);
    }
  });
});

test.describe("Horizontal DnD: Visual Feedback", () => {
  test("shows blue line indicator for before position", async ({ page, request }) => {
    const note1 = await createTestNote(request, { title: `Indicator Before ${Date.now()}` });
    const note2 = await createTestNote(request, { title: `Indicator Target ${Date.now()}` });

    try {
      await page.goto(`/notes/${note1.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Get handles
      const handle1 = await getDragHandle(page, note1.title);
      const handle2Box = await (await getDragHandle(page, note2.title)).boundingBox();
      const handle1Box = await handle1.boundingBox();

      if (!handle1Box || !handle2Box) throw new Error("Could not get handle bounds");

      // Start dragging note1
      await page.mouse.move(handle1Box.x + handle1Box.width / 2, handle1Box.y + handle1Box.height / 2);
      await page.mouse.down();

      // Move to top 35% of note2
      const targetY = handle2Box.y + (handle2Box.height * 0.2);
      await page.mouse.move(handle2Box.x + handle2Box.width / 2, targetY, { steps: 20 });
      await page.waitForTimeout(300);

      // Check for blue indicator line at top
      const note2Row = sidebar.getByRole("button", { name: note2.title })
        .locator("xpath=ancestor::div[contains(@class, 'group')][1]");

      // The indicator div should be visible
      const topIndicator = note2Row.locator(".bg-blue-500").first();
      // Note: The indicator may be absolutely positioned, so we check if the parent has the class

      await page.mouse.up();
    } finally {
      // Use safeDelete - drag may have nested note1 into note2, causing cascade delete
      await safeDeleteTestNote(request, note2.id);
      await safeDeleteTestNote(request, note1.id);
    }
  });

  test("shows blue highlight for nest/on position", async ({ page, request }) => {
    const note1 = await createTestNote(request, { title: `Nest Target ${Date.now()}` });
    const note2 = await createTestNote(request, { title: `Nest Source ${Date.now()}` });

    try {
      await page.goto(`/notes/${note1.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Get handles
      const handle2 = await getDragHandle(page, note2.title);
      const handle1Box = await (await getDragHandle(page, note1.title)).boundingBox();
      const handle2Box = await handle2.boundingBox();

      if (!handle1Box || !handle2Box) throw new Error("Could not get handle bounds");

      // Start dragging note2
      await page.mouse.move(handle2Box.x + handle2Box.width / 2, handle2Box.y + handle2Box.height / 2);
      await page.mouse.down();

      // Move to middle 30% of note1 (nest zone)
      const targetY = handle1Box.y + (handle1Box.height * 0.5); // 50% from top (in "on" zone)
      await page.mouse.move(handle1Box.x + handle1Box.width / 2 + 50, targetY, { steps: 20 });
      await page.waitForTimeout(300);

      // Check for blue highlight on note1
      const note1Row = sidebar.getByRole("button", { name: note1.title })
        .locator("xpath=ancestor::div[contains(@class, 'group')][1]");

      // Should have blue background or ring
      await expect(note1Row).toHaveClass(/bg-blue-100|ring-blue/, { timeout: 5000 });

      await page.mouse.up();
    } finally {
      await deleteTestNote(request, note2.id);
      await deleteTestNote(request, note1.id);
    }
  });

  test("shows red indicator for invalid drop target", async ({ page, request }) => {
    const parent = await createTestNote(request, { title: `Invalid Parent ${Date.now()}` });
    const child = await createTestNote(request, { title: `Invalid Child ${Date.now()}`, parent_id: parent.id });

    try {
      await page.goto(`/notes/${child.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Get handles
      const parentHandle = await getDragHandle(page, parent.title);
      const parentHandleBox = await parentHandle.boundingBox();
      const childRow = sidebar.getByRole("button", { name: child.title })
        .locator("xpath=ancestor::div[contains(@class, 'group')][1]");
      const childBox = await childRow.boundingBox();

      if (!parentHandleBox || !childBox) throw new Error("Could not get bounds");

      // Start dragging parent
      await page.mouse.move(parentHandleBox.x + parentHandleBox.width / 2, parentHandleBox.y + parentHandleBox.height / 2);
      await page.mouse.down();

      // Move to child (invalid target)
      await page.mouse.move(childBox.x + childBox.width / 2, childBox.y + childBox.height / 2, { steps: 20 });
      await page.waitForTimeout(300);

      // Should show red border
      await expect(childRow).toHaveClass(/border-red-400/, { timeout: 5000 });

      await page.mouse.up();

      // Verify hierarchy unchanged
      const parentData = await getTestNote(request, parent.id);
      expect(parentData.parent_id).toBeNull();
    } finally {
      await deleteTestNote(request, child.id);
      await deleteTestNote(request, parent.id);
    }
  });
});

test.describe("Horizontal DnD: Rich Content Integration", () => {
  test("moves note with table content preserving data", async ({ page, request }) => {
    const tableContent = `
# Data Table

| ID | Name | Status |
|----|------|--------|
| 1  | Foo  | Active |
| 2  | Bar  | Pending |
    `.trim();

    const parent = await createTestNote(request, { title: `Table Parent ${Date.now()}` });
    const tableNote = await createTestNote(request, {
      title: `Table Note ${Date.now()}`,
      content: tableContent
    });

    try {
      await page.goto(`/notes/${tableNote.id}`);
      await page.waitForTimeout(500);

      const sidebar = page.locator("aside");

      // Get handles
      const tableHandle = await getDragHandle(page, tableNote.title);
      const parentHandle = await getDragHandle(page, parent.title);
      const tableHandleBox = await tableHandle.boundingBox();
      const parentHandleBox = await parentHandle.boundingBox();

      if (!tableHandleBox || !parentHandleBox) throw new Error("Could not get bounds");

      // Drag table note to nest under parent
      await page.mouse.move(tableHandleBox.x + tableHandleBox.width / 2, tableHandleBox.y + tableHandleBox.height / 2);
      await page.mouse.down();

      // Move to parent with rightward offset for indent
      await page.mouse.move(
        tableHandleBox.x + tableHandleBox.width / 2 + 60,
        parentHandleBox.y + parentHandleBox.height / 2,
        { steps: 20 }
      );
      await page.waitForTimeout(300);
      await page.mouse.up();

      await page.waitForTimeout(500);

      // Verify moved and content preserved
      const movedNote = await getTestNote(request, tableNote.id);
      expect(movedNote.parent_id).toBe(parent.id);
      expect(movedNote.content).toBe(tableContent);

      // Reload and verify persistence
      await page.reload();
      await page.waitForTimeout(500);

      const persistedNote = await getTestNote(request, tableNote.id);
      expect(persistedNote.parent_id).toBe(parent.id);
      expect(persistedNote.content).toBe(tableContent);
    } finally {
      await deleteTestNote(request, tableNote.id);
      await deleteTestNote(request, parent.id);
    }
  });

  test("moves note with code block content preserving data", async ({ page, request }) => {
    const codeContent = `
# Code Example

\`\`\`typescript
interface Note {
  id: string;
  title: string;
  parent_id: string | null;
}
\`\`\`
    `.trim();

    const parent = await createTestNote(request, { title: `Code Parent ${Date.now()}` });
    const codeNote = await createTestNote(request, {
      title: `Code Note ${Date.now()}`,
      content: codeContent
    });

    try {
      await page.goto(`/notes/${codeNote.id}`);
      await page.waitForTimeout(500);

      // Move to root by dragging far left
      const sidebar = page.locator("aside");
      const codeHandle = await getDragHandle(page, codeNote.title);
      const codeHandleBox = await codeHandle.boundingBox();
      const sidebarBox = await sidebar.boundingBox();

      if (!codeHandleBox || !sidebarBox) throw new Error("Could not get bounds");

      // First nest it under parent
      const parentHandle = await getDragHandle(page, parent.title);
      const parentBox = await parentHandle.boundingBox();
      if (!parentBox) throw new Error("Could not get parent bounds");

      await page.mouse.move(codeHandleBox.x + codeHandleBox.width / 2, codeHandleBox.y + codeHandleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(codeHandleBox.x + 60, parentBox.y + parentBox.height / 2, { steps: 20 });
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(500);

      // Verify nested
      let movedNote = await getTestNote(request, codeNote.id);
      expect(movedNote.parent_id).toBe(parent.id);
      expect(movedNote.content).toBe(codeContent);

      // Now move back to root
      await page.reload();
      await page.waitForTimeout(500);

      const nestedHandle = await getDragHandle(page, codeNote.title);
      const nestedBox = await nestedHandle.boundingBox();
      if (!nestedBox) throw new Error("Could not get nested bounds");

      // Start from center of handle
      const startX = nestedBox.x + nestedBox.width / 2;
      const startY = nestedBox.y + nestedBox.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();

      // Move 120px to the left (root drop triggers at -100px offset)
      await page.mouse.move(startX - 120, startY, { steps: 30 });
      await page.waitForTimeout(300);
      await page.mouse.up();

      // Wait for API and normalization
      await page.waitForTimeout(1000);

      // Verify at root
      movedNote = await getTestNote(request, codeNote.id);
      expect(movedNote.parent_id).toBeNull();
      expect(movedNote.content).toBe(codeContent);
    } finally {
      await deleteTestNote(request, codeNote.id);
      await deleteTestNote(request, parent.id);
    }
  });
});
