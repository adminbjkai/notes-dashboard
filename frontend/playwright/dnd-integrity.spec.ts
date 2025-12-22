import { test, expect } from "@playwright/test";
import { createTestNote, deleteTestNote, getTestNote } from "./helpers/api-utils";

test.describe("Drag-and-drop integrity", () => {
  test("prevents dragging a parent onto its child", async ({ page, request }) => {
    const parentTitle = `Parent ${Date.now()}`;
    const childTitle = `Child ${Date.now()}`;

    const parent = await createTestNote(request, { title: parentTitle });
    const child = await createTestNote(request, { title: childTitle, parent_id: parent.id });

    await page.goto(`/notes/${child.id}`);

    const sidebar = page.locator("aside");
    const parentRow = sidebar.getByRole("button", { name: parentTitle }).locator("..");
    const childRow = sidebar.getByRole("button", { name: childTitle }).locator("..");
    const parentHandle = parentRow.locator("div.cursor-grab");

    await parentRow.hover();
    const parentBox = await parentHandle.boundingBox();
    const childBox = await childRow.boundingBox();
    if (!parentBox || !childBox) {
      throw new Error("Missing drag handle bounds");
    }

    await page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(childBox.x + childBox.width / 2, childBox.y + childBox.height / 2, {
      steps: 8,
    });

    await page.waitForTimeout(100);
    await expect(childRow).toHaveClass(/border-red-400/);

    await page.mouse.up();

    const refreshedParent = await getTestNote(request, parent.id);
    expect(refreshedParent.parent_id).toBeNull();

    await deleteTestNote(request, child.id);
    await deleteTestNote(request, parent.id);
  });
});
