import { test, expect } from "@playwright/test";
import { createTestNote, deleteTestNote } from "./helpers/api-utils";

test.describe("Sidebar actions", () => {
  test("deletes a note from the menu", async ({ page, request }) => {
    const title = `Delete Me ${Date.now()}`;
    const note = await createTestNote(request, { title });

    // Set up dialog handler FIRST, before any page navigation
    let dialogHandled = false;
    page.on("dialog", async (dialog) => {
      dialogHandled = true;
      await dialog.accept();
    });

    await page.goto(`/notes/${note.id}`);

    const sidebar = page.locator("aside");

    // Find the note's title button and navigate to its row container
    const noteButton = sidebar.getByRole("button", { name: title });
    // The row structure is: div.group > [drag handle, expand btn, title div, menu container]
    const noteRow = noteButton.locator("xpath=ancestor::div[contains(@class, 'group')][1]");

    // Hover on the row to reveal the menu toggle
    await noteRow.hover();
    await page.waitForTimeout(200); // Let opacity transition complete

    // Click the menu toggle within THIS specific row
    const menuToggle = noteRow.locator("[data-menu-toggle]");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Wait for dropdown menu to appear (look for the Delete button with Trash icon)
    const deleteMenuItem = sidebar.locator("button.text-red-600", { hasText: "Delete" });
    await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });

    await deleteMenuItem.click();

    // Give the dialog a moment to be handled
    await page.waitForTimeout(500);

    // Verify dialog was handled
    expect(dialogHandled).toBe(true);

    // Wait for the sidebar to update after deletion and page refresh
    await expect(sidebar.getByRole("button", { name: title })).toHaveCount(0, { timeout: 10000 });
  });
});
