import { test, expect } from "@playwright/test";
import { createTestNote, deleteTestNote } from "./helpers/api-utils";

test.describe("Recursive tree view", () => {
  test("renders nested notes with indentation", async ({ page, request }) => {
    const parentTitle = `Parent ${Date.now()}`;
    const childTitle = `Child ${Date.now()}`;

    const parent = await createTestNote(request, { title: parentTitle });
    const child = await createTestNote(request, { title: childTitle, parent_id: parent.id });

    await page.goto(`/notes/${child.id}`);
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText(parentTitle)).toBeVisible();
    const childText = sidebar.getByText(childTitle);
    await expect(childText).toBeVisible();
    const indentedAncestor = childText.locator(
      "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' pl-4 ')]"
    );
    await expect(indentedAncestor.first()).toBeVisible();

    await deleteTestNote(request, child.id);
    await deleteTestNote(request, parent.id);
  });
});
