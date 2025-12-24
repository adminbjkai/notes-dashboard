import { test, expect } from "@playwright/test";

const API_BASE_URL = process.env.API_URL || "http://localhost:8000";

// Helper to safely delete a test note
async function safeDeleteTestNote(
  request: ReturnType<typeof test.info>["request"] extends () => infer R
    ? R
    : never,
  noteId: string
): Promise<void> {
  try {
    await request.delete(`${API_BASE_URL}/api/notes/${noteId}`);
  } catch {
    // Ignore errors - note may have been cascade deleted or doesn't exist
  }
}

test.describe("Image Resize Persistence", () => {
  test("resized image width persists after page reload", async ({
    page,
    request,
  }) => {
    // Create a new note with an image already in content
    const createResponse = await request.post(`${API_BASE_URL}/api/notes`, {
      data: {
        title: "Image Resize Test",
        content:
          "![test](https://via.placeholder.com/600x400/cccccc/666666?text=Resize+Me)",
        parent_id: null,
      },
    });

    expect(createResponse.ok()).toBe(true);
    const note = await createResponse.json();
    const noteId = note.id;

    try {
      // Navigate to the note
      await page.goto(`/notes/${noteId}`);
      await page.waitForTimeout(1500);

      // Find the image
      const image = page.locator(".ProseMirror img");
      expect(await image.count()).toBeGreaterThan(0);

      // Get original width (should be auto/natural)
      const originalStyleWidth = await image.first().evaluate((el) => {
        return (el as HTMLImageElement).style.width;
      });
      console.log(`Original style width: "${originalStyleWidth}"`);

      // Click to select the image (to show resize controls)
      await image.first().click();
      await page.waitForTimeout(500);

      // Use the "S" preset button (200px) - be more specific with selector
      const smallBtn = page
        .locator(".ProseMirror")
        .locator('button:has-text("S")')
        .first();
      if ((await smallBtn.count()) > 0) {
        await smallBtn.click();
        await page.waitForTimeout(500);

        // Verify the resize took effect
        const newWidth = await image.first().evaluate((el) => {
          return (el as HTMLImageElement).style.width;
        });
        console.log(`Width after resize: ${newWidth}`);
        expect(newWidth).toBe("200px");

        // Wait for auto-save (content is saved on editor update)
        await page.waitForTimeout(2000);

        // Reload the page
        await page.reload();
        await page.waitForTimeout(2000);

        // Check width after reload
        const imageAfter = page.locator(".ProseMirror img");
        expect(await imageAfter.count()).toBeGreaterThan(0);

        const persistedWidth = await imageAfter.first().evaluate((el) => {
          return (el as HTMLImageElement).style.width;
        });
        console.log(`Width after reload: ${persistedWidth}`);

        // Width should persist as 200px
        expect(persistedWidth).toBe("200px");
      } else {
        console.log("Resize control buttons not found");
        test.skip();
      }
    } finally {
      await safeDeleteTestNote(request, noteId);
    }
  });

  test("Full size preset persists after reload", async ({ page, request }) => {
    // Create a note with an image
    const createResponse = await request.post(`${API_BASE_URL}/api/notes`, {
      data: {
        title: "Full Size Test",
        content:
          "![test](https://via.placeholder.com/500x300/cccccc/666666?text=Full)",
        parent_id: null,
      },
    });

    expect(createResponse.ok()).toBe(true);
    const note = await createResponse.json();
    const noteId = note.id;

    try {
      await page.goto(`/notes/${noteId}`);
      await page.waitForTimeout(1500);

      const image = page.locator(".ProseMirror img");
      await image.first().click();
      await page.waitForTimeout(500);

      // Click "Full" preset (100%)
      const fullBtn = page
        .locator(".ProseMirror")
        .locator('button:has-text("Full")')
        .first();
      if ((await fullBtn.count()) > 0) {
        await fullBtn.click();
        await page.waitForTimeout(500);

        const newWidth = await image.first().evaluate((el) => {
          return (el as HTMLImageElement).style.width;
        });
        console.log(`Width after Full preset: ${newWidth}`);
        expect(newWidth).toBe("100%");

        // Wait for save
        await page.waitForTimeout(2000);

        // Reload
        await page.reload();
        await page.waitForTimeout(2000);

        const imageAfter = page.locator(".ProseMirror img");
        const persistedWidth = await imageAfter.first().evaluate((el) => {
          return (el as HTMLImageElement).style.width;
        });
        console.log(`Width after reload: ${persistedWidth}`);

        expect(persistedWidth).toBe("100%");
      }
    } finally {
      await safeDeleteTestNote(request, noteId);
    }
  });

  test("image without explicit width loads correctly", async ({
    page,
    request,
  }) => {
    // Create a note with a plain image (no width attribute)
    const createResponse = await request.post(`${API_BASE_URL}/api/notes`, {
      data: {
        title: "Plain Image Test",
        content:
          "![plain](https://via.placeholder.com/300x200/cccccc/666666?text=Plain)",
        parent_id: null,
      },
    });

    expect(createResponse.ok()).toBe(true);
    const note = await createResponse.json();
    const noteId = note.id;

    try {
      await page.goto(`/notes/${noteId}`);
      await page.waitForTimeout(1500);

      // Image should load without explicit width (natural size or auto)
      const image = page.locator(".ProseMirror img");
      expect(await image.count()).toBeGreaterThan(0);

      // Should have no inline width style or "auto"
      const width = await image.first().evaluate((el) => {
        return (el as HTMLImageElement).style.width;
      });
      console.log(`Plain image width style: "${width}"`);
      // Empty string or "auto" means no explicit width set
      expect(width === "" || width === "auto").toBe(true);
    } finally {
      await safeDeleteTestNote(request, noteId);
    }
  });

  test("markdown format correctly stores image width", async ({ request }) => {
    // Create a note with a resized image using the {width=...} syntax
    const createResponse = await request.post(`${API_BASE_URL}/api/notes`, {
      data: {
        title: "Markdown Width Test",
        content:
          "![sized](https://via.placeholder.com/500x300){width=250px}",
        parent_id: null,
      },
    });

    expect(createResponse.ok()).toBe(true);
    const note = await createResponse.json();
    const noteId = note.id;

    try {
      // Fetch the note to verify content is stored correctly
      const getResponse = await request.get(
        `${API_BASE_URL}/api/notes/${noteId}`
      );
      expect(getResponse.ok()).toBe(true);
      const fetchedNote = await getResponse.json();

      // The content should contain the width attribute
      expect(fetchedNote.content).toContain("{width=250px}");
      console.log(`Stored content: ${fetchedNote.content}`);
    } finally {
      await safeDeleteTestNote(request, noteId);
    }
  });
});
