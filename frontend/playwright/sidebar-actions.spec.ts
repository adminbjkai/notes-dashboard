import { test, expect } from "@playwright/test";
import { createTestNote } from "./helpers/api-utils";

test.describe("Sidebar actions", () => {
  test("deletes a note from the menu", async ({ page, request }) => {
    const title = `Delete Me ${Date.now()}`;
    const note = await createTestNote(request, { title });

    await page.goto(`/notes/${note.id}`);

    const sidebar = page.locator("aside");
    const rowButton = sidebar.getByRole("button", { name: title });
    const row = rowButton.locator("..");
    const menuButton = row.locator("button").last();

    await menuButton.click();

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Delete" }).click();

    await expect(sidebar.getByRole("button", { name: title })).toHaveCount(0);
  });
});
